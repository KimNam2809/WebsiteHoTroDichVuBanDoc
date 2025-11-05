from fastapi import Depends, HTTPException, status, Path
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from app.connect.security import decode_access_token
from app.connect.db import supabase_client
import logging
from typing import Dict, Any # Thêm import

logger = logging.getLogger(__name__)

# Tầng 0: Định nghĩa "nơi" lấy token
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

# Ngoại lệ chung
CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Không thể xác thực thông tin đăng nhập",
    headers={"WWW-Authenticate": "Bearer"},
)
FORBIDDEN_EXCEPTION = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Không có quyền thực hiện hành động này."
)

# --- TẦNG 1: XÁC THỰC (Lấy thông tin NguoiDung từ CSDL) ---
def get_current_user_from_db(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Dependency Tầng 1:
    1. Giải mã JWT (lấy payload).
    2. Dùng ID từ payload để lấy bản ghi 'nguoidung' MỚI NHẤT từ CSDL.
    Điều này đảm bảo 'vaiTro' hoặc 'trangthai' luôn được cập nhật.
    """
    payload = decode_access_token(token)
    if payload is None:
        raise CREDENTIALS_EXCEPTION

    user_id: int = payload.get("id")
    if user_id is None:
        raise CREDENTIALS_EXCEPTION

    try:
        # Lấy thông tin NguoiDung MỚI NHẤT từ CSDL
        response = supabase_client.table("nguoidung") \
            .select("*") \
            .eq("manguoidung", user_id) \
            .single() \
            .execute()

        if not response.data:
            raise CREDENTIALS_EXCEPTION

        # Trả về bản ghi 'nguoidung' (dạng dict)
        return response.data

    except Exception as e:
        logger.warning(f"Lỗi khi get_current_user_from_db: {e}")
        raise CREDENTIALS_EXCEPTION

# --- TẦNG 2: PHÂN QUYỀN (Kiểm tra hồ sơ) ---

def get_current_staff_profile(
    current_user: Dict[str, Any] = Depends(get_current_user_from_db)
) -> Dict[str, Any]:
    """
    Dependency Tầng 2 (Nhân viên):
    1. Đảm bảo user đã được xác thực (từ Tầng 1).
    2. Kiểm tra `vaiTro` là 'nhanVien'.
    3. KIỂM TRA sự tồn tại của hồ sơ trong bảng 'nhanvien'.
    4. Trả về thông tin hồ sơ nhân viên.
    """
    if current_user.get("vaitro") != "nhanVien":
        raise FORBIDDEN_EXCEPTION

    try:
        # KIỂM TRA HỒ SƠ
        profile_res = supabase_client.table("nhanvien") \
            .select("*") \
            .eq("manguoidung", current_user["manguoidung"]) \
            .single() \
            .execute()

        if not profile_res.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Tài khoản nhân viên hợp lệ nhưng thiếu hồ sơ."
            )

        # Gộp thông tin (tùy chọn, nhưng rất hữu ích)
        # current_user giờ sẽ chứa cả thông tin 'nhanvien'
        current_user.update(profile_res.data)
        return current_user

    except Exception as e:
        logger.warning(f"Lỗi khi get_current_staff_profile: {e}")
        raise FORBIDDEN_EXCEPTION

def get_current_reader_profile(
    current_user: Dict[str, Any] = Depends(get_current_user_from_db)
) -> Dict[str, Any]:
    """
    Dependency Tầng 2 (Bạn Đọc) - Đây là câu trả lời cho bạn.
    1. Đảm bảo user đã được xác thực (từ Tầng 1).
    2. Kiểm tra `vaiTro` là 'nguoiDung'.
    3. KIỂM TRA sự tồn tại của hồ sơ trong bảng 'bandoc'.
    4. Trả về thông tin hồ sơ bạn đọc.
    """
    if current_user.get("vaitro") != "nguoiDung":
        raise FORBIDDEN_EXCEPTION

    try:
        # KIỂM TRA HỒ SƠ
        profile_res = supabase_client.table("bandoc") \
            .select("*") \
            .eq("manguoidung", current_user["manguoidung"]) \
            .single() \
            .execute()

        if not profile_res.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn phải hoàn thiện hồ sơ bạn đọc để sử dụng chức năng này."
            )

        # Gộp thông tin
        current_user.update(profile_res.data)
        return current_user

    except Exception as e:
        logger.warning(f"Lỗi khi get_current_reader_profile: {e}")
        # Lỗi .single() nếu không tìm thấy
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hồ sơ bạn đọc của bạn không tồn tại hoặc bị lỗi."
        )

def get_owner_or_staff(
    # 1. Nhận `maBanDoc` từ API (không cần `Path(...)`)
    maBanDoc: int,
    # 2. Lấy thông tin người dùng (Tầng 1)
    current_user: dict = Depends(get_current_user_from_db)
) -> dict:
    """
    Dependency Tầng 2 (Đã sửa lỗi logic):
    Đảm bảo người dùng là Nhân viên HOẶC là chính chủ của hồ sơ.
    """
    user_id = current_user["manguoidung"]
    user_role = current_user.get("vaitro")

    # === Trường hợp 1: Người dùng là Nhân viên ===
    if user_role == "nhanVien":
        try:
            # Xác thực họ CÓ hồ sơ nhân viên
            profile_res = supabase_client.table("nhanvien") \
                .select("maNhanVien") \
                .eq("manguoidung", user_id) \
                .single() \
                .execute()

            if profile_res.data:
                # OK! Họ là nhân viên đã được xác thực
                return current_user
        except Exception:
            # Không tìm thấy hồ sơ nhân viên
            pass
            # (Chúng ta `pass` để đi xuống kiểm tra Lỗi 403 cuối cùng,
            # nhưng một nhân viên không có hồ sơ là một lỗi logic)

    # === Trường hợp 2: Người dùng là Bạn đọc ===
    if user_role == "nguoiDung":
        try:
            # Lấy `maBanDoc` của chính người dùng đang đăng nhập
            profile_res = supabase_client.table("bandoc") \
                .select("mabandoc") \
                .eq("manguoidung", user_id) \
                .single() \
                .execute()

            if profile_res.data:
                own_profile_id = profile_res.data["mabandoc"]

                # KIỂM TRA QUYỀN SỞ HỮU:
                if own_profile_id == maBanDoc:
                    # OK! Họ là chính chủ
                    return current_user

        except Exception:
            # Lỗi .single() -> người dùng này không có hồ sơ bandoc
            raise HTTPException(status_code=403, detail="Bạn không có hồ sơ bạn đọc.")

    # === Trường hợp 3: Thất bại ===
    # Nếu code chạy đến đây, có nghĩa là:
    # 1. Họ là Nhân viên (nhưng không có hồ sơ)
    # 2. Họ là Bạn đọc (nhưng đang cố xem hồ sơ của người khác)
    # 3. Họ là một vai trò lạ (vd: 'nguoiDung' chưa có hồ sơ)
    logger.warning(f"Từ chối: User {user_id} cố xem hồ sơ {maBanDoc} mà không có quyền.")
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Bạn không có quyền xem hồ sơ này."
    )


# (Chúng ta có thể giữ lại hàm cũ nếu muốn có 1 dependency
#  chỉ kiểm tra token, không cần hit CSDL, nhưng Tầng 1 mới an toàn hơn)
def get_current_user_payload(token: str = Depends(oauth2_scheme)) -> dict:
    """Dependency Tầng 0: Chỉ giải mã token, không kiểm tra CSDL (Nhanh)."""
    payload = decode_access_token(token)
    if payload is None:
        raise CREDENTIALS_EXCEPTION
    return payload