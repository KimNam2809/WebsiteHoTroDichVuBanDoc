from app.connect.db import supabase_client
from datetime import datetime
from collections import Counter

def get_bandoc_id(user_id: int):
    """Lấy mabandoc từ manguoidung (bảng nguoidung)"""
    res = supabase_client.table("bandoc").select("mabandoc").eq("manguoidung", user_id).single().execute()
    return res.data["mabandoc"] if res.data else None

def analyze_and_recommend(user_id: int, topic: str = None):
    """
    Gợi ý sách thông minh:
    - Nếu 'topic' là tên 1 cuốn sách -> Gợi ý sách tương tự (cùng tác giả/danh mục).
    - Nếu 'topic' là chủ đề -> Tìm sách theo chủ đề.
    - Nếu topic=None -> Dựa vào lịch sử.
    """
    try:
        # [MODE 1] User cung cấp topic (có thể là tên sách hoặc chủ đề)
        if topic:
            # Check xem topic có phải là tên sách không?
            exact_book = supabase_client.table("tacpham").select("matacpham, tacgia, tacpham_danhmuc(danhmuc(tendanhmuc))")\
                .ilike("tentacpham", f"{topic}").limit(1).execute()
            
            if exact_book.data:
                # -> Topic là Tên Sách -> Suggest Similar
                b = exact_book.data[0]
                auth = b.get('tacgia')
                
                # Lấy danh mục đầu tiên
                cat = None
                if b.get('tacpham_danhmuc'):
                    cat = b['tacpham_danhmuc'][0]['danhmuc']['tendanhmuc']
                
                # Tìm sách cùng tác giả hoặc cùng danh mục (Trừ cuốn hiện tại)
                query = supabase_client.table("tacpham").select("matacpham, tentacpham, tacgia, mota, anhbia")\
                    .neq("matacpham", b['matacpham'])
                
                if auth:
                    query = query.ilike("tacgia", f"%{auth}%")
                elif cat:
                    # Logic phức tạp tí: query qua relation, nhưng ở đây simplify bằng text search danh mục nếu cần
                    pass 
                
                res = query.limit(5).execute()
                if res.data:
                    return {"message": f"Dựa trên cuốn **'{topic}'**, mình gợi ý các sách tương tự của tác giả **{auth}**:", "data": res.data}

            # -> Topic không phải sách cụ thể -> Search theo Category/Keyword (Logic cũ)
            dm_res = supabase_client.table("danhmuc").select("madanhmuc").ilike("tendanhmuc", f"%{topic}%").execute()
            dm_ids = [d['madanhmuc'] for d in dm_res.data]
            
            query = supabase_client.table("tacpham").select("matacpham, tentacpham, tacgia, mota, anhbia")
            
            if dm_ids:
                tp_dm = supabase_client.table("tacpham_danhmuc").select("matacpham").in_("madanhmuc", dm_ids).execute()
                tp_ids = [x['matacpham'] for x in tp_dm.data]
                if tp_ids: query = query.in_("matacpham", tp_ids)
                else: query = query.or_(f"tentacpham.ilike.%{topic}%, mota.ilike.%{topic}%")
            else:
                query = query.or_(f"tentacpham.ilike.%{topic}%, mota.ilike.%{topic}%")

            res = query.limit(5).execute()
            if res.data:
                return {"message": f"Về chủ đề **'{topic}'**, mình có vài cuốn hay nè:", "data": res.data}
            
            return f"Tiếc quá, mình chưa tìm thấy cuốn nào về **'{topic}'**."

        # [MODE 2] Gợi ý theo lịch sử (Giữ nguyên logic cũ hoạt động tốt)
        mabandoc = get_bandoc_id(user_id)
        if not mabandoc: return "Bạn chưa đăng ký thẻ bạn đọc."

        history_res = supabase_client.table("muontra").select("thoigianmuon, bansao(tacpham(matacpham, tacgia))").eq("mabandoc", mabandoc).limit(5).execute()
        if not history_res.data: return "Bạn chưa mượn cuốn nào. Hãy thử tìm sách mới nhé!"
        
        # Lấy tác giả mượn gần nhất
        last_book = history_res.data[0]['bansao']['tacpham']
        target_auth = last_book.get('tacgia')
        
        if target_auth:
            res = supabase_client.table("tacpham").select("matacpham, tentacpham, tacgia, anhbia").eq("tacgia", target_auth).limit(5).execute()
            return {"message": f"Vì bạn từng đọc sách của **{target_auth}**, bạn có thể thích:", "data": res.data}
            
        return "Hãy thử tìm kiếm sách theo chủ đề bạn thích nhé."

    except Exception as e:
        return f"Lỗi gợi ý: {str(e)}"

