from fastapi import Depends, HTTPException, status, Path
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from app.connect.security import decode_access_token
from app.connect.db import supabase_client
import logging
from typing import Dict, Any

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
        logger.warning("Token không hợp lệ hoặc không thể giải mã")
        raise CREDENTIALS_EXCEPTION

    user_id: int = payload.get("id")
    email = payload.get("email")

    if user_id is None and email is None:
        logger.warning("Token thiếu thông tin định danh (id hoặc email)")
        raise CREDENTIALS_EXCEPTION

    try:
        # 3. Query vào Database
        query = supabase_client.table("nguoidung").select("*")

        if user_id:
            # Nếu có ID (Token thường) -> Tìm theo ID
            query = query.eq("manguoidung", user_id)
        else:
            # Nếu không có ID nhưng có Email (Token Google) -> Tìm theo Email
            query = query.eq("email", email)

        response = query.single().execute()

        if not response.data:
            logger.warning(f"Không tìm thấy user trong public.nguoidung. ID={user_id}, Email={email}")
            raise CREDENTIALS_EXCEPTION

        user_data = response.data

        # (Tùy chọn) Kiểm tra trạng thái tài khoản
        if user_data.get("trangthai") is False:
            raise HTTPException(status_code=400, detail="Tài khoản đã bị khóa")

        return user_data

    except Exception as e:
        logger.error(f"Lỗi DB trong get_current_user_from_db: {e}")
        # Nếu lỗi là do không tìm thấy dòng nào (PGRST116)
        if "PGRST116" in str(e):
            raise CREDENTIALS_EXCEPTION
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lỗi kết nối cơ sở dữ liệu xác thực"
        )

# --- TẦNG 2: PHÂN QUYỀN (Kiểm tra hồ sơ) ---

# 1. Xác nhận nhân viên
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

# 2. Xác nhận bạn đọc
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

# 3. Nghiệp vụ người dùng
def get_user_owner_or_staff(
    maNguoiDung: int, # <-- 1. Lấy ID 'NguoiDung' từ URL
    current_user: dict = Depends(get_current_user_from_db) # <-- 2. Lấy user
) -> dict:
    """
    Dependency Tầng 2 (Bảo vệ NguoiDung):
    Đảm bảo user là Nhân viên HOẶC là chủ của tài khoản NguoiDung.
    """
    user_role = current_user.get("vaitro")
    user_id_from_token = current_user.get("manguoidung")

    # --- Trường hợp 1: Người dùng là Nhân viên ---
    if user_role == "nhanVien":
        return current_user # OK, là nhân viên

    # --- Trường hợp 2: Người dùng là "Chính chủ" ---
    # (So sánh ID từ token với ID từ URL)
    if user_id_from_token == maNguoiDung:
        return current_user # OK, là chính chủ

    # --- Trường hợp 3: Thất bại ---
    logger.warning(f"Từ chối: User {user_id_from_token} cố truy cập NguoiDung ID {maNguoiDung}.")
    raise FORBIDDEN_EXCEPTION

# 4. Nghiệp vụ nhân viên
def get_current_admin_profile(
    current_user: dict = Depends(get_current_user_from_db)
) -> dict:
    """
    Dependency Tầng 2 (Admin):
    Đảm bảo user là Nhân viên VÀ có vai trò Admin
    (Phòng Kỹ thuật & Quản trị hệ thống).
    """
    if current_user.get("vaitro") != "nhanVien":
        raise FORBIDDEN_EXCEPTION # Bị cấm (không phải nhân viên)

    try:
        # KIỂM TRA HỒ SƠ ĐỂ XÁC NHẬN ADMIN
        profile_res = supabase_client.table("nhanvien") \
            .select("phongban, chucvu") \
            .eq("manguoidung", current_user["manguoidung"]) \
            .single() \
            .execute()

        if not profile_res.data:
            raise HTTPException(status_code=403, detail="Tài khoản nhân viên hợp lệ nhưng thiếu hồ sơ.")

        profile = profile_res.data

        # === LOGIC ADMIN MỚI CỦA BẠN ===
        is_admin = (
            profile.get("phongban") == "Phòng kỹ thuật" and
            profile.get("chucvu") == "Quản trị hệ thống"
        )

        if not is_admin:
            raise HTTPException(status_code=403, detail="Yêu cầu quyền Quản trị hệ thống.")

        current_user.update(profile) # Gắn thông tin admin vào
        return current_user

    except Exception as e:
        if isinstance(e, HTTPException): raise e
        logger.warning(f"Lỗi khi get_current_admin_profile: {e}")
        raise FORBIDDEN_EXCEPTION

