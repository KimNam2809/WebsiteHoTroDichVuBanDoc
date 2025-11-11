import logging
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.models.nguoi_dung import NguoiDung, NguoiDungCreate, NguoiDungUpdate
from app.connect.db import supabase_client
from app.connect.auth import get_current_staff_profile, get_user_owner_or_staff
from app.connect.security import get_password_hash

router = APIRouter()
logger = logging.getLogger(__name__)

TABLE_NAME = "nguoidung"

# 1. CREATE (Tạo người dùng MỚI)
@router.post(
    "/",
    response_model=NguoiDung, # <-- Trả về NguoiDung (không     có mật khẩu)
    status_code=status.HTTP_201_CREATED,
    summary="Tạo một người dùng mới (đã băm mật khẩu)"
)
def create_nguoi_dung(nguoi_dung_in: NguoiDungCreate): # <-- Nhận NguoiDungCreate (có mật khẩu)
    """
    Tạo một người dùng mới. Mật khẩu sẽ tự động được băm.
    """
    try:
        # **PHẦN QUAN TRỌNG VỀ BẢO MẬT**
        # 1. Lấy dữ liệu từ Pydantic model
        data = nguoi_dung_in.model_dump(by_alias=True)

        # 2. Băm mật khẩu
        hashed_password = get_password_hash(nguoi_dung_in.matKhau)

        # 3. Thay thế mật khẩu trần bằng mật khẩu đã băm
        data["matkhau"] = hashed_password

        # 4. Gửi dữ liệu đã băm vào DB
        response = supabase_client.table(TABLE_NAME).insert(data).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể tạo người dùng")

    except Exception as e:
        error_str = str(e).lower()
        if "unique constraint" in error_str and "tendangnhap" in error_str:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Tên đăng nhập '{nguoi_dung_in.tenDangNhap}' đã tồn tại."
            )
        if "unique constraint" in error_str and "email" in error_str:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Email '{nguoi_dung_in.email}' đã tồn tại."
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 2. READ ALL
@router.get(
    "/",
    response_model=List[NguoiDung], # <-- Đảm bảo trả về model an toàn
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách tất cả người dùng"
)
def get_all_nguoi_dung(current_staff: dict = Depends(get_current_staff_profile)):
    """
    Lấy danh sách tất cả người dùng.
    **Mật khẩu sẽ không được trả về.**
    """
    try:
        response = supabase_client.table(TABLE_NAME).select("*").order("manguoidung", desc=False).execute()

        if response.data:
            return response.data
        return []

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 3. READ ONE
@router.get(
    "/{maNguoiDung}",
    response_model=NguoiDung, # <-- Đảm bảo trả về model an toàn
    status_code=status.HTTP_200_OK,
    summary="Lấy thông tin chi tiết một người dùng"
)
def get_nguoi_dung_by_id(maNguoiDung: int, current_user: dict = Depends(get_user_owner_or_staff)):
    """
    Lấy thông tin chi tiết của một người dùng.
    - Nhân viên: Được xem bất kỳ.
    - Người dùng: Chỉ được xem của chính mình.
    """
    try:
        response = supabase_client.table(TABLE_NAME).select("*").eq("manguoidung", maNguoiDung).single().execute()

        if response.data:
            return response.data

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy người dùng với id={maNguoiDung}")

# 4. UPDATE
@router.put(
    "/{maNguoiDung}",
    response_model=NguoiDung,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật thông tin người dùng"
)
def update_nguoi_dung(maNguoiDung: int, nguoi_dung_in: NguoiDungUpdate, current_user: dict = Depends(get_user_owner_or_staff)):
    """
    Cập nhật thông tin người dùng.
    Nếu `matKhau` được cung cấp, nó sẽ được băm lại.
    """
    try:
        data = nguoi_dung_in.model_dump(exclude_unset=True, by_alias=True)

        # === BẢN VÁ BẢO MẬT QUAN TRỌNG ===
        # Nếu người dùng cố gắng thay đổi vai trò
        if "vaitro" in data:
            # Và người đó KHÔNG PHẢI là Nhân viên
            if current_user.get("vaitro") != "nhanVien":
                logger.warning(f"Từ chối: User {current_user.get('manguoidung')} cố tự ý đổi vai trò.")
                raise HTTPException(status_code=403, detail="Bạn không có quyền thay đổi vai trò.")

        # Xử lý nếu có cập nhật mật khẩu
        if "matkhau" in data:
            data["matkhau"] = get_password_hash(data["matkhau"])

        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có thông tin nào được gửi để cập nhật")

        response = supabase_client.table(TABLE_NAME).update(data).eq("manguoidung", maNguoiDung).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy người dùng với id={maNguoiDung}")

    except Exception as e:
        if isinstance(e, HTTPException): raise e # Ném lại lỗi 403
        logger.error(f"Lỗi khi cập nhật NguoiDung {maNguoiDung}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 5. DELETE
@router.delete(
    "/{maNguoiDung}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa một người dùng"
)
def delete_nguoi_dung(maNguoiDung: int, current_staff: dict = Depends(get_current_staff_profile)):
    """
    Xóa một người dùng.
    Lưu ý: Sẽ thất bại nếu người dùng này đang là `BanDoc` hoặc `NhanVien`.
    """
    try:
        response = supabase_client.table(TABLE_NAME).delete().eq("manguoidung", maNguoiDung).execute()

        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy người dùng với id={maNguoiDung} để xóa")

        return

    except Exception as e:
        if "foreign key constraint" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Không thể xóa: Người dùng này đang được tham chiếu bởi 'BanDoc' hoặc 'NhanVien'."
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))