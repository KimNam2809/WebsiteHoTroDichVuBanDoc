from app.connect.db import supabase_client
import threading
from datetime import datetime, timezone, timedelta

# Cấu hình thời gian quên: 30 phút
# Nếu user im lặng 30 phút, AI sẽ quên ngữ cảnh trước đó.
CONTEXT_TIMEOUT_MINUTES = 30

def save_chat_history(user_id: int, session_id: str, role: str, content: str):
    """Lưu tin nhắn kèm Session ID"""
    def _save():
        try:
            data = {
                "manguoidung": user_id,
                "session_id": session_id, # <--- Mới
                "vaitro": role,
                "noidung": content,
                "thoigian": datetime.now(timezone.utc).isoformat()
            }
            supabase_client.table("lichsuchatbot").insert(data).execute()
        except Exception as e:
            print(f"❌ Lỗi lưu lịch sử chat: {e}")

    thread = threading.Thread(target=_save)
    thread.start()

def get_recent_history_as_text(user_id: int, session_id: str, limit: int = 6) -> str:
    """
    Lấy lịch sử theo Session ID và kiểm tra thời gian.
    """
    try:
        # 1. Lấy tin nhắn theo Session ID
        response = supabase_client.table("lichsuchatbot")\
            .select("vaitro, noidung, thoigian")\
            .eq("manguoidung", user_id)\
            .eq("session_id", session_id)\
            .order("thoigian", desc=True)\
            .limit(limit)\
            .execute()

        if not response.data:
            return ""

        messages = response.data

        # 2. KIỂM TRA THỜI GIAN (Time-based Context)
        # Lấy thời gian của tin nhắn gần nhất
        last_msg_time_str = messages[0]['thoigian']
        # Chuyển string ISO format sang datetime object
        last_msg_time = datetime.fromisoformat(last_msg_time_str.replace('Z', '+00:00'))
        now = datetime.now(timezone.utc)

        # Tính khoảng cách thời gian
        time_diff = now - last_msg_time

        # Nếu tin nhắn cuối cùng cách đây quá lâu, ta coi như Hết Phiên -> Trả về rỗng
        if time_diff > timedelta(minutes=CONTEXT_TIMEOUT_MINUTES):
            print(f"⏳ Ngữ cảnh quá cũ ({time_diff}), reset bộ nhớ.")
            return ""

        # 3. Format văn bản
        # Đảo ngược để lấy thứ tự cũ -> mới
        messages = messages[::-1]

        history_text = ""
        for msg in messages:
            role_display = "User" if msg['vaitro'] == 'user' else "AI"
            history_text += f"{role_display}: {msg['noidung']}\n"

        return history_text.strip()

    except Exception as e:
        print(f"⚠️ Lỗi lấy lịch sử: {e}")
        return ""