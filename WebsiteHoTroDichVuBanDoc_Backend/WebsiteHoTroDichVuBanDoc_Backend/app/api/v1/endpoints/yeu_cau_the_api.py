from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.connect.auth import get_card_request_owner_or_staff, get_current_staff_profile, get_current_user_from_db
from app.models.yeu_cau_the import YeuCauThe, YeuCauTheCreate, YeuCauTheUpdate
from app.connect.db import supabase_client
from app.utils import to_json_safe
import logging, ast

router = APIRouter()
logger = logging.getLogger(__name__)

TABLE_NAME = "yeucauthe"

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