# Lưu trữ đơn giản trong bộ nhớ (RAM).
# Nếu dự án lớn, bạn nên lưu vào bảng ThongBao hoặc một bảng ChatHistory riêng.
chat_histories = {}

def get_history(user_id: str):
    if user_id not in chat_histories:
        chat_histories[user_id] = []
    return chat_histories[user_id]

def add_to_history(user_id: str, role: str, content: str):
    history = get_history(user_id)
    history.append({"role": role, "content": content})
    # Chỉ giữ lại 5-10 tin nhắn gần nhất để tránh quá tải cho AI Local
    if len(history) > 10:
        history.pop(0)