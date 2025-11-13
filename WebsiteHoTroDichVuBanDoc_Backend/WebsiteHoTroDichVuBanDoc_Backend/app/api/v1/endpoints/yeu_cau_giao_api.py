from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.connect.auth import get_current_staff_profile, get_current_user_from_db, get_delivery_request_owner_or_staff
from app.models.yeu_cau_giao import YeuCauGiao, YeuCauGiaoCreate, YeuCauGiaoUpdate
from app.connect.db import supabase_client
from app.utils import to_json_safe
import logging, ast

router = APIRouter()
logger = logging.getLogger(__name__)

TABLE_NAME = "yeucaugiao"

# 1. CREATE (Bạn đọc tạo yêu cầu giao tài liệu)
@router.post(
    "/",
    response_model=YeuCauGiao,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo một yêu cầu giao tài liệu mới"
)
def create_yeu_cau_giao(yeu_cau_in: YeuCauGiaoCreate, current_user: dict = Depends(get_current_user_from_db)):
    """
    Tạo một yêu cầu giao sách tận nơi.
    - Nhân viên: Được phép tạo cho bất kỳ ai.
    - Bạn đọc: Chỉ được tạo cho chính mình.
    """
    user_role = current_user.get("vaitro")
    user_id_from_token = current_user.get("manguoidung")

    try:
        # === LOGIC PHÂN QUYỀN ===
        if user_role == "nhanVien":
            pass # Nhân viên được phép

        elif user_role == "nguoiDung":
            # Bạn đọc phải tự tạo cho chính mình
            profile_res = supabase_client.table("bandoc") \
                .select("mabandoc") \
                .eq("manguoidung", user_id_from_token) \
                .single().execute()

            if not profile_res.data:
                raise HTTPException(status_code=403, detail="Bạn không có hồ sơ bạn đọc hợp lệ.")

            own_maBanDoc = profile_res.data["mabandoc"]

            # Kiểm tra xem maBanDoc trong body có khớp không
            if own_maBanDoc != yeu_cau_in.maBanDoc:
                raise HTTPException(status_code=403, detail="Bạn đọc chỉ được tạo yêu cầu giao cho chính mình.")

            # Kiểm tra xem maMuonTra có thuộc về họ không
            loan_res = supabase_client.table("muontra") \
                .select("mabandoc") \
                .eq("mamuontra", yeu_cau_in.maMuonTra) \
                .single().execute()

            if not loan_res.data or loan_res.data["mabandoc"] != own_maBanDoc:
                raise HTTPException(status_code=403, detail="Lượt mượn này không thuộc về bạn.")
        else:
            raise HTTPException(status_code=403, detail="Vai trò của bạn không được phép tạo yêu cầu này.")

        # === LOGIC TẠO (Giữ nguyên) ===
        data = to_json_safe(yeu_cau_in.model_dump(by_alias=True))
        response = supabase_client.table(TABLE_NAME).insert(data).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể tạo yêu cầu giao sách")

    except Exception as e:
        if isinstance(e, HTTPException): raise e
        error_str = str(e)
        logger.error("Lỗi khi tạo YeuCauGiao: %s", error_str)
        if "foreign key constraint" in error_str:
            raise HTTPException(status_code=404, detail="Không tìm thấy 'BanDoc', 'MuonTra', 'PhuongXa' hoặc 'NhanVien'.")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Lỗi máy chủ nội bộ")

# 2. READ ALL (SỬA: PHÂN QUYỀN ĐỘNG)
@router.get(
    "/",
    response_model=List[YeuCauGiao],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách tất cả yêu cầu giao tài liệu (Phân quyền động)"
)
def get_all_yeu_cau_giao(
    current_user: dict = Depends(get_current_user_from_db) # Dùng Tầng 1
):
    """
    Lấy danh sách tất cả các yêu cầu giao tài liệu.
    - Nhân viên: Thấy TẤT CẢ.
    - Bạn đọc: Chỉ thấy CỦA MÌNH.
    """
    try:
        user_role = current_user.get("vaitro")
        user_id = current_user.get("manguoidung")

        query = supabase_client.table(TABLE_NAME).select("*")

        if user_role == "nhanVien":
            pass # Nhân viên thấy tất cả

        elif user_role == "nguoiDung":
            try:
                profile_res = supabase_client.table("bandoc") \
                    .select("mabandoc") \
                    .eq("manguoidung", user_id) \
                    .single().execute()

                if not profile_res.data:
                    return [] # Không có hồ sơ

                ma_ban_doc = profile_res.data["mabandoc"]
                query = query.eq("mabandoc", ma_ban_doc)

            except Exception as profile_e:
                logger.error(f"Lỗi khi lấy hồ sơ bạn đọc (ID: {user_id}): {profile_e}")
                raise HTTPException(status_code=500, detail="Lỗi khi truy xuất hồ sơ bạn đọc.")
        else:
            return []

        response = query.order("thoigianyeucau", desc=True).execute()
        return response.data or []

    except Exception as e:
        logger.error("Lỗi khi lấy tất cả YeuCauGiao: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 3. READ ONE
@router.get(
    "/{maYeuCauGiao}",
    response_model=YeuCauGiao,
    status_code=status.HTTP_200_OK,
    summary="Lấy chi tiết một yêu cầu giao tài liệu"
)
def get_yeu_cau_giao_by_id(maYeuCauGiao: int, current_user: dict = Depends(get_delivery_request_owner_or_staff)):
    """Lấy thông tin chi tiết của một yêu cầu giao tài liệu bằng ID."""
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
def update_yeu_cau_giao(maYeuCauGiao: int, yeu_cau_in: YeuCauGiaoUpdate, current_staff: dict = Depends(get_current_staff_profile)):
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
    summary="Xóa một yêu cầu giao tài liệu"
)
def delete_yeu_cau_giao(maYeuCauGiao: int, current_staff: dict = Depends(get_current_staff_profile)):
    """(Hành chính) Xóa một yêu cầu giao tài liệu."""
    try:
        response = supabase_client.table(TABLE_NAME).delete().eq("mayeucaugiao", maYeuCauGiao).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy yêu cầu với id={maYeuCauGiao} để xóa")
        return
    except Exception as e:
        logger.error("Lỗi khi xóa YeuCauGiao ID %s: %s", maYeuCauGiao, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))