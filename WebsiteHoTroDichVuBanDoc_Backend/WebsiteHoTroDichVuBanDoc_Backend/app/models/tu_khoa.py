from typing import Optional
from app.models.db_base import DBModel

class TuKhoaBase(DBModel):
    tenTuKhoa: str
    maTuKhoaCha: Optional[int] = None

class TuKhoaCreate(TuKhoaBase):
    pass

class TuKhoaUpdate(DBModel):
    tenTuKhoa: Optional[str] = None
    maTuKhoaCha: Optional[int] = None

class TuKhoa(TuKhoaBase):
    maTuKhoa: int