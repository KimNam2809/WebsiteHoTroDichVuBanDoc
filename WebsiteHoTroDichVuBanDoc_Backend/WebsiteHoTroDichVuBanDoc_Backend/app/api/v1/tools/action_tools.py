from datetime import datetime, timedelta
from app.connect.db import supabase_client

def get_user_id_by_auth(manguoidung_id: int):
    """Lấy mã bạn đọc an toàn."""
    try:
        # Dùng .limit(1) thay vì .single() để tránh lỗi 406 khi không có data
        res = supabase_client.table("bandoc").select("mabandoc").eq("manguoidung", manguoidung_id).limit(1).execute()

        if res.data and len(res.data) > 0:
            return res.data[0]['mabandoc']
        return None
    except Exception:
        return None

def check_personal_dashboard(user_id: int):
    try:
        mbd = get_user_id_by_auth(user_id)
        if not mbd: return "Bạn chưa có hồ sơ bạn đọc. Vui lòng đăng ký thẻ thư viện."

        # Lấy danh sách mượn (đã fix query)
        # Lưu ý: Supabase-py cú pháp select nested: "col, relation(col)"
        mt = supabase_client.table("muontra")\
            .select("ngaytra, tienphat, bansao(mathietbinoibo, tacpham(tentacpham))")\
            .eq("mabandoc", mbd).eq("trangthaimuon", "daMuon").execute()

        # Lấy danh sách đặt trước
        dt = supabase_client.table("dattruoc")\
            .select("thoidiemdattruoc, bansao(tacpham(tentacpham))")\
            .eq("mabandoc", mbd).eq("trangthaidattruoc", "kichHoat").execute()

        summary = []
        if mt.data:
            books = []
            for item in mt.data:
                # Xử lý nested data an toàn
                bs = item.get('bansao') or {}
                tp = bs.get('tacpham') or {}
                title = tp.get('tentacpham', 'Sách không rõ tên')
                books.append(f"- {title} (Hạn: {item['ngaytra']})")
            summary.append("📚 **Sách đang mượn:**\n" + "\n".join(books))

        if dt.data:
            reserves = []
            for item in dt.data:
                bs = item.get('bansao') or {}
                tp = bs.get('tacpham') or {}
                title = tp.get('tentacpham', 'Sách không rõ tên')
                reserves.append(f"- {title} (Đặt lúc: {item['thoidiemdattruoc'][:10]})")
            summary.append("📌 **Sách đang đặt trước:**\n" + "\n".join(reserves))

        return "\n\n".join(summary) if summary else "Bạn hiện không mượn hoặc đặt trước cuốn sách nào."
    except Exception as e:
        return f"Lỗi kiểm tra thông tin: {str(e)}"

