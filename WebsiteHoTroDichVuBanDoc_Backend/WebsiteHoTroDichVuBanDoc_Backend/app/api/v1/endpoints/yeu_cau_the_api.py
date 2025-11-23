from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from typing import List, Optional
from app.models.yeu_cau_the import YeuCauThe, YeuCauTheCreate, YeuCauTheUpdate, YeuCauTheAdminView, DuyetTheRequest
from app.connect.db import supabase_client
from app.utils import to_json_safe
from app.connect.auth import get_current_user_from_db, get_current_staff_profile, get_card_request_owner_or_staff
import logging, ast, uuid
from pydantic import BaseModel
from datetime import date
import time, re # Để xử lý tên file (bỏ ký tự đặc biệt)

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
    ho_ten: str = Form(...),
    ngay_sinh: str = Form(...),
    cccd: str = Form(...),
    dia_chi: str = Form(...),
    email: str = Form(...),
    sdt: str = Form(...),
    ma_loai_the: int = Form(...),
    # File ảnh là tùy chọn (nếu người dùng không up)
    anh_the: UploadFile = File(None),
    # Người dùng phải đăng nhập mới được gửi yêu cầu
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
        "cccd": cccd,
        "dia_chi": dia_chi,
        "email": email,
        "sdt": sdt,
        "anh_the_url": anh_the_url,
        "ma_nguoi_dung_dang_ky": user_id # Lưu lại để truy vết
    }

    # 3. Tạo bản ghi YeuCauThe
    db_data = {
        "maloaithe": ma_loai_the,
        "mabandoc": None, # Quan trọng: NULL vì chưa là bạn đọc
        "trangthaiquytrinh": "choDuyet", # Trạng thái chờ
        "thongtinbosung": to_json_safe(thong_tin_bo_sung),
        "hinhthucyeucau": "Online"
    }

    try:
        response = supabase_client.table(TABLE_NAME).insert(db_data).execute()
        if response.data:
            return {"message": "Gửi yêu cầu thành công", "data": response.data[0]}
        raise HTTPException(status_code=400, detail="Không thể tạo yêu cầu.")
    except Exception as e:
        logger.error(f"Lỗi DB đăng ký thẻ: {e}")
        raise HTTPException(status_code=500, detail="Lỗi máy chủ nội bộ.")


# --- 2. API LẤY DANH SÁCH CHỜ DUYỆT (Cho Admin) ---
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


# --- 3. API DUYỆT / TỪ CHỐI THẺ (Cho Admin) ---
@router.put(
    "/phe-duyet/{maYeuCauThe}",
    summary="Duyệt hoặc Từ chối yêu cầu thẻ"
)
def phe_duyet_yeu_cau_the(
    maYeuCauThe: int,
    duyet_in: DuyetTheRequest,
    current_staff: dict = Depends(get_current_staff_profile)
):
    """
    Cập nhật trạng thái hồ sơ.
    - Nếu `daDuyet`: Cập nhật trạng thái và nhân viên xử lý.
    - Nếu `tuChoi`: Cập nhật trạng thái và lưu lý do vào `thongtinbosung` (để dành trường `ghichu` cho ghi chú nội bộ).
    """
    # Validate trạng thái input
    if duyet_in.trang_thai not in ["daDuyet", "tuChoi"]:
        raise HTTPException(status_code=400, detail="Trạng thái không hợp lệ (chỉ 'daDuyet' hoặc 'tuChoi').")

    try:
        # 1. Lấy dữ liệu cũ để giữ lại thông tin bổ sung cũ
        old_req = supabase_client.table(TABLE_NAME).select("thongtinbosung").eq("mayeucauthe", maYeuCauThe).single().execute()
        if not old_req.data:
            raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu.")

        updated_info = old_req.data["thongtinbosung"] or {}

        # Cập nhật ngày xử lý
        updated_info["ngay_xu_ly"] = date.today().isoformat()

        # 2. Nếu TỪ CHỐI -> Lưu lý do vào JSON `thongtinbosung`
        if duyet_in.trang_thai == "tuChoi":
            if not duyet_in.ly_do:
                raise HTTPException(status_code=400, detail="Vui lòng cung cấp lý do từ chối.")
            # Lưu vào đây để frontend dễ hiển thị kèm thông tin đăng ký
            updated_info["ly_do_tu_choi"] = duyet_in.ly_do

        # 3. Cập nhật DB
        update_data = {
            "trangthaiquytrinh": duyet_in.trang_thai,
            "manhanvien": current_staff.get("manhanvien"), # Ghi nhận nhân viên duyệt
            "thoigianxuly": "now()",
            "thongtinbosung": to_json_safe(updated_info)
            # Không cập nhật cột 'ghichu' ở đây nữa
        }

        supabase_client.table(TABLE_NAME).update(update_data).eq("mayeucauthe", maYeuCauThe).execute()

        return {"message": f"Đã cập nhật trạng thái thành {duyet_in.trang_thai}"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi phê duyệt thẻ: {e}")
        raise HTTPException(status_code=500, detail="Lỗi máy chủ nội bộ.")

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