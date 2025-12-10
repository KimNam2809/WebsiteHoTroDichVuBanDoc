# Chạy khi có mạng lại
import psycopg2
import time
from supabase import create_client
from backup_config import LOCAL_CONN_ARGS, SUPA_URL, SUPA_KEY
import logging
from app.connect.config import settings

# Kết nối Cloud
supa_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

def sync_back_dat_cho():
    print("📤 Đang đồng bộ ngược dữ liệu 'DatChoNgoi' từ Local lên Cloud...")

    try:
        conn = psycopg2.connect(**LOCAL_CONN_ARGS)
        cursor = conn.cursor()

        # Lấy các lượt đặt chỗ được tạo trong vòng 24h qua (ví dụ) tại Local
        # (Thực tế bạn nên có cờ 'is_synced' ở Local, nhưng ở đây ta dùng thời gian)
        cursor.execute("""
            SELECT machongoi, mabandoc, thoigianbatdau, thoigianketthuc
            FROM datchongoi
            WHERE created_at > (NOW() - INTERVAL '1 day')
            ORDER BY created_at ASC
        """)
        local_bookings = cursor.fetchall()

        if not local_bookings:
            print("✅ Không có dữ liệu Local mới để đồng bộ.")
            return

        print(f"🔍 Tìm thấy {len(local_bookings)} lượt đặt cần đồng bộ.")

        conflict_log = []

        for booking in local_bookings:
            # Chuẩn bị params gọi RPC Cloud
            # booking[2] và [3] là object datetime, cần chuyển sang string ISO
            params = {
                "p_ma_cho_ngoi": booking[0],
                "p_ma_ban_doc": booking[1],
                "p_thoi_gian_bat_dau": booking[2].isoformat(),
                "p_thoi_gian_ket_thuc": booking[3].isoformat()
            }

            try:
                # Gọi RPC trên Cloud (Đây là bước "Smart Sync")
                response = supa_client.rpc("fn_dat_cho_ngoi", params).execute()
                print(f"   ✅ Đồng bộ thành công: Ghế {booking[0]} cho User {booking[1]}")

            except Exception as e:
                error_msg = str(e)
                # Bắt lỗi Xung đột (Business Error)
                if "BUSINESS_ERROR" in error_msg:
                    print(f"   ⚠️ XUNG ĐỘT: Ghế {booking[0]} - User {booking[1]}")
                    conflict_log.append({
                        "user": booking[1],
                        "seat": booking[0],
                        "time": booking[2].isoformat(),
                        "reason": "Trùng lịch với dữ liệu Cloud"
                    })
                else:
                    print(f"   ❌ Lỗi khác: {error_msg}")

        # Báo cáo xung đột
        if conflict_log:
            print("\n" + "="*30)
            print("DANH SÁCH CẦN XỬ LÝ THỦ CÔNG")
            print("="*30)
            for conflict in conflict_log:
                print(f"- User {conflict['user']} đặt Ghế {conflict['seat']} lúc {conflict['time']}")
                print(f"  -> Thất bại: {conflict['reason']}")

    except Exception as e:
        print(f"❌ Lỗi kết nối Local DB: {e}")
    finally:
        if 'cursor' in locals(): cursor.close()
        if 'conn' in locals(): conn.close()

if __name__ == "__main__":
    sync_back_dat_cho()