# 5. Nghiệp vụ nhân viên (xác nhận nhân viên hoặc admin)
def get_staff_self_or_admin(
    maNhanVien: int, # <-- 1. Lấy ID 'NhanVien' từ URL
    current_user: dict = Depends(get_current_user_from_db) # <-- 2. Lấy user
) -> dict:
    """
    Dependency Tầng 2 (Bảo vệ NhanVien - READ/UPDATE):
    Đảm bảo user là Admin (được làm mọi thứ)
    HOẶC là Nhân viên đang xem/sửa hồ sơ CỦA CHÍNH MÌNH.
    """
    user_id_from_token = current_user["manguoidung"]
    user_role = current_user.get("vaitro")

    if user_role != "nhanVien":
        raise FORBIDDEN_EXCEPTION # Không phải nhân viên, cấm ngay

    try:
        # 1. Lấy hồ sơ của người đang đăng nhập
        profile_res = supabase_client.table("nhanvien") \
            .select("manhanvien, phongban, chucvu") \
            .eq("manguoidung", user_id_from_token) \
            .single() \
            .execute()

        if not profile_res.data:
            raise HTTPException(status_code=403, detail="Bạn là nhân viên nhưng không có hồ sơ hợp lệ.")

        profile = profile_res.data

        # 2. Kiểm tra xem họ có phải ADMIN không
        is_admin = (
            profile.get("phongban") == "Phòng kỹ thuật" and
            profile.get("chucvu") == "Quản trị hệ thống"
        )

        if is_admin:
            return current_user # OK! Admin được phép làm mọi thứ

        # 3. Nếu không phải Admin, kiểm tra xem có phải CHÍNH CHỦ không
        own_staff_id = profile.get("manhanvien")
        if own_staff_id == maNhanVien:
            return current_user # OK! Là chính chủ

    except Exception as e:
        if isinstance(e, HTTPException): raise e
        logger.warning(f"Lỗi khi get_staff_self_or_admin: {e}")
        raise FORBIDDEN_EXCEPTION

    # Nếu là nhân viên, nhưng không phải admin và cũng không phải chính chủ
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Nhân viên chỉ được phép thao tác trên hồ sơ của chính mình (hoặc cần quyền Admin)."
    )

# 6. Nghiệp vụ bạn đọc
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
                .select("manhanvien") \
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

