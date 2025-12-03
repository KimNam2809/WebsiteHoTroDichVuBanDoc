from pydantic import EmailStr
from typing import Optional
from datetime import date, datetime
from app.models.db_base import DBModel
from app.models.yeu_cau_the import LatestRequestInfo

class NguoiDungBase(DBModel):
    tenDangNhap: str
    email: Optional[EmailStr] = None
    soDienThoai: Optional[str] = None
    vaiTro: str = 'nguoiDung'
    trangThai: bool = True

class NguoiDungCreate(NguoiDungBase):
    matKhau: str # Mật khẩu là bắt buộc khi tạo

class NguoiDungUpdate(DBModel):
    email: Optional[EmailStr] = None
    soDienThoai: Optional[str] = None
    matKhau: Optional[str] = None
    vaiTro: Optional[str] = None
    trangThai: Optional[bool] = None

class NguoiDung(NguoiDungBase):
    maNguoiDung: int
    ngayTao: Optional[datetime] = None

class UserProfileResponse(DBModel):
    # Thông tin chung
    hoten: str
    email: str
    vaitro: str

    # ID ĐỊNH DANH QUAN TRỌNG CHO FRONTEND
    maBanDoc: Optional[int] = None   # Dành cho Bạn đọc (để gửi API mượn trả/đặt chỗ)
    maNhanVien: Optional[int] = None # Dành cho Nhân viên (để gửi API quản lý)

    # Thông tin Bạn Đọc (Optional - chỉ có nếu là Bạn đọc)
    sothe: Optional[str] = None
    tenthe: Optional[str] = None
    ngayhethan: Optional[date] = None
    trangthaithe: Optional[str] = None
    tailieumuontoida: Optional[int] = 0

    # Thông tin Nhân Viên (Optional - chỉ có nếu là Nhân viên)
    manhanviennoibo: Optional[str] = None
    phongban: Optional[str] = None
    chucvu: Optional[str] = None
    ngaytuyendung: Optional[date] = None

    # Thông tin yêu cầu thẻ mới nhất (để Frontend xử lý UI chờ duyệt/popup)
    yeu_cau_moi_nhat: Optional[LatestRequestInfo] = None

