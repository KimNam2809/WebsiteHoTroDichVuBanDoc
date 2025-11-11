from typing import Optional
from app.models.db_base import DBModel

class PhuongXaBase(DBModel):
    tenPhuongXa: str
    maTinhThanhPho: int

class PhuongXaCreate(PhuongXaBase):
    pass

class PhuongXaUpdate(DBModel):
    tenPhuongXa: Optional[str] = None
    maTinhThanhPho: Optional[int] = None

class PhuongXa(PhuongXaBase):
    maPhuongXa: int