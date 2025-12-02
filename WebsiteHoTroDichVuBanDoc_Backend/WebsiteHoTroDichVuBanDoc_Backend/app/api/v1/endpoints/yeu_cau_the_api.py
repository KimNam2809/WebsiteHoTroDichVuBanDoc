from fastapi import APIRouter, HTTPException, Query, status, Depends, UploadFile, File, Form, BackgroundTasks
from typing import List, Optional, Dict, Any
from app.api.v1.endpoints.mock_national_db_api import generate_username_from_name, perform_verification
from app.connect.security import get_password_hash
from app.models.yeu_cau_the import TraCuuRequest, YeuCauThe, YeuCauTheCreate, YeuCauTheDetailResponse, YeuCauTheUpdate, YeuCauTheAdminView, DuyetTheRequest, TraCuuYeuCauResponse
from app.connect.db import supabase_client
from app.utils import to_json_safe
from app.connect.auth import get_current_user_from_db, get_current_staff_profile, get_card_request_owner_or_staff
import logging, ast, uuid, time, re
from datetime import date, datetime, timedelta

def process_card_application(ma_yeu_cau: int, form_data: dict, filename: str):
    """
    Hàm chạy ngầm: Gọi Mock API -> Cập nhật trạng thái -> (Tự động tạo thẻ nếu Xanh)
    """
    logger.info(f"🚀 Bắt đầu xử lý ngầm hồ sơ {ma_yeu_cau}...")

    # Giả lập độ trễ mạng (để thấy được trạng thái 'dangXuLy')
    time.sleep(5)

    try:
        # 1. Gọi hàm xác thực (Mock API)
        verify_result = perform_verification(
            cccd=form_data["cccd"],
            ho_ten=form_data["ho_ten"],
            ngay_sinh=form_data["ngay_sinh"],
            sdt=form_data["sdt"],
            filename=filename
        )

        risk = verify_result["risk_level"]
        logger.info(f"🔍 Kết quả xác thực hồ sơ {ma_yeu_cau}: {risk}")

        # Lấy dữ liệu hiện tại để update JSON
        current_req = supabase_client.table(TABLE_NAME).select("thongtinbosung").eq("mayeucauthe", ma_yeu_cau).single().execute()
        info = current_req.data["thongtinbosung"]

        # Ghi kết quả xác thực vào JSON
        info["ket_qua_xac_thuc"] = verify_result

        # 2. Phân luồng xử lý
        if risk == "HIGH":
            # --- LUỒNG ĐỎ: TỰ ĐỘNG TỪ CHỐI ---
            supabase_client.table(TABLE_NAME).update({
                "trangthaiquytrinh": "tuChoi",
                "thoigianxuly": datetime.now().isoformat(),
                "ghichu": f"Hệ thống tự động từ chối: {', '.join(verify_result['details'])}",
                "thongtinbosung": to_json_safe(info)
            }).eq("mayeucauthe", ma_yeu_cau).execute()

        elif risk == "MEDIUM":
            # --- LUỒNG VÀNG: CHỜ DUYỆT (ADMIN XEM) ---
            supabase_client.table(TABLE_NAME).update({
                "trangthaiquytrinh": "choDuyet", # Chuyển từ dangXuLy -> choDuyet
                "thongtinbosung": to_json_safe(info)
            }).eq("mayeucauthe", ma_yeu_cau).execute()

        elif risk == "LOW":
            # --- LUỒNG XANH: TỰ ĐỘNG DUYỆT & TẠO THẺ ---

            creator_id = info.get("ma_nguoi_dung_dang_ky")
            target_user_id = creator_id # Mặc định là người đăng ký tự làm cho mình

            # === BƯỚC KIỂM TRA: AI LÀ NGƯỜI ĐĂNG KÝ? (FIX LỖI 2) ===
            is_staff = False
            try:
                # Kiểm tra xem creator_id có phải là Nhân Viên không
                staff_check = supabase_client.table("nhanvien").select("manhanvien").eq("manguoidung", creator_id).execute()
                if staff_check.data:
                    is_staff = True
            except Exception:
                pass

            if is_staff:
                logger.info(f"Hồ sơ {ma_yeu_cau} do NHÂN VIÊN tạo -> Tiến hành tạo tài khoản User mới.")
                # Logic: Nhân viên tạo hộ -> Phải tạo User mới cho khách

                # 1. Tạo Username & Hash pass
                new_username = generate_username_from_name(info.get("ho_ten"))
                default_password = get_password_hash("abc123456") # Mật khẩu mặc định dài chút cho an toàn

                # 2. Insert vào bảng NguoiDung
                new_user_data = {
                    "tendangnhap": new_username,
                    "email": info.get("email"), # Dùng email từ form
                    "sodienthoai": info.get("sdt"), # Dùng sdt từ form
                    "matkhau": default_password,
                    "vaitro": "nguoiDung",
                    "trangthai": True # Kích hoạt luôn
                }

                try:
                    user_res = supabase_client.table("nguoidung").insert(new_user_data).execute()
                    if user_res.data:
                        target_user_id = user_res.data[0]['manguoidung']
                        logger.info(f"Đã tạo user mới ID: {target_user_id} ({new_username})")
                    else:
                        raise Exception("Không thể tạo tài khoản người dùng mới.")
                except Exception as create_user_err:
                    # Nếu trùng email/sdt thì có thể user đã tồn tại, thử tìm lại
                    logger.warning(f"Lỗi tạo user (có thể đã tồn tại): {create_user_err}")
                    find_user = supabase_client.table("nguoidung").select("manguoidung").eq("email", info.get("email")).execute()
                    if find_user.data:
                        target_user_id = find_user.data[0]['manguoidung']
                    else:
                        raise create_user_err # Lỗi thật sự
            # === KẾT THÚC LOGIC KIỂM TRA NGƯỜI TẠO ===

            # A. Tạo/Lấy BanDoc (Dùng target_user_id đã xác định ở trên)
            ma_phuong_xa = info.get("ma_phuong_xa") or 1

            check_bd = supabase_client.table("bandoc").select("mabandoc").eq("manguoidung", target_user_id).execute()

            if check_bd.data:
                # === KIỂM TRA TRÙNG THẺ ===
                # Lấy loại thẻ khách muốn đăng ký
                req_data = supabase_client.table(TABLE_NAME).select("maloaithe").eq("mayeucauthe", ma_yeu_cau).single().execute()
                ma_loai_the = req_data.data["maloaithe"]
                # Kiểm tra xem bạn đọc này ĐÃ CÓ thẻ loại này và ĐANG HOẠT ĐỘNG chưa?
                check_card = supabase_client.table("thebandoc") \
                    .select("mathe") \
                    .eq("mabandoc", ma_ban_doc) \
                    .eq("maloaithe", ma_loai_the) \
                    .eq("trangthaithe", True) \
                    .execute()
                if check_card.data:
                    # ==> PHÁT HIỆN TRÙNG: TỰ ĐỘNG TỪ CHỐI
                    logger.warning(f"User {target_user_id} đã có thẻ loại {ma_loai_the}. Từ chối yêu cầu {ma_yeu_cau}.")
                    reason = "Bạn đã sở hữu loại thẻ này và thẻ vẫn đang hoạt động. Không thể cấp trùng."
                    # Cập nhật JSON lý do
                    info["ly_do_tu_choi"] = reason
                    info["ngay_xu_ly"] = datetime.now().isoformat()

                    supabase_client.table(TABLE_NAME).update({
                        "trangthaiquytrinh": "tuChoi", # Từ chối
                        "mabandoc": ma_ban_doc,
                        "thoigianxuly": "now()",
                        "ghichu": "Hệ thống tự động từ chối (Duplicate Card)",
                        "thongtinbosung": to_json_safe(info)
                    }).eq("mayeucauthe", ma_yeu_cau).execute()

                    return # KẾT THÚC HÀM NGAY TẠI ĐÂY
                else:
                    # Nếu người dùng (target) đã là bạn đọc -> Dùng lại hồ sơ cũ (Cấp thẻ mới/Làm lại)
                    ma_ban_doc = check_bd.data[0]['mabandoc']
            else:
                # Nếu chưa -> Tạo hồ sơ Bạn Đọc mới
                new_bandoc = {
                    "manguoidung": target_user_id, # <-- Dùng ID đúng
                    "hoten": info.get("ho_ten"),
                    "ngaysinh": info.get("ngay_sinh"),
                    "gioi_tinh": info.get("gioi_tinh"),
                    "cccd": info.get("cccd"),
                    "diachi": info.get("dia_chi"),
                    "maphuongxa": ma_phuong_xa,
                    "nghenghiep": info.get("nghe_nghiep"),
                    "thongtinbosung": to_json_safe({"anh_the_url": info.get("anh_the_url")})
                }
                bd_res = supabase_client.table("bandoc").insert(to_json_safe(new_bandoc)).execute()
                ma_ban_doc = bd_res.data[0]['mabandoc']

            # B. Tạo Thẻ (Giữ nguyên)
            # Lấy ma_loai_the từ DB
            req_data = supabase_client.table(TABLE_NAME).select("maloaithe").eq("mayeucauthe", ma_yeu_cau).single().execute()
            ma_loai_the = req_data.data["maloaithe"]

            so_the = f"T{int(time.time())}"
            ngay_het_han = (datetime.now() + timedelta(days=365)).date()

            new_card = {
                "mabandoc": ma_ban_doc,
                "maloaithe": ma_loai_the,
                "sothe": so_the,
                "manhanvien": creator_id if is_staff else None, # Nếu nhân viên làm thì ghi nhận, user làm thì null
                "ngayhethan": ngay_het_han,
                "trangthaithe": True,
                "phuongthucvanchuyen": "TaiQuay"
            }
            supabase_client.table("thebandoc").insert(to_json_safe(new_card)).execute()

            # C. Cập nhật trạng thái YeuCauThe (Hoàn tất)
            info["ngay_xu_ly"] = datetime.now().isoformat()
            if is_staff:
                info["ghi_chu_he_thong"] = f"Được tạo hộ bởi nhân viên ID {creator_id}. Tài khoản mới: {target_user_id}"

            supabase_client.table(TABLE_NAME).update({
                "trangthaiquytrinh": "daDuyet",
                "mabandoc": ma_ban_doc,
                "thoigianxuly": "now()",
                "manhanvien": creator_id if is_staff else None, # Ghi nhận người xử lý
                "ghichu": "Hệ thống tự động duyệt (Auto-Approved)",
                "thongtinbosung": to_json_safe(info)
            }).eq("mayeucauthe", ma_yeu_cau).execute()

    except Exception as e:
        logger.error(f"🔥 Lỗi trong background task hồ sơ {ma_yeu_cau}: {e}")
        # Cập nhật trạng thái lỗi để Admin biết đường xử lý
        supabase_client.table(TABLE_NAME).update({
            "trangthaiquytrinh": "choDuyet", # Đẩy về cho người xem
            "ghichu": f"Lỗi xử lý tự động: {str(e)}"
        }).eq("mayeucauthe", ma_yeu_cau).execute()

