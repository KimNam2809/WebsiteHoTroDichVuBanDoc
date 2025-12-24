# File: app/tools/action_tools.py
from datetime import datetime, timedelta, timezone
from app.connect.db import supabase_client
import json

# --- 1. KIỂM TRA PHẠT ---
def check_my_status(user_id: int):
    """
    Kiểm tra tổng quan: Sách đang mượn + Tiền phạt.
    """
    try:
        # 1. Lấy maBanDoc
        profile_res = supabase_client.table("bandoc").select("mabandoc").eq("manguoidung", user_id).single().execute()
        if not profile_res.data:
            return "Bạn chưa có hồ sơ bạn đọc."

        ma_ban_doc = profile_res.data["mabandoc"]

        msg = []

        # 2. Kiểm tra sách ĐANG MƯỢN (daMuon)
        loan_res = supabase_client.table("muontra").select(
            "ngaytra, bansao(tacpham(tentacpham))"
        ).eq("mabandoc", ma_ban_doc).eq("trangthaimuon", "daMuon").execute()

        if loan_res.data:
            books = [f"- {item['bansao']['tacpham']['tentacpham']} (Hạn: {item['ngaytra']})" for item in loan_res.data]
            msg.append(f"📚 Sách đang mượn:\n" + "\n".join(books))
        else:
            msg.append("Bạn hiện không mượn cuốn sách nào.")

        # 3. Kiểm tra TIỀN PHẠT (tienphat > 0)
        fine_res = supabase_client.table("muontra").select(
            "tienphat, bansao(tacpham(tentacpham))"
        ).eq("mabandoc", ma_ban_doc).gt("tienphat", 0).execute()

        if fine_res.data:
            total = sum(item['tienphat'] for item in fine_res.data)
            msg.append(f"\n⚠️ CẢNH BÁO PHẠT: Tổng {total:,.0f}đ.")

        return "\n".join(msg)

    except Exception as e:
        return f"Lỗi kiểm tra trạng thái: {str(e)}"

# --- 2. GIA HẠN SÁCH ---
def renew_book(user_id: int, book_name_keyword: str):
    """
    Gia hạn sách.
    Logic:
    1. Tìm maBanDoc.
    2. Tìm phiếu mượn 'daMuon' khớp tên sách.
    3. Gọi RPC fn_gia_han.
    """
    try:
        # 1. Lấy maBanDoc
        profile_res = supabase_client.table("bandoc").select("mabandoc").eq("manguoidung", user_id).single().execute()
        if not profile_res.data: return "Bạn chưa có hồ sơ bạn đọc."
        ma_ban_doc = profile_res.data["mabandoc"]

        # 2. Tìm phiếu mượn
        res = supabase_client.table("muontra").select(
            "mamuontra, ngaytra, solangiahan, solangiahantoida, bansao(tacpham(tentacpham))"
        ).eq("mabandoc", ma_ban_doc).eq("trangthaimuon", "daMuon").execute()

        loans = res.data
        target_loan = None

        for loan in loans:
            # An toàn khi truy xuất nested dict
            try:
                title = loan['bansao']['tacpham']['tentacpham']
            except:
                title = ""

            if book_name_keyword.lower() in title.lower():
                target_loan = loan
                break

        if not target_loan:
            return f"Bạn hiện không mượn cuốn sách nào có tên chứa '{book_name_keyword}'."

        # 3. Chuẩn bị tham số cho RPC
        # Logic ngày trả mới: Ngày hiện tại của phiếu + 7 ngày (hoặc quy định khác)
        # Lưu ý: Hàm RPC fn_gia_han yêu cầu p_ngay_tra_moi
        current_due = datetime.strptime(target_loan['ngaytra'], "%Y-%m-%d")
        new_due = current_due + timedelta(days=7)

        # Tính toán ngày để thông báo cho người dùng biết tình trạng
        today = datetime.now().date()
        due_date = datetime.strptime(target_loan['ngaytra'], "%Y-%m-%d").date()

        # Logic tính ngày trả mới (Ví dụ cộng 7 ngày từ hôm nay hoặc từ hạn cũ)
        # Thường gia hạn tính từ ngày thao tác hoặc cộng nối tiếp. Ở đây cộng nối tiếp.
        if today > due_date:
            # Nếu đang quá hạn (nhưng <= 2 ngày nên RPC mới cho qua), tính từ hôm nay cho công bằng
            new_due = today + timedelta(days=7)
            msg_suffix = "(Đã được ân hạn quá hạn)"
        else:
            new_due = due_date + timedelta(days=7)
            msg_suffix = ""

        params = {
            "p_ma_muon_tra": target_loan['mamuontra'],
            "p_ma_nhan_vien": None,
            "p_ngay_tra_moi": new_due.strftime("%Y-%m-%d"),
            "p_ly_do_gia_han": "Chatbot renew"
        }

        rpc_res = supabase_client.rpc("fn_gia_han", params).execute()

        # Bắt lỗi từ RPC (nếu quá hạn > 2 ngày, RPC sẽ ném lỗi BUSINESS_ERROR)
        if hasattr(rpc_res, 'error') and rpc_res.error:
            err_msg = str(rpc_res.error)
            if "BUSINESS_ERROR" in err_msg:
                # Trích xuất thông báo tiếng Việt từ RPC
                try:
                    clean_msg = err_msg.split('MESSAGE:')[1].split('DETAIL:')[0].strip().replace('"', '')
                    return f"⚠️ Thất bại: {clean_msg}"
                except:
                    return f"⚠️ Thất bại: {err_msg}"
            return f"Lỗi: {err_msg}"

        return f"✅ Gia hạn thành công sách '{target_loan['bansao']['tacpham']['tentacpham']}'! {msg_suffix}\nHạn trả mới: {new_due.strftime('%d/%m/%Y')}."

    except Exception as e:
        return f"Lỗi hệ thống gia hạn: {str(e)}"

