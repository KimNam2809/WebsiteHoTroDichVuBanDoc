from typing import Optional
from datetime import datetime
from decimal import Decimal
from app.models.db_base import DBModel

class VanChuyenBase(DBModel):
    maYeuCauThe: int
    donViVanChuyen: Optional[str] = None
    maTheoDoi: Optional[str] = None
    nguoiGui: Optional[str] = None
    nguoiNhan: Optional[str] = None
    diaChiNhan: Optional[str] = None
    maPhuongXa: Optional[int] = None
    soDienThoaiNhanHang: Optional[str] = None
    trangThai: str = 'dangChuanBi'
    thoiGianGiaoHang: Optional[datetime] = None
    thoiGianGiaoHangThanhCong: Optional[datetime] = None
    chiPhiVanChuyen: Optional[Decimal] = None
    ghiChu: Optional[str] = None

class VanChuyenCreate(VanChuyenBase):
    pass

class VanChuyenUpdate(DBModel):
    donViVanChuyen: Optional[str] = None
    maTheoDoi: Optional[str] = None
    trangThai: Optional[str] = None
    thoiGianGiaoHang: Optional[datetime] = None
    thoiGianGiaoHangThanhCong: Optional[datetime] = None
    chiPhiVanChuyen: Optional[Decimal] = None
    ghiChu: Optional[str] = None

class VanChuyen(VanChuyenBase):
    maVanChuyen: int