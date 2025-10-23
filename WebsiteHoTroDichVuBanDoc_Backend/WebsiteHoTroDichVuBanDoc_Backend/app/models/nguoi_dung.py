from pydantic import EmailStr
from typing import Optional
from datetime import datetime
from app.models.db_base import DBModel

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