# 7. Nghiệp vụ thẻ bạn đọc
def get_card_owner_or_staff(
    maThe: int, # <-- 1. Lấy ID 'TheBanDoc' từ URL
    current_user: dict = Depends(get_current_user_from_db) # <-- 2. Lấy user
) -> dict:
    """
    Dependency Tầng 2 (Bảo vệ TheBanDoc - GET ONE):
    Đảm bảo user là Nhân viên HOẶC là chủ của Thẻ Bạn Đọc.
    """
    user_id = current_user["manguoidung"]
    user_role = current_user.get("vaitro")

    # --- Trường hợp 1: Người dùng là Nhân viên ---
    if user_role == "nhanVien":
        return current_user # OK, là nhân viên

    # --- Trường hợp 2: Người dùng là Bạn đọc (Kiểm tra sở hữu) ---
    if user_role == "nguoiDung":
        try:
            # 1. Lấy xem ai là chủ của THẺ này
            card_res = supabase_client.table("thebandoc") \
                .select("mabandoc") \
                .eq("mathe", maThe) \
                .single() \
                .execute()

            if not card_res.data:
                raise HTTPException(status_code=404, detail="Không tìm thấy thẻ bạn đọc.")

            card_owner_id = card_res.data["mabandoc"]

            # 2. Lấy hồ sơ (maBanDoc) của người đang đăng nhập
            profile_res = supabase_client.table("bandoc") \
                .select("mabandoc") \
                .eq("manguoidung", user_id) \
                .single() \
                .execute()

            if not profile_res.data:
                raise HTTPException(status_code=403, detail="Bạn không có hồ sơ bạn đọc.")

            user_profile_id = profile_res.data["mabandoc"]

            # 3. So sánh
            if card_owner_id == user_profile_id:
                return current_user # OK, là chính chủ

        except Exception as e:
            if isinstance(e, HTTPException): raise e
            logger.warning(f"Lỗi khi kiểm tra get_card_owner_or_staff: {e}")
            raise FORBIDDEN_EXCEPTION

    # --- Trường hợp 3: Thất bại ---
    logger.warning(f"Từ chối: User {user_id} cố xem Thẻ {maThe} mà không có quyền.")
    raise FORBIDDEN_EXCEPTION

# 8. Nghiệp vụ yêu cầu thẻ
def get_card_request_owner_or_staff(
    maYeuCauThe: int, # <-- 1. Lấy ID 'YeuCauThe' từ URL
    current_user: dict = Depends(get_current_user_from_db) # <-- 2. Lấy user
) -> dict:
    """
    Dependency Tầng 2 (Bảo vệ YeuCauThe - GET ONE):
    Đảm bảo user là Nhân viên HOẶC là chủ của Yêu cầu thẻ.
    """
    user_id = current_user["manguoidung"]
    user_role = current_user.get("vaitro")

    # --- Trường hợp 1: Người dùng là Nhân viên ---
    if user_role == "nhanVien":
        return current_user # OK, là nhân viên

    # --- Trường hợp 2: Người dùng là Bạn đọc (Kiểm tra sở hữu) ---
    if user_role == "nguoiDung":
        try:
            # 1. Lấy xem ai là chủ của YÊU CẦU THẺ này
            request_res = supabase_client.table("yeucauthe") \
                .select("mabandoc") \
                .eq("mayeucauthe", maYeuCauThe) \
                .single() \
                .execute()

            if not request_res.data:
                raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu thẻ.")

            request_owner_id = request_res.data["mabandoc"]

            # 2. Lấy hồ sơ (maBanDoc) của người đang đăng nhập
            profile_res = supabase_client.table("bandoc") \
                .select("mabandoc") \
                .eq("manguoidung", user_id) \
                .single() \
                .execute()

            if not profile_res.data:
                raise HTTPException(status_code=403, detail="Bạn không có hồ sơ bạn đọc.")

            user_profile_id = profile_res.data["mabandoc"]

            # 3. So sánh
            if request_owner_id == user_profile_id:
                return current_user # OK, là chính chủ

        except Exception as e:
            if isinstance(e, HTTPException): raise e
            logger.warning(f"Lỗi khi kiểm tra get_card_request_owner_or_staff: {e}")
            raise FORBIDDEN_EXCEPTION

    # --- Trường hợp 3: Thất bại ---
    logger.warning(f"Từ chối: User {user_id} cố xem YeuCauThe {maYeuCauThe} mà không có quyền.")
    raise FORBIDDEN_EXCEPTION

