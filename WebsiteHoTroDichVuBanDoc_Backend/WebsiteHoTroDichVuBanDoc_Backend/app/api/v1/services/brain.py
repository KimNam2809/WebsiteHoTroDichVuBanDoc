import re
import json
from langchain_ollama import ChatOllama
from app.api.v1.services.rag_service import query_rag_context
from app.api.v1.services.history_service import get_recent_history_as_text, save_chat_history
from app.api.v1.tools.db_tools import search_library_sql, get_facility_status, search_articles_sql, search_equipment_sql, search_seats_sql
from app.api.v1.tools.action_tools import check_personal_dashboard, handle_book_action

class LibraryBrain:
    def __init__(self):
        self.llm = ChatOllama(model="llama3", base_url="http://localhost:11434", temperature=0.0)
        self.nav_map = {
            "card": {"url": "/account/card-request", "label": "Đăng ký thẻ"},
            "room": {"url": "/booking/room", "label": "Đặt phòng họp"},
            "ship": {"url": "/services/delivery", "label": "Yêu cầu giao sách"}
        }

    def extract_search_keyword(self, history: str, query: str):
        """
        Nhiệm vụ: Chỉ trích xuất ĐÚNG từ khóa chính (tên sách, tác giả, tên phòng).
        Chống AI giải thích dài dòng.
        """
        prompt = f"""
        [LỊCH SỬ]: {history}
        [CÂU HỎI]: {query}

        NHIỆM VỤ: Dựa vào lịch sử và câu hỏi, hãy trả về DUY NHẤT tên đối tượng (sách/người/phòng) được nhắc đến.
        QUY TẮC:
        - KHÔNG giải thích.
        - KHÔNG trả lời bằng tiếng Anh.
        - Nếu không có đối tượng cụ thể, trả về 'NONE'.
        - Nếu câu hỏi dùng 'nó', 'sách này', hãy lấy tên từ lịch sử.

        TÊN ĐỐI TƯỢNG:"""

        try:
            res = self.llm.invoke(prompt).content.strip()
            # Hậu xử lý để chặn AI nói dài
            keyword = res.split('\n')[0].replace('"', '').replace("'", "").replace(".", "")
            if len(keyword) > 50: # Nếu quá dài là AI đang giải thích -> lấy 5 từ đầu
                keyword = " ".join(keyword.split()[:5])
            return None if "NONE" in keyword.upper() else keyword
        except:
            return None

    def extract_entities(self, query: str, history: str):
        # "action_type": "loại hành động"
        """Trích xuất đa tham số dưới dạng JSON sạch."""
        prompt = f"""
        Nhiệm vụ: Trích xuất thông tin từ câu hỏi dựa vào lịch sử chat. Trả về JSON.
        BẮT BUỘC:
        1. Chỉ trả về JSON, không giải thích, không dùng tiếng Anh.
        2. Nếu dùng 'nó', 'quyển đó', lấy tên từ LỊCH SỬ.
        3. Nếu không có thông tin, để giá trị là null.

        Cấu trúc JSON:
        {{
            "book_name": "tên sách",
            "author": "tên tác giả",
            "room_name": "tên phòng",
            "device_name": "tên thiết bị",
            "article_topic": "chủ đề bài viết"
        }}

        [LỊCH SỬ]: {history}
        [CÂU HỎI]: {query}
        JSON:"""

        try:
            res = self.llm.invoke(prompt).content.strip()
            # Tìm kiếm khối JSON trong chuỗi trả về
            json_match = re.search(r'\{.*\}', res, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            return {}
        except:
            return {}

    def process_chat(self, user_query: str, user_id: int, session_id: str):
        # 0. Ưu tiên ngữ cảnh ngược (Lấy lịch sử mới nhất trước)
        history = get_recent_history_as_text(user_id, session_id)
        q_lower = user_query.lower()

        # 1. PHÂN LOẠI INTENT (Dựa trên 12 nhóm nghiệp vụ)

        # Trích xuất đa tham số
        entities = self.extract_entities(user_query, history)

        # --- Nhóm Điều hướng (Navigation) ---
        if any(w in q_lower for w in ["làm thẻ", "đăng ký thẻ", "yeu cau the"]):
            return {"reply": "Mời bạn điền form đăng ký thẻ tại đây.", "action": {"type": "navigate", "payload": self.nav_map['card']}}

        if any(w in q_lower for w in ["giao tài liệu", "ship", "vận chuyển"]):
            return {"reply": "Mời bạn tạo yêu cầu giao sách tận nhà.", "action": {"type": "navigate", "payload": self.nav_map['ship']}}

        # --- Nhóm Hành động AI (Action Tools) ---
        if any(w in q_lower for w in ["tôi mượn", "phạt", "nợ", "tình trạng của tôi"]):
            return {"reply": check_personal_dashboard(user_id), "action": None}

        if "gia hạn" in q_lower or "đặt trước" in q_lower:
            action = "renew" if "gia hạn" in q_lower else "reserve"
            target = entities.get("book_name")
            if target:
                return {"reply": handle_book_action(user_id, target, action), "action": None}

        # --- Nhóm Tra cứu DB (DB Tools) ---
        # if any(w in q_lower for w in ["bài viết", "tin tức", "thông báo", "hướng dẫn về", "blog"]):
        #     keyword = self.extract_target(user_query, history)
        #     return {"reply": search_articles_sql(keyword if keyword else "mới nhất"), "action": None}

        # if any(w in q_lower for w in ["máy tính", "máy chiếu", "thiết bị", "điều hòa", "wifi"]):
        #     device = self.extract_target(user_query, history)
        #     return {"reply": search_equipment_sql(device_name=device), "action": None}

        if any(w in q_lower for w in ["tìm sách", "có sách", "tác giả", "về chủ đề"]):
            # Truyền tham số dưới dạng keyword arguments để tránh lỗi positional error
            return {"reply": search_library_sql(
                keyword=entities.get("book_name"),
                author=entities.get("author")
            ), "action": None}

        if any(w in q_lower for w in ["máy tính", "máy chiếu", "thiết bị", "điều hòa", "wifi"]  ):
            if entities.get("device_name"):
                return {"reply": search_equipment_sql(
                    device_name=entities.get("device_name"),
                    room_name=entities.get("room_name")
                ), "action": None}
            return {"reply": get_facility_status(entities.get("room_name")), "action": None}

        if any(w in q_lower for w in ["bài viết", "tin tức", "thông báo", "hướng dẫn về", "blog"]):
            topic = entities.get("article_topic") or ""
            return {"reply": search_articles_sql(article_topic=topic), "action": None}

        if any(w in q_lower for w in ["chỗ ngồi", "đặt chỗ", "ghế trống"]):
            room = entities.get("room_name")
            return {"reply": search_seats_sql(room_name=room), "action": None}

        # --- Nhóm Hỏi đáp linh tinh (RAG) ---
        context = query_rag_context(user_query)
        # Ép AI trả lời bằng tiếng Việt và bám sát ngữ cảnh 2025
        prompt = f"""
        <SYSTEM>
        Bạn là Trợ lý AI Thư viện Đà Nẵng năm 2025.
        Dữ liệu tham khảo: {context}
        Lịch sử trò chuyện: {history}

        Nhiệm vụ:
        - Trả lời câu hỏi người dùng một cách chuyên nghiệp, chính xác. lịch sự.
        - Nếu người dùng hỏi về bài viết cụ thể, hãy nhắc họ nhấn vào link đính kèm.
        - Không bịa đặt thông tin nếu không có trong dữ liệu.
        - Luôn trả lời bằng tiếng Việt và chỉ trả lời bằng tiếng Anh nếu người dùng yêu cầu.
        </SYSTEM>
        User: {user_query}
        Assistant:
        """

        final_response = self.llm.invoke(prompt).content

        # Lưu lịch sử và trả về
        save_chat_history(user_id, session_id, "user", user_query)
        save_chat_history(user_id, session_id, "assistant", final_response)

        return {"reply": final_response, "action": None}

    def extract_target(self, query: str, history: str):
        """Trích xuất danh từ mục tiêu, ưu tiên Recency Bias (Ngữ cảnh mới nhất)."""
        prompt = f"Lịch sử chat (mới nhất ở dưới):\n{history}\nCâu hiện tại: {query}\nTrích xuất tên riêng/danh từ/tên sách/tên chủ đề được nhắc đến GẦN NHẤT. Chỉ trả về tên, không giải thích. Nếu không có, trả về 'NONE'."
        res = self.llm.invoke(prompt).content.strip()
        return "" if "NONE" in res else res