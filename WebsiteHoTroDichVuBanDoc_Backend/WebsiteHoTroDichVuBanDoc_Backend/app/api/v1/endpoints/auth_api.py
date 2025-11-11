from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.connect.db import supabase_client
from app.connect.security import verify_password, create_access_token
import logging, ast
from datetime import timedelta

router = APIRouter()
logger = logging.getLogger(__name__)

# ĐỊNH NGHĨA THỜI GIAN HẾT HẠN CỦA TOKEN
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 ngày

@router.post(
    "/login",
    summary="Đăng nhập và nhận JWT Token"
)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    API Đăng nhập.

    Sử dụng form-data (không phải JSON) với 2 key:
    - username: (Có thể là tenDangNhap hoặc email)
    - password: (Mật khẩu)

    Trả về Access Token nếu thành công.
    """
    try:
        # Bước 1: Tìm người dùng
        # Cho phép đăng nhập bằng tenDangNhap HOẶC email
        response = supabase_client.table("nguoidung") \
            .select("*") \
            .or_(f"tendangnhap.eq.{form_data.username},email.eq.{form_data.username}") \
            .single() \
            .execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Tên đăng nhập hoặc mật khẩu không chính xác",
            )

        user = response.data

        # Bước 2: Kiểm tra mật khẩu
        if not verify_password(form_data.password, user["matkhau"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Tên đăng nhập hoặc mật khẩu không chính xác",
            )

        # Bước 3: Kiểm tra trạng thái (nếu có)
        # (Sau này khi làm Đăng ký, chúng ta sẽ set 'trangThai'
        # if user["trangthai"] != 'daXacMinh':
        #     raise HTTPException(
        #         status_code=status.HTTP_400_BAD_REQUEST,
        #         detail="Tài khoản chưa được kích hoạt."
        #     )

        # Bước 4: Tạo JWT
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

        # Dữ liệu payload của JWT
        token_data = {
            "sub": user["tendangnhap"], # Subject (chủ thể) của token
            "vaiTro": user["vaitro"],   # Vai trò (theo yêu cầu của bạn)
            "id": user["manguoidung"]  # ID người dùng
        }

        access_token = create_access_token(
            data=token_data,
            expires_delta=access_token_expires
        )

        # Bước 5: Trả về token
        return {"access_token": access_token, "token_type": "bearer"}

    except Exception as e:
        logger.error(f"Lỗi khi đăng nhập: {e}")
        # Bắt lỗi từ .single() nếu không tìm thấy
        if "single()" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Tên đăng nhập hoặc mật khẩu không chính xác",
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lỗi máy chủ nội bộ"
        )