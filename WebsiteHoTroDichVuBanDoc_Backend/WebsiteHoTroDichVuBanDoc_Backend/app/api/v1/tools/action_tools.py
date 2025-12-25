from datetime import datetime, timedelta
from app.connect.db import supabase_client

def get_user_id_by_auth(manguoidung_id: int):
    """Lấy mã bạn đọc từ mã người dùng."""
    res = supabase_client.table("bandoc").select("mabandoc").eq("manguoidung", manguoidung_id).single().execute()
    return res.data['mabandoc'] if res.data else None

def check_personal_dashboard(user_id: int):
    """Tổng hợp toàn bộ trạng thái cá nhân dựa trên schema."""
    try:
        mbd = get_user_id_by_auth(user_id)
        if not mbd: return "Bạn chưa có hồ sơ bạn đọc."

        # 1. Mượn trả & Phạt
        mt = supabase_client.table("muontra").select("ngaytra, tienphat, bansao(tacpham(tentacpham))")\
            .eq("mabandoc", mbd).eq("trangthaimuon", "daMuon").execute()

        # 2. Đặt chỗ & Đặt phòng
        dc = supabase_client.table("datchongoi").select("thoigianbatdau, chongoi(tenchongoi)")\
            .eq("mabandoc", mbd).eq("trangthaidatcho", "kichHoat").execute()

        summary = []
        if mt.data:
            summary.append("📚 Đang mượn: " + ", ".join([f"{i['bansao']['tacpham']['tentacpham']} (Hạn: {i['ngaytra']})" for i in mt.data]))
            fines = sum(float(i['tienphat']) for i in mt.data if i['tienphat'])
            if fines > 0: summary.append(f"⚠️ Nợ phạt: {fines:,.0f} VNĐ")
        if dc.data:
            summary.append("🪑 Đang đặt chỗ: " + ", ".join([f"{i['chongoi']['tenchongoi']}" for i in dc.data]))

        return "\n".join(summary) if summary else "Bạn hiện không có hoạt động mượn trả hay đặt chỗ nào."
    except Exception as e: return f"Lỗi dashboard: {str(e)}"

def handle_book_action(user_id: int, book_name: str, action_type: str):
    """Xử lý Gia hạn (renew) hoặc Đặt trước (reserve) sách."""
    mbd = get_user_id_by_auth(user_id)
    if action_type == "renew":
        # Tìm phiếu mượn gần nhất của sách này
        res = supabase_client.table("muontra").select("mamuontra, ngaytra")\
            .eq("mabandoc", mbd).eq("trangthaimuon", "daMuon")\
            .ilike("bansao.tacpham.tentacpham", f"%{book_name}%").limit(1).execute()
        if not res.data: return f"Bạn không mượn sách '{book_name}'."

        # Gọi RPC đã sửa với logic ân hạn 2 ngày
        params = {"p_ma_muon_tra": res.data[0]['mamuontra'], "p_ma_nhan_vien": None,
                "p_ngay_tra_moi": (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d"),
                "p_ly_do_gia_han": "AI Assistant"}
        rpc = supabase_client.rpc("fn_gia_han", params).execute()
        return "✅ Gia hạn thành công." if not hasattr(rpc, 'error') else f"❌ {rpc.error['message']}"

    if action_type == "reserve":
        existing = supabase_client.table("dattruoc")\
            .select("madattruoc")\
            .eq("mabandoc", mbd)\
            .eq("trangthaidattruoc", "kichHoat")\
            .ilike("bansao.tacpham.tentacpham", f"%{book_name}%")\
            .execute()

        if existing.data:
            return f"Thông báo: Bạn đã thực hiện đặt trước cuốn sách '{book_name}' rồi. Hệ thống đang ghi nhận yêu cầu của bạn, vui lòng không đặt lại."

        # Tìm bản sao đang bận
        res = supabase_client.table("bansao").select("mabansao").eq("trangthaichomuon", False)\
            .ilike("tacpham.tentacpham", f"%{book_name}%").limit(1).execute()
        if not res.data: return f"Sách '{book_name}' hiện có sẵn, mời bạn mượn trực tiếp."

        rpc = supabase_client.rpc("fn_dat_truoc", {"p_ma_ban_sao": res.data[0]['mabansao'], "p_ma_ban_doc": mbd}).execute()
        return "✅ Đã đặt trước thành công."

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