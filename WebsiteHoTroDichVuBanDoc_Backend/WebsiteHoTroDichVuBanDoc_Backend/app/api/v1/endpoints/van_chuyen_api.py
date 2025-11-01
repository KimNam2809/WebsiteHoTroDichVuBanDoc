from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from app.models.van_chuyen import VanChuyen, VanChuyenCreate, VanChuyenUpdate
from app.connect.db import supabase_client
from app.utils import to_json_safe
import logging, ast

router = APIRouter()
logger = logging.getLogger(__name__)

TABLE_NAME = "vanchuyen"

# 1. CREATE (Tạo đơn vận chuyển)
@router.post(
    "/",
    response_model=VanChuyen,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo một đơn vận chuyển mới"
)
def create_van_chuyen(van_chuyen_in: VanChuyenCreate):
    """
    Tạo một đơn vận chuyển mới, thường liên kết với một 'YeuCauThe'.
    """
    try:
        # Dùng to_json_safe vì có Datetime và Decimal
        data = to_json_safe(van_chuyen_in.model_dump(by_alias=True))

        response = supabase_client.table(TABLE_NAME).insert(data).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể tạo đơn vận chuyển")

    except Exception as e:
        error_str = str(e)
        logger.error("Lỗi khi tạo VanChuyen: %s", error_str)

        if "foreign key constraint" in error_str:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy 'YeuCauThe' hoặc 'PhuongXa' với ID đã cung cấp."
            )
        if "unique constraint" in error_str and "matheodoi" in error_str:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Mã theo dõi '{van_chuyen_in.maTheoDoi}' đã tồn tại."
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi máy chủ nội bộ")

# 2. READ ALL
@router.get(
    "/",
    response_model=List[VanChuyen],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách tất cả đơn vận chuyển"
)
def get_all_van_chuyen():
    """Lấy danh sách tất cả các đơn vận chuyển."""
    try:
        response = supabase_client.table(TABLE_NAME).select("*").order("mavanchuyen", desc=True).execute()
        if response.data:
            return response.data
        return []
    except Exception as e:
        logger.error("Lỗi khi lấy tất cả VanChuyen: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 3. READ ONE
@router.get(
    "/{maVanChuyen}",
    response_model=VanChuyen,
    status_code=status.HTTP_200_OK,
    summary="Lấy chi tiết một đơn vận chuyển"
)
def get_van_chuyen_by_id(maVanChuyen: int):
    """Lấy thông tin chi tiết của một đơn vận chuyển bằng ID."""
    try:
        response = supabase_client.table(TABLE_NAME).select("*").eq("mavanchuyen", maVanChuyen).single().execute()
        if response.data:
            return response.data
    except Exception as e:
        logger.warning("Không tìm thấy VanChuyen ID %s: %s", maVanChuyen, e)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy đơn vận chuyển với id={maVanChuyen}")

# 4. UPDATE (Cập nhật trạng thái giao hàng)
@router.put(
    "/{maVanChuyen}",
    response_model=VanChuyen,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật trạng thái đơn vận chuyển"
)
def update_van_chuyen(maVanChuyen: int, van_chuyen_in: VanChuyenUpdate):
    """
    Cập nhật thông tin/trạng thái cho một đơn vận chuyển
    (ví dụ: cập nhật `trangThai` thành 'dangGiaoHang' hoặc 'daGiaoThanhCong').
    """
    try:
        data = to_json_safe(van_chuyen_in.model_dump(exclude_unset=True, by_alias=True))
        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có thông tin nào được gửi để cập nhật")

        response = supabase_client.table(TABLE_NAME).update(data).eq("mavanchuyen", maVanChuyen).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy đơn vận chuyển với id={maVanChuyen} để cập nhật")

    except Exception as e:
        error_str = str(e)
        logger.error("Lỗi khi cập nhật VanChuyen ID %s: %s", maVanChuyen, e)
        if "unique constraint" in error_str and "matheodoi" in error_str:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Mã theo dõi này đã tồn tại."
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 5. DELETE
@router.delete(
    "/{maVanChuyen}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa một đơn vận chuyển"
)
def delete_van_chuyen(maVanChuyen: int):
    """(Hành chính) Xóa một đơn vận chuyển."""
    try:
        response = supabase_client.table(TABLE_NAME).delete().eq("mavanchuyen", maVanChuyen).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy đơn vận chuyển với id={maVanChuyen} để xóa")
        return
    except Exception as e:
        error_str = str(e)
        logger.error("Lỗi khi xóa VanChuyen ID %s: %s", maVanChuyen, e)
        if "foreign key constraint" in error_str:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Không thể xóa: Đơn vận chuyển này đang được 'TheBanDoc' tham chiếu đến."
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))