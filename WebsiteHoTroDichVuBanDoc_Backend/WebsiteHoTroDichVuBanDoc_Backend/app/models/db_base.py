from pydantic import BaseModel

def to_lowercase(s: str) -> str:
    """Chuyển đổi một chuỗi camelCase thành lowercase."""
    return s.lower()

class DBModel(BaseModel):
    """
    Model cơ sở (cha) để tự động xử lý alias
    giữa camelCase (Python) và lowercase (Database).
    """
    class Config:
        from_attributes = True
        # Cho phép Pydantic đọc dữ liệu bằng cả tên trường
        # (vd: tenTacPham) hoặc alias (vd: tentacpham)
        populate_by_name = True
        # Tự động tạo alias bằng cách gọi hàm to_lowercase
        # cho mọi tên trường.
        alias_generator = to_lowercase