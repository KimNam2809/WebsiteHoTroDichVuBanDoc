from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from app.models.thiet_bi import ThietBi, ThietBiCreate, ThietBiUpdate
from app.connect.db import supabase_client
from app.utils import to_json_safe
import logging, ast

router = APIRouter()
logger = logging.getLogger(__name__)

TABLE_NAME = "thietbi"

# 1. CREATE
@router.post(
    "/",
    response_model=ThietBi,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo một thiết bị mới"
)

def create_thiet_bi(thiet_bi_in: ThietBiCreate):
    """
    Tạo một thiết bị mới
    """
    try:
        data = to_json_safe(thiet_bi_in.model_dump(by_alias=True))

        response = supabase_client.table(TABLE_NAME).insert(data).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể tạo thiết bị")
    except Exception as e:
        error_str = str(e)
        logger.error("Lỗi khi tạo Thiết bị: %s", error_str)

        # Bắt lỗi UNIQUE constraint (mã thiết bị nội bộ bị trùng)
        if "unique constraint" in error_str and "mathietbinoibo" in error_str:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Mã thiết bị nội bộ '{thiet_bi_in.maThietBiNoiBo}' đã tồn tại"
            )

        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi máy chủ nội bộ.")

# 2. READ ALL
@router.get(
    "/",
    response_model=List[ThietBi],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách tất cả thiết bị"
)

def get_all_thiet_bi():
    """
    Lấy danh sách tất cả các thiết bị.
    """
    try:
        response = supabase_client.table(TABLE_NAME).select("*").order("mathietbi", desc=False).execute()

        if response.data:
            return response.data
        return []
    except Exception as e:
        logger.error("Lỗi khi lấy tất cả Thiết bị: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 3. READ ONE
@router.get(
    "/{maThietBi}",
    response_model=ThietBi,
    status_code=status.HTTP_200_OK,
    summary="Lấy thông tin một thiết bị theo mã thiết bị"
)

def get_thiet_bi_by_id(maThietBi: int):
    """
    Lấy thông tin chi tiết của một thiết bị bằng mã thiết bị.
    """
    try:
        response = supabase_client.table(TABLE_NAME).select("*").eq("mathietbi", maThietBi).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy thiết bị")

    except Exception as e:
        error_str = str(e)
        logger.error("Lỗi khi lấy Thiết bị theo mã: %s", error_str)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi máy chủ nội bộ")

# 4. UPDATE
@router.put(
    "/{maThietBi}",
    response_model=ThietBi,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật thông tin một thiết bị"
)

def update_thiet_bi(maThietBi: int, thiet_bi_in: ThietBiUpdate):
    """
    Cập nhật thông tin cho một thiết bị.
    """
    try:
        data = to_json_safe(thiet_bi_in.model_dump(exclude_unset=True, by_alias=True))
        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có thông tin nào được gửi để cập nhật")

        response = supabase_client.table(TABLE_NAME).update(data).eq("mathietbi", maThietBi).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy thiết bị với mã {maThietBi} để cập nhật")

    except Exception as e:
        error_str = str(e)
        logger.error("Lỗi khi cập nhật Thiết bị: %s", error_str)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi máy chủ nội bộ")

# 5. DELETE
@router.delete(
    "/{maThietBi}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa một thiết bị"
)

def delete_thiet_bi(maThietBi: int):
    """
    Xóa một thiết bị theo mã thiết bị.
    """
    try:
        response = supabase_client.table(TABLE_NAME).delete().eq("mathietbi", maThietBi).execute()

        if response.count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy thiết bị với mã {maThietBi} để xóa")

    except Exception as e:
        error_str = str(e)
        logger.error("Lỗi khi xóa Thiết bị: %s", error_str)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi máy chủ nội bộ")
