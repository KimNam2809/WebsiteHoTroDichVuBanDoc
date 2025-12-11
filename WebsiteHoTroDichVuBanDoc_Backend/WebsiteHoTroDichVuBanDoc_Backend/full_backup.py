import os
import subprocess
from datetime import datetime
from app.connect.config import settings
import urllib.parse

# --- CẤU HÌNH ĐƯỜNG DẪN (Postgres 18) ---
BIN_DIR = r"C:\Program Files\PostgreSQL\18\bin"
PG_DUMP_PATH = os.path.join(BIN_DIR, "pg_dump.exe")
PG_RESTORE_PATH = os.path.join(BIN_DIR, "pg_restore.exe") # Dùng cái này thay cho psql

# Đổi đuôi file thành .dump để dễ nhận biết là file nhị phân
TEMP_FILE = "temp_backup.dump"

def parse_db_uri(uri):
    """Tách mật khẩu ra khỏi URI"""
    try:
        result = urllib.parse.urlparse(uri)
        password = urllib.parse.unquote(result.password) if result.password else ""
        safe_netloc = f"{result.username}@{result.hostname}:{result.port}"
        safe_uri = list(result)
        safe_uri[1] = safe_netloc
        uri_no_pass = urllib.parse.urlunparse(safe_uri)
        return uri_no_pass, password
    except:
        return uri, ""

def full_backup():
    print(f"[{datetime.now()}] 🌙 Bắt đầu Full Backup (Binary Mode)...")

    # Tạo môi trường biến
    my_env = os.environ.copy()

    # --- BƯỚC 1: DUMP (Binary Format) ---
    print("   ↳ Bước 1: Đang tải dữ liệu (Binary)...")
    cloud_uri, cloud_pass = parse_db_uri(settings.SUPABASE_DB_STR)
    my_env["PGPASSWORD"] = cloud_pass

    # Thêm tham số: -N cron (N nghĩa là "No schema", loại bỏ schema cron)
    # Có thể thêm -N vault -N auth nếu muốn loại bỏ các schema hệ thống khác của Supabase
    cmd_dump = f'"{PG_DUMP_PATH}" -F c -N cron --no-owner --no-privileges --file="{TEMP_FILE}" "{cloud_uri}"'

    try:
        subprocess.run(cmd_dump, shell=True, check=True, env=my_env)
        print("     ✅ Dump Binary thành công.")
    except subprocess.CalledProcessError as e:
        print(f"     ❌ Lỗi Dump: {e}")
        return

    # --- BƯỚC 2: RESTORE (Dùng pg_restore) ---
    print("   ↳ Bước 2: Đang nạp vào Local DB...")
    local_uri, local_pass = parse_db_uri(settings.LOCAL_DB_STR_CMD)
    my_env["PGPASSWORD"] = local_pass

    # pg_restore tự động xử lý việc xóa cũ và nạp mới
    # -d: database đích
    # --clean: xóa object cũ trước khi tạo
    # --if-exists: tránh lỗi nếu chưa có gì để xóa
    # --no-owner: Bỏ qua lỗi quyền sở hữu (quan trọng khi từ Cloud về Local)

    cmd_restore = f'"{PG_RESTORE_PATH}" -d "{local_uri}" --clean --if-exists --no-owner --no-privileges "{TEMP_FILE}"'

    try:
        # pg_restore có thể trả về cảnh báo (warnings) làm exit code khác 0.
        # Chúng ta dùng check=False và tự kiểm tra stderr nếu cần, hoặc cứ để nó chạy.
        result = subprocess.run(cmd_restore, shell=True, check=False, env=my_env, capture_output=True, text=True)

        # pg_restore trả về 0 là thành công tuyệt đối.
        # Trả về 1 thường là cảnh báo nhưng dữ liệu vẫn vào được.
        if result.returncode == 0:
            print("     ✅ Restore thành công tuyệt đối.")
        else:
            print(f"     ⚠️ Restore hoàn tất với cảnh báo (Code {result.returncode}).")
            # In ra vài dòng lỗi cuối cùng để debug nếu cần
            print(f"     Chi tiết: {result.stderr[-200:]}")

    except Exception as e:
        print(f"     ❌ Lỗi Restore: {e}")
        return

    # --- BƯỚC 3: DỌN DẸP ---
    if os.path.exists(TEMP_FILE):
        os.remove(TEMP_FILE)
        print("   ↳ 🧹 Đã xóa file tạm.")

    print(f"[{datetime.now()}] 🎉 Hoàn tất!")

if __name__ == "__main__":
    full_backup()