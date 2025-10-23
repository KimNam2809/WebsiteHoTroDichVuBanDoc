from typing import Optional
from app.models.db_base import DBModel

class DanhMucBase(DBModel):
    tenDanhMuc: str
    maDanhMucCha: Optional[int] = None

class DanhMucCreate(DanhMucBase):
    pass

class DanhMucUpdate(DBModel):
    tenDanhMuc: Optional[str] = None
    maDanhMucCha: Optional[int] = None

class DanhMuc(DanhMucBase):
    maDanhMuc: int