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
    """
    Tổng hợp toàn bộ trạng thái cá nhân:
    1. Thông tin thẻ & Yêu cầu thẻ.
    2. Sách đang mượn (muontra).
    3. Sách đặt trước (dattruoc).
    4. Chỗ ngồi/Phòng đã đặt (datchongoi).
    """
    try:
        # 1. Lấy thông tin Bạn đọc & Thẻ & Yêu cầu thẻ
        profile_query = supabase_client.table("bandoc")\
            .select("mabandoc, hoten, thebandoc(sothe, ngayhethan, trangthaithe), yeucauthe(trangthaiquytrinh, hinhthucyeucau)")\
            .eq("manguoidung", user_id).limit(1).execute()

        if not profile_query.data:
            return "⚠️ Bạn chưa có hồ sơ bạn đọc. Vui lòng đăng ký thẻ thư viện để sử dụng các dịch vụ cá nhân."

        profile = profile_query.data[0]
        mbd = profile['mabandoc']
        hoten = profile['hoten']

        summary = [f"👤 **Xin chào {hoten}!**\nDưới đây là thông tin hoạt động của bạn:"]

        # --- A. THÔNG TIN THẺ ---
        cards = profile.get('thebandoc', [])
        requests = profile.get('yeucauthe', [])

        if cards:
            c = cards[0]
            status = "Hoạt động" if c['trangthaithe'] else "Khóa"
            # Format ngày hết hạn
            exp_date = c['ngayhethan']
            if exp_date:
                try: exp_date = datetime.strptime(exp_date, '%Y-%m-%d').strftime('%d/%m/%Y')
                except: pass
            summary.append(f"💳 **Thẻ:** {c['sothe']} (Hết hạn: {exp_date}) - {status}")
        elif requests:
            r = requests[0] # Lấy yêu cầu mới nhất
            summary.append(f"📝 **Yêu cầu thẻ:** Đang xử lý ({r['trangthaiquytrinh']})")
        else:
            summary.append("💳 **Thẻ:** Chưa có thẻ (Vui lòng đăng ký).")

        # --- B. SÁCH ĐANG MƯỢN (muontra) ---
        mt = supabase_client.table("muontra")\
            .select("ngaytra, tienphat, bansao(mabansao, tacpham(tentacpham))")\
            .eq("mabandoc", mbd).eq("trangthaimuon", "daMuon").execute()

        if mt.data:
            books = []
            for item in mt.data:
                bs = item.get('bansao') or {}
                tp = bs.get('tacpham') or {}
                title = tp.get('tentacpham', 'Sách không tên')

                due_date = item['ngaytra']
                if due_date:
                    try: due_date = datetime.strptime(due_date, '%Y-%m-%d').strftime('%d/%m/%Y')
                    except: pass

                fines = f" - ⚠️ Phạt: {item['tienphat']:,.0f}đ" if item.get('tienphat') and item['tienphat'] > 0 else ""
                books.append(f"- {title} (Hạn: {due_date}){fines}")
            summary.append(f"\n📚 **Đang mượn ({len(books)}):**\n" + "\n".join(books))
        else:
            summary.append("\n📚 **Đang mượn:** Không có sách nào.")

        # --- C. SÁCH ĐẶT TRƯỚC (dattruoc) ---
        dt = supabase_client.table("dattruoc")\
            .select("thoidiemdattruoc, bansao(tacpham(tentacpham))")\
            .eq("mabandoc", mbd).eq("trangthaidattruoc", "kichHoat").execute()

        if dt.data:
            reserves = []
            for item in dt.data:
                bs = item.get('bansao') or {}
                tp = bs.get('tacpham') or {}
                title = tp.get('tentacpham', 'Sách không tên')

                # Format thời gian đặt
                time_str = item['thoidiemdattruoc']
                if time_str:
                    try: time_str = datetime.fromisoformat(time_str.replace('Z', '+00:00')).strftime('%d/%m/%Y %H:%M')
                    except: time_str = time_str[:16]

                reserves.append(f"- {title} (Đặt lúc: {time_str})")
            summary.append(f"\n📌 **Đang đặt trước ({len(reserves)}):**\n" + "\n".join(reserves))

        # --- D. ĐẶT CHỖ / PHÒNG (datchongoi) ---
        # Lưu ý: Bảng datphong (theo schema) dùng cho người tổ chức sự kiện và không có mabandoc.
        # User cá nhân đặt chỗ/phòng thông qua bảng datchongoi.
        try:
            dc = supabase_client.table("datchongoi")\
                .select("thoigianbatdau, thoigianketthuc, trangthaidatcho, chongoi(tenchongoi, phong(tenphong))")\
                .eq("mabandoc", mbd)\
                .in_("trangthaidatcho", ["kichHoat", "dangSuDung", "choDuyet"]) \
                .execute()

            if dc.data and len(dc.data) > 0:
                bookings = []
                for item in dc.data:
                    seat = item.get('chongoi') or {}
                    room = seat.get('phong') or {}
                    seat_name = seat.get('tenchongoi', 'Chỗ ?')
                    room_name = room.get('tenphong', 'Phòng ?')
                    status_raw = item.get('trangthaidatcho', '')

                    # Việt hóa trạng thái cho thân thiện
                    status_map = {
                        "kichHoat": "Đã đặt",
                        "dangSuDung": "Đang ngồi",
                        "choDuyet": "Chờ duyệt"
                    }
                    status_vn = status_map.get(status_raw, status_raw)

                    start = item['thoigianbatdau']
                    if start:
                        try: start = datetime.fromisoformat(start.replace('Z', '+00:00')).strftime('%H:%M %d/%m')
                        except: start = start[:16]

                    bookings.append(f"- {seat_name} ({room_name}) lúc {start} [{status_vn}]")

                summary.append(f"\n🪑 **Chỗ ngồi/Phòng đã đặt ({len(bookings)}):**\n" + "\n".join(bookings))

            else:
                # --- KHẮC PHỤC Ở ĐÂY ---
                # Nếu không tìm thấy chỗ nào Active, thông báo rõ ràng cho người dùng biết.
                summary.append("\n🪑 **Chỗ ngồi/Phòng:** Bạn hiện chưa có lịch đặt chỗ nào đang hoạt động.")

        except Exception as e:
            summary.append(f"\n⚠️ Lỗi lấy thông tin chỗ ngồi: {str(e)}")

        return "\n".join(summary)

    except Exception as e:
        return f"Lỗi truy xuất hồ sơ: {str(e)}"

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