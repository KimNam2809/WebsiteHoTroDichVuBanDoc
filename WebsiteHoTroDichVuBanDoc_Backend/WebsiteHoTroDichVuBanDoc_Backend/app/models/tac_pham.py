from typing import List, Optional
from datetime import datetime
from app.models.db_base import DBModel

class TacPhamBase(DBModel):
    tenTacPham: str
    tacGia: Optional[str] = None
    moTa: Optional[str] = None
    isbn: Optional[str] = None
    namXuatBan: Optional[int] = None
    anhBia: Optional[str] = None # Chứa URL ảnh

class TacPhamCreate(TacPhamBase):
    pass

class TacPhamUpdate(DBModel):
    tenTacPham: Optional[str] = None
    tacGia: Optional[str] = None
    moTa: Optional[str] = None
    isbn: Optional[str] = None
    namXuatBan: Optional[int] = None
    anhBia: Optional[str] = None

class TacPham(TacPhamBase):
    maTacPham: int
    ngayTao: Optional[datetime] = None

class TimKiemTacPham(DBModel):
    data: List[TacPham]
    total: int
    page: int
    limit: int
    total_pages: int

# ==========================================
# MÔ HÌNH TÌM KIẾM SÁCH VỚI VECTOR (Dùng cho AI Chatbot)
# Dữ liệu người dùng gửi lên
class SearchRequest(DBModel):
    query: str
    threshold: float = 0.5  # Độ chính xác mong muốn (0.5 là mức trung bình khá)
    limit: int = 5          # Số lượng sách trả về

# Dữ liệu trả về cho Frontend
class BookSearchResult(DBModel):
    matacpham: int
    tentacpham: str
    tacgia: Optional[str] = None
    mota: Optional[str] = None
    similarity: float       # Điểm tương đồng (VD: 0.89 = 89% giống)