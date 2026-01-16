from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from app.connect.db import supabase_client
from app.connect.auth import (
    get_current_user_from_db,
    get_current_staff_profile,
    get_notification_owner_or_staff
)
from app.models.thong_bao import ThongBao, ThongBaoCreate, ThongBaoUpdate
from app.utils import to_json_safe
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

TABLE_NAME = "thongbao"

# ==========================================
# 1. UNREAD COUNT (Đưa lên đầu để tránh conflict route)
# ==========================================
@router.get(
    "/unread-count",
    summary="Đếm số lượng thông báo chưa đọc"
)
def count_unread_notifications(
    # Sử dụng get_current_user_from_db để linh hoạt (cả NV và Bạn đọc đều gọi được mà không lỗi 403)
    current_user: dict = Depends(get_current_user_from_db)
):
    try:
        user_id = current_user.get("manguoidung")
        role = current_user.get("vaitro")

        # Nếu là nhân viên -> Trả về 0 (hoặc logic thông báo cho nhân viên sau này)
        if role == "nhanVien":
            return {"count": 0}

        # Nếu là bạn đọc -> Lấy mã bạn đọc
        bd_res = supabase_client.table("bandoc").select("mabandoc").eq("manguoidung", user_id).maybe_single().execute()

        if not bd_res.data:
            return {"count": 0}

        ma_ban_doc = bd_res.data.get("mabandoc")

        # Đếm số lượng
        response = (
            supabase_client.table(TABLE_NAME)
            .select("mathongbao", count="exact")
            .eq("mabandoc", ma_ban_doc)
            .eq("trangthai", "chuaXem")
            .execute()
        )

        return {"count": response.count}

    except Exception as e:
        logger.error(f"Lỗi đếm thông báo: {e}")
        # Trả về 0 để không làm crash giao diện
        return {"count": 0}


# ==========================================
# 2. GET ALL (Sửa lỗi 403 tại đây)
# ==========================================
@router.get(
    "/",
    response_model=List[ThongBao],
    summary="Lấy danh sách thông báo"
)
def get_user_notifications(
    # Cho phép lọc theo maBanDoc (Dành cho nhân viên)
    maBanDoc: Optional[int] = Query(None),
    current_user: dict = Depends(get_current_user_from_db),
    limit: int = 20,
    offset: int = 0
):
    """
    - Bạn đọc: BẮT BUỘC lọc theo ID của chính mình.
    - Nhân viên: Được phép xem tất cả hoặc lọc.
    """
    try:
        user_id = current_user.get("manguoidung")
        role = current_user.get("vaitro") # 'nguoiDung' hoặc 'nhanVien'

        # Khởi tạo query cơ bản
        query = supabase_client.table(TABLE_NAME).select("*")

        # --- LOGIC PHÂN QUYỀN CHẶT CHẼ ---

        if role == "nguoiDung":
            # 1. Lấy thông tin Bạn đọc từ User ID hiện tại
            # Sử dụng maybe_single để tránh lỗi nếu chưa có hồ sơ
            bd_res = supabase_client.table("bandoc") \
                .select("mabandoc") \
                .eq("manguoidung", user_id) \
                .maybe_single() \
                .execute()

            # Nếu không tìm thấy hồ sơ bạn đọc -> Trả về rỗng ngay lập tức
            if not bd_res.data:
                return []

            real_ma_ban_doc = bd_res.data["mabandoc"]

            # 2. BẮT BUỘC áp dụng bộ lọc theo mabandoc của chính user đó
            query = query.eq("mabandoc", real_ma_ban_doc)

        elif role == "nhanVien" or role == "admin":
            # Nếu là nhân viên, cho phép lọc theo tham số query (nếu có)
            if maBanDoc:
                query = query.eq("mabandoc", maBanDoc)
            # Nếu không có maBanDoc, nhân viên được quyền xem tất cả (không làm gì thêm)

        else:
            # Nếu vai trò lạ (không phải nguoiDung, không phải nhanVien) -> CHẶN NGAY
            # Trả về danh sách rỗng để bảo mật
            return []

        # --- THỰC THI QUERY ---
        # Chỉ thực thi sau khi đã đi qua logic phân quyền ở trên
        response = (
            query
            .order("thoigiangui", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        return response.data or []

    except Exception as e:
        logger.error(f"Lỗi lấy danh sách thông báo user {user_id}: {e}")
        # Trả về rỗng thay vì lỗi 500 để UX tốt hơn, nhưng log lại lỗi
        return []


# ==========================================
# 3. CREATE (Giữ nguyên - Chỉ nhân viên tạo)
# ==========================================
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
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


# ==========================================
# 4. READ ONE (Detail)
# ==========================================
@router.get(
    "/{maThongBao}",
    response_model=ThongBao,
    summary="Lấy chi tiết thông báo"
)
def get_thong_bao_by_id(maThongBao: int, current_user: dict = Depends(get_notification_owner_or_staff)):
    try:
        response = supabase_client.table(TABLE_NAME).select("*").eq("mathongbao", maThongBao).single().execute()
        if response.data:
            return response.data
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy thông báo ID {maThongBao}")


# ==========================================
# 5. UPDATE (Mark Read)
# ==========================================
@router.put(
    "/{maThongBao}/read",
    summary="Đánh dấu đã đọc"
)
def mark_notification_as_read(
    maThongBao: int,
    # Sử dụng dependency này để đảm bảo chỉ chủ sở hữu mới được đánh dấu đọc
    current_user: dict = Depends(get_notification_owner_or_staff)
):
    try:
        response = supabase_client.table(TABLE_NAME).update({"trangthai": "daXem"}).eq("mathongbao", maThongBao).execute()
        if response.data:
            return response.data[0]
        raise HTTPException(status_code=404, detail="Không tìm thấy thông báo")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================================
# 6. DELETE (Chỉ nhân viên xóa)
# ==========================================
@router.delete(
    "/{maThongBao}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa thông báo"
)
def delete_thong_bao(maThongBao: int, current_staff: dict = Depends(get_current_staff_profile)):
    try:
        supabase_client.table(TABLE_NAME).delete().eq("mathongbao", maThongBao).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))