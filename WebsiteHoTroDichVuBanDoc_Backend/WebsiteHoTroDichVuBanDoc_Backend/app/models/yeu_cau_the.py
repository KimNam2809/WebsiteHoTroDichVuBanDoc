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

class LatestRequestInfo(DBModel):
    """Thông tin về yêu cầu thẻ mới nhất để hiển thị trạng thái."""
    ma_yeu_cau: int
    trang_thai: str  # 'choDuyet', 'daDuyet', 'tuChoi', 'dangXuLy'
    ten_loai_the: str
    ngay_yeu_cau: datetime
    ly_do_tu_choi: Optional[str] = None

class TraCuuRequest(DBModel):
    keyword: str # CCCD hoặc SĐT

class TraCuuYeuCauResponse(DBModel):
    ma_yeu_cau: Optional[int] = None # Có thể null nếu đây là Thẻ chính thức (không phải yêu cầu)
    ho_ten: str
    cccd: str
    sdt: Optional[str] = None
    ten_loai_the: str
    ngay_dang_ky: Optional[datetime] = None
    trang_thai: str       # 'choDuyet', 'daDuyet', 'tuChoi', 'THE_DANG_HOAT_DONG'
    ly_do_tu_choi: Optional[str] = None
    sothe: Optional[str] = None # [Mới] Hiển thị số thẻ nếu đã có
    anh_the_url: Optional[str] = None