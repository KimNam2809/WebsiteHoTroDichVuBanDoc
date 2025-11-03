from typing import Optional
from datetime import datetime
from app.models.db_base import DBModel

class DatChoNgoiBase(DBModel):
    maChoNgoi: int
    maBanDoc: int
    maNhanVien: Optional[int] = None # Nhân viên xác nhận (nếu cần)
    thoiGianBatDau: datetime
    thoiGianKetThuc: datetime
    trangThaiDatCho: str = 'kichHoat'
    thoiDiemHuy: Optional[datetime] = None
    nhanVienHuy: Optional[int] = None

class DatChoNgoiCreate(DBModel):
    # Khi user tạo, chỉ cần
    maChoNgoi: int
    maBanDoc: int
    thoiGianBatDau: datetime
    thoiGianKetThuc: datetime

class DatChoNgoiUpdate(DBModel):
    # Dùng để hủy
    trangThaiDatCho: Optional[str] = None
    thoiDiemHuy: Optional[datetime] = None
    nhanVienHuy: Optional[int] = None

class DatChoNgoi(DatChoNgoiBase):
    maDatCho: int
    ngayKhoiTao: Optional[datetime] = None

class DatChoNgoiCheckIn(DBModel):
    """
    Model input cho hành động "check-in" tại quầy.
    Chỉ cần biết nhân viên nào xử lý.
    """
    maNhanVien: int