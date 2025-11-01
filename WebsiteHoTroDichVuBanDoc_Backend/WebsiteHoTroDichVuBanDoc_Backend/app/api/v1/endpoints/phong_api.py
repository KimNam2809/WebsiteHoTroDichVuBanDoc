from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from app.models.phong import Phong, PhongCreate, PhongUpdate
from app.connect.db import supabase_client
from app.utils import to_json_safe # Dùng cho nhất quán
import logging, ast

router = APIRouter()
logger = logging.getLogger(__name__)

TABLE_NAME = "phong"

# 1. CREATE
@router.post(
    "/",
    response_model=Phong,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo một phòng mới"
)

def create_phong(phong_in: PhongCreate):
    """
    Tạo một phòng mới trong thư viện.
    """
    try:
        data = to_json_safe(phong_in.model_dump(by_alias=True))

        response = supabase_client.table(TABLE_NAME).insert(data).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể tạo phòng")

    except Exception as e:
        error_str = str(e)
        logger.error("Lỗi khi tạo Phong: %s", error_str)

        # Bắt lỗi UNIQUE constraint (tên phòng bị trùng)
        if "unique constraint" in error_str and "tenphong" in error_str:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Tên phòng '{phong_in.tenPhong}' đã tồn tại."
            )

        # Lỗi chung
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi máy chủ nội bộ")

# 2. READ ALL
@router.get(
    "/",
    response_model=List[Phong],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách tất cả phòng"
)

def get_all_phong():
    """Lấy danh sách tất cả các phòng trong thư viện."""
    try:
        response = supabase_client.table(TABLE_NAME).select("*").order("maphong", desc=False).execute()

        if response.data is not None:
            return response.data
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy phòng nào")

    except Exception as e:
        error_str = str(e)
        logger.error("Lỗi khi lấy danh sách Phong: %s", error_str)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi máy chủ nội bộ")

# 3. READ ONE
@router.get(
    "/{maPhong}",
    response_model=Phong,
    status_code=status.HTTP_200_OK,
    summary="Lấy thông tin một phòng theo mã phòng"
)

def get_phong_by_id(maPhong: int):
    """Lấy thông tin một phòng theo mã phòng."""
    try:
        response = supabase_client.table(TABLE_NAME).select("*").eq("maphong", maPhong).single().execute()

        if response.data is not None:
            return response.data
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy phòng với mã {maPhong}")

    except Exception as e:
        error_str = str(e)
        logger.error("Lỗi khi lấy Phong theo ID: %s", error_str)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi máy chủ nội bộ")

# 4. UPDATE
@router.put(
    "/{maPhong}",
    response_model=Phong,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật thông tin một phòng"
)

def update_phong(maPhong: int, phong_in: PhongUpdate):
    """Cập nhật thông tin một phòng theo mã phòng."""
    try:
        data = to_json_safe(phong_in.model_dump(exclude_unset=True, by_alias=True))

        response = supabase_client.table(TABLE_NAME).update(data).eq("maphong", maPhong).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy phòng với mã {maPhong} để cập nhật")

    except Exception as e:
        error_str = str(e)
        logger.error("Lỗi khi cập nhật Phong: %s", error_str)

        # Bắt lỗi UNIQUE constraint (tên phòng bị trùng)
        if "unique constraint" in error_str and "tenphong" in error_str:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Tên phòng '{phong_in.tenPhong}' đã tồn tại."
            )

        # Lỗi chung
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi máy chủ nội bộ")

# 5. DELETE
@router.delete(
    "/{maPhong}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa một phòng theo mã phòng"
)

def delete_phong(maPhong: int):
    """Xóa một phòng theo mã phòng."""
    try:
        response = supabase_client.table(TABLE_NAME).delete().eq("maphong", maPhong).execute()

        if response.data:
            return
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy phòng với mã {maPhong} để xóa")

    except Exception as e:
        error_str = str(e)
        logger.error("Lỗi khi xóa Phong: %s", error_str)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi máy chủ nội bộ")