# 9. Nghiệp vụ thông báo
def get_notification_owner_or_staff(
    maThongBao: int, # <-- 1. Lấy ID 'ThongBao' từ URL
    current_user: dict = Depends(get_current_user_from_db) # <-- 2. Lấy user
) -> dict:
    """
    Dependency Tầng 2 (Bảo vệ ThongBao - GET ONE / UPDATE):
    Đảm bảo user là Nhân viên HOẶC là chủ của Thông báo.
    """
    user_id = current_user["manguoidung"]
    user_role = current_user.get("vaitro")

    # --- Trường hợp 1: Người dùng là Nhân viên ---
    if user_role == "nhanVien":
        return current_user # OK, là nhân viên

    # --- Trường hợp 2: Người dùng là Bạn đọc (Kiểm tra sở hữu) ---
    if user_role == "nguoiDung":
        try:
            # 1. Lấy xem ai là chủ của THÔNG BÁO này
            notification_res = supabase_client.table("thongbao") \
                .select("mabandoc") \
                .eq("mathongbao", maThongBao) \
                .single() \
                .execute()

            if not notification_res.data:
                raise HTTPException(status_code=404, detail="Không tìm thấy thông báo.")

            notification_owner_id = notification_res.data["mabandoc"]

            # 2. Lấy hồ sơ (maBanDoc) của người đang đăng nhập
            profile_res = supabase_client.table("bandoc") \
                .select("mabandoc") \
                .eq("manguoidung", user_id) \
                .single() \
                .execute()

            if not profile_res.data:
                raise HTTPException(status_code=403, detail="Bạn không có hồ sơ bạn đọc.")

            user_profile_id = profile_res.data["mabandoc"]

            # 3. So sánh
            if notification_owner_id == user_profile_id:
                return current_user # OK, là chính chủ

        except Exception as e:
            if isinstance(e, HTTPException): raise e
            logger.warning(f"Lỗi khi kiểm tra get_notification_owner_or_staff: {e}")
            raise FORBIDDEN_EXCEPTION

    # --- Trường hợp 3: Thất bại ---
    logger.warning(f"Từ chối: User {user_id} cố xem ThongBao {maThongBao} mà không có quyền.")
    raise FORBIDDEN_EXCEPTION

# 10. Nghiệp vụ đặt chỗ ngồi
def get_booking_seat_owner_or_staff(
    maDatCho: int, # <-- 1. Lấy ID từ URL
    current_user: dict = Depends(get_current_user_from_db) # <-- 2. Lấy user
) -> dict:
    """
    Dependency Tầng 2 (Bảo vệ DatChoNgoi):
    Đảm bảo user là Nhân viên HOẶC là chủ của lượt đặt chỗ.
    """
    user_id = current_user["manguoidung"]
    user_role = current_user.get("vaitro")

    # --- Trường hợp 1: Người dùng là Nhân viên ---
    if user_role == "nhanVien":
        return current_user # OK, là nhân viên

    # --- Trường hợp 2: Người dùng là Bạn đọc (Kiểm tra sở hữu) ---
    if user_role == "nguoiDung":
        try:
            # 1. Lấy xem ai là chủ của lượt ĐẶT CHỖ này
            booking_res = supabase_client.table("datchongoi") \
                .select("mabandoc") \
                .eq("madatcho", maDatCho) \
                .single() \
                .execute()

            if not booking_res.data:
                raise HTTPException(status_code=404, detail="Không tìm thấy lượt đặt chỗ.")

            booking_owner_id = booking_res.data["mabandoc"]

            # 2. Lấy hồ sơ (maBanDoc) của người đang đăng nhập
            profile_res = supabase_client.table("bandoc") \
                .select("mabandoc") \
                .eq("manguoidung", user_id) \
                .single() \
                .execute()

            if not profile_res.data:
                raise HTTPException(status_code=403, detail="Bạn không có hồ sơ bạn đọc.")

            user_profile_id = profile_res.data["mabandoc"]

            # 3. So sánh
            if booking_owner_id == user_profile_id:
                return current_user # OK, là chính chủ

        except Exception as e:
            if isinstance(e, HTTPException): raise e
            logger.warning(f"Lỗi khi kiểm tra get_booking_owner_or_staff: {e}")
            raise FORBIDDEN_EXCEPTION

    # --- Trường hợp 3: Thất bại ---
    logger.warning(f"Từ chối: User {user_id} cố xem lượt đặt {maDatCho} mà không có quyền.")
    raise FORBIDDEN_EXCEPTION

