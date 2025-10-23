from app.models.db_base import DBModel

# Bảng này chỉ có khóa chính, không có model Create/Update riêng
class TacPhamDanhMuc(DBModel):
    maTacPham: int
    maDanhMuc: int