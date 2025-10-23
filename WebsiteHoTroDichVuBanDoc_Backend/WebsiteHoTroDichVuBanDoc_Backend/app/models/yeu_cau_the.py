from typing import Optional, Dict, Any
from datetime import datetime
from decimal import Decimal
from app.models.db_base import DBModel

class YeuCauTheBase(DBModel):
    maBanDoc: int
    maLoaiThe: int
    hinhThucYeuCau: Optional[str] = None
    thongTinBoSung: Optional[Dict[str, Any]] = None
    lePhi: Optional[Decimal] = 0
    trangThaiQuyTrinh: str = 'daYeuCau'
    maNhanVien: Optional[int] = None
    thoiGianXuLy: Optional[datetime] = None
    noiNhanThe: Optional[str] = None
    maPhuongXa: Optional[int] = None
    thoiGianDuKien: Optional[datetime] = None
    ghiChu: Optional[str] = None

class YeuCauTheCreate(YeuCauTheBase):
    pass

class YeuCauTheUpdate(DBModel):
    # Chỉ cập nhật các trường logic
    trangThaiQuyTrinh: Optional[str] = None
    maNhanVien: Optional[int] = None
    thoiGianXuLy: Optional[datetime] = None
    thoiGianDuKien: Optional[datetime] = None
    ghiChu: Optional[str] = None

class YeuCauThe(YeuCauTheBase):
    maYeuCauThe: int
    thoiGianBatDau: Optional[datetime] = None