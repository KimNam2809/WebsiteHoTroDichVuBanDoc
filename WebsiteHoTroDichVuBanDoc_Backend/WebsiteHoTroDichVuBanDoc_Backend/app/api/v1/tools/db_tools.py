from app.connect.db import supabase_client
from datetime import datetime

def search_library_sql(keyword: str = None, author: str = None):
    """Tìm kiếm tài liệu dựa trên tên sách HOẶC tác giả HOẶC cả hai."""
    if not keyword and not author:
        return "Vui lòng cung cấp tên sách hoặc tác giả để tôi tìm kiếm."

    try:
        # Sử dụng join để kiểm tra trạng thái mượn trả
        query = supabase_client.table("tacpham").select("tentacpham, tacgia, namxuatban, bansao(trangthaichomuon)")

        if keyword:
            query = query.ilike("tentacpham", f"%{keyword}%")
        if author:
            query = query.ilike("tacgia", f"%{author}%")

        res = query.limit(3).execute()

        if not res.data:
            return f"Không tìm thấy tài liệu nào khớp với yêu cầu của bạn."

        output = ["📚 **Kết quả tìm thấy:**"]
        for b in res.data:
            copies = b.get('bansao', [])
            available = sum(1 for c in copies if c['trangthaichomuon'] is True)
            status = f"✅ Còn {available} bản" if available > 0 else "❌ Đã hết bản"

            output.append(f"- {b['tentacpham']} (TG: {b['tacgia']}) - {status}")

        return "\n".join(output)
    except Exception as e:
        return f"Lỗi truy vấn dữ liệu sách: {str(e)}"

def search_articles_sql(article_topic: str = None):
    """
    Tìm kiếm bài viết.
    """
    try:
        # 1. Khởi tạo query cơ bản
        query = supabase_client.table("baiviet").select("mabaiviet, tieude, noidung, ngaydang").eq("trangthai", True)

        # 2. Xử lý từ khóa
        is_generic_search = True

        if article_topic:
            # --- FIX: Đã xóa "sự kiện", "thông báo" khỏi danh sách loại trừ ---
            # Chỉ loại bỏ các từ nối, từ chỉ thời gian hoặc từ chỉ loại hình chung chung
            stop_words = ["mới nhất", "gần đây", "vừa đăng", "tin tức", "bài viết", "của thư viện", "về", "những", "các", "liệt kê", "danh sách"]

            clean_keyword = article_topic.lower()
            for sw in stop_words:
                clean_keyword = clean_keyword.replace(sw, "").strip()

            # Nếu còn từ khóa (Ví dụ: "sự kiện", "thông báo", "nghỉ tết") -> Search nội dung
            if len(clean_keyword) > 1:
                is_generic_search = False
                # Tìm trong tiêu đề HOẶC mảng từ khóa (tags)
                query = query.or_(f"tieude.ilike.%{clean_keyword}%,tukhoa.cs.{{{clean_keyword}}}")

        # 3. Thực thi Query
        res = query.order("ngaydang", desc=True).limit(3).execute()

        if not res.data:
            return f"Không tìm thấy bài viết nào liên quan đến '{article_topic}'."

        # 4. Format kết quả
        intro_text = "📰 **Các bài viết mới nhất:**" if is_generic_search else f"📰 **Kết quả tìm kiếm chủ đề '{clean_keyword}':**"

        articles = [intro_text]
        for a in res.data:
            desc = (a['noidung'][:100] + "...") if a['noidung'] else ""

            date_str = "N/A"
            if a['ngaydang']:
                try:
                    # Cắt chuỗi lấy YYYY-MM-DD
                    date_str = datetime.strptime(a['ngaydang'][:10], '%Y-%m-%d').strftime('%d/%m/%Y')
                except: pass

            articles.append(f"- [{date_str}] **{a['tieude']}**\n  {desc}")

        return "\n\n".join(articles)

    except Exception as e:
        return f"Lỗi tìm bài viết: {str(e)}"

def search_seats_sql(room_name: str = None):
    """Tìm chỗ ngồi khả dụng (Trạng thái: coSan)."""
    try:
        # Dùng !inner join để lọc chính xác theo tên phòng
        query = supabase_client.table("chongoi").select("tenchongoi, loaichongoi, trangthai, phong!inner(tenphong)")\
            .eq("trangthai", "coSan")

        if room_name:
            query = query.ilike("phong.tenphong", f"%{room_name}%")

        res = query.limit(5).execute()

        if not res.data:
            return "Hiện tại không còn chỗ ngồi trống nào phù hợp."

        seats = ["🪑 **Chỗ ngồi đang trống:**"]
        for s in res.data:
            seats.append(f"- {s['tenchongoi']} ({s['loaichongoi']}) tại {s['phong']['tenphong']}")

        return "\n".join(seats)
    except Exception as e:
        return f"Lỗi tìm chỗ ngồi: {str(e)}"

def search_equipment_sql(device_name: str = None, room_name: str = None):
    try:
        # Bước 1: Nếu user tìm theo phòng, Kiểm tra xem phòng có tồn tại không trước
        if room_name:
            check_room = supabase_client.table("phong").select("tenphong").ilike("tenphong", f"%{room_name}%").execute()
            if not check_room.data:
                return f"Hệ thống không tìm thấy phòng nào có tên chứa '{room_name}'."

        # Bước 2: Query thiết bị (Logic cũ)
        query = supabase_client.table("thietbi").select("tenthietbi, mathietbinoibo, trangthai, phong!inner(tenphong)")

        # Bỏ qua từ khóa chung chung
        common_words = ["thiết bị", "cơ sở vật chất", "đồ đạc", "máy móc", "dụng cụ"]
        if device_name and device_name.lower() not in common_words:
            query = query.ilike("tenthietbi", f"%{device_name}%")

        if room_name:
            query = query.ilike("phong.tenphong", f"%{room_name}%")

        res = query.limit(5).execute()

        if not res.data:
            # Nếu bước 1 tìm thấy phòng, mà bước 2 không ra thiết bị -> Phòng trống
            if room_name:
                return f"Phòng '{room_name}' hiện chưa được ghi nhận có thiết bị nào."
            return f"Không tìm thấy thiết bị phù hợp."

        devices = ["💻 **Danh sách thiết bị:**"]
        for d in res.data:
            phong = d.get('phong', {}).get('tenphong', 'N/A')
            status = d.get('trangthai', 'N/A')
            devices.append(f"- {d['tenthietbi']} ({d['mathietbinoibo']}) - {status}")

        return "\n".join(devices)
    except Exception as e:
        return f"Lỗi tra cứu thiết bị: {str(e)}"

def get_facility_status(room_name: str = None):
    """Kiểm tra tình trạng phòng cụ thể."""
    try:
        if not room_name:
            return "Vui lòng cho biết tên phòng cần kiểm tra."

        res = supabase_client.table("phong").select("tenphong, trangthai, chongoi(count)")\
            .ilike("tenphong", f"%{room_name}%").limit(1).execute()

        if not res.data:
            return f"Không tìm thấy phòng nào tên là '{room_name}'."

        p = res.data[0]
        # Đếm số lượng chỗ ngồi (nếu query trả về count)
        seat_count = p.get('chongoi', [{}])[0].get('count', 0) if p.get('chongoi') else 0

        return f"🏢 **{p['tenphong']}**\n- Trạng thái: {p['trangthai']}\n- Tổng số chỗ ngồi: {seat_count}"
    except Exception as e:
        return f"Lỗi thông tin phòng: {str(e)}"