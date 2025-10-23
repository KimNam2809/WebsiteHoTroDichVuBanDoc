from typing import Optional, Dict, Any
from datetime import datetime, date
from app.models.db_base import DBModel

class TheBanDocBase(DBModel):
    maBanDoc: int
    maLoaiThe: int
    soThe: str
    maNhanVien: int
    ngayHetHan: Optional[date] = None
    phuongThucVanChuyen: Optional[str] = None
    maVanChuyen: Optional[int] = None
    trangThaiThe: bool = True
    thongTinBoSung: Optional[Dict[str, Any]] = None

class TheBanDocCreate(TheBanDocBase):
    pass

class TheBanDocUpdate(DBModel):
    ngayHetHan: Optional[date] = None
    trangThaiThe: Optional[bool] = None
    thongTinBoSung: Optional[Dict[str, Any]] = None

class TheBanDoc(TheBanDocBase):
    maThe: int
    ngayPhatHanh: Optional[datetime] = None