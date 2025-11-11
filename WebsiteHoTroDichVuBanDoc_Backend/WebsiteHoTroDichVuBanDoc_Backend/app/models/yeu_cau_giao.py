from typing import Optional, Dict, Any
from datetime import datetime
from decimal import Decimal
from app.models.db_base import DBModel

class YeuCauGiaoBase(DBModel):
    maBanDoc: int
    maMuonTra: int
    hinhThucYeuCau: str
    diaChi: str
    maPhuongXa: int
    soDienThoai: Optional[str] = None
    maNhanVien: Optional[int] = None
    trangThai: str = 'daYeuCau'
    thoiGianCoTheNhanHang: Optional[datetime] = None
    thoiGianNhanHangThucTe: Optional[datetime] = None
    lePhi: Optional[Decimal] = None
    thongTinBoSung: Optional[Dict[str, Any]] = None
    ghiChu: Optional[str] = None

class YeuCauGiaoCreate(YeuCauGiaoBase):
    pass

class YeuCauGiaoUpdate(DBModel):
    maNhanVien: Optional[int] = None
    trangThai: Optional[str] = None
    thoiGianCoTheNhanHang: Optional[datetime] = None
    thoiGianNhanHangThucTe: Optional[datetime] = None
    lePhi: Optional[Decimal] = None
    ghiChu: Optional[str] = None

class YeuCauGiao(YeuCauGiaoBase):
    maYeuCauGiao: int
    thoiGianYeuCau: Optional[datetime] = None