from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
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
def create_yeu_cau_the(yeu_cau_in: YeuCauTheCreate):
    """
    Tạo một yêu cầu làm thẻ thư viện mới.
    Trạng thái ban đầu mặc định là 'daYeuCau'.
    """
    try:
        data = to_json_safe(yeu_cau_in.model_dump(by_alias=True))

        response = supabase_client.table(TABLE_NAME).insert(data).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể tạo yêu cầu thẻ")

    except Exception as e:
        error_str = str(e)
        logger.error("Lỗi khi tạo YeuCauThe: %s", error_str)

        if "foreign key constraint" in error_str:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy Bạn đọc, Loại thẻ, Nhân viên hoặc Phường xã với ID đã cung cấp."
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi máy chủ nội bộ")

# 2. READ ALL
@router.get(
    "/",
    response_model=List[YeuCauThe],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách tất cả yêu cầu thẻ"
)
def get_all_yeu_cau_the():
    """
    Lấy danh sách tất cả các yêu cầu thẻ (đã yêu cầu, đã xử lý, đã hủy),
    mới nhất lên trước.
    """
    try:
        response = supabase_client.table(TABLE_NAME).select("*").order("thoigianbatdau", desc=True).execute()
        if response.data:
            return response.data
        return []
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
def get_yeu_cau_the_by_id(maYeuCauThe: int):
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
def update_yeu_cau_the(maYeuCauThe: int, yeu_cau_in: YeuCauTheUpdate):
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
def delete_yeu_cau_the(maYeuCauThe: int):
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