# app/services/chatbot_service.py
import json
import ollama
from app.connect.config import settings
from supabase import create_client

# Kết nối DB
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

# Cấu hình Model
OLLAMA_MODEL = "qwen2.5"     # Model tư duy (Chat)
EMBED_MODEL = "nomic-embed-text" # Model vector

def get_context_from_db(query: str):
    """
    Hàm này tìm kiếm thông tin trong Knowledge Base (Sách + Quy định)
    """
    try:
        # 1. Embed câu hỏi
        vec_res = ollama.embeddings(model=EMBED_MODEL, prompt=query)
        query_vector = vec_res['embedding']

        # 2. Gọi hàm Hybrid Search (đã tạo ở bước trước)
        params = {
            "query_embedding": query_vector,
            "query_text": query, # Search keyword
            "match_threshold": 0.3, # Nới lỏng chút để bắt được nhiều ngữ cảnh
            "match_count": 5 # Chỉ cần top 5 thông tin liên quan nhất
        }
        res = supabase.rpc("hybrid_match_rag_chunks", params).execute()

        # Ghép các đoạn text tìm được thành 1 chuỗi context
        if not res.data:
            return ""

        context_str = ""
        for item in res.data:
            context_str += f"- {item['content']}\n"

        return context_str

    except Exception as e:
        print(f"Error getting context: {e}")
        return ""

def chat_with_librarian(user_query: str):
    """
    Bộ não chính: Nhận câu hỏi -> Lấy thông tin -> Trả lời như người thật
    """
    print(f"User: {user_query}")

    # 1. Lấy thông tin từ DB (RAG)
    context = get_context_from_db(user_query)

    # 2. Xây dựng Prompt (Kịch bản cho AI)
    if context:
        system_instruction = f"""
        Bạn là Thủ thư AI thân thiện của Thư viện Đà Nẵng.
        Dưới đây là thông tin thực tế tìm thấy trong cơ sở dữ liệu thư viện:

        --- BẮT ĐẦU THÔNG TIN ---
        {context}
        --- KẾT THÚC THÔNG TIN ---

        NHIỆM VỤ CỦA BẠN:
        1. Dựa vào thông tin trên để trả lời câu hỏi của người dùng.
        2. Nếu thông tin có chứa vị trí sách (Ví dụ: Kệ A1, Kho mượn), HÃY CHỈ RÕ cho người dùng.
        3. Trả lời ngắn gọn, lịch sự, xưng hô là "mình" hoặc "tôi".
        4. Nếu thông tin không đủ để trả lời, hãy thành thật xin lỗi và gợi ý liên hệ quầy thủ thư.
        """
    else:
        # Trường hợp không tìm thấy gì trong DB
        system_instruction = """
        Bạn là Thủ thư AI của Thư viện Đà Nẵng.
        Người dùng đang hỏi một câu mà bạn không tìm thấy thông tin trong cơ sở dữ liệu.
        Hãy lịch sự xin lỗi và gợi ý họ cung cấp thêm chi tiết hoặc liên hệ nhân viên.
        Đừng bịa đặt thông tin sách không có thật.
        """

    # 3. Gửi cho Ollama (Qwen) suy luận
    messages = [
        {"role": "system", "content": system_instruction},
        {"role": "user", "content": user_query}
    ]

    try:
        response = ollama.chat(model=OLLAMA_MODEL, messages=messages)
        return response['message']['content']
    except Exception as e:
        return f"Xin lỗi, hệ thống đang bận. Lỗi: {str(e)}"