def search_library_sql(keyword: str = None, author: str = None, category: str = None, available_only: bool = False):
    """
    Search sách bao quát (Tên, Tác giả, Danh mục).
    """
    if not keyword and not author and not category and not available_only:
        return {"message": "Vui lòng cung cấp từ khóa tìm kiếm.", "data": []}

    try:
        # [QUAN TRỌNG] "category" từ AI có thể là Tên Sách (VD: "Python").
        # Nên nếu search Category fail -> Tự động chuyển category thành keyword tìm tên sách.
        
        search_kw = keyword or ""
        search_cat = category or ""
        
        # 1. Base Query
        query = supabase_client.table("tacpham").select("matacpham, tentacpham, tacgia, namxuatban, anhbia, bansao(trangthaichomuon)")

        # 2. Xử lý logic search
        # Nếu có Category -> Tìm ID match category trước
        matched_ids = set()
        if search_cat:
            # Tìm danh mục
            dm = supabase_client.table("danhmuc").select("madanhmuc").ilike("tendanhmuc", f"%{search_cat}%").execute()
            dm_ids = [d['madanhmuc'] for d in dm.data]
            
            if dm_ids:
                t1 = supabase_client.table("tacpham_danhmuc").select("matacpham").in_("madanhmuc", dm_ids).execute()
                for x in t1.data: matched_ids.add(x['matacpham'])
            
            # NẾU không tìm thấy ID nào theo danh mục -> Coi 'search_cat' là một phần của tên sách/mô tả
            # Ví dụ: search_cat="Python" (không có danh mục Python) -> Search tên sách chứa "Python"
            if not matched_ids:
                # Merge vào keyword để search ở bước sau
                if not search_kw: search_kw = search_cat
        
        # 3. Apply Filters
        if matched_ids:
            query = query.in_("matacpham", list(matched_ids))
        
        if search_kw:
            # Search rộng trong Tên HOẶC Tác giả (đề phòng AI extract nhầm field)
            query = query.or_(f"tentacpham.ilike.%{search_kw}%, tacgia.ilike.%{search_kw}%")
            
        if author:
            query = query.ilike("tacgia", f"%{author}%")

        res = query.limit(10).execute()

        if not res.data:
             return {"message": f"Không tìm thấy tài liệu nào phù hợp với từ khóa '{search_kw or search_cat}'.", "data": []}

        # 4. Format
        books_payload = []
        text_lines = []
        
        for b in res.data:
            copies = b.get('bansao', []) or []
            available_count = sum(1 for c in copies if c.get('trangthaichomuon') is True)
            
            status_text = f"(✅ Còn {available_count} bản)" if available_count > 0 else "(❌ Hết bản)"
            text_lines.append(f"- **{b['tentacpham']}** - {b['tacgia']} {status_text}")
            
            books_payload.append({
                "id": b['matacpham'],
                "title": b['tentacpham'],
                "author": b['tacgia'] or "N/A",
                "cover": b.get('anhbia') or "/images/default-book.png",
                "link": f"/tai_lieu/{b['matacpham']}"
            })
            
        return {
            "message": f"Tôi tìm thấy {len(books_payload)} tài liệu:\n" + "\n".join(text_lines),
            "data": books_payload
        }

    except Exception as e:
        return {"message": f"Lỗi tìm sách: {str(e)}", "data": []}
    
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

