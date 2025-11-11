from typing import Optional
from datetime import datetime, date
from decimal import Decimal
from app.models.db_base import DBModel

class MuonTraBase(DBModel):
    maBanSao: int
    maBanDoc: int
    maNhanVien: int # Nhân viên thực hiện cho mượn
    ngayTra: date # Ngày hẹn trả
    trangThaiMuon: str = 'daMuon'
    soLanGiaHan: int = 0
    soLanGiaHanToiDa: int = 2
    tienPhat: Optional[Decimal] = 0
    ghiChu: Optional[str] = None

class MuonTraCreate(MuonTraBase):
    # Khi tạo mới, chỉ cần các thông tin cơ bản
    # ngayTraThucTe sẽ là None
    pass

class MuonTraUpdate(DBModel):
    # Dùng khi trả sách hoặc cập nhật
    maNhanVien: Optional[int] = None # Nhân viên nhận sách trả
    ngayTraThucTe: Optional[datetime] = None
    trangThaiMuon: Optional[str] = None
    tienPhat: Optional[Decimal] = None
    ghiChu: Optional[str] = None

class MuonTra(MuonTraBase):
    maMuonTra: int
    thoiGianMuon: Optional[datetime] = None
    ngayTraThucTe: Optional[datetime] = None

class MuonTraTraSach(DBModel):
    maNhanVien: int # Nhân viên nhận sách trả