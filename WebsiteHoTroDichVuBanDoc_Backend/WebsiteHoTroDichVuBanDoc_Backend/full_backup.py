# Chạy mỗi đêm (pg_dump)
import os
import subprocess
from datetime import datetime
from app.connect.config import settings

def full_backup():
    print(f"[{datetime.now()}] 🌙 Bắt đầu Full Backup (pg_dump)...")

    # Thiết lập biến môi trường PGPASSWORD để không phải nhập pass thủ công
    # (Lấy password từ chuỗi kết nối - bạn cần tự tách hoặc gán cứng ở đây nếu script lỗi auth)
    env = os.environ.copy()

    # ĐƯỜNG DẪN TUYỆT ĐỐI ĐẾN FILE EXE (Sửa số '16' thành phiên bản bạn cài)
    PG_DUMP_PATH = r"C:\Program Files\PostgreSQL\16\bin\pg_dump.exe"
    PSQL_PATH = r"C:\Program Files\PostgreSQL\16\bin\psql.exe"

    # Lệnh: pg_dump lấy dữ liệu -> Đẩy thẳng sang psql để nạp vào Local
    # --clean: Xóa bảng cũ trước khi tạo lại
    # --if-exists: Tránh lỗi nếu bảng chưa có
    # --no-owner --no-privileges: Bỏ qua lỗi về quyền user khác nhau giữa Cloud và Local

    cmd = f'"{PG_DUMP_PATH}" "{settings.SUPABASE_DB_STR}" --clean --if-exists --no-owner --no-privileges | "{PSQL_PATH}" "{settings.LOCAL_DB_STR_CMD}"'

    try:
        # shell=True để chạy được dấu pipe '|' trên Windows
        subprocess.run(cmd, shell=True, check=True, env=env)
        print("✅ Full Backup hoàn tất thành công!")
    except subprocess.CalledProcessError as e:
        print(f"❌ Lỗi Full Backup: {e}")

if __name__ == "__main__":
    full_backup()