from typing import Optional
from datetime import datetime, date
from app.models.db_base import DBModel

class GiaHanBase(DBModel):
    maMuonTra: int
    maNhanVien: int
    ngayTraMoi: date
    lyDoGiaHan: Optional[str] = None

class GiaHanCreate(GiaHanBase):
    pass

class GiaHanUpdate(DBModel):
    ngayTraMoi: Optional[date] = None
    lyDoGiaHan: Optional[str] = None

class GiaHan(GiaHanBase):
    maGiaHan: int
    thoiDiemGiaHan: Optional[datetime] = None