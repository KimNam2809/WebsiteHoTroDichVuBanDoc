from decimal import Decimal
from typing import Optional
from app.models.db_base import DBModel

class LoaiTheBase(DBModel):
    tenThe: str
    moTa: Optional[str] = None
    taiLieuMuonToiDa: int = 3
    soNgayMuonMacDinh: int = 14
    lePhi: Optional[Decimal] = 0

class LoaiTheCreate(LoaiTheBase):
    pass

class LoaiTheUpdate(DBModel):
    tenThe: Optional[str] = None
    moTa: Optional[str] = None
    taiLieuMuonToiDa: Optional[int] = None
    soNgayMuonMacDinh: Optional[int] = None
    lePhi: Optional[Decimal] = None

class LoaiThe(LoaiTheBase):
    maLoaiThe: int