from typing import Optional
from datetime import datetime
from app.models.db_base import DBModel

class TacPhamBase(DBModel):
    tenTacPham: str
    tacGia: Optional[str] = None
    moTa: Optional[str] = None
    isbn: Optional[str] = None
    namXuatBan: Optional[int] = None

class TacPhamCreate(TacPhamBase):
    pass

class TacPhamUpdate(DBModel):
    tenTacPham: Optional[str] = None
    tacGia: Optional[str] = None
    moTa: Optional[str] = None
    isbn: Optional[str] = None
    namXuatBan: Optional[int] = None

class TacPham(TacPhamBase):
    maTacPham: int
    ngayTao: Optional[datetime] = None