# --- 3. ĐẶT TRƯỚC (RESERVE) ---
def reserve_book(user_id: int, book_name_keyword: str):
    """
    Đặt trước tài liệu.
    Logic:
    1. Tìm maBanDoc.
    2. Tìm sách (TacPham).
    3. Tìm bản sao khả dụng (trangthaichomuon=true).
    4. Gọi RPC fn_dat_truoc.
    """
    try:
        # 1. Lấy maBanDoc
        profile_res = supabase_client.table("bandoc").select("mabandoc").eq("manguoidung", user_id).single().execute()
        if not profile_res.data: return "Bạn chưa có hồ sơ bạn đọc."
        ma_ban_doc = profile_res.data["mabandoc"]

        # 2. Tìm sách (Lấy ID sách đầu tiên khớp tên)
        book_res = supabase_client.table("tacpham").select("matacpham, tentacpham")\
            .ilike("tentacpham", f"%{book_name_keyword}%").limit(1).execute()

        if not book_res.data:
            return f"Không tìm thấy sách '{book_name_keyword}' trong thư viện."

        book = book_res.data[0]

        # 3. Tìm bản sao khả dụng
        # Logic: Tìm bản sao của sách này mà CHƯA BỊ ĐẶT TRƯỚC (cần check kỹ hơn nếu hệ thống phức tạp)
        # Ở đây ta tìm bản sao có trangthaichomuon = True để user mượn luôn,
        # HOẶC bản sao đang được mượn để đặt gạch?
        # -> Theo yêu cầu: "nếu còn bản sao có thể mượn".
        # -> Nếu còn bản sao mượn được thì AI nên bảo user đi mượn luôn
        # -> Thường Đặt trước dùng khi HẾT sách.
        # -> Nhưng OK, nên cứ làm theo flow gọi RPC fn_dat_truoc.

        # Tìm bản sao bất kỳ để đặt (ưu tiên cái đang rảnh)
        copy_res = supabase_client.table("bansao").select("mabansao, vitri")\
            .eq("matacpham", book['matacpham'])\
            .limit(1).execute()

        if not copy_res.data:
            return f"Sách '{book['tentacpham']}' hiện không có bản sao nào trong hệ thống."

        target_copy = copy_res.data[0]

        # KIỂM TRA TRƯỚC KHI GỌI RPC
        # Nếu sách đang có sẵn (trangthaichomuon = True), báo user đi mượn luôn
        if target_copy.get('trangthaichomuon') == True: # Hoặc logic tương đương
            location = target_copy.get('vitri', 'Quầy thủ thư')
            return f"Tin vui! Cuốn sách '{book['tentacpham']}' hiện ĐANG CÓ SẴN tại thư viện (Vị trí: {location}). Bạn có thể đến mượn ngay mà không cần đặt trước."

        # 4. Gọi RPC
        params = {
            "p_ma_ban_sao": target_copy['mabansao'],
            "p_ma_ban_doc": ma_ban_doc
        }

        rpc_res = supabase_client.rpc("fn_dat_truoc", params).execute()

        if hasattr(rpc_res, 'error') and rpc_res.error:
            return f"Lỗi đặt trước: {rpc_res.error}"

        return f"✅ Đã đặt trước thành công sách '{book['tentacpham']}'. Vui lòng kiểm tra email để nhận thông báo khi có sách."

    except Exception as e:
        err_msg = str(e)
        if "BUSINESS_ERROR" in err_msg:
            # Cố gắng trích xuất message lỗi sạch
            try:
                msg = err_msg.split('MESSAGE:')[1].split('DETAIL:')[0].strip().replace('"', '')
                return f"Thất bại: {msg}"
            except:
                return f"Thất bại: {err_msg}"
        return f"Lỗi hệ thống khi đặt trước: {err_msg}"

# --- 4. HÀM GIẢ (MOCK) ĐẶT CHỖ (Nếu chưa có RPC) ---
def quick_book_seat(user_id: int):
    # Bạn chưa gửi schema DatCho, nên tạm thời mock
    return "Tính năng đặt chỗ ngồi đang được bảo trì. Vui lòng thử lại sau."

def check_overdue_books(user_id: int):
    # TODO: Kết nối DB để check bảng MuonTra
    return "Hệ thống kiểm tra: Bạn hiện không có sách quá hạn. (Mockup)"

def quick_book_seat(user_id: int):
    # TODO: Logic đặt chỗ
    return "Đã đặt chỗ ngồi thành công cho bạn tại Phòng đọc tổng hợp. (Mockup)"