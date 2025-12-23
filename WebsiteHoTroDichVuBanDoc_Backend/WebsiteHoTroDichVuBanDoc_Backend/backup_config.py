# backup_config.py
import os
# Import settings từ ứng dụng chính để đồng bộ nguồn dữ liệu
from app.connect.config import settings

# Cấu hình Local cho thư viện psycopg2 (Python)
LOCAL_CONN_ARGS = {
    "dbname": settings.LOCAL_DB_NAME,
    "user": settings.LOCAL_DB_USER,
    "password": settings.LOCAL_DB_PASS,
    "host": settings.LOCAL_DB_HOST,
    "port": settings.LOCAL_DB_PORT
}

# File lưu trạng thái Incremental Backup
# (Sẽ tự động được tạo ra ở thư mục gốc, đồng cấp với các script backup)
STATE_FILE = "backup_state.json"

# Danh sách bảng theo thứ tự (Cha trước - Con sau)
TABLES_ORDER = [
    # 1. Master Data
    "tinhthanhpho", "phuongxa", "loaithe", "danhmuc", "tukhoa", "phong",
    # 2. Users
    "nguoidung", "nhanvien", "bandoc",
    # 3. Assets
    "thietbi", "chongoi", "tacpham", "tacpham_embeddings", "tacpham_danhmuc", "tacpham_tukhoa", "bansao",
    # 4. Process
    "yeucauthe", "vanchuyen", "thebandoc",
    # 5. Transactions
    "datphong", "datchongoi", "muontra", "giahan", "dattruoc", "yeucaugiao",
    # 6. Others
    "thongbao", "baiviet",
    # # 7. API RAG
    # "rag_chunks", "rag_documents"
]