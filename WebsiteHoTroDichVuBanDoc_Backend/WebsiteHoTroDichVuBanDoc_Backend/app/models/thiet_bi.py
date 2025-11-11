from typing import Optional, Dict, Any
from datetime import date
from app.models.db_base import DBModel

class ThietBiBase(DBModel):
    maThietBiNoiBo: Optional[str] = None
    tenThietBi: Optional[str] = None
    loaiThietBi: Optional[str] = None
    maPhong: Optional[int] = None
    ngayMua: Optional[date] = None
    hanBaoHanh: Optional[date] = None
    trangThai: Optional[str] = None
    thongTinBoSung: Optional[Dict[str, Any]] = None
    ghiChu: Optional[str] = None

class ThietBiCreate(ThietBiBase):
    pass

class ThietBiUpdate(DBModel):
    pass # Hầu hết các trường đều có thể update

class ThietBi(ThietBiBase):
    maThietBi: int