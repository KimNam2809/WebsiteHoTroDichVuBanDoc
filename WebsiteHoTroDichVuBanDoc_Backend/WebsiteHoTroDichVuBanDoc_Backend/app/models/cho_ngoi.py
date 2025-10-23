from typing import Optional
from app.models.db_base import DBModel

class ChoNgoiBase(DBModel):
    maPhong: int
    tenChoNgoi: Optional[str] = None
    loaiChoNgoi: Optional[str] = None
    trangThai: str = 'coSan'
    choNgoiTrucTiep: bool = False
    ghiChu: Optional[str] = None

class ChoNgoiCreate(ChoNgoiBase):
    pass

class ChoNgoiUpdate(DBModel):
    tenChoNgoi: Optional[str] = None
    loaiChoNgoi: Optional[str] = None
    trangThai: Optional[str] = None
    choNgoiTrucTiep: Optional[bool] = None
    ghiChu: Optional[str] = None

class ChoNgoi(ChoNgoiBase):
    maChoNgoi: int