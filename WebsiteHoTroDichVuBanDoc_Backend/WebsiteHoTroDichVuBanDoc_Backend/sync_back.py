import psycopg2
from supabase import create_client
from backup_config import LOCAL_CONN_ARGS, SUPA_URL, SUPA_KEY
import logging
from datetime import datetime

# --- CẤU HÌNH ---
# Kết nối Cloud
supa_client = create_client(SUPA_URL, SUPA_KEY)

# Ngưỡng thời gian: Chỉ lấy dữ liệu thay đổi trong 24h qua (hoặc khoảng thời gian mất mạng)
# Có thể điều chỉnh tham số này
SYNC_INTERVAL = "1 day"

def get_local_connection():
    return psycopg2.connect(**LOCAL_CONN_ARGS)

# ==========================================
# 1. ĐỒNG BỘ ĐẶT CHỖ NGỒI
# ==========================================
def sync_dat_cho(cursor, conflict_log):
    print("   ↳ 🪑 Đang đồng bộ 'DatChoNgoi'...")
    cursor.execute(f"""
        SELECT machongoi, mabandoc, thoigianbatdau, thoigianketthuc
        FROM datchongoi
        WHERE created_at > (NOW() - INTERVAL '{SYNC_INTERVAL}')
        ORDER BY created_at ASC
    """)
    for row in cursor.fetchall():
        params = {
            "p_ma_cho_ngoi": row[0],
            "p_ma_ban_doc": row[1],
            "p_thoi_gian_bat_dau": row[2].isoformat(),
            "p_thoi_gian_ket_thuc": row[3].isoformat()
        }
        try:
            supa_client.rpc("fn_dat_cho_ngoi", params).execute()
            print(f"     ✅ Ghế {row[0]}: OK")
        except Exception as e:
            msg = str(e)
            if "BUSINESS_ERROR" in msg:
                conflict_log.append(f"[ĐẶT CHỖ] User {row[1]} ghế {row[0]}: Xung đột thời gian.")
            else:
                print(f"     ❌ Lỗi: {msg}")

# ==========================================
# 2. ĐỒNG BỘ ĐẶT PHÒNG
# ==========================================
def sync_dat_phong(cursor, conflict_log):
    print("   ↳ 🚪 Đang đồng bộ 'DatPhong'...")
    cursor.execute(f"""
        SELECT maphong, nguoitochuc, sodienthoai, thoigianbatdau, thoigianketthuc, mucdichsudung, songuoithamdudukien 
        FROM datphong
        WHERE created_at > (NOW() - INTERVAL '{SYNC_INTERVAL}')
        ORDER BY created_at ASC
    """)
    for row in cursor.fetchall():
        params = {
            "p_ma_phong": row[0],
            "p_nguoi_to_chuc": row[1],
            "p_so_dien_thoai": row[2],
            "p_thoi_gian_bat_dau": row[3].isoformat(),
            "p_thoi_gian_ket_thuc": row[4].isoformat(),
            "p_muc_dich_su_dung": row[5],
            "p_so_nguoi_tham_du_du_kien": row[6]
        }
        try:
            # Gọi RPC fn_dat_phong để tận dụng logic kiểm tra trùng
            supa_client.rpc("fn_dat_phong", params).execute()
            print(f"     ✅ Phòng {row[0]}: OK")
        except Exception as e:
            msg = str(e)
            if "BUSINESS_ERROR" in msg:
                conflict_log.append(f"[ĐẶT PHÒNG] Phòng {row[0]} ({row[1]}): Xung đột thời gian.")
            else:
                print(f"     ❌ Lỗi: {msg}")

# ==========================================
# 3. ĐỒNG BỘ MƯỢN SÁCH
# ==========================================
def sync_muon_sach(cursor, conflict_log):
    print("   ↳ 📖 Đang đồng bộ 'MuonTra' (Mượn)...")
    # Chỉ lấy các lượt mượn MỚI TẠO (created_at mới) và trạng thái là 'daMuon'
    cursor.execute(f"""
        SELECT mabansao, mabandoc, manhanvien, ngaytra
        FROM muontra
        WHERE created_at > (NOW() - INTERVAL '{SYNC_INTERVAL}')
        AND trangthaimuon = 'daMuon'
        ORDER BY created_at ASC
    """)
    for row in cursor.fetchall():
        params = {
            "p_ma_ban_sao": row[0],
            "p_ma_ban_doc": row[1],
            "p_ma_nhan_vien": row[2],
            "p_ngay_tra": row[3].isoformat() # Date object
        }
        try:
            # Gọi RPC fn_muon_tai_lieu
            supa_client.rpc("fn_muon_tai_lieu", params).execute()
            print(f"     ✅ Mượn Bản sao {row[0]}: OK")
        except Exception as e:
            msg = str(e)
            if "BUSINESS_ERROR" in msg:
                # Lỗi này nghĩa là trên Cloud, cuốn sách này đã bị người khác mượn rồi!
                conflict_log.append(f"[MƯỢN SÁCH] User {row[1]} mượn Bản sao {row[0]}: Sách không có sẵn trên Cloud.")
            else:
                print(f"     ❌ Lỗi: {msg}")

