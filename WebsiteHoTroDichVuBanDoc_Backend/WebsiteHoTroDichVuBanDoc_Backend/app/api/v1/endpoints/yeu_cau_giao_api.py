from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from app.models.yeu_cau_giao import YeuCauGiao, YeuCauGiaoCreate, YeuCauGiaoUpdate
from app.connect.db import supabase_client
from app.utils import to_json_safe
import logging, ast

router = APIRouter()
logger = logging.getLogger(__name__)

TABLE_NAME = "yeucaugiao"

# 1. CREATE (Bạn đọc tạo yêu cầu giao sách)
@router.post(
    "/",
    response_model=YeuCauGiao,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo một yêu cầu giao sách mới"
)
def create_yeu_cau_giao(yeu_cau_in: YeuCauGiaoCreate):
    """
    Tạo một yêu cầu giao sách tận nơi cho một lượt mượn đã có.
    Trạng thái ban đầu mặc định là 'daYeuCau'.
    """
    try:
        # Dùng to_json_safe vì có JSONB, Decimal, Datetime
        data = to_json_safe(yeu_cau_in.model_dump(by_alias=True))

        response = supabase_client.table(TABLE_NAME).insert(data).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể tạo yêu cầu giao sách")

    except Exception as e:
        error_str = str(e)
        logger.error("Lỗi khi tạo YeuCauGiao: %s", error_str)

        if "foreign key constraint" in error_str:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy 'BanDoc', 'MuonTra', 'PhuongXa' hoặc 'NhanVien' với ID đã cung cấp."
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi máy chủ nội bộ")

# 2. READ ALL
@router.get(
    "/",
    response_model=List[YeuCauGiao],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách tất cả yêu cầu giao sách"
)
def get_all_yeu_cau_giao():
    """Lấy danh sách tất cả các yêu cầu giao sách."""
    try:
        response = supabase_client.table(TABLE_NAME).select("*").order("thoigianyeucau", desc=True).execute()
        if response.data:
            return response.data
        return []
    except Exception as e:
        logger.error("Lỗi khi lấy tất cả YeuCauGiao: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 3. READ ONE
@router.get(
    "/{maYeuCauGiao}",
    response_model=YeuCauGiao,
    status_code=status.HTTP_200_OK,
    summary="Lấy chi tiết một yêu cầu giao sách"
)
def get_yeu_cau_giao_by_id(maYeuCauGiao: int):
    """Lấy thông tin chi tiết của một yêu cầu giao sách bằng ID."""
    try:
        response = supabase_client.table(TABLE_NAME).select("*").eq("mayeucaugiao", maYeuCauGiao).single().execute()
        if response.data:
            return response.data
    except Exception as e:
        logger.warning("Không tìm thấy YeuCauGiao ID %s: %s", maYeuCauGiao, e)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy yêu cầu với id={maYeuCauGiao}")

# 4. UPDATE (Nhân viên xử lý yêu cầu)
@router.put(
    "/{maYeuCauGiao}",
    response_model=YeuCauGiao,
    status_code=status.HTTP_200_OK,
    summary="Nhân viên xử lý/cập nhật yêu cầu giao sách"
)
def update_yeu_cau_giao(maYeuCauGiao: int, yeu_cau_in: YeuCauGiaoUpdate):
    """
    Cập nhật trạng thái cho một yêu cầu giao sách.
    Đây là API chính cho nhân viên:
    - Cập nhật `trangThai` (vd: 'dangChuanBi', 'dangGiao', 'daGiaoThanhCong', 'daHuy').
    - Gán `maNhanVien` xử lý.
    """
    try:
        data = to_json_safe(yeu_cau_in.model_dump(exclude_unset=True, by_alias=True))
        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có thông tin nào được gửi để cập nhật")

        response = supabase_client.table(TABLE_NAME).update(data).eq("mayeucaugiao", maYeuCauGiao).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy yêu cầu với id={maYeuCauGiao} để cập nhật")

    except Exception as e:
        error_str = str(e)
        logger.error("Lỗi khi cập nhật YeuCauGiao ID %s: %s", maYeuCauGiao, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 5. DELETE
@router.delete(
    "/{maYeuCauGiao}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa một yêu cầu giao sách"
)
def delete_yeu_cau_giao(maYeuCauGiao: int):
    """(Hành chính) Xóa một yêu cầu giao sách."""
    try:
        response = supabase_client.table(TABLE_NAME).delete().eq("mayeucaugiao", maYeuCauGiao).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy yêu cầu với id={maYeuCauGiao} để xóa")
        return
    except Exception as e:
        logger.error("Lỗi khi xóa YeuCauGiao ID %s: %s", maYeuCauGiao, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))