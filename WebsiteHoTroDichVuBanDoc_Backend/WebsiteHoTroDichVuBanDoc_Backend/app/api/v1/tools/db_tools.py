from app.connect.db import supabase_client

def search_library_sql(keyword: str = None, author: str = None):
    """Tìm kiếm đa năng dựa trên từ khóa đã lọc."""
    if not keyword or len(keyword) < 2:
        return "Vui lòng cung cấp từ khóa tìm kiếm cụ thể hơn."

    try:
        # 1. Tìm Sách (Bảng tacpham)
        res_book = supabase_client.table("tacpham").select("tentacpham, tacgia, namxuatban, isbn")\
            .or_(f"tentacpham.ilike.%{keyword}%,tacgia.ilike.%{author}%").limit(3).execute()

        # 2. Tìm Bài viết (Bảng baiviet)
        res_blog = supabase_client.table("baiviet").select("tieude, mabaiviet")\
            .ilike("tieude", f"%{keyword}%").eq("trangthai", True).limit(2).execute()

        # 3. Tìm Phòng/Tiện ích (Bảng phong)
        res_room = supabase_client.table("phong").select("tenphong, vitri, trangthai")\
            .ilike("tenphong", f"%{keyword}%").limit(2).execute()

        output = []
        if res_book.data:
            output.append("📚 **Tài liệu tìm thấy:**")
            for b in res_book.data:
                output.append(f"- {b['tentacpham']} (TG: {b['tacgia']} - {b['namxuatban']})")

        if res_blog.data:
            output.append("\n📰 **Bài viết/Thông báo:**")
            for a in res_blog.data:
                output.append(f"- {a['tieude']} (Mã: {a['mabaiviet']})")

        if res_room.data:
            output.append("\n🏢 **Cơ sở vật chất:**")
            for r in res_room.data:
                output.append(f"- {r['tenphong']} tại {r['vitri']} ({r['trangthai']})")

        return "\n".join(output) if output else f"Xin lỗi, thư viện không tìm thấy thông tin nào cho từ khóa '{keyword}'."
    except Exception as e:
        return f"Lỗi truy vấn dữ liệu thư viện."

def get_facility_status(room_name: str = None):
    """Kiểm tra tình trạng phòng hoặc chỗ ngồi cụ thể."""
    try:
        if room_name:
            res = supabase_client.table("phong").select("*, chongoi(tenchongoi, trangthai)")\
                .ilike("tenphong", f"%{room_name}%").single().execute()
            p = res.data
            seats = p.get('chongoi', [])
            avail_seats = sum(1 for s in seats if s['trangthai'] == 'coSan')
            return f"🏢 {p['tenphong']}: {p['trangthai']}. Chỗ trống: {avail_seats}/{len(seats)}."
        return "Vui lòng cho biết tên phòng cần kiểm tra."
    except: return "Không tìm thấy thông tin phòng."

def search_articles_sql(keyword: str):
    """Tìm kiếm bài viết theo tiêu đề hoặc từ khóa (array)."""
    try:
        # Sử dụng .contains cho cột tukhoa text[] hoặc ilike cho tieude
        res = supabase_client.table("baiviet")\
            .select("mabaiviet, tieude, noidung, ngaydang, tukhoa")\
            .eq("trangthai", True)\
            .or_(f"tieude.ilike.%{keyword}%,tukhoa.cs.{{{keyword}}}")\
            .order("ngaydang", desc=True).limit(3).execute()

        if not res.data:
            return f"Không tìm thấy bài viết nào liên quan đến '{keyword}'."

        articles = []
        for a in res.data:
            desc = a['noidung'][:150] + "..." # Lấy đoạn ngắn mô tả
            articles.append(f"📰 **{a['tieude']}** ({a['ngaydang'][:10]})\n   {desc}\n   [Xem thêm](mabaiviet={a['mabaiviet']})")

        return "Kết quả tìm kiếm bài viết:\n\n" + "\n\n".join(articles)
    except Exception as e:
        return f"Lỗi tìm bài viết: {str(e)}"

def search_equipment_sql(room_id: int = None, device_name: str = None):
    """Kiểm tra danh sách hoặc tình trạng thiết bị trong phòng."""
    try:
        query = supabase_client.table("thietbi").select("tenthietbi, mathietbinoibo, trangthai, phong(tenphong)")

        if room_id:
            query = query.eq("maphong", room_id)
        if device_name:
            query = query.ilike("tenthietbi", f"%{device_name}%")

        res = query.execute()
        if not res.data:
            return "Không tìm thấy thiết bị nào phù hợp với yêu cầu."

        devices = [f"- {d['tenthietbi']} ({d['mathietbinoibo']}): **{d['trangthai']}** tại {d['phong']['tenphong']}" for d in res.data]
        return "Tình trạng thiết bị:\n" + "\n".join(devices)
    except Exception as e:
        return f"Lỗi tra cứu thiết bị: {str(e)}"