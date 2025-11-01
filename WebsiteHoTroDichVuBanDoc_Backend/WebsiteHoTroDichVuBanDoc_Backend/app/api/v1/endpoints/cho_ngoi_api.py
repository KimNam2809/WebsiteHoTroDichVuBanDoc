from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from app.models.cho_ngoi import ChoNgoi, ChoNgoiCreate, ChoNgoiUpdate
from app.connect.db import supabase_client
from app.utils import to_json_safe
import logging, ast

router = APIRouter()
logger = logging.getLogger(__name__)

TABLE_NAME = "chongoi"

# 1. CREATE
@router.post(
    "/",
    response_model=ChoNgoi,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo một chỗ ngồi mới"
)
def create_cho_ngoi(cho_ngoi_in: ChoNgoiCreate):
    """
    Tạo một chỗ ngồi mới, liên kết với một 'Phong' đã có.
    """
    try:
        data = to_json_safe(cho_ngoi_in.model_dump(by_alias=True))

        response = supabase_client.table(TABLE_NAME).insert(data).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể tạo chỗ ngồi")

    except Exception as e:
        error_str = str(e)
        logger.error("Lỗi khi tạo ChoNgoi: %s", error_str)
        if "foreign key constraint" in error_str and "maphong" in error_str:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy Phòng với ID: {cho_ngoi_in.maPhong}."
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi máy chủ nội bộ")

# 2. READ ALL
@router.get(
    "/",
    response_model=List[ChoNgoi],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách tất cả chỗ ngồi"
)
def get_all_cho_ngoi():
    """Lấy danh sách tất cả các chỗ ngồi trong thư viện."""
    try:
        response = supabase_client.table(TABLE_NAME).select("*").order("machongoi", desc=False).execute()
        if response.data:
            return response.data
        return []
    except Exception as e:
        logger.error("Lỗi khi lấy tất cả ChoNgoi: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 3. READ ONE
@router.get(
    "/{maChoNgoi}",
    response_model=ChoNgoi,
    status_code=status.HTTP_200_OK,
    summary="Lấy chi tiết một chỗ ngồi"
)
def get_cho_ngoi_by_id(maChoNgoi: int):
    """Lấy thông tin chi tiết của một chỗ ngồi bằng ID."""
    try:
        response = supabase_client.table(TABLE_NAME).select("*").eq("machongoi", maChoNgoi).single().execute()
        if response.data:
            return response.data
    except Exception as e:
        logger.warning("Không tìm thấy ChoNgoi ID %s: %s", maChoNgoi, e)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy chỗ ngồi với id={maChoNgoi}")

# 4. UPDATE
@router.put(
    "/{maChoNgoi}",
    response_model=ChoNgoi,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật thông tin chỗ ngồi"
)
def update_cho_ngoi(maChoNgoi: int, cho_ngoi_in: ChoNgoiUpdate):
    """
    Cập nhật thông tin cho một chỗ ngồi
    (ví dụ: đổi `trangThai` thành 'dangSuDung' hoặc 'coSan').
    """
    try:
        data = to_json_safe(cho_ngoi_in.model_dump(exclude_unset=True, by_alias=True))
        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có thông tin nào được gửi để cập nhật")

        response = supabase_client.table(TABLE_NAME).update(data).eq("machongoi", maChoNgoi).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy chỗ ngồi với id={maChoNgoi} để cập nhật")

    except Exception as e:
        error_str = str(e)
        logger.error("Lỗi khi cập nhật ChoNgoi ID %s: %s", maChoNgoi, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 5. DELETE
@router.delete(
    "/{maChoNgoi}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa một chỗ ngồi"
)
def delete_cho_ngoi(maChoNgoi: int):
    """Xóa một chỗ ngồi. (Sẽ thất bại nếu đang có lượt đặt chỗ)."""
    try:
        response = supabase_client.table(TABLE_NAME).delete().eq("machongoi", maChoNgoi).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy chỗ ngồi với id={maChoNgoi} để xóa")
        return
    except Exception as e:
        error_str = str(e)
        logger.error("Lỗi khi xóa ChoNgoi ID %s: %s", maChoNgoi, e)
        if "foreign key constraint" in error_str:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Không thể xóa: Chỗ ngồi này đang được 'DatChoNgoi' tham chiếu đến."
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))