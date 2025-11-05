from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.models.bai_viet import BaiViet, BaiVietCreate, BaiVietUpdate
from app.connect.db import supabase_client
from app.connect.auth import get_current_staff_profile
from app.utils import to_json_safe # Import tiện ích của bạn
import logging, ast

router = APIRouter()
logger = logging.getLogger(__name__)

TABLE_NAME = "baiviet"

# 1. CREATE
@router.post(
    "/",
    response_model=BaiViet,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo một bài viết mới" # Chỉ nhân viên mới được tạo bài viết
)
def create_bai_viet(bai_viet_in: BaiVietCreate, current_staff: dict = Depends(get_current_staff_profile)):
    """
    Tạo một bài viết (tin tức, thông báo) mới.
    `ngayDang` sẽ tự động được đặt bởi database.
    """
    try:
        # Dùng to_json_safe vì model có thể chứa datetime
        data = to_json_safe(bai_viet_in.model_dump(by_alias=True))

        response = supabase_client.table(TABLE_NAME).insert(data).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể tạo bài viết")

    except Exception as e:
        error_str = str(e)
        logger.error("Lỗi khi tạo BaiViet: %s", error_str)

        # Bắt lỗi khóa ngoại (nếu maNhanVien không tồn tại)
        if "foreign key constraint" in error_str and "manhanvien" in error_str:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy Nhân viên với ID: {bai_viet_in.maNhanVien}."
            )

        # Lỗi chung
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi máy chủ nội bộ")

# 2. READ ALL
@router.get(
    "/",
    response_model=List[BaiViet],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách tất cả bài viết"
)
def get_all_bai_viet():
    """
    Lấy danh sách tất cả bài viết,
    sắp xếp theo ngày đăng mới nhất lên trước.
    """
    try:
        response = supabase_client.table(TABLE_NAME).select("*").order("ngaydang", desc=True).execute()
        if response.data:
            return response.data
        return []
    except Exception as e:
        logger.error("Lỗi khi lấy tất cả BaiViet: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 3. READ ONE
@router.get(
    "/{maBaiViet}",
    response_model=BaiViet,
    status_code=status.HTTP_200_OK,
    summary="Lấy chi tiết một bài viết"
)
def get_bai_viet_by_id(maBaiViet: int):
    """Lấy thông tin chi tiết của một bài viết bằng ID."""
    try:
        response = supabase_client.table(TABLE_NAME).select("*").eq("mabaiviet", maBaiViet).single().execute()
        if response.data:
            return response.data
    except Exception as e:
        logger.warning("Không tìm thấy BaiViet ID %s: %s", maBaiViet, e)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy bài viết với id={maBaiViet}")

# 4. UPDATE
@router.put(
    "/{maBaiViet}",
    response_model=BaiViet,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật thông tin bài viết"
)
def update_bai_viet(maBaiViet: int, bai_viet_in: BaiVietUpdate, current_staff: dict = Depends(get_current_staff_profile)):
    """
    Cập nhật thông tin cho một bài viết (tiêu đề, nội dung, trạng thái...).
    Sẽ tự động cập nhật `ngayCapNhat` nếu có trong model (hiện DB tự xử lý).
    """
    try:
        data = to_json_safe(bai_viet_in.model_dump(exclude_unset=True, by_alias=True))
        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có thông tin nào được gửi để cập nhật")

        response = supabase_client.table(TABLE_NAME).update(data).eq("mabaiviet", maBaiViet).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy bài viết với id={maBaiViet} để cập nhật")

    except Exception as e:
        error_str = str(e)
        logger.error("Lỗi khi cập nhật BaiViet ID %s: %s", maBaiViet, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 5. DELETE
@router.delete(
    "/{maBaiViet}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa một bài viết"
)
def delete_bai_viet(maBaiViet: int, current_staff: dict = Depends(get_current_staff_profile)):
    """Xóa một bài viết."""
    try:
        response = supabase_client.table(TABLE_NAME).delete().eq("mabaiviet", maBaiViet).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy bài viết với id={maBaiViet} để xóa")
        return
    except Exception as e:
        logger.error("Lỗi khi xóa BaiViet ID %s: %s", maBaiViet, e)
        # Bảng BaiViet không có khóa ngoại nào trỏ tới nó,
        # nên thường không có lỗi 'foreign key constraint' khi xóa.
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))