def search_equipment_sql(device_name: str = None, room_name: str = None):
    """Tìm thiết bị (Map từ đồng nghĩa wifi->internet, máy lạnh->điều hòa)."""
    try:
        # Mapping từ đồng nghĩa
        synonyms = {
            "wifi": ["internet", "mạng", "wifi", "access point"],
            "máy lạnh": ["điều hòa", "máy lạnh", "làm mát"],
            "máy chiếu": ["máy chiếu", "projector"]
        }
        
        search_terms = []
        if device_name:
            norm_name = device_name.lower()
            found_key = next((k for k, v in synonyms.items() if norm_name in v or norm_name == k), None)
            if found_key:
                search_terms = synonyms[found_key]
            else:
                search_terms = [norm_name]
        
        # Build Query
        query = supabase_client.table("thietbi").select("tenthietbi, trangthai, phong!inner(tenphong)")
        
        if room_name:
            query = query.ilike("phong.tenphong", f"%{room_name}%")
            
        if search_terms:
            # Tạo chuỗi OR: tenthietbi.ilike.%term1%,tenthietbi.ilike.%term2%...
            or_clause = ",".join([f"tenthietbi.ilike.%{t}%" for t in search_terms])
            query = query.or_(or_clause)
            
        res = query.limit(10).execute()
        
        if not res.data:
            # Failover: Nếu hỏi về tiện ích cơ bản (wifi, máy lạnh) mà không có trong bảng Thiết bị
            # -> Có thể check mô tả phòng (nếu có, nhưng user bảo ko có cột mota)
            # -> Trả về trạng thái phòng để user biết phòng có tồn tại
            if room_name:
                return get_facility_status(room_name)
            return "Không tìm thấy thông tin thiết bị này."

        items = []
        for d in res.data:
            items.append(f"- {d['tenthietbi']} ({d['trangthai']}) @ {d['phong']['tenphong']}")
            
        return "💻 **Thiết bị tìm thấy:**\n" + "\n".join(items)

    except Exception as e:
        return f"Lỗi tra cứu: {str(e)}"

def get_facility_status(room_name: str = None):
    """
    Check phòng ốc.
    FIX: Bỏ cột 'mota' vì không tồn tại trong schema.
    """
    try:
        if not room_name: return "Vui lòng nhập tên phòng."
        
        # Chỉ select các cột chắc chắn có
        # Check schema user provided? No schema file -> Safe guess: tenphong, trangthai, succhua?
        # User error logs showed 'phong.mota' does not exist.
        res = supabase_client.table("phong").select("tenphong, trangthai, chongoi(count)").ilike("tenphong", f"%{room_name}%").limit(1).execute()
        
        if not res.data:
            return f"Không tìm thấy phòng '{room_name}'."
            
        p = res.data[0]
        seat_count = p['chongoi'][0]['count'] if p.get('chongoi') else 0
        
        return f"🏢 **{p['tenphong']}**\n- Trạng thái: {p['trangthai']}\n- Số chỗ ngồi: {seat_count}"
        
    except Exception as e:
        return f"Lỗi thông tin phòng: {str(e)}"

def search_seats_sql(room_name: str = None):
    return "Tính năng tìm chỗ đang phát triển."

def search_staff_sql(name: str = None, department: str = None):
    """Tra cứu thông tin nhân viên."""
    try:
        query = supabase_client.table("nhanvien").select("hoten, chucvu, phongban, email, sdt")
        
        if name:
            query = query.ilike("hoten", f"%{name}%")
        if department:
            query = query.ilike("phongban", f"%{department}%")
            
        res = query.limit(5).execute()
        
        if not res.data:
            return "Không tìm thấy thông tin nhân viên phù hợp."
            
        staffs = ["👥 **Danh sách nhân viên:**"]
        for s in res.data:
            info = f"- **{s['hoten']}**"
            if s.get('chucvu'): info += f" ({s['chucvu']})"
            if s.get('phongban'): info += f" - {s['phongban']}"
            staffs.append(info)
            
        return "\n".join(staffs)
    except Exception as e:
        return f"Lỗi tra cứu nhân viên: {str(e)}"

def get_library_policies_sql(topic: str = None):
    """
    Tra cứu chính sách thư viện (Loại thẻ, phí, quy định mượn).
    """
    try:
        # Nếu hỏi về Thẻ -> Tra bảng LoaiThe
        if topic and any(x in topic.lower() for x in ["thẻ", "phí", "loại thẻ", "hạn mức"]):
            res = supabase_client.table("loaithe").select("tenthe, lephi, tailieumuontoida, songaymuonmacdinh").execute()
            if not res.data: return "Không tìm thấy thông tin loại thẻ."
            
            lines = ["💳 **Chính sách thẻ bạn đọc:**"]
            for c in res.data:
                fee = f"{c.get('lephi', 0):,.0f}đ" if c.get('lephi') else "Miễn phí"
                lines.append(f"- **{c['tenthe']}**: Phí {fee}, mượn tối đa {c['tailieumuontoida']} cuốn ({c['songaymuonmacdinh']} ngày).")
            return "\n".join(lines)
            
        return "Vui lòng xem chi tiết nội quy tại mục Hướng dẫn."
    except Exception as e:
        return f"Lỗi tra cứu chính sách: {str(e)}"