from typing import Optional
from datetime import date
from app.models.db_base import DBModel

class NhanVienBase(DBModel):
    maNguoiDung: int
    hoTen: str
    maNhanVienNoiBo: Optional[str] = None
    phongBan: Optional[str] = None
    chucVu: Optional[str] = None
    ngayTuyenDung: Optional[date] = None
    diaChi: Optional[str] = None
    maPhuongXa: int
    ghiChu: Optional[str] = None

class NhanVienCreate(NhanVienBase):
    pass

class NhanVienUpdate(DBModel):
    hoTen: Optional[str] = None
    maNhanVienNoiBo: Optional[str] = None
    phongBan: Optional[str] = None
    chucVu: Optional[str] = None
    ngayTuyenDung: Optional[date] = None
    diaChi: Optional[str] = None
    maPhuongXa: Optional[int] = None
    ghiChu: Optional[str] = None

class NhanVien(NhanVienBase):
    maNhanVien: int