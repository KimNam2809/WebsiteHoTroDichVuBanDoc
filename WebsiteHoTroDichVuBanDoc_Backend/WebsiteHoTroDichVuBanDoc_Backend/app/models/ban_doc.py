from typing import Optional, Dict, Any
from datetime import datetime, date
from app.models.db_base import DBModel

class BanDocBase(DBModel):
    maNguoiDung: int
    hoTen: str
    ngaySinh: date
    gioiTinh: str
    cccd: str
    diaChi: str
    maPhuongXa: int
    ngheNghiep: Optional[str] = None
    thongTinBoSung: Optional[Dict[str, Any]] = None

class BanDocCreate(BanDocBase):
    pass

class BanDocUpdate(DBModel):
    hoTen: Optional[str] = None
    ngaySinh: Optional[date] = None
    gioiTinh: Optional[str] = None
    cccd: Optional[str] = None
    diaChi: Optional[str] = None
    maPhuongXa: Optional[int] = None
    ngheNghiep: Optional[str] = None
    thongTinBoSung: Optional[Dict[str, Any]] = None

class BanDoc(BanDocBase):
    maBanDoc: int
    ngayDangKy: Optional[datetime] = None