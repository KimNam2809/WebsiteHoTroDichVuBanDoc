from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from app.connect.config import settings

pwd_context = CryptContext(schemes=["argon2", "bcrypt"], deprecated="auto")
# (Giữ "bcrypt" để sau này nếu có mật khẩu cũ vẫn verify được)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    So sánh mật khẩu trần với mật khẩu đã băm trong DB.
    """
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Băm một mật khẩu trần.
    """
    # Nó sẽ tự động dùng scheme đầu tiên ("argon2") để băm
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Tạo ra một JWT (Access Token) mới.
    """
    to_encode = data.copy()

    # Đặt thời gian hết hạn
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # Mặc định cho hết hạn sau 30 phút
        expire = datetime.utcnow() + timedelta(minutes=30)

    to_encode.update({"exp": expire})

    # Mã hóa token
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt

def decode_access_token(token: str):
    """
    Giải mã một JWT (Access Token).
    (Chúng ta sẽ dùng cái này sau để bảo vệ API)
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        # Lấy 'sub' (subject, thường là username hoặc id)
        username: str = payload.get("sub")
        if username is None:
            return None # Hoặc raise lỗi
        return payload
    except JWTError:
        return None # Hoặc raise lỗi