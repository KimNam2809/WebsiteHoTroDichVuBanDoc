# File: app/services/brain.py
import re
from langchain_ollama import ChatOllama
from langchain_core.callbacks import CallbackManager
from langchain_core.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from app.api.v1.services.rag_service import query_rag_context
from app.api.v1.services.history_service import get_recent_history_as_text, save_chat_history
from app.api.v1.tools.action_tools import check_my_status, renew_book, reserve_book, quick_book_seat

class LibraryBrain:
    def __init__(self):
        self.llm = ChatOllama(
            model="llama3",
            base_url="http://localhost:11434",
            temperature=0.0, # Giữ nhiệt độ 0 để AI không sáng tạo bừa bãi
            # callback_manager=CallbackManager([StreamingStdOutCallbackHandler()]) # Tắt stream log để đỡ rối
        )

    def contextualize_query(self, history: str, current_query: str) -> str:
        if not history: return current_query

        # Kỹ thuật Few-Shot: Đưa ví dụ input/output để AI bắt chước
        prompt = f"""
        Bạn là một công cụ viết lại câu (Rewriting Tool).
        Nhiệm vụ: Dựa vào lịch sử, viết lại câu nói hiện tại của user cho đầy đủ chủ ngữ/vị ngữ.

        QUY TẮC TUYỆT ĐỐI:
        1. KHÔNG giải thích, KHÔNG thêm "Lý giải", KHÔNG thêm "Here is...".
        2. CHỈ trả về duy nhất 1 câu kết quả.
        3. Nếu là câu lệnh (Gia hạn, Đặt trước), GIỮ NGUYÊN ý định.

        VÍ DỤ MẪU:
        - History: User: Sách Đắc Nhân Tâm ở đâu? AI: Kệ A.
        - Current: Nó còn không?
        -> Output: Sách Đắc Nhân Tâm còn không?

        - History: User: Tôi muốn mượn sách.
        - Current: Gia hạn cuốn đó.
        -> Output: Gia hạn cuốn sách tôi đang mượn.

        LỊCH SỬ THỰC TẾ:
        {history}

        CÂU HIỆN TẠI: {current_query}

        OUTPUT:
        """
        try:
            new_query = self.llm.invoke(prompt).content.strip()
            # Hậu xử lý: Nếu AI vẫn cố tình giải thích dài dòng, ta lấy dòng đầu tiên hoặc fallback về query cũ
            if "\n" in new_query or len(new_query) > len(current_query) * 3:
                print(f"⚠️ Rephrase quá dài, dùng query gốc: {new_query}")
                return current_query

            # Loại bỏ các ký tự thừa
            new_query = new_query.replace('"', '').replace("Output:", "").strip()
            print(f"🔄 Rephrased: '{current_query}' -> '{new_query}'")
            return new_query
        except:
            return current_query

    def process_chat(self, user_query: str, user_id: int, session_id: str):
        # 1. Rephrase
        history_text = get_recent_history_as_text(user_id, session_id)
        refined_query = self.contextualize_query(history_text, user_query)

        # 2. RAG
        context = query_rag_context(refined_query)

        # 3. System Prompt (Cập nhật tên Tool)
        system_prompt = f"""
        <SYSTEM>
        Bạn là Trợ lý Thư viện Đà Nẵng.
        User ID: {user_id}.

        NHIỆM VỤ ƯU TIÊN: GỌI TOOL KHI CẦN THIẾT.

        DANH SÁCH TOOL:
        1. Kiểm tra trạng thái (Mượn sách/Phạt): ||TOOL:check_status||
            (Dùng khi: "Tôi đang mượn gì", "Kiểm tra phạt", "Có nợ gì không")

        2. Gia hạn sách: ||TOOL:renew|Tên_Sách_Cụ_Thể||
            (Dùng khi: "Gia hạn cuốn X", "Mượn thêm ngày")

        3. Đặt trước sách: ||TOOL:reserve|Tên_Sách_Cụ_Thể||

        LƯU Ý QUAN TRỌNG:
        - Nếu người dùng KHÔNG nói tên sách cụ thể, ĐỪNG tự điền "Tên_Sách". Hãy hỏi lại tên sách.
        - Trả lời bằng tiếng Việt.
        </SYSTEM>

        Lịch sử:
        {history_text}

        User: {refined_query}
        Assistant:
        """

        print("--- Sending to AI ---")
        response = self.llm.invoke(system_prompt).content.strip()
        print(f"🤖 AI Raw: {response}")

        # 4. XỬ LÝ TOOL

        # A. Check Status (Tool Mới)
        if "||TOOL:check_status||" in response:
            result = "\n" + check_my_status(user_id)
            response = response.replace("||TOOL:check_status||", result)

        # B. Renew
        elif "||TOOL:renew|" in response:
            match = re.search(r"\|\|TOOL:renew\|(.*?)\|\|", response)
            book_name = match.group(1).strip() if match else ""

            # CHẶN LỖI PLACEHOLDER
            if book_name in ["Tên_Sách", "Tên_Sách_Cụ_Thể", "your_book_name"]:
                response = "Vui lòng cho tôi biết cụ thể tên cuốn sách bạn muốn gia hạn."
            elif not book_name:
                response = "Vui lòng cung cấp tên sách để gia hạn."
            else:
                result = "\n" + renew_book(user_id, book_name)
                response = response.split("||")[0] + result

        # C. Reserve
        elif "||TOOL:reserve|" in response:
            match = re.search(r"\|\|TOOL:reserve\|(.*?)\|\|", response)
            book_name = match.group(1).strip() if match else ""

            if book_name in ["Tên_Sách", "Tên_Sách_Cụ_Thể"]:
                response = "Vui lòng cho tôi biết cụ thể tên cuốn sách bạn muốn đặt trước."
            elif not book_name:
                response = "Vui lòng cung cấp tên sách để đặt trước."
            else:
                result = "\n" + reserve_book(user_id, book_name)
                response = response.split("||")[0] + result

        # Lưu lịch sử
        if user_id:
            save_chat_history(user_id, session_id, "user", user_query)
            save_chat_history(user_id, session_id, "assistant", response)

        return response