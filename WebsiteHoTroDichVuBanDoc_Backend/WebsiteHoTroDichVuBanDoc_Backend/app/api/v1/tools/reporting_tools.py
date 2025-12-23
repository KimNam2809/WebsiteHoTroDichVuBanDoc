# app/tools/reporting_tools.py
from app.connect.db import supabase_client

def get_user_loan_status(user_id: int):
    """
    Kiểm tra xem người dùng đang mượn những sách gì
    """
    try:
        # Query bảng MuonTra, join sang BanSao -> TacPham
        res = supabase_client.table("muontra").select(
            "ngaytra, trangthaimuon, bansao(mabansaonoibo, tacpham(tentacpham))"
        ).eq("mabandoc", user_id).eq("trangthaimuon", "daMuon").execute()

        loans = res.data
        if not loans:
            return "Bạn hiện không mượn cuốn sách nào."

        report = "Danh sách sách bạn đang mượn:\n"
        for item in loans:
            book_title = item['bansao']['tacpham']['tentacpham']
            due_date = item['ngaytra']
            report += f"- {book_title} (Hạn trả: {due_date})\n"

        return report
    except Exception as e:
        return f"Lỗi kiểm tra sách mượn: {str(e)}"

def check_book_availability_realtime(book_name: str):
    """
    Kiểm tra xem một cuốn sách cụ thể còn bản nào trên kệ không
    """
    try:
        # 1. Tìm ID sách theo tên (Tìm gần đúng)
        book_res = supabase_client.table("tacpham").select("matacpham, tentacpham").ilike("tentacpham", f"%{book_name}%").limit(1).execute()

        if not book_res.data:
            return f"Không tìm thấy sách có tên '{book_name}' trong hệ thống."

        book = book_res.data[0]

        # 2. Đếm số bản sao ĐANG CÓ SẴN (trangthaichomuon = true)
        count_res = supabase_client.table("bansao").select("*", count="exact")\
            .eq("matacpham", book['matacpham'])\
            .eq("trangthaichomuon", True).execute()

        count = count_res.count

        if count > 0:
            return f"Sách '{book['tentacpham']}' hiện CÒN {count} bản trên kệ. Bạn có thể đến mượn ngay."
        else:
            return f"Sách '{book['tentacpham']}' hiện ĐÃ HẾT (đang được mượn hết). Vui lòng đặt trước hoặc quay lại sau."

    except Exception as e:
        return f"Lỗi kiểm tra tình trạng sách: {str(e)}"

def get_fine_status(user_id: int):
    """Kiểm tra tổng tiền phạt"""
    try:
        # Lấy các khoản phạt chưa thanh toán (Giả sử logic là sum tienphat)
        res = supabase_client.table("muontra").select("tienphat").eq("mabandoc", user_id).gt("tienphat", 0).execute()

        total_fine = sum([item['tienphat'] for item in res.data])

        if total_fine > 0:
            return f"Bạn đang có tổng số tiền phạt là: {total_fine:,.0f} VNĐ."
        else:
            return "Xin chúc mừng, bạn không có khoản phạt nào."
    except Exception as e:
        return f"Lỗi kiểm tra phạt: {str(e)}"