# 11. Nghiệp vụ đặt trước
def get_reservation_owner_or_staff(
    maDatTruoc: int, # <-- 1. Lấy ID từ URL
    current_user: dict = Depends(get_current_user_from_db) # <-- 2. Lấy user
) -> dict:
    """
    Dependency Tầng 2 (Bảo vệ DatTruoc):
    Đảm bảo user là Nhân viên HOẶC là chủ của lượt đặt trước.
    """
    user_id = current_user["manguoidung"]
    user_role = current_user.get("vaitro")

    # --- Trường hợp 1: Người dùng là Nhân viên ---
    if user_role == "nhanVien":
        # (Chúng ta tin tưởng Nhân viên đã có hồ sơ hợp lệ)
        return current_user # OK, là nhân viên

    # --- Trường hợp 2: Người dùng là Bạn đọc (Kiểm tra sở hữu) ---
    if user_role == "nguoiDung":
        try:
            # 1. Lấy xem ai là chủ của lượt ĐẶT TRƯỚC này
            reservation_res = supabase_client.table("dattruoc") \
                .select("mabandoc") \
                .eq("madattruoc", maDatTruoc) \
                .single() \
                .execute()

            if not reservation_res.data:
                raise HTTPException(status_code=404, detail="Không tìm thấy lượt đặt trước.")

            reservation_owner_id = reservation_res.data["mabandoc"]

            # 2. Lấy hồ sơ (maBanDoc) của người đang đăng nhập
            profile_res = supabase_client.table("bandoc") \
                .select("mabandoc") \
                .eq("manguoidung", user_id) \
                .single() \
                .execute()

            if not profile_res.data:
                raise HTTPException(status_code=403, detail="Bạn không có hồ sơ bạn đọc.")

            user_profile_id = profile_res.data["mabandoc"]

            # 3. So sánh
            if reservation_owner_id == user_profile_id:
                return current_user # OK, là chính chủ

        except Exception as e:
            if isinstance(e, HTTPException): raise e
            logger.warning(f"Lỗi khi kiểm tra get_reservation_owner_or_staff: {e}")
            raise FORBIDDEN_EXCEPTION

    # --- Trường hợp 3: Thất bại ---
    logger.warning(f"Từ chối: User {user_id} cố xem lượt đặt {maDatTruoc} mà không có quyền.")
    raise FORBIDDEN_EXCEPTION

# 12. Nghiệp vụ vận chuyển
def get_delivery_owner_or_staff(
    maVanChuyen: int, # <-- 1. Lấy ID 'VanChuyen' từ URL
    current_user: dict = Depends(get_current_user_from_db) # <-- 2. Lấy user
) -> dict:
    """
    Dependency Tầng 2 (Bảo vệ VanChuyen - GET ONE):
    Đảm bảo user là Nhân viên HOẶC là chủ của đơn vận chuyển.
    (Kiểm tra 3 cấp: VanChuyen -> YeuCauThe -> BanDoc)
    """
    user_id = current_user["manguoidung"]
    user_role = current_user.get("vaitro")

    # --- Trường hợp 1: Người dùng là Nhân viên ---
    if user_role == "nhanVien":
        return current_user # OK, là nhân viên

    # --- Trường hợp 2: Người dùng là Bạn đọc (Kiểm tra sở hữu) ---
    if user_role == "nguoiDung":
        try:
            # 1. Lấy hồ sơ (maBanDoc) của người đang đăng nhập
            profile_res = supabase_client.table("bandoc") \
                .select("mabandoc") \
                .eq("manguoidung", user_id) \
                .single().execute()

            if not profile_res.data:
                raise HTTPException(status_code=403, detail="Bạn không có hồ sơ bạn đọc.")
            user_profile_id = profile_res.data["mabandoc"]

            # 2. Lấy xem ai là chủ của đơn VẬN CHUYỂN này (JOIN 2 cấp)
            # Cú pháp: vanchuyen!inner(yeucauthe!inner(mabandoc))
            delivery_res = supabase_client.table("vanchuyen") \
                .select("yeucauthe!inner(mabandoc)") \
                .eq("mavanchuyen", maVanChuyen) \
                .single().execute()

            if not delivery_res.data or not delivery_res.data.get("yeucauthe"):
                raise HTTPException(status_code=404, detail="Không tìm thấy đơn vận chuyển hoặc yêu cầu thẻ liên quan.")

            delivery_owner_id = delivery_res.data["yeucauthe"]["mabandoc"]

            # 3. So sánh
            if delivery_owner_id == user_profile_id:
                return current_user # OK, là chính chủ

        except Exception as e:
            if isinstance(e, HTTPException): raise e
            logger.warning(f"Lỗi khi kiểm tra get_delivery_owner_or_staff: {e}")
            raise FORBIDDEN_EXCEPTION

    # --- Trường hợp 3: Thất bại ---
    logger.warning(f"Từ chối: User {user_id} cố xem VanChuyen {maVanChuyen} mà không có quyền.")
    raise FORBIDDEN_EXCEPTION

