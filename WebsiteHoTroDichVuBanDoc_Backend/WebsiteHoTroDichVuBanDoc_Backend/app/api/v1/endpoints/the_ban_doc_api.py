from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.connect.auth import get_card_owner_or_staff, get_current_staff_profile
from app.models.the_ban_doc import TheBanDoc, TheBanDocCreate, TheBanDocUpdate
from app.connect.db import supabase_client
from app.utils import to_json_safe
import logging, ast

router = APIRouter()
logger = logging.getLogger(__name__)

TABLE_NAME = "thebandoc"

# 1. CREATE (Phát hành thẻ mới)
@router.post(
    "/",
    response_model=TheBanDoc,
    status_code=status.HTTP_201_CREATED,
    summary="Phát hành một Thẻ Bạn Đọc mới"
)
def create_the_ban_doc(the_ban_doc_in: TheBanDocCreate, current_staff: dict = Depends(get_current_staff_profile)):
    """
    Tạo một bản ghi Thẻ Bạn Đọc mới, hoàn tất quy trình 'YeuCauThe'.
    """
    try:
        # Dùng to_json_safe vì có Date và JSONB
        data = to_json_safe(the_ban_doc_in.model_dump(by_alias=True))

        response = supabase_client.table(TABLE_NAME).insert(data).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể phát hành thẻ")

    except Exception as e:
        error_str = str(e)
        logger.error("Lỗi khi tạo TheBanDoc: %s", error_str)

        if "foreign key constraint" in error_str:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy 'BanDoc', 'LoaiThe', 'NhanVien' hoặc 'VanChuyen' với ID đã cung cấp."
            )
        if "unique constraint" in error_str and "sothe" in error_str:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Số thẻ '{the_ban_doc_in.soThe}' đã tồn tại."
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi máy chủ nội bộ")

# 2. READ ALL
@router.get(
    "/",
    response_model=List[TheBanDoc],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách tất cả Thẻ Bạn Đọc"
)
def get_all_the_ban_doc(current_staff: dict = Depends(get_current_staff_profile)):
    """Lấy danh sách tất cả các Thẻ Bạn Đọc đã được phát hành."""
    try:
        response = supabase_client.table(TABLE_NAME).select("*").order("mathe", desc=True).execute()
        if response.data:
            return response.data
        return []
    except Exception as e:
        logger.error("Lỗi khi lấy tất cả TheBanDoc: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 3. READ ONE
@router.get(
    "/{maThe}",
    response_model=TheBanDoc,
    status_code=status.HTTP_200_OK,
    summary="Lấy chi tiết một Thẻ Bạn Đọc"
)
def get_the_ban_doc_by_id(maThe: int, current_user: dict = Depends(get_card_owner_or_staff )):
    """
    Lấy thông tin chi tiết của một Thẻ Bạn Đọc bằng ID.
    - Nhân viên: Được xem bất kỳ.
    - Bạn đọc: Chỉ được xem của chính mình.
    """
    try:
        response = supabase_client.table(TABLE_NAME).select("*").eq("mathe", maThe).single().execute()
        if response.data:
            return response.data
    except Exception as e:
        logger.warning("Không tìm thấy TheBanDoc ID %s: %s", maThe, e)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy thẻ với id={maThe}")

# 4. UPDATE (Cập nhật thẻ)
@router.put(
    "/{maThe}",
    response_model=TheBanDoc,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật thông tin Thẻ Bạn Đọc"
)
def update_the_ban_doc(maThe: int, the_ban_doc_in: TheBanDocUpdate, current_staff: dict = Depends(get_current_staff_profile)):
    """
    Cập nhật thông tin cho một Thẻ Bạn Đọc
    (ví dụ: gia hạn `ngayHetHan`, thay đổi `trangThaiThe`).
    """
    try:
        data = to_json_safe(the_ban_doc_in.model_dump(exclude_unset=True, by_alias=True))
        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có thông tin nào được gửi để cập nhật")

        response = supabase_client.table(TABLE_NAME).update(data).eq("mathe", maThe).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy thẻ với id={maThe} để cập nhật")

    except Exception as e:
        error_str = str(e)
        logger.error("Lỗi khi cập nhật TheBanDoc ID %s: %s", maThe, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 5. DELETE
@router.delete(
    "/{maThe}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa một Thẻ Bạn Đọc"
)
def delete_the_ban_doc(maThe: int, current_staff: dict = Depends(get_current_staff_profile)):
    """(Hành chính) Xóa một bản ghi Thẻ Bạn Đọc."""
    try:
        response = supabase_client.table(TABLE_NAME).delete().eq("mathe", maThe).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy thẻ với id={maThe} để xóa")
        return
    except Exception as e:
        logger.error("Lỗi khi xóa TheBanDoc ID %s: %s", maThe, e)
        # Không có khóa ngoại nào trỏ tới 'maThe'
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))