# ==========================================
# 4. ĐỒNG BỘ TRẢ SÁCH
# ==========================================
def sync_tra_sach(cursor, conflict_log):
    print("   ↳ ↩️ Đang đồng bộ 'MuonTra' (Trả)...")
    # Lấy các lượt mượn đã chuyển sang 'daTra' GẦN ĐÂY (updated_at mới)
    # Lưu ý: Chúng ta cần mamuontra phải khớp giữa Local và Cloud.
    # Giả định dữ liệu mượn cũ đã được sync về Local trước khi mất mạng.
    cursor.execute(f"""
        SELECT mamuontra, manhanvien
        FROM muontra
        WHERE updated_at > (NOW() - INTERVAL '{SYNC_INTERVAL}')
        AND trangthaimuon = 'daTra'
        ORDER BY updated_at ASC
    """)
    for row in cursor.fetchall():
        params = {
            "p_ma_muon_tra": row[0],
            "p_ma_nhan_vien_tra": row[1]
        }
        try:
            # Gọi RPC fn_tra_sach
            supa_client.rpc("fn_tra_sach", params).execute()
            print(f"     ✅ Trả ID {row[0]}: OK")
        except Exception as e:
            msg = str(e)
            if "BUSINESS_ERROR" in msg:
                # Có thể trên Cloud đã trả rồi, hoặc ID không khớp
                conflict_log.append(f"[TRẢ SÁCH] Lượt {row[0]}: Không thể trả trên Cloud (Sai trạng thái/Không tồn tại).")
            else:
                print(f"     ❌ Lỗi: {msg}")

# 5. ĐỒNG BỘ GIA HẠN
# ==========================================
def sync_gia_han(cursor, conflict_log):
    print("   ↳ ⏳ Đang đồng bộ 'GiaHan'...")

    # Lấy các lượt gia hạn được tạo khi Offline
    # Cần lấy đủ 4 tham số mà RPC fn_gia_han yêu cầu
    cursor.execute(f"""
        SELECT mamuontra, manhanvien, ngaytramoi, lydogiahan
        FROM giahan
        WHERE created_at > (NOW() - INTERVAL '{SYNC_INTERVAL}')
        ORDER BY created_at ASC
    """)

    for row in cursor.fetchall():
        # Chuẩn bị tham số cho RPC
        # row[2] là ngày (date object), cần isoformat
        params = {
            "p_ma_muon_tra": row[0],
            "p_ma_nhan_vien": row[1],
            "p_ngay_tra_moi": row[2].isoformat(),
            "p_ly_do_gia_han": row[3]
        }

        try:
            # Gọi RPC fn_gia_han trên Cloud
            # RPC này sẽ tự động kiểm tra:
            # 1. Số lần gia hạn tối đa.
            # 2. Trạng thái lượt mượn (phải là 'daMuon').
            supa_client.rpc("fn_gia_han", params).execute()
            print(f"     ✅ Gia hạn lượt mượn {row[0]}: OK")

        except Exception as e:
            msg = str(e)
            if "BUSINESS_ERROR" in msg:
                # Các lỗi có thể gặp: "Đã đạt số lần gia hạn tối đa", "Lượt mượn đã trả"
                conflict_log.append(f"[GIA HẠN] Lượt {row[0]}: Thất bại do xung đột ({msg})")
            else:
                print(f"     ❌ Lỗi: {msg}")

# ==========================================
# MAIN EXECUTOR
# ==========================================
def run_sync_process():
    print(f"\n🚀 BẮT ĐẦU ĐỒNG BỘ NGƯỢC (LOCAL -> CLOUD)")
    print(f"   (Dữ liệu trong vòng {SYNC_INTERVAL} qua)\n")

    conflict_log = []
    conn = None
    try:
        conn = get_local_connection()
        cursor = conn.cursor()

        # Chạy từng nghiệp vụ
        sync_dat_cho(cursor, conflict_log)
        sync_dat_phong(cursor, conflict_log)
        sync_muon_sach(cursor, conflict_log)
        sync_tra_sach(cursor, conflict_log)
        sync_gia_han(cursor, conflict_log)

        # Báo cáo xung đột
        if conflict_log:
            print("\n" + "!"*40)
            print("⚠️ PHÁT HIỆN XUNG ĐỘT CẦN XỬ LÝ THỦ CÔNG")
            print("!"*40)
            for item in conflict_log:
                print(f" - {item}")
            print("\n-> Vui lòng kiểm tra thực tế và thao tác lại trên hệ thống Cloud.")
        else:
            print("\n✨ Đồng bộ hoàn tất. Không có xung đột.")

    except Exception as e:
        print(f"🔥 Lỗi kết nối Local DB: {e}")
    finally:
        if conn: conn.close()

if __name__ == "__main__":
    run_sync_process()