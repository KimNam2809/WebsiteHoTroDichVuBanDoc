from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.connect.auth import get_current_staff_profile
from app.models.thong_bao import ThongBao, ThongBaoCreate, ThongBaoUpdate
from app.connect.db import supabase_client
from app.connect.auth import get_current_staff_profile, get_owner_or_staff, get_notification_owner_or_staff
from app.utils import to_json_safe
import logging, ast

router = APIRouter()
logger = logging.getLogger(__name__)

TABLE_NAME = "thongbao"

# 1. CREATE
@router.post(
    "/",
    response_model=ThongBao,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo thông báo mới"
)

def create_thong_bao(thong_bao_in: ThongBaoCreate, current_staff: dict = Depends(get_current_staff_profile)):
    try:
        data = to_json_safe(thong_bao_in.model_dump(by_alias=True))
        response = supabase_client.table(TABLE_NAME).insert(data).execute()
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể tạo thông báo")
    except Exception as e:
        logger.error(f"Lỗi khi tạo ThongBao: {e}")
        if "foreign key constraint" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy Bạn đọc được tham chiếu")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 2. READ ALL
@router.get(
    "/",
    response_model=List[ThongBao],
    summary="Lấy tất cả thông báo"
)

def get_all_thong_bao(current_staff: dict = Depends(get_current_staff_profile)):
    try:
        response = supabase_client.table(TABLE_NAME).select("*").order("mathongbao", desc=True).execute()
        return response.data or []
    except Exception as e:
        logger.error(f"Lỗi khi lấy tất cả ThongBao: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 3. READ ONE
@router.get(
    "/{maThongBao}",
    response_model=ThongBao,
    summary="Lấy chi tiết thông báo"
)

def get_thong_bao_by_id(maThongBao: int, current_user: dict = Depends(get_notification_owner_or_staff)):
    """
    Lấy chi tiết một thông báo.
    - Nhân viên: Xem bất kỳ.
    - Bạn đọc: Chỉ xem của mình.
    """
    try:
        response = supabase_client.table(TABLE_NAME).select("*").eq("mathongbao", maThongBao).single().execute()
        if response.data:
            return response.data
    except Exception as e:
        logger.warning(f"Không tìm thấy ThongBao ID {maThongBao}: {e}")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy thông báo với id={maThongBao}")

# 4. UPDATE
@router.put(
    "/{maThongBao}",
    response_model=ThongBao,
    summary="Cập nhật trạng thái thông báo"
)

def update_thong_bao(maThongBao: int, thong_bao_in: ThongBaoUpdate, current_user: dict = Depends(get_notification_owner_or_staff)):
    """
    Cập nhật trạng thái thông báo.
    - Bạn đọc: Cập nhật của mình (ví dụ: 'daDoc').
    - Nhân viên: Cập nhật bất kỳ.
    """
    try:
        data = to_json_safe(thong_bao_in.model_dump(exclude_unset=True, by_alias=True))
        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có thông tin nào được gửi để cập nhật")
        response = supabase_client.table(TABLE_NAME).update(data).eq("mathongbao", maThongBao).execute()
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy thông báo với id={maThongBao}")
    except Exception as e:
        logger.error(f"Lỗi khi cập nhật ThongBao {maThongBao}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 5. DELETE
@router.delete(
    "/{maThongBao}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa thông báo"
)

def delete_thong_bao(maThongBao: int, current_staff: dict = Depends(get_current_staff_profile)):
    try:
        response = supabase_client.table(TABLE_NAME).delete().eq("mathongbao", maThongBao).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy thông báo với id={maThongBao}")
        return
    except Exception as e:
        logger.error(f"Lỗi khi xóa ThongBao {maThongBao}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 6. API Nghiệp vụ: Lấy thông báo theo bạn đọc
@router.get(
    "/ban-doc/{maBanDoc}",
    response_model=List[ThongBao],
    summary="Lấy thông báo theo Bạn đọc"
)

def get_thong_bao_by_ban_doc(maBanDoc: int, current_user: dict = Depends(get_owner_or_staff)):
    """Lấy thông báo theo bạn đọc."""
    try:
        response = (
            supabase_client.table(TABLE_NAME)
            .select("*")
            .eq("mabandoc", maBanDoc)
            .order("mathongbao", desc=True)
            .limit(50)
            .execute()
        )
        return response.data or []
    except Exception as e:
        logger.error(f"Lỗi khi lấy ThongBao theo BanDoc {maBanDoc}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))