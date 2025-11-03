from typing import Optional
from datetime import datetime
from app.models.db_base import DBModel

class DatPhongBase(DBModel):
    maPhong: int
    nguoiToChuc: str
    soDienThoai: str
    thoiGianBatDau: datetime
    thoiGianKetThuc: datetime
    mucDichSuDung: Optional[str] = None
    soNguoiThamDuDuKien: int = 0
    trangThai: str = 'kichHoat'
    maNhanVien: Optional[int] = None # Nhân viên duyệt

class DatPhongCreate(DatPhongBase):
    pass

class DatPhongUpdate(DBModel):
    trangThai: Optional[str] = None
    maNhanVien: Optional[int] = None

class DatPhong(DatPhongBase):
    maDatPhong: int
    ngayKhoiTao: Optional[datetime] = None

class DatPhongDuyet(DBModel):
    """Model input cho hành động duyệt phòng."""
    maNhanVien: int