router = APIRouter()
logger = logging.getLogger(__name__)

TABLE_NAME = "yeucauthe"
STORAGE_BUCKET = "card_requests"

# --- 1. API ĐĂNG KÝ THẺ (Upload Ảnh & Thông tin) ---
@router.post(
    "/dang-ky",
    status_code=status.HTTP_201_CREATED,
    summary="Gửi yêu cầu làm thẻ mới (Kèm ảnh)"
)
async def dang_ky_the_ban_doc(
    # Sử dụng Form(...) thay vì Body JSON để hỗ trợ upload file
    background_tasks: BackgroundTasks,
    ho_ten: str = Form(...),
    ngay_sinh: str = Form(...),
    gioi_tinh: str = Form(...),
    nghe_nghiep: str = Form(...),
    cccd: str = Form(...),
    dia_chi: str = Form(...),
    email: str = Form(...),
    sdt: str = Form(...),
    ma_loai_the: int = Form(...),
    ma_phuong_xa: int = Form(...),
    anh_the: UploadFile = File(None),
    current_user: dict = Depends(get_current_user_from_db)
):
    """
    API đăng ký thẻ thư viện. Sử dụng `multipart/form-data`.
    - Upload ảnh lên Supabase Storage.
    - Lưu thông tin cá nhân vào cột `thongtinbosung` (JSONB).
    - `maBanDoc` sẽ để NULL (vì chưa được duyệt thành bạn đọc chính thức).
    """
    user_id = current_user.get("manguoidung")
    anh_the_url = None

    # 1. Xử lý Upload Ảnh (Nếu có)
    if anh_the:
        try:
            # A. Làm sạch tên file gốc (chỉ giữ lại chữ, số, dấu ., -, _)
            # Ví dụ: "Ảnh Thẻ.jpg" -> "AnhThe.jpg" (tương đối) hoặc giữ nguyên nếu không dấu
            original_filename = anh_the.filename.replace(" ", "_")
            clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '', original_filename)

            # B. Tạo tên file theo định dạng: u{user_id}_{timestamp}_{tên_gốc}
            # Ví dụ: u12_1732345678_avatar.jpg
            # - u12: Biết ngay là của user ID 12.
            # - timestamp: Đảm bảo không bao giờ trùng, dù up lại ảnh cũ.
            timestamp = int(time.time())
            file_name = f"u{user_id}_{timestamp}_{clean_name}"

            # C. Đọc nội dung file
            file_content = await anh_the.read()

            # D. Upload lên Supabase Storage
            # content-type rất quan trọng để trình duyệt hiểu đây là ảnh
            supabase_client.storage.from_(STORAGE_BUCKET).upload(
                path=file_name,
                file=file_content,
                file_options={"content-type": anh_the.content_type}
            )

            # E. Lấy Public URL (Để lưu vào DB và truy cập sau này)
            anh_the_url = supabase_client.storage.from_(STORAGE_BUCKET).get_public_url(file_name)

        except Exception as e:
            logger.error(f"Lỗi upload ảnh: {e}")
            # Tùy chọn: Có thể cho phép lỗi ảnh nhưng vẫn tạo hồ sơ, hoặc chặn luôn.
            # Ở đây tôi chặn luôn để đảm bảo hồ sơ phải có ảnh.
            raise HTTPException(status_code=500, detail="Lỗi khi tải ảnh thẻ lên hệ thống (Vui lòng kiểm tra định dạng ảnh).")

    # 2. Chuẩn bị dữ liệu JSONB (thongtinbosung)
    thong_tin_bo_sung = {
        "ho_ten": ho_ten,
        "ngay_sinh": ngay_sinh,
        "gioi_tinh": gioi_tinh,
        "nghe_nghiep": nghe_nghiep,
        "cccd": cccd,
        "dia_chi": dia_chi,
        "ma_phuong_xa": ma_phuong_xa,
        "email": email,
        "sdt": sdt,
        "anh_the_url": anh_the_url,
        "ma_nguoi_dung_dang_ky": user_id
    }

    # 1. Lấy thông tin mức phí hiện tại của loại thẻ
    loai_the_info = supabase_client.table("loaithe").select("lephi").eq("maloaithe", ma_loai_the).single().execute()
    le_phi_hien_tai = 0
    if loai_the_info.data:
        le_phi_hien_tai = loai_the_info.data.get("lephi", 0)

    # 1. Tạo bản ghi với trạng thái 'dangXuLy'
    db_data = {
        "maloaithe": ma_loai_the,
        "mabandoc": None,
        "trangthaiquytrinh": "dangXuLy", # <-- Trạng thái mới
        "maphuongxa": None,
        "thongtinbosung": to_json_safe(thong_tin_bo_sung),
        "hinhthucyeucau": "Online",
        "lephi": le_phi_hien_tai,
    }

    res = supabase_client.table(TABLE_NAME).insert(db_data).execute()
    if not res.data:
        raise HTTPException(500, "Lỗi DB")

    new_req = res.data[0]

    # 2. Kích hoạt Background Task
    # Truyền dữ liệu cần thiết vào hàm chạy ngầm
    background_tasks.add_task(
        process_card_application,
        ma_yeu_cau=new_req["mayeucauthe"],
        form_data=thong_tin_bo_sung,
        filename=anh_the.filename if anh_the else ""
    )

    # 3. Trả về ngay lập tức (202 Accepted)
    return {
        "message": "Hồ sơ đã được tiếp nhận và đang được hệ thống xử lý.",
        "data": {
            "mayeucauthe": new_req["mayeucauthe"],
            "trangthai": "dangXuLy"
        }
    }