def handle_book_action(user_id: int, book_name: str, action_type: str):
    """
    Xử lý Gia hạn/Đặt trước với logic tìm kiếm 2 bước để tránh lỗi PGRST108.
    """
    mbd = get_user_id_by_auth(user_id)
    if not mbd: return "Bạn chưa có hồ sơ bạn đọc."
    if not book_name: return "Vui lòng cung cấp tên sách cụ thể."

    try:
        # BƯỚC 1: Tìm ID sách (matacpham) từ tên sách
        book_res = supabase_client.table("tacpham").select("matacpham, tentacpham")\
            .ilike("tentacpham", f"%{book_name}%").limit(1).execute()

        if not book_res.data:
            return f"Không tìm thấy sách nào có tên chứa '{book_name}'."

        target_book = book_res.data[0]
        matacpham = target_book['matacpham']
        real_name = target_book['tentacpham']

        # BƯỚC 2: Xử lý theo nghiệp vụ
        if action_type == "renew":
            # Tìm phiếu mượn của user đối với CÁC BẢN SAO của cuốn sách này
            # Logic: Tìm trong bảng muontra mà mabandoc = user VÀ mabansao thuộc (select mabansao from bansao where matacpham = ...)

            # Lấy danh sách bản sao của sách này
            copy_res = supabase_client.table("bansao").select("mabansao").eq("matacpham", matacpham).execute()
            copy_ids = [c['mabansao'] for c in copy_res.data]

            if not copy_ids: return f"Sách '{real_name}' chưa có bản sao nào trong hệ thống."

            # Tìm phiếu mượn khớp với các bản sao này
            loan_res = supabase_client.table("muontra").select("mamuontra, ngaytra")\
                .eq("mabandoc", mbd).eq("trangthaimuon", "daMuon")\
                .in_("mabansao", copy_ids).limit(1).execute()

            if not loan_res.data:
                return f"Bạn đang không mượn cuốn sách '{real_name}'."

            # Gọi RPC Gia hạn
            params = {
                "p_ma_muon_tra": loan_res.data[0]['mamuontra'],
                "p_ma_nhan_vien": None,
                "p_ngay_tra_moi": (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d"),
                "p_ly_do_gia_han": "AI Renew"
            }
            rpc = supabase_client.rpc("fn_gia_han", params).execute()
            # Kiểm tra lỗi RPC (Supabase trả về data là None nếu thành công hoặc error object)
            # Lưu ý: cách check lỗi RPC tùy thuộc vào implementation của function SQL
            return f"✅ Đã gia hạn thành công sách '{real_name}'."

        elif action_type == "reserve":
            # Kiểm tra xem đã đặt trước chưa (tránh spam)
            # Tương tự: Tìm dattruoc của user với các bản sao của sách này
            copy_res = supabase_client.table("bansao").select("mabansao").eq("matacpham", matacpham).execute()
            copy_ids = [c['mabansao'] for c in copy_res.data]

            check_res = supabase_client.table("dattruoc").select("madattruoc")\
                .eq("mabandoc", mbd).eq("trangthaidattruoc", "kichHoat")\
                .in_("mabansao", copy_ids).execute()

            if check_res.data:
                return f"Bạn đã đặt trước sách '{real_name}' rồi."

            # Tìm một bản sao khả dụng để đặt (Logic: Bản sao nào cũng được, miễn là của sách đó)
            # Thường đặt trước áp dụng cho sách đang HẾT.
            # Lấy đại bản sao đầu tiên để đặt giữ chỗ
            if not copy_ids: return "Sách này hiện không có bản sao nào."

            target_copy_id = copy_ids[0]

            rpc = supabase_client.rpc("fn_dat_truoc", {
                "p_ma_ban_sao": target_copy_id,
                "p_ma_ban_doc": mbd
            }).execute()

            return f"✅ Đã đặt trước thành công sách '{real_name}'."

    except Exception as e:
        return f"Lỗi xử lý yêu cầu: {str(e)}"

def increment_article_view(article_id: int):
    """Tăng số lượt xem cho bài viết khi người dùng nhấn xem qua chatbot."""
    try:
        # Lấy số lượt xem hiện tại
        current = supabase_client.table("baiviet").select("soluotxem").eq("mabaiviet", article_id).single().execute()
        if current.data:
            new_views = current.data['soluotxem'] + 1
            supabase_client.table("baiviet").update({"soluotxem": new_views}).eq("mabaiviet", article_id).execute()
            return True
    except:
        return False

def check_room_availability(room_id: int, start_time: str, end_time: str):
    """Kiểm tra xem phòng có bị trùng lịch đặt hay không."""
    try:
        # Kiểm tra bảng datphong
        res = supabase_client.table("datphong")\
            .select("*")\
            .eq("maphong", room_id)\
            .eq("trangthai", "kichHoat")\
            .filter("thoigianbatdau", "lt", end_time)\
            .filter("thoigianketthuc", "gt", start_time)\
            .execute()

        return len(res.data) == 0 # Trả về True nếu không có lịch trùng
    except:
        return False