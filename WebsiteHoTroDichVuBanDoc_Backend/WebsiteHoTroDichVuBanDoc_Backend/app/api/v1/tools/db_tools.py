from app.connect.db import supabase_client
from datetime import datetime

def search_library_sql(keyword: str = None, author: str = None, category: str = None, available_only: bool = False):
    """
    Tìm kiếm tài liệu hỗ trợ Schema nhiều-nhiều (tacpham_danhmuc, tacpham_tukhoa).
    """
    if not keyword and not author and not category and not available_only:
        return {"message": "Vui lòng cung cấp tên sách, tác giả hoặc chủ đề bạn quan tâm.", "data": []}

    try:
        # --- BƯỚC 1: XỬ LÝ LỌC THEO CHỦ ĐỀ/THỂ LOẠI (CATEGORY) ---
        target_book_ids = set()
        filter_by_category = False

        if category:
            filter_by_category = True
            # 1.1. Tìm trong bảng DANHMUC -> tacpham_danhmuc
            dm_res = supabase_client.table("danhmuc").select("madanhmuc").ilike("tendanhmuc", f"%{category}%").execute()
            if dm_res.data:
                dm_ids = [d['madanhmuc'] for d in dm_res.data]
                # Lấy ID sách từ bảng trung gian
                tp_dm = supabase_client.table("tacpham_danhmuc").select("matacpham").in_("madanhmuc", dm_ids).execute()
                for x in tp_dm.data: target_book_ids.add(x['matacpham'])

            # 1.2. Tìm trong bảng TUKHOA -> tacpham_tukhoa
            tk_res = supabase_client.table("tukhoa").select("matukhoa").ilike("tentukhoa", f"%{category}%").execute()
            if tk_res.data:
                tk_ids = [k['matukhoa'] for k in tk_res.data]
                # Lấy ID sách từ bảng trung gian
                tp_tk = supabase_client.table("tacpham_tukhoa").select("matacpham").in_("matukhoa", tk_ids).execute()
                for x in tp_tk.data: target_book_ids.add(x['matacpham'])

            # 1.3. (Tùy chọn) Tìm luôn trong tên sách để không bỏ sót
            tp_name = supabase_client.table("tacpham").select("matacpham").ilike("tentacpham", f"%{category}%").execute()
            for x in tp_name.data: target_book_ids.add(x['matacpham'])

        # --- BƯỚC 2: TRUY VẤN BẢNG TACPHAM ---
        query = supabase_client.table("tacpham").select("matacpham, tentacpham, tacgia, namxuatban, anhbia, bansao(trangthaichomuon)")

        # Áp dụng bộ lọc Category (nếu có)
        if filter_by_category:
            if not target_book_ids:
                return {"message": f"Không tìm thấy sách nào thuộc chủ đề '{category}'.", "data": []}
            query = query.in_("matacpham", list(target_book_ids))

        # Áp dụng bộ lọc Keyword (Tên sách cụ thể)
        if keyword:
            query = query.ilike("tentacpham", f"%{keyword}%")

        # Áp dụng bộ lọc Tác giả
        if author:
            query = query.ilike("tacgia", f"%{author}%")

        res = query.limit(10).execute()

        if not res.data:
            return {"message": "Không tìm thấy tài liệu nào phù hợp.", "data": []}

        # --- BƯỚC 3: XỬ LÝ KẾT QUẢ & LỌC AVAILABLE ---
        books_payload = []
        text_lines = []
        found_count = 0

        for b in res.data:
            copies = b.get('bansao', [])
            available_count = sum(1 for c in copies if c['trangthaichomuon'] is True)

            # Lọc nếu user chỉ cần sách có thể mượn ngay
            if available_only and available_count == 0:
                continue

            found_count += 1
            if found_count > 5: break

            status_text = f"(✅ Còn {available_count} bản)" if available_count > 0 else "(❌ Hết bản)"
            text_lines.append(f"- {b['tentacpham']} - {b['tacgia']} {status_text}")

            cover_url = b.get('anhbia') or "/images/default-book.png"
            books_payload.append({
                "id": b['matacpham'],
                "title": b['tentacpham'],
                "author": b['tacgia'] or "Chưa rõ",
                "cover": cover_url,
                "link": f"/tai_lieu/{b['matacpham']}"
            })

        if not books_payload:
            if available_only:
                return {"message": "Các sách phù hợp hiện đều đã được mượn hết.", "data": []}
            return {"message": "Không tìm thấy tài liệu phù hợp.", "data": []}

        prefix = "Các sách hiện có thể mượn ngay:\n" if available_only else f"Tôi tìm thấy {len(books_payload)} tài liệu phù hợp:\n"
        reply_msg = prefix + "\n".join(text_lines)

        return {
            "message": reply_msg,
            "data": books_payload
        }

    except Exception as e:
        return {"message": f"Lỗi hệ thống: {str(e)}", "data": []}

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
    """
    Kiểm tra danh sách thiết bị.
    Xử lý thông minh các từ khóa chung chung.
    """
    try:
        # --- FIX: Xử lý tên phòng chung chung ---
        # Nếu room_name là các từ này, coi như tìm tất cả phòng
        ignored_rooms = ["thư viện", "trường", "đây", "tất cả", "ở đây"]
        if room_name and any(x in room_name.lower() for x in ignored_rooms):
            room_name = None

        # Bước 1: Kiểm tra phòng tồn tại (Chỉ khi room_name cụ thể)
        if room_name:
            check_room = supabase_client.table("phong").select("tenphong").ilike("tenphong", f"%{room_name}%").execute()
            if not check_room.data:
                return f"Hệ thống không tìm thấy phòng nào có tên chứa '{room_name}'."

        # Bước 2: Query thiết bị
        query = supabase_client.table("thietbi").select("tenthietbi, mathietbinoibo, trangthai, phong!inner(tenphong)")

        # Bỏ qua từ khóa thiết bị chung chung
        common_words = ["thiết bị", "cơ sở vật chất", "đồ đạc", "máy móc", "dụng cụ", "các", "những"]

        if device_name:
            clean_device = device_name.lower().strip()
            if clean_device not in common_words:
                query = query.ilike("tenthietbi", f"%{clean_device}%")

        if room_name:
            query = query.ilike("phong.tenphong", f"%{room_name}%")

        res = query.limit(5).execute()

        if not res.data:
            if room_name:
                return f"Phòng '{room_name}' hiện chưa được ghi nhận có thiết bị nào."
            return f"Không tìm thấy thiết bị phù hợp."

        devices = ["💻 **Danh sách thiết bị:**"]
        for d in res.data:
            phong = d.get('phong', {}).get('tenphong', 'N/A')
            status = d.get('trangthai', 'N/A')
            devices.append(f"- {d['tenthietbi']} (Mã: {d['mathietbinoibo']}) - {status} [Tại: {phong}]")

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