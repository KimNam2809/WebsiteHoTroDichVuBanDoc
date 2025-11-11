from typing import Optional
from datetime import datetime, date
from app.models.db_base import DBModel

class BanSaoBase(DBModel):
    maTacPham: int
    maBanSaoNoiBo: Optional[str] = None
    viTri: Optional[str] = None
    viTriKeNgan: Optional[str] = None
    dinhDangBanSao: Optional[str] = None
    ngayMua: Optional[date] = None
    trangThaiVatLy: Optional[str] = None
    trangThaiChoMuon: bool = True

class BanSaoCreate(BanSaoBase):
    pass

class BanSaoUpdate(DBModel):
    maBanSaoNoiBo: Optional[str] = None
    viTri: Optional[str] = None
    viTriKeNgan: Optional[str] = None
    dinhDangBanSao: Optional[str] = None
    ngayMua: Optional[date] = None
    trangThaiVatLy: Optional[str] = None
    trangThaiChoMuon: Optional[bool] = None

class BanSao(BanSaoBase):
    maBanSao: int
    ngayNhap: Optional[datetime] = None