# 13. Nghiệp vụ yêu cầu giao
def get_delivery_request_owner_or_staff(
    maYeuCauGiao: int, # <-- 1. Lấy ID 'YeuCauGiao' từ URL
    current_user: dict = Depends(get_current_user_from_db) # <-- 2. Lấy user
) -> dict:
    """
    Dependency Tầng 2 (Bảo vệ YeuCauGiao - GET ONE):
    Đảm bảo user là Nhân viên HOẶC là chủ của Yêu cầu giao.
    """
    user_id = current_user["manguoidung"]
    user_role = current_user.get("vaitro")

    # --- Trường hợp 1: Người dùng là Nhân viên ---
    if user_role == "nhanVien":
        return current_user # OK, là nhân viên

    # --- Trường hợp 2: Người dùng là Bạn đọc (Kiểm tra sở hữu) ---
    if user_role == "nguoiDung":
        try:
            # 1. Lấy xem ai là chủ của YÊU CẦU GIAO này
            request_res = supabase_client.table("yeucaugiao") \
                .select("mabandoc") \
                .eq("mayeucaugiao", maYeuCauGiao) \
                .single() \
                .execute()

            if not request_res.data:
                raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu giao.")

            request_owner_id = request_res.data["mabandoc"]

            # 2. Lấy hồ sơ (maBanDoc) của người đang đăng nhập
            profile_res = supabase_client.table("bandoc") \
                .select("mabandoc") \
                .eq("manguoidung", user_id) \
                .single() \
                .execute()

            if not profile_res.data:
                raise HTTPException(status_code=403, detail="Bạn không có hồ sơ bạn đọc.")

            user_profile_id = profile_res.data["mabandoc"]

            # 3. So sánh
            if request_owner_id == user_profile_id:
                return current_user # OK, là chính chủ

        except Exception as e:
            if isinstance(e, HTTPException): raise e
            logger.warning(f"Lỗi khi kiểm tra get_delivery_request_owner_or_staff: {e}")
            raise FORBIDDEN_EXCEPTION

    # --- Trường hợp 3: Thất bại ---
    logger.warning(f"Từ chối: User {user_id} cố xem YeuCauGiao {maYeuCauGiao} mà không có quyền.")
    raise FORBIDDEN_EXCEPTION

