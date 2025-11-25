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

class YeuCauTheAdminView(DBModel):
    ma_ho_so: int
    ho_ten: str
    loai_the: str
    ngay_dang_ky: datetime
    trang_thai: str
    anh_the_url: Optional[str] = None
    email: Optional[str] = None
    sdt: Optional[str] = None

# Model body để duyệt thẻ
class DuyetTheRequest(DBModel):
    trang_thai: str # 'daDuyet' hoặc 'tuChoi'
    ly_do: Optional[str] = None

# Model mới cho chi tiết (Response)
class YeuCauTheDetailResponse(DBModel):
    mayeucauthe: int
    thoigianbatdau: datetime
    tenloaithe: str
    thongtinbosung: Dict[str, Any]
    lephi: Optional[float] = 0
    trangthaiquytrinh: str