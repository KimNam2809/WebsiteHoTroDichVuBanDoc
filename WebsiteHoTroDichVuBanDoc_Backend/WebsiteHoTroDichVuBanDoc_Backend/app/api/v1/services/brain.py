import re
from langchain_ollama import ChatOllama
from langchain_core.callbacks import CallbackManager
from langchain_core.callbacks.streaming_stdout import StreamingStdOutCallbackHandler

from app.api.v1.services.rag_service import query_rag_context
from app.api.v1.tools.db_tools import search_books_by_title
from app.api.v1.tools.action_tools import check_overdue_books, quick_book_seat

class LibraryBrain:
    def __init__(self):
        self.llm = ChatOllama(
            model="llama3", # Đảm bảo bạn đã `ollama pull llama3`
            base_url="http://localhost:11434",
            temperature=0.1,
            callback_manager=CallbackManager([StreamingStdOutCallbackHandler()])
        )

    def process_chat(self, user_query: str, user_id: int = None):
        # 1. RAG
        context = query_rag_context(user_query)

        # 2. Prompt
        system_prompt = f"""
        <SYSTEM_INSTRUCTION>
        Bạn là AI của Thư viện Đà Nẵng.

        DỮ LIỆU THAM KHẢO (RAG):
        {context}

        QUY TẮC:
        1. Nếu người dùng hỏi nội quy/thông tin chung: Dùng DỮ LIỆU THAM KHẢO trả lời.
        2. Nếu người dùng muốn TÌM SÁCH CỤ THỂ, KIỂM TRA PHẠT, GIA HẠN: Dùng lệnh TOOL.

        CÚ PHÁP TOOL (Chỉ xuất dòng này ở cuối, không giải thích):
        - Tìm sách: ||TOOL:search_book|tên_sách||
        - Phạt: ||TOOL:check_fine||
        - Đặt chỗ: ||TOOL:book_seat||
        - Gia hạn: ||TOOL:extend_book||

        Ví dụ:
        User: Sách Đắc Nhân Tâm ở đâu?
        AI: Để mình tìm vị trí cuốn sách này giúp bạn.
        ||TOOL:search_book|Đắc Nhân Tâm||
        </SYSTEM_INSTRUCTION>

        User Question: {user_query}
        Answer:
        """

        print("--- Calling AI ---")
        try:
            response = self.llm.invoke(system_prompt).content.strip()
        except Exception as e:
            return f"Lỗi kết nối Ollama: {str(e)}"

        print(f"DEBUG RAW: {response}")

        # 3. Regex Tool Parsing
        tool_pattern = r"\|\|TOOL:(.*?)(?:\|(.*?))?\|\|"
        matches = list(re.finditer(tool_pattern, response))

        final_reply = response

        if matches:
            for match in matches:
                full_command = match.group(0)
                tool_name = match.group(1).strip()
                argument = match.group(2).strip() if match.group(2) else None

                print(f"--- EXEC TOOL: {tool_name} arg: {argument} ---")
                tool_result = ""

                if tool_name == "search_book":
                    if not argument:
                        tool_result = "\nBạn chưa cung cấp tên sách cụ thể."
                    else:
                        data = search_books_by_title(argument)
                        if isinstance(data, str):
                            tool_result = f"\n{data}"
                        else:
                            books = data.get('books', [])
                            if not books:
                                tool_result = f"\nKhông tìm thấy sách '{argument}' trong hệ thống."
                            else:
                                tool_result = f"\n📚 Tìm thấy {len(books)} sách:\n"
                                for b in books:
                                    tool_result += f"- {b['tentacpham']} (Tác giả: {b['tacgia']}) - Vị trí: {b['vi_tri']}\n"

                elif tool_name == "check_fine":
                    tool_result = "\n" + check_overdue_books(user_id)
                elif tool_name == "book_seat":
                    tool_result = "\n" + quick_book_seat(user_id)
                elif tool_name == "extend_book":
                    tool_result = "\nVui lòng liên hệ quầy thủ thư để gia hạn."

                # Thay thế lệnh Tool bằng kết quả
                final_reply = final_reply.replace(full_command, tool_result)

        return final_reply