from typing import Optional
from app.models.db_base import DBModel

class TinhThanhPhoBase(DBModel):
    tenTinhThanhPho: str

class TinhThanhPhoCreate(TinhThanhPhoBase):
    pass

class TinhThanhPhoUpdate(DBModel):
    tenTinhThanhPho: Optional[str] = None

class TinhThanhPho(TinhThanhPhoBase):
    maTinhThanhPho: int