# --- 2. API KIỂM TRA TRẠNG THÁI HỒ SƠ (POLLING) ---
@router.get("/{maYeuCauThe}/trang-thai", summary="Kiểm tra trạng thái hồ sơ (Polling)")
def check_request_status(maYeuCauThe: int, current_user: dict = Depends(get_current_user_from_db)):
    try:
        res = supabase_client.table(TABLE_NAME).select("*").eq("mayeucauthe", maYeuCauThe).single().execute()
        if not res.data:
            raise HTTPException(404, "Không tìm thấy.")

        data = res.data
        info = data.get("thongtinbosung") or {}
        trang_thai = data["trangthaiquytrinh"]

        # LOGIC LẤY LÝ DO TỪ CHỐI (FIX LỖI 1)
        ly_do = None
        if trang_thai == "tuChoi":
            # Ưu tiên lấy trong JSON (nếu nhân viên nhập tay)
            ly_do = info.get("ly_do_tu_choi")
            # Nếu không có, lấy trong cột ghi chú (nếu hệ thống tự reject)
            if not ly_do:
                ly_do = data.get("ghichu")

        # LOGIC THÔNG BÁO THÀNH CÔNG
        message = None
        if trang_thai == "daDuyet":
            message = "Chúc mừng! Hồ sơ của bạn đã được duyệt và thẻ đã được tạo."

        return {
            "mayeucauthe": maYeuCauThe,
            "trangthai": trang_thai,
            "ket_qua_xac_thuc": info.get("ket_qua_xac_thuc"),
            "ly_do_tu_choi": ly_do,
            "message": message
        }
    except Exception as e:
        raise HTTPException(500, str(e))

# --- 3. API LẤY DANH SÁCH CHỜ DUYỆT (Cho Admin) ---
@router.get(
    "/danh-sach-cho-duyet",
    response_model=List[YeuCauTheAdminView],
    summary="Lấy danh sách yêu cầu thẻ đang chờ duyệt (Admin)"
)
def get_danh_sach_cho_duyet(
    current_staff: dict = Depends(get_current_staff_profile)
):
    """
    Lấy danh sách các yêu cầu có trạng thái 'choDuyet'.
    Dữ liệu JSONB sẽ được làm phẳng (flatten) ra để Admin dễ xem.
    """
    try:
        # Query: Lấy yêu cầu + Join tên loại thẻ
        query = """
            mayeucauthe,
            thoigianbatdau,
            trangthaiquytrinh,
            thongtinbosung,
            loaithe (tenthe)
        """

        # Lọc: Chỉ lấy 'choDuyet' và maBanDoc IS NULL (đăng ký mới)
        # (Hoặc có thể bỏ điều kiện maBanDoc is null nếu muốn xem cả yêu cầu cấp lại thẻ)
        response = (
            supabase_client.table(TABLE_NAME)
            .select(query)
            .eq("trangthaiquytrinh", "choDuyet")
            .order("thoigianbatdau", desc=False) # Cũ nhất lên đầu để duyệt trước
            .execute()
        )

        result_list = []
        for item in response.data:
            info = item.get("thongtinbosung") or {}
            loai_the = item.get("loaithe") or {}

            # Map dữ liệu vào Model trả về
            view_item = {
                "ma_ho_so": item["mayeucauthe"],
                "ho_ten": info.get("ho_ten", "Không tên"),
                "loai_the": loai_the.get("tenthe", "Không xác định"),
                "ngay_dang_ky": item["thoigianbatdau"],
                "trang_thai": item["trangthaiquytrinh"],
                "anh_the_url": info.get("anh_the_url"),
                "email": info.get("email"),
                "sdt": info.get("sdt")
            }
            result_list.append(view_item)

        return result_list

    except Exception as e:
        logger.error(f"Lỗi lấy danh sách chờ duyệt: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- 4. API LẤY CHI TIẾT YÊU CẦU (MỚI) ---
@router.get(
    "/{maYeuCauThe}",
    response_model=YeuCauTheDetailResponse,
    summary="Lấy chi tiết đầy đủ một yêu cầu thẻ (Admin)"
)
def get_chi_tiet_yeu_cau_the(
    maYeuCauThe: int,
    current_staff: dict = Depends(get_current_staff_profile)
):
    """
    Lấy thông tin chi tiết.
    Hệ thống sẽ tự động lấy ID phường xã trong JSON, tra cứu tên Phường/Tỉnh
    và trả về cho Admin xem (thay vì trả về số ID vô nghĩa).
    """
    try:
        # 1. Lấy thông tin yêu cầu
        query = "*, loaithe(tenthe)"
        response = supabase_client.table(TABLE_NAME).select(query).eq("mayeucauthe", maYeuCauThe).single().execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu.")

        data = response.data
        loai_the = data.get("loaithe") or {}
        info = data.get("thongtinbosung") or {}

        # 2. Xử lý Địa chỉ (Logic Mới)
        # Lấy ID từ JSON
        ma_phuong_xa = info.get("ma_phuong_xa")

        dia_chi_full = info.get("dia_chi", "") # Mặc định là số nhà
        ten_phuong = ""
        ten_tinh = ""

        if ma_phuong_xa:
            try:
                # Query bảng Phường Xã (kèm Tỉnh Thành)
                px_res = supabase_client.table("phuongxa") \
                    .select("tenphuongxa, tinhthanhpho(tentinhthanhpho)") \
                    .eq("maphuongxa", ma_phuong_xa) \
                    .single().execute()

                if px_res.data:
                    ten_phuong = px_res.data.get("tenphuongxa")
                    tinh_data = px_res.data.get("tinhthanhpho") or {}
                    ten_tinh = tinh_data.get("tentinhthanhpho")

                    # Gắn thêm thông tin hiển thị vào JSON trả về (không lưu vào DB)
                    info["ten_phuong_xa"] = ten_phuong
                    info["ten_tinh_thanh_pho"] = ten_tinh
                    info["dia_chi_hien_thi"] = f"{dia_chi_full}, {ten_phuong}, {ten_tinh}"
            except Exception:
                pass # Nếu lỗi lấy địa chỉ thì vẫn trả về các thông tin khác

        return {
            "mayeucauthe": data["mayeucauthe"],
            "thoigianbatdau": data["thoigianbatdau"],
            "tenloaithe": loai_the.get("tenthe", "Không xác định"),
            "thongtinbosung": info, # JSON bây giờ đã có thêm tên phường/tỉnh
            "lephi": data.get("lephi") or 0,
            "trangthaiquytrinh": data["trangthaiquytrinh"]
        }
    except Exception as e:
        logger.error(f"Lỗi xem chi tiết yêu cầu {maYeuCauThe}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- 5. API DUYỆT / TỪ CHỐI THẺ (Cho Admin) ---
@router.put(
    "/phe-duyet/{maYeuCauThe}",
    summary="Duyệt (Tự động tạo Bạn đọc & Thẻ) hoặc Từ chối"
)
def phe_duyet_yeu_cau_the(
    maYeuCauThe: int,
    duyet_in: DuyetTheRequest,
    current_staff: dict = Depends(get_current_staff_profile)
):
    # ... (Phần validate đầu hàm giữ nguyên) ...
    if duyet_in.trang_thai not in ["daDuyet", "tuChoi"]:
        raise HTTPException(status_code=400, detail="Trạng thái không hợp lệ.")

    try:
        # 1. Lấy thông tin hiện tại
        req_res = supabase_client.table(TABLE_NAME).select("*").eq("mayeucauthe", maYeuCauThe).single().execute()
        if not req_res.data:
            raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu.")

        request_data = req_res.data
        if request_data["trangthaiquytrinh"] in ["daDuyet", "tuChoi"]:
            raise HTTPException(status_code=400, detail="Yêu cầu này đã được xử lý trước đó.")

        info = request_data.get("thongtinbosung") or {}
        manhanvien = current_staff.get("manhanvien")

        # === LOGIC TỪ CHỐI (Giữ nguyên) ===
        if duyet_in.trang_thai == "tuChoi":
            # ... (Code từ chối giữ nguyên như bài trước) ...
            if not duyet_in.ly_do:
                raise HTTPException(status_code=400, detail="Vui lòng nhập lý do từ chối.")
            info["ly_do_tu_choi"] = duyet_in.ly_do
            info["ngay_xu_ly"] = datetime.now().isoformat()
            supabase_client.table(TABLE_NAME).update({
                "trangthaiquytrinh": "tuChoi",
                "manhanvien": manhanvien,
                "thoigianxuly": "now()",
                "thongtinbosung": to_json_safe(info)
            }).eq("mayeucauthe", maYeuCauThe).execute()
            return {"message": "Đã từ chối yêu cầu thẻ."}

        # === LOGIC DUYỆT (CẬP NHẬT: Lấy ma_phuong_xa từ JSON) ===
        if duyet_in.trang_thai == "daDuyet":
            user_id = info.get("ma_nguoi_dung_dang_ky")
            if not user_id:
                raise HTTPException(status_code=400, detail="Dữ liệu lỗi: Không tìm thấy User ID.")

            check_bd = supabase_client.table("bandoc").select("mabandoc").eq("manguoidung", user_id).execute()
            ma_ban_doc_moi = None

            if check_bd.data:
                ma_ban_doc_moi = check_bd.data[0]['mabandoc']
            else:
                # --- THAY ĐỔI Ở ĐÂY ---
                # Lấy ma_phuong_xa từ JSON 'info' thay vì từ cột 'maphuongxa'
                ma_phuong_xa = info.get("ma_phuong_xa")

                if not ma_phuong_xa:
                    raise HTTPException(status_code=400, detail="Thiếu thông tin Phường/Xã trong hồ sơ đăng ký.")

                new_bandoc_data = {
                    "manguoidung": user_id,
                    "hoten": info.get("ho_ten"),
                    "ngaysinh": info.get("ngay_sinh"),
                    "gioi_tinh": info.get("gioi_tinh", "Khác"),
                    "cccd": info.get("cccd"),
                    "diachi": info.get("dia_chi"),
                    "maphuongxa": ma_phuong_xa, # Dùng ID lấy từ JSON
                    "nghenghiep": info.get("nghe_nghiep"),
                    "thongtinbosung": to_json_safe({"anh_the_url": info.get("anh_the_url")})
                }

                bd_res = supabase_client.table("bandoc").insert(to_json_safe(new_bandoc_data)).execute()
                if not bd_res.data:
                    raise HTTPException(status_code=500, detail="Lỗi khi tạo hồ sơ Bạn đọc.")
                ma_ban_doc_moi = bd_res.data[0]['mabandoc']

            # Tạo Thẻ & Update Yêu cầu (Giữ nguyên logic cũ)
            so_the_moi = f"T{int(time.time())}"
            ngay_het_han = (datetime.now() + timedelta(days=365)).date()

            new_card_data = {
                "mabandoc": ma_ban_doc_moi,
                "maloaithe": request_data["maloaithe"],
                "sothe": so_the_moi,
                "manhanvien": manhanvien,
                "ngayhethan": ngay_het_han,
                "trangthaithe": True,
                "phuongthucvanchuyen": "TaiQuay"
            }
            supabase_client.table("thebandoc").insert(to_json_safe(new_card_data)).execute()

            info["ngay_xu_ly"] = datetime.now().isoformat()
            supabase_client.table(TABLE_NAME).update({
                "trangthaiquytrinh": "daDuyet",
                "manhanvien": manhanvien,
                "mabandoc": ma_ban_doc_moi,
                "thoigianxuly": "now()",
                "thongtinbosung": to_json_safe(info)
            }).eq("mayeucauthe", maYeuCauThe).execute()

            return {"message": "Đã duyệt yêu cầu thành công.", "ma_ban_doc": ma_ban_doc_moi}

    except Exception as e:
        logger.error(f"Lỗi xử lý duyệt thẻ: {e}")
        raise HTTPException(status_code=500, detail=f"Lỗi nội bộ: {str(e)}")

# --- API TRA CỨU CÔNG KHAI (Public Search) ---
@router.post(
    "/tra-cuu",
    response_model=List[TraCuuYeuCauResponse],
    summary="Tra cứu trạng thái yêu cầu thẻ & Thẻ hiện có (Công khai)"
)
def tra_cuu_yeu_cau_the(
    search_in: TraCuuRequest # Nhận JSON Body
):
    """
    API dành cho khách. Tra cứu dựa trên CCCD hoặc SĐT.
    Method: POST
    Body: { "keyword": "048203..." }
    """
    result_list = []
    keyword = search_in.keyword # Lấy keyword từ body

    # Validate độ dài (Thay cho min_length của Query)
    if len(keyword) < 6:
        # Trả về list rỗng hoặc lỗi tùy bạn. Ở đây trả rỗng cho an toàn.
        return []

    try:
        # =========================================================
        # PHẦN 1: KIỂM TRA THẺ ĐANG HOẠT ĐỘNG (Query bảng BanDoc)
        # =========================================================

        # Nếu keyword giống CCCD (chỉ chứa số và dài >= 9)
        if keyword.isdigit() and len(keyword) >= 9:
            try:
                # Query BanDoc kèm thông tin Thẻ
                existing_member = (
                    supabase_client.table("bandoc")
                    .select("hoten, cccd, thebandoc(sothe, trangthaithe, loaithe(tenthe))")
                    .eq("cccd", keyword)
                    .execute()
                )

                if existing_member.data:
                    for member in existing_member.data:
                        cards = member.get("thebandoc", [])
                        for card in cards:
                            if card.get("trangthaithe") is True:
                                loai_the = card.get("loaithe") or {}

                                active_card_item = {
                                    "ma_yeu_cau": None,
                                    "ho_ten": member.get("hoten"),
                                    "cccd": member.get("cccd"),
                                    "sdt": "******",
                                    "ten_loai_the": loai_the.get("tenthe", "Thẻ thành viên"),
                                    "ngay_dang_ky": None,
                                    "trang_thai": "THE_DANG_HOAT_DONG",
                                    "sothe": card.get("sothe"),
                                    "ly_do_tu_choi": None
                                }
                                result_list.append(active_card_item)
            except Exception as e:
                logger.warning(f"Lỗi tìm thẻ active: {e}")

        # =========================================================
        # PHẦN 2: TRA CỨU LỊCH SỬ YÊU CẦU (Query bảng YeuCauThe)
        # =========================================================

        filter_condition = f"thongtinbosung->>sdt.eq.{keyword},thongtinbosung->>cccd.eq.{keyword}"

        req_response = (
            supabase_client.table(TABLE_NAME)
            .select("mayeucauthe, thoigianbatdau, trangthaiquytrinh, thongtinbosung, loaithe(tenthe)")
            .or_(filter_condition)
            .order("thoigianbatdau", desc=True)
            .execute()
        )

        for item in req_response.data:
            info = item.get("thongtinbosung") or {}
            loai_the = item.get("loaithe") or {}

            req_item = {
                "ma_yeu_cau": item["mayeucauthe"],
                "ho_ten": info.get("ho_ten", "Không xác định"),
                "cccd": info.get("cccd", ""),
                "sdt": info.get("sdt", ""),
                "ten_loai_the": loai_the.get("tenthe", "Không xác định"),
                "ngay_dang_ky": item["thoigianbatdau"],
                "trang_thai": item["trangthaiquytrinh"],
                "ly_do_tu_choi": info.get("ly_do_tu_choi"),
                "sothe": None
            }
            result_list.append(req_item)

        return result_list

    except Exception as e:
        logger.error(f"Lỗi tra cứu tổng hợp: {e}")
        return []

# 1. CREATE (Bạn đọc tạo yêu cầu)
@router.post(
    "/",
    response_model=YeuCauThe,
    status_code=status.HTTP_201_CREATED,
    summary="Bạn đọc tạo một yêu cầu thẻ mới"
)
def create_yeu_cau_the(yeu_cau_in: YeuCauTheCreate, current_user: dict = Depends(get_current_user_from_db)):
    """
    Tạo một yêu cầu làm thẻ thư viện mới.
    - Nhân viên: Được phép tạo cho bất kỳ ai.
    - Bạn đọc: Chỉ được tạo cho chính mình.
    """
    user_role = current_user.get("vaitro")
    user_id_from_token = current_user.get("manguoidung")

    try:
        # === LOGIC PHÂN QUYỀN ===
        if user_role == "nhanVien":
            pass # Nhân viên được phép

        elif user_role == "nguoiDung":
            # Bạn đọc phải tự tạo cho chính mình
            profile_res = supabase_client.table("bandoc") \
                .select("mabandoc") \
                .eq("manguoidung", user_id_from_token) \
                .single().execute()

            if not profile_res.data:
                raise HTTPException(status_code=403, detail="Bạn không có hồ sơ bạn đọc hợp lệ.")

            own_maBanDoc = profile_res.data["mabandoc"]

            # Kiểm tra xem maBanDoc trong body có khớp không
            if own_maBanDoc != yeu_cau_in.maBanDoc:
                raise HTTPException(status_code=403, detail="Bạn đọc chỉ được tạo yêu cầu thẻ cho chính mình.")
        else:
            raise HTTPException(status_code=403, detail="Vai trò của bạn không được phép tạo yêu cầu này.")

        # === LOGIC TẠO (Giữ nguyên) ===
        data = to_json_safe(yeu_cau_in.model_dump(by_alias=True))
        response = supabase_client.table(TABLE_NAME).insert(data).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể tạo yêu cầu thẻ")

    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_str = str(e)
        logger.error("Lỗi khi tạo YeuCauThe: %s", error_str)
        if "foreign key constraint" in error_str:
            raise HTTPException(status_code=404, detail="Không tìm thấy 'BanDoc', 'LoaiThe', 'PhuongXa' hoặc 'NhanVien'.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi máy chủ nội bộ")

# 2. READ ALL (SỬA: PHÂN QUYỀN ĐỘNG)
@router.get(
    "/",
    response_model=List[YeuCauThe],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách tất cả yêu cầu thẻ (Phân quyền động)"
)
def get_all_yeu_cau_the(
    current_user: dict = Depends(get_current_user_from_db) # Dùng Tầng 1
):
    """
    Lấy danh sách tất cả các yêu cầu thẻ.
    - Nhân viên: Thấy TẤT CẢ.
    - Bạn đọc: Chỉ thấy CỦA MÌNH.
    """
    try:
        user_role = current_user.get("vaitro")
        user_id = current_user.get("manguoidung")

        query = supabase_client.table(TABLE_NAME).select("*")

        if user_role == "nhanVien":
            pass # Nhân viên thấy tất cả

        elif user_role == "nguoiDung":
            try:
                profile_res = supabase_client.table("bandoc") \
                    .select("mabandoc") \
                    .eq("manguoidung", user_id) \
                    .single().execute()

                if not profile_res.data:
                    return [] # Không có hồ sơ

                ma_ban_doc = profile_res.data["mabandoc"]
                query = query.eq("mabandoc", ma_ban_doc)

            except Exception as profile_e:
                logger.error(f"Lỗi khi lấy hồ sơ bạn đọc (ID: {user_id}): {profile_e}")
                raise HTTPException(status_code=500, detail="Lỗi khi truy xuất hồ sơ bạn đọc.")
        else:
            return []

        response = query.order("thoigianbatdau", desc=True).execute()
        return response.data or []

    except Exception as e:
        logger.error("Lỗi khi lấy tất cả YeuCauThe: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 3. READ ONE
@router.get(
    "/{maYeuCauThe}",
    response_model=YeuCauThe,
    status_code=status.HTTP_200_OK,
    summary="Lấy chi tiết một yêu cầu thẻ"
)
def get_yeu_cau_the_by_id(maYeuCauThe: int, current_user: dict = Depends(get_card_request_owner_or_staff)):
    """Lấy thông tin chi tiết của một yêu cầu thẻ bằng ID."""
    try:
        response = supabase_client.table(TABLE_NAME).select("*").eq("mayeucauthe", maYeuCauThe).single().execute()
        if response.data:
            return response.data
    except Exception as e:
        logger.warning("Không tìm thấy YeuCauThe ID %s: %s", maYeuCauThe, e)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy yêu cầu thẻ với id={maYeuCauThe}")

# 4. UPDATE (Nhân viên xử lý yêu cầu)
@router.put(
    "/{maYeuCauThe}",
    response_model=YeuCauThe,
    status_code=status.HTTP_200_OK,
    summary="Nhân viên xử lý/cập nhật một yêu cầu thẻ"
)
def update_yeu_cau_the(maYeuCauThe: int, yeu_cau_in: YeuCauTheUpdate, current_staff: dict = Depends(get_current_staff_profile)):
    """
    Cập nhật trạng thái cho một yêu cầu thẻ.
    Đây là API chính cho nhân viên:
    - Cập nhật `trangThaiQuyTrinh` (vd: 'daXuLy', 'daHuy').
    - Gán `maNhanVien` xử lý.
    - Thêm `ghiChu`, `thoiGianDuKien`, v.v.
    """
    try:
        data = to_json_safe(yeu_cau_in.model_dump(exclude_unset=True, by_alias=True))
        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có thông tin nào được gửi để cập nhật")

        response = supabase_client.table(TABLE_NAME).update(data).eq("mayeucauthe", maYeuCauThe).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy yêu cầu thẻ với id={maYeuCauThe} để cập nhật")

    except Exception as e:
        error_str = str(e)
        logger.error("Lỗi khi cập nhật YeuCauThe ID %s: %s", maYeuCauThe, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 5. DELETE
@router.delete(
    "/{maYeuCauThe}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa một yêu cầu thẻ"
)
def delete_yeu_cau_the(maYeuCauThe: int, current_staff: dict = Depends(get_current_staff_profile)):
    """(Hành chính) Xóa một yêu cầu thẻ."""
    try:
        response = supabase_client.table(TABLE_NAME).delete().eq("mayeucauthe", maYeuCauThe).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy yêu cầu thẻ với id={maYeuCauThe} để xóa")
        return
    except Exception as e:
        error_str = str(e)
        logger.error("Lỗi khi xóa YeuCauThe ID %s: %s", maYeuCauThe, e)
        if "foreign key constraint" in error_str:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Không thể xóa: Yêu cầu này đang được 'VanChuyen' tham chiếu đến."
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))