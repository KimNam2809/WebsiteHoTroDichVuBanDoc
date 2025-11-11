from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.connect.auth import get_current_admin_profile
from app.models.phuong_xa import PhuongXa, PhuongXaCreate, PhuongXaUpdate
from app.connect.db import supabase_client
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

TABLE_NAME = "phuongxa"

# 1. CREATE
@router.post(
    "/",
    response_model=PhuongXa,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo Phường/Xã mới"
)

def create_phuong_xa(phuong_xa_in: PhuongXaCreate, current_admin: dict = Depends(get_current_admin_profile)):
    try:
        data = phuong_xa_in.model_dump(by_alias=True)
        response = supabase_client.table(TABLE_NAME).insert(data).execute()
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể tạo Phường/Xã")
    except Exception as e:
        logger.error(f"Lỗi khi tạo PhuongXa: {e}")
        if "foreign key constraint" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy Tỉnh/Thành phố tham chiếu")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 2. READ ALL
@router.get("/", response_model=List[PhuongXa], summary="Lấy tất cả Phường/Xã")
def get_all_phuong_xa():
    try:
        response = supabase_client.table(TABLE_NAME).select("*").order("maphuongxa").execute()
        return response.data or []
    except Exception as e:
        logger.error(f"Lỗi khi lấy tất cả PhuongXa: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 3. READ ONE
@router.get("/{maPhuongXa}", response_model=PhuongXa, summary="Lấy chi tiết Phường/Xã")
def get_phuong_xa_by_id(maPhuongXa: int):
    try:
        response = supabase_client.table(TABLE_NAME).select("*").eq("maphuongxa", maPhuongXa).single().execute()
        if response.data:
            return response.data
    except Exception as e:
        logger.warning(f"Không tìm thấy PhuongXa ID {maPhuongXa}: {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy Phường/Xã với id={maPhuongXa}")

# 4. UPDATE
@router.put(
    "/{maPhuongXa}",
    response_model=PhuongXa,
    summary="Cập nhật Phường/Xã"
)

def update_phuong_xa(maPhuongXa: int, phuong_xa_in: PhuongXaUpdate, current_admin: dict = Depends(get_current_admin_profile)):
    try:
        data = phuong_xa_in.model_dump(exclude_unset=True, by_alias=True)
        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có thông tin nào được gửi để cập nhật")
        response = supabase_client.table(TABLE_NAME).update(data).eq("maphuongxa", maPhuongXa).execute()
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy Phường/Xã với id={maPhuongXa}")
    except Exception as e:
        logger.error(f"Lỗi khi cập nhật PhuongXa {maPhuongXa}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 5. DELETE
@router.delete(
    "/{maPhuongXa}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa Phường/Xã"
)

def delete_phuong_xa(maPhuongXa: int, current_admin: dict = Depends(get_current_admin_profile)):
    try:
        response = supabase_client.table(TABLE_NAME).delete().eq("maphuongxa", maPhuongXa).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy Phường/Xã với id={maPhuongXa}")
        return
    except Exception as e:
        logger.error(f"Lỗi khi xóa PhuongXa {maPhuongXa}: {e}")
        if "foreign key constraint" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể xóa: Phường/Xã này đang được Bạn đọc, Nhân viên, v.v. tham chiếu đến.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 6. API Nghiệp vụ: Lấy tất cả phường/xã của 1 tỉnh/thành phố
@router.get(
    "/tinh-thanh-pho/{maTinhThanhPho}",
    response_model=List[PhuongXa],
    summary="Lấy Phường/Xã theo Tỉnh/Thành phố"
)

def get_phuong_xa_by_tinh_thanh_pho(maTinhThanhPho: int):
    """L..." (Giữ nguyên hàm này) ..."""
    try:
        response = (
            supabase_client.table(TABLE_NAME)
            .select("*")
            .eq("matinhthanhpho", maTinhThanhPho)
            .order("tenphuongxa")
            .execute()
        )
        return response.data or []
    except Exception as e:
        logger.error(f"Lỗi khi lấy PhuongXa theo Tỉnh/Thành phố {maTinhThanhPho}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))