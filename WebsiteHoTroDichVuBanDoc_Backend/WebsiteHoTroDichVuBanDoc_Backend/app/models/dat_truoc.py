from typing import Optional
from datetime import datetime
from app.models.db_base import DBModel

class DatTruocBase(DBModel):
    maBanSao: int
    maBanDoc: int
    trangThaiDatTruoc: str = 'kichHoat'
    hinhThucThongBao: Optional[str] = None
    thoiDiemHoanThanh: Optional[datetime] = None
    ghiChu: Optional[str] = None

class DatTruocCreate(DatTruocBase):
    pass

class DatTruocUpdate(DBModel):
    trangThaiDatTruoc: Optional[str] = None
    thoiDiemHoanThanh: Optional[datetime] = None
    ghiChu: Optional[str] = None

class DatTruoc(DatTruocBase):
    maDatTruoc: int
    thoiDiemDatTruoc: Optional[datetime] = None