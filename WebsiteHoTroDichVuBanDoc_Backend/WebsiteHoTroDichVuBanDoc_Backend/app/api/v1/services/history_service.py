# File: app/services/history_service.py
from app.connect.db import supabase_client
import threading

def save_chat_history(user_id: int, role: str, content: str):
    """
    Lưu tin nhắn vào bảng 'lichsuchatbot' trong Supabase.
    Sử dụng Threading để không làm chậm phản hồi của API.
    """
    def _save():
        try:
            data = {
                "manguoidung": user_id,  # Lưu ý: user_id phải là số (BIGINT) khớp với bảng NguoiDung
                "vaitro": role,          # 'user' hoặc 'assistant'
                "noidung": content
            }
            # Lưu ý tên bảng phải chính xác
            supabase_client.table("lichsuchatbot").insert(data).execute()
        except Exception as e:
            print(f"Lỗi khi lưu lịch sử chat: {e}")

    # Chạy ngầm để API trả lời ngay lập tức
    thread = threading.Thread(target=_save)
    thread.start()

def get_recent_history(user_id: int, limit: int = 5):
    """Lấy 5 tin nhắn gần nhất để làm context cho AI"""
    try:
        response = supabase_client.table("lichsuchatbot")\
            .select("vaitro, noidung")\
            .eq("manguoidung", user_id)\
            .order("thoigian", desc=True)\
            .limit(limit)\
            .execute()

        # Đảo ngược lại để đúng thứ tự thời gian (Cũ trước -> Mới sau)
        return response.data[::-1] if response.data else []
    except Exception:
        return []