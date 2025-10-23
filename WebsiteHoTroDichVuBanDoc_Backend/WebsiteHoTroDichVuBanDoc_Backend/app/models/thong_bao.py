from typing import Optional, Dict, Any
from datetime import datetime
from app.models.db_base import DBModel

class ThongBaoBase(DBModel):
    maBanDoc: int
    hinhThuc: Optional[str] = None
    tieuDe: Optional[str] = None
    noiDung: Optional[str] = None
    duLieuGoc: Optional[Dict[str, Any]] = None
    thoiGianGui: Optional[datetime] = None
    trangThai: Optional[str] = None
    thamChieu: Optional[str] = None
    soLanGui: int = 0

class ThongBaoCreate(ThongBaoBase):
    pass

class ThongBaoUpdate(DBModel):
    trangThai: Optional[str] = None
    soLanGui: Optional[int] = None

class ThongBao(ThongBaoBase):
    maThongBao: int