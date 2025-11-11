from typing import Optional, List
from datetime import datetime
from app.models.db_base import DBModel

class BaiVietBase(DBModel):
    maNhanVien: Optional[int] = None
    tieuDe: str
    noiDung: str
    anhDaiDien: Optional[str] = None
    trangThai: bool = True
    tuKhoa: Optional[List[str]] = None
    ghiChu: Optional[str] = None

class BaiVietCreate(BaiVietBase):
    pass

class BaiVietUpdate(DBModel):
    tieuDe: Optional[str] = None
    noiDung: Optional[str] = None
    anhDaiDien: Optional[str] = None
    trangThai: Optional[bool] = None
    tuKhoa: Optional[List[str]] = None
    ghiChu: Optional[str] = None

class BaiViet(BaiVietBase):
    maBaiViet: int
    ngayDang: Optional[datetime] = None
    ngayCapNhat: Optional[datetime] = None
    soLuotXem: int = 0
    soLuotChiaSe: int = 0