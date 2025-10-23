from typing import Optional, Dict, Any
from app.models.db_base import DBModel

class PhongBase(DBModel):
    tenPhong: str
    loaiPhong: Optional[str] = None
    sucChua: Optional[int] = None
    viTri: Optional[str] = None
    trangThai: str = 'moCua'
    thongTinThietBiTaiPhong: Optional[Dict[str, Any]] = None
    ghiChu: Optional[str] = None

class PhongCreate(PhongBase):
    pass

class PhongUpdate(DBModel):
    tenPhong: Optional[str] = None
    loaiPhong: Optional[str] = None
    sucChua: Optional[int] = None
    viTri: Optional[str] = None
    trangThai: Optional[str] = None
    thongTinThietBiTaiPhong: Optional[Dict[str, Any]] = None
    ghiChu: Optional[str] = None

class Phong(PhongBase):
    maPhong: int