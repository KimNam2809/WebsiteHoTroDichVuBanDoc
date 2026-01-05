from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.db_base import DBModel

class BaiVietBase(DBModel):
    maNhanVien: Optional[int] = None
    tieuDe: str
    noiDung: str
    anhDaiDien: Optional[Dict[str, Any]] = None  # Chứa URL ảnh và thông tin liên quan
    trangThai: bool = True
    tuKhoa: Optional[List[str]] = None
    ghiChu: Optional[str] = None

class BaiVietUpdate(DBModel):
    tieuDe: Optional[str] = None
    noiDung: Optional[str] = None
    anhDaiDien: Optional[Dict[str, Any]] = None
    trangThai: Optional[bool] = None
    tuKhoa: Optional[List[str]] = None
    ghiChu: Optional[str] = None

class BaiViet(BaiVietBase):
    maBaiViet: int
    ngayDang: Optional[datetime] = None
    ngayCapNhat: Optional[datetime] = None
    soLuotXem: int = 0
    soLuotChiaSe: int = 0

class AnhChiTiet(DBModel):
    url: str
    chu_thich: Optional[str] = ""

class BaiVietCreate(DBModel):
    tieude: str
    noidung: str # HTML đã chứa link ảnh thật
    tukhoa: List[str] = [] # Frontend gửi mảng string ["tag1", "tag2"]
    ghichu: Optional[str] = None
    trangthai: bool = True
    # Danh sách ảnh để lưu vào cột jsonb anhdaidien
    danh_sach_anh: List[AnhChiTiet]