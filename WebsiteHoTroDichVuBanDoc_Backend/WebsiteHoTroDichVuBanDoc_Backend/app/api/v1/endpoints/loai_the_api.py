from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.models.loai_the import LoaiThe, LoaiTheCreate, LoaiTheUpdate
from app.connect.db import supabase_client
from app.connect.auth import get_current_staff_profile
from app.utils import to_json_safe # Dùng cho nhất quán
import logging, ast

router = APIRouter()
logger = logging.getLogger(__name__)

TABLE_NAME = "loaithe"

# 1. CREATE
@router.post(
    "/",
    response_model=LoaiThe,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo một loại thẻ mới"
)
def create_loai_the(loai_the_in: LoaiTheCreate, current_staff: dict = Depends(get_current_staff_profile)):
    """
    Tạo một loại thẻ thư viện mới (ví dụ: Thẻ Sinh viên).
    """
    try:
        # Model này không có Date/Decimal, nhưng dùng to_json_safe
        # là một thói quen tốt.
        data = to_json_safe(loai_the_in.model_dump(by_alias=True))

        response = supabase_client.table(TABLE_NAME).insert(data).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể tạo loại thẻ")

    except Exception as e:
        error_str = str(e)
        logger.error("Lỗi khi tạo LoaiThe: %s", error_str)

        # Bắt lỗi UNIQUE constraint (tên thẻ bị trùng)
        if "unique constraint" in error_str and "tenthe" in error_str:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Tên loại thẻ '{loai_the_in.tenThe}' đã tồn tại."
            )

        # Lỗi chung
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi máy chủ nội bộ")

# 2. READ ALL
@router.get(
    "/",
    response_model=List[LoaiThe],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách tất cả loại thẻ"
)
def get_all_loai_the():
    """Lấy danh sách tất cả các loại thẻ thư viện."""
    try:
        response = supabase_client.table(TABLE_NAME).select("*").order("maloaithe", desc=False).execute()
        if response.data:
            return response.data
        return []
    except Exception as e:
        logger.error("Lỗi khi lấy tất cả LoaiThe: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 3. READ ONE
@router.get(
    "/{maLoaiThe}",
    response_model=LoaiThe,
    status_code=status.HTTP_200_OK,
    summary="Lấy chi tiết một loại thẻ"
)
def get_loai_the_by_id(maLoaiThe: int):
    """Lấy thông tin chi tiết của một loại thẻ bằng ID."""
    try:
        response = supabase_client.table(TABLE_NAME).select("*").eq("maloaithe", maLoaiThe).single().execute()
        if response.data:
            return response.data
    except Exception as e:
        logger.warning("Không tìm thấy LoaiThe ID %s: %s", maLoaiThe, e)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy loại thẻ với id={maLoaiThe}")

# 4. UPDATE
@router.put(
    "/{maLoaiThe}",
    response_model=LoaiThe,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật thông tin loại thẻ"
)
def update_loai_the(maLoaiThe: int, loai_the_in: LoaiTheUpdate, current_staff: dict = Depends(get_current_staff_profile)):
    """Cập nhật thông tin cho một loại thẻ (tên, mô tả, giới hạn mượn...)."""
    try:
        data = to_json_safe(loai_the_in.model_dump(exclude_unset=True, by_alias=True))
        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có thông tin nào được gửi để cập nhật")

        response = supabase_client.table(TABLE_NAME).update(data).eq("maloaithe", maLoaiThe).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy loại thẻ với id={maLoaiThe} để cập nhật")

    except Exception as e:
        error_str = str(e)
        logger.error("Lỗi khi cập nhật LoaiThe ID %s: %s", maLoaiThe, e)
        if "unique constraint" in error_str and "tenthe" in error_str:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Tên loại thẻ này đã tồn tại."
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 5. DELETE
@router.delete(
    "/{maLoaiThe}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa một loại thẻ"
)
def delete_loai_the(maLoaiThe: int, current_staff: dict = Depends(get_current_staff_profile)):
    """Xóa một loại thẻ. (Sẽ thất bại nếu đang có thẻ bạn đọc hoặc yêu cầu thẻ dùng loại này)."""
    try:
        response = supabase_client.table(TABLE_NAME).delete().eq("maloaithe", maLoaiThe).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy loại thẻ với id={maLoaiThe} để xóa")
        return
    except Exception as e:
        error_str = str(e)
        logger.error("Lỗi khi xóa LoaiThe ID %s: %s", maLoaiThe, e)
        if "foreign key constraint" in error_str:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Không thể xóa: Loại thẻ này đang được tham chiếu bởi 'YeuCauThe' hoặc 'TheBanDoc'."
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))