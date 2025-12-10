# Cấu hình chung cho backup
import os
from dotenv import load_dotenv
from app.connect.config import settings

# Dùng cho thư viện psycopg2
LOCAL_CONN_ARGS = {
    "dbname": settings.LOCAL_DB_NAME,
    "user": settings.LOCAL_DB_USER,
    "password": settings.LOCAL_DB_PASS,
    "host": settings.LOCAL_DB_HOST,
    "port": settings.LOCAL_DB_PORT
}

# --- THỨ TỰ BẢNG (QUAN TRỌNG ĐỂ TRÁNH LỖI KHÓA NGOẠI) ---
# Nguyên tắc: Bảng "Cha" (được tham chiếu) đứng trước, bảng "Con" đứng sau.
TABLES_ORDER = [
    # 1. Master Data (Dữ liệu nền)
    "tinhthanhpho",
    "phuongxa",
    "loaithe",
    "danhmuc",
    "tukhoa",
    "phong",

    # 2. Người dùng & Nhân sự
    "nguoidung",
    "nhanvien",
    "bandoc",

    # 3. Tài sản & Thiết bị
    "thietbi",
    "chongoi",
    "tacpham",
    "tacpham_danhmuc",
    "tacpham_tukhoa",
    "bansao",

    # 4. Quy trình Thẻ
    "yeucauthe",
    "vanchuyen",
    "thebandoc",

    # 5. Nghiệp vụ Giao dịch (Transaction)
    "datphong",
    "datchongoi",
    "muontra",
    "giahan",
    "dattruoc",
    "yeucaugiao",

    # 6. Thông tin khác
    "thongbao",
    "baiviet"
]

STATE_FILE = "backup_state.json"