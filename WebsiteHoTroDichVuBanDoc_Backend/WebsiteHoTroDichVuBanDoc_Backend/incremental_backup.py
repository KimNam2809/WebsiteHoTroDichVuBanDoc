import os
import json
import psycopg2
from supabase import create_client
from datetime import datetime
from backup_config import LOCAL_CONN_ARGS, TABLES_ORDER, STATE_FILE
from app.connect.config import settings

# --- CẤU HÌNH KHÓA CHÍNH (PK) ---
# Mặc định script sẽ lấy cột đầu tiên làm PK.
# Với các bảng trung gian dùng khóa phức hợp (2 cột), phải khai báo ở đây.
TABLE_PK_MAP = {
    "tacpham_danhmuc": "matacpham, madanhmuc",
    "tacpham_tukhoa": "matacpham, matukhoa",
    "rag_chunks": "id",
    "rag_documents": "id"
    # Nếu có bảng nào khác dùng 2 khóa chính, hãy thêm vào đây
}

def get_last_sync_time(table_name):
    """Đọc mốc thời gian lần backup trước"""
    if not os.path.exists(STATE_FILE):
        return "2000-01-01T00:00:00+00:00"

    try:
        with open(STATE_FILE, 'r') as f:
            data = json.load(f)
            return data.get(table_name, "2000-01-01T00:00:00+00:00")
    except:
        return "2000-01-01T00:00:00+00:00"

def update_last_sync_time(table_name, timestamp):
    """Lưu mốc thời gian mới"""
    data = {}
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, 'r') as f:
                data = json.load(f)
        except:
            pass

    data[table_name] = timestamp
    with open(STATE_FILE, 'w') as f:
        json.dump(data, f)

def sync_table(table_name):
    # 1. Kết nối Supabase
    supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

    # 2. Kết nối Local Postgres
    try:
        conn = psycopg2.connect(**LOCAL_CONN_ARGS)
        cursor = conn.cursor()
    except Exception as e:
        print(f"❌ Lỗi kết nối DB Local: {e}")
        return

    last_time = get_last_sync_time(table_name)
    print(f"   Table '{table_name}': Kiểm tra thay đổi sau {last_time}...")

    try:
        # 3. Lấy dữ liệu mới từ Cloud
        response = supabase.table(table_name)\
            .select("*")\
            .gt("updated_at", last_time)\
            .order("updated_at", desc=False)\
            .execute()

        rows = response.data
        if not rows:
            print("   -> Không có dữ liệu mới.")
            return

        print(f"   -> ⬇️ Đang tải {len(rows)} dòng mới...")

        # 4. Tạo câu lệnh UPSERT động
        columns = list(rows[0].keys())
        columns_str = ", ".join(columns)
        placeholders = ", ".join(["%s"] * len(columns))

        # --- [SỬA LỖI 2]: XÁC ĐỊNH KHÓA CHÍNH (PK) ---
        if table_name in TABLE_PK_MAP:
            pk_conflict_target = TABLE_PK_MAP[table_name]
        else:
            # Mặc định lấy cột đầu tiên làm PK (ví dụ: manguoidung, mabandoc...)
            pk_conflict_target = columns[0]

        # Tạo chuỗi UPDATE cho trường hợp trùng ID
        update_set = ", ".join([f"{col} = EXCLUDED.{col}" for col in columns])

        sql = f"""
            INSERT INTO public.{table_name} ({columns_str})
            VALUES ({placeholders})
            ON CONFLICT ({pk_conflict_target})
            DO UPDATE SET {update_set};
        """

        # 5. Thực thi Insert
        for row in rows:
            values = []
            for col in columns:
                val = row.get(col)

                # XỬ LÝ JSONB (DICT/LIST)
                # psycopg2 không tự hiểu dict, phải chuyển về json string
                if isinstance(val, (dict, list)):
                    values.append(json.dumps(val))
                else:
                    values.append(val)

            cursor.execute(sql, values)

        conn.commit()

        # 6. Lưu mốc thời gian mới nhất
        new_last_time = rows[-1]['updated_at']
        update_last_sync_time(table_name, new_last_time)
        print("   -> ✅ Đồng bộ xong.")

    except Exception as e:
        print(f"   ❌ Lỗi đồng bộ bảng {table_name}: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    print(f"--- 🚀 BẮT ĐẦU INCREMENTAL BACKUP: {datetime.now()} ---")
    for table in TABLES_ORDER:
        sync_table(table)
    print("--- HOÀN TẤT ---")