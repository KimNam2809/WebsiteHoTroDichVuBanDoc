from passlib.context import CryptContext

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