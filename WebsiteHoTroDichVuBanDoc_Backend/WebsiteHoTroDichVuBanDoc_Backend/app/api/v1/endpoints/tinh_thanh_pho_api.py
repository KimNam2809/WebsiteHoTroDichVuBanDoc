from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.connect.auth import get_current_admin_profile
from app.models.tinh_thanh_pho import TinhThanhPho, TinhThanhPhoCreate, TinhThanhPhoUpdate
from app.connect.db import supabase_client
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

TABLE_NAME = "tinhthanhpho"

# 1. CREATE
@router.post(
    "/",
    response_model=TinhThanhPho,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo Tỉnh/Thành phố mới"
)

def create_tinh_thanh_pho(tinh_thanh_pho_in: TinhThanhPhoCreate, current_admin: dict = Depends(get_current_admin_profile)):
    try:
        data = tinh_thanh_pho_in.model_dump(by_alias=True)
        response = supabase_client.table(TABLE_NAME).insert(data).execute()
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể tạo Tỉnh/Thành phố")
    except Exception as e:
        logger.error(f"Lỗi khi tạo TinhThanhPho: {e}")
        if "unique constraint" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Tên Tỉnh/Thành phố đã tồn tại")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 2. READ ALL
@router.get(
    "/",
    response_model=List[TinhThanhPho],
    summary="Lấy tất cả Tỉnh/Thành phố"
)

def get_all_tinh_thanh_pho():
    try:
        response = supabase_client.table(TABLE_NAME).select("*").order("matinhthanhpho").execute()
        return response.data or []
    except Exception as e:
        logger.error(f"Lỗi khi lấy tất cả TinhThanhPho: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 3. READ ONE
@router.get(
    "/{maTinhThanhPho}",
    response_model=TinhThanhPho,
    summary="Lấy chi tiết Tỉnh/Thành phố"
)

def get_tinh_thanh_pho_by_id(maTinhThanhPho: int):
    try:
        response = supabase_client.table(TABLE_NAME).select("*").eq("matinhthanhpho", maTinhThanhPho).single().execute()
        if response.data:
            return response.data
    except Exception as e:
        logger.warning(f"Không tìm thấy TinhThanhPho ID {maTinhThanhPho}: {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy Tỉnh/Thành phố với id={maTinhThanhPho}")

# 4. UPDATE
@router.put(
    "/{maTinhThanhPho}",
    response_model=TinhThanhPho,
    summary="Cập nhật Tỉnh/Thành phố"
)

def update_tinh_thanh_pho(maTinhThanhPho: int, tinh_thanh_pho_in: TinhThanhPhoUpdate, current_admin: dict = Depends(get_current_admin_profile)):
    try:
        data = tinh_thanh_pho_in.model_dump(exclude_unset=True, by_alias=True)
        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có thông tin nào được gửi để cập nhật")
        response = supabase_client.table(TABLE_NAME).update(data).eq("matinhthanhpho", maTinhThanhPho).execute()
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy Tỉnh/Thành phố với id={maTinhThanhPho}")
    except Exception as e:
        logger.error(f"Lỗi khi cập nhật TinhThanhPho {maTinhThanhPho}: {e}")
        if "unique constraint" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Tên Tỉnh/Thành phố đã tồn tại")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 5. DELETE
@router.delete(
    "/{maTinhThanhPho}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa Tỉnh/Thành phố"
)

def delete_tinh_thanh_pho(maTinhThanhPho: int, current_admin: dict = Depends(get_current_admin_profile)):
    try:
        response = supabase_client.table(TABLE_NAME).delete().eq("matinhthanhpho", maTinhThanhPho).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy Tỉnh/Thành phố với id={maTinhThanhPho}")
        return
    except Exception as e:
        logger.error(f"Lỗi khi xóa TinhThanhPho {maTinhThanhPho}: {e}")
        if "foreign key constraint" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể xóa: Tỉnh/Thành phố này đang được Phường/Xã tham chiếu đến.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))