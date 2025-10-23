from app.models.db_base import DBModel

class TacPhamTuKhoa(DBModel):
    maTacPham: int
    maTuKhoa: int