# 14. Nghiệp vụ gia hạn
def get_renewal_owner_or_staff(
    # Tham số này sẽ được điền bởi API gọi nó
    maGiaHan: int,
    current_user: dict = Depends(get_current_user_from_db)
) -> dict:
    """
    Dependency (Bảo vệ GiaHan - GET ONE):
    Đảm bảo user là Nhân viên HOẶC là chủ của lượt gia hạn.
    """
    user_id = current_user["manguoidung"]
    user_role = current_user.get("vaitro")

    if user_role == "nhanVien":
        return current_user # OK, là nhân viên

    if user_role == "nguoiDung":
        try:
            # 1. Lấy hồ sơ (maBanDoc) của người đang đăng nhập
            profile_res = supabase_client.table("bandoc") \
                .select("mabandoc") \
                .eq("manguoidung", user_id) \
                .single().execute()

            if not profile_res.data:
                raise HTTPException(status_code=403, detail="Bạn không có hồ sơ bạn đọc.")
            user_profile_id = profile_res.data["mabandoc"]

            # 2. Lấy xem ai là chủ của lượt GIA HẠN này (kiểm tra 2 cấp)
            renewal_res = supabase_client.table("giahan") \
                .select("muontra(mabandoc)") \
                .eq("magiahan", maGiaHan) \
                .single().execute()

            if not renewal_res.data or not renewal_res.data.get("muontra"):
                raise HTTPException(status_code=404, detail="Không tìm thấy lượt gia hạn hoặc lượt mượn liên quan.")

            renewal_owner_id = renewal_res.data["muontra"]["mabandoc"]

            # 3. So sánh
            if renewal_owner_id == user_profile_id:
                return current_user # OK, là chính chủ

        except Exception as e:
            if isinstance(e, HTTPException): raise e
            logger.warning(f"Lỗi khi kiểm tra get_renewal_owner_or_staff: {e}")
            raise FORBIDDEN_EXCEPTION

    raise FORBIDDEN_EXCEPTION

# 15. Nghiệp vụ mượn trả
def get_loan_owner_or_staff(
    # Tham số này sẽ được điền bởi API gọi nó
    maMuonTra: int,
    current_user: dict = Depends(get_current_user_from_db)
) -> dict:
    """
    Dependency (Bảo vệ GiaHan - GET BY MUONTRA):
    Đảm bảo user là Nhân viên HOẶC là chủ của lượt mượn.
    """
    user_id = current_user["manguoidung"]
    user_role = current_user.get("vaitro")

    if user_role == "nhanVien":
        return current_user # OK, là nhân viên

    if user_role == "nguoiDung":
        try:
            # 1. Lấy hồ sơ (maBanDoc) của người đang đăng nhập
            profile_res = supabase_client.table("bandoc") \
                .select("mabandoc") \
                .eq("manguoidung", user_id) \
                .single().execute()

            if not profile_res.data:
                raise HTTPException(status_code=403, detail="Bạn không có hồ sơ bạn đọc.")
            user_profile_id = profile_res.data["mabandoc"]

            # 2. Lấy xem ai là chủ của lượt MƯỢN này
            loan_res = supabase_client.table("muontra") \
                .select("mabandoc") \
                .eq("mamuontra", maMuonTra) \
                .single().execute()

            if not loan_res.data:
                raise HTTPException(status_code=404, detail="Không tìm thấy lượt mượn.")

            loan_owner_id = loan_res.data["mabandoc"]

            # 3. So sánh
            if loan_owner_id == user_profile_id:
                return current_user # OK, là chính chủ

        except Exception as e:
            if isinstance(e, HTTPException): raise e
            logger.warning(f"Lỗi khi kiểm tra get_loan_owner_or_staff: {e}")
            raise FORBIDDEN_EXCEPTION

    raise FORBIDDEN_EXCEPTION

# (Chúng ta có thể giữ lại hàm cũ nếu muốn có 1 dependency
#  chỉ kiểm tra token, không cần hit CSDL, nhưng Tầng 1 mới an toàn hơn)
def get_current_user_payload(token: str = Depends(oauth2_scheme)) -> dict:
    """Dependency Tầng 0: Chỉ giải mã token, không kiểm tra CSDL (Nhanh)."""
    payload = decode_access_token(token)
    if payload is None:
        raise CREDENTIALS_EXCEPTION
    return payload