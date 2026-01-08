import re
import time
import json
from typing import Dict, Any

from langchain_groq import ChatGroq
# from langchain_ollama import ChatOllama

from app.api.v1.services.rag_service import query_rag_context
from app.api.v1.services.history_service import (
    get_recent_history_as_text,
    save_chat_history
)
from app.api.v1.tools.db_tools import (
    search_library_sql,
    get_facility_status,
    search_articles_sql,
    search_equipment_sql,
    search_seats_sql,
    analyze_and_recommend
)
from app.api.v1.tools.action_tools import (
    check_personal_dashboard,
    handle_book_action
)
from app.connect.config import settings


# -------------------- KEYWORDS CONFIG --------------------

PERSONAL_KEYWORDS = [
    "tôi đang mượn", "thẻ của tôi", "lịch sử mượn", "kiểm tra phạt", "hồ sơ của tôi",
    "tôi đang đặt", "chỗ ngồi của tôi", "lịch đặt", "ghế đã đặt",
    "bao giờ hết hạn", "khi nào hết hạn", "sách chưa trả",
    "đang giữ", "nợ bao nhiêu", "thông tin thẻ bạn đọc"
]

NAV_CARD = ["làm thẻ", "đăng ký thẻ", "cấp thẻ", "muốn làm thẻ", "cấp thẻ mới", "form thẻ", "link làm thẻ"]
NAV_ROOM = ["đặt phòng", "mượn phòng", "phòng họp nhóm", "thuê phòng"]
NAV_SHIP = ["giao sách", "ship", "vận chuyển"]

BOOK_SEARCH = [
    "tìm sách", "có sách", "về chủ đề", "sách", "tác phẩm",
    "tác giả", "mượn", "đọc", "chủ đề", "thể loại", "tìm"
]

RECOMMEND_KEYWORDS = [
    "gợi ý", "tương tự", "nên đọc gì", "gu của tôi", "hợp với tôi",
    "sách hay cho tôi", "đề xuất", "recommend", "có gì mới không"
]

DEVICE_SEARCH = ["máy tính", "máy chiếu", "thiết bị", "điều hòa", "wifi"]
ARTICLE_SEARCH = ["bài viết", "tin tức", "thông báo", "hướng dẫn về", "blog"]
SEAT_SEARCH = ["chỗ ngồi", "đặt chỗ", "ghế trống"]


def has_any(text: str, keywords: list[str]) -> bool:
    return any(k in text for k in keywords)


# -------------------- CORE BRAIN --------------------

class LibraryBrain:
    def __init__(self):
        self.llm = ChatGroq(
            temperature=0,
            model_name="llama-3.3-70b-versatile",
            api_key=settings.GROQ_API_KEY
        )
        # self.llm = ChatOllama(model="llama3", base_url="http://localhost:11434", temperature=0.0)

        self.nav_map = {
            "card": {"url": "/dang_ky_the", "label": "Đăng ký thẻ"},
            "room": {"url": "/booking/room", "label": "Đặt phòng họp"},
            "ship": {"url": "/services/delivery", "label": "Yêu cầu giao sách"}
        }

    # -------------------- ENTITY EXTRACTION --------------------

    def extract_entities(self, query: str, history: str) -> Dict[str, Any]:
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
            "category": "Thể loại hoặc từ khoá (Ví dụ: 'trinh thám', 'lập trình', 'văn học')",
            "available": "true/false (Nếu người dùng hỏi 'có thể mượn ngay', 'còn sách không', 'mượn bây giờ')",
            "device_name": "tên thiết bị",
            "article_topic": "chủ đề bài viết"
        }}

        [LỊCH SỬ]: {history}
        [CÂU HỎI]: {query}
        JSON:
        """

        try:
            res = self.llm.invoke(prompt).content.strip()
            match = re.search(r"\{.*\}", res, re.DOTALL)
            return json.loads(match.group()) if match else {}
        except Exception:
            return {}

    # -------------------- MAIN PROCESS --------------------

    def process_chat(self, user_query: str, user_id: int, session_id: str):
        start_time = time.time()
        history = get_recent_history_as_text(user_id, session_id)
        q_lower = user_query.lower()

        entities = self.extract_entities(user_query, history)

        # ---- RECOMMENDATION PATH ----
        if has_any(q_lower, RECOMMEND_KEYWORDS):
            print(f"💡 Recommend Path: User {user_id}")
            rec_result = analyze_and_recommend(user_id)

            if isinstance(rec_result, dict):
                return {
                    "reply": rec_result["message"],
                    "action": {
                        "type": "show_books",
                        "payload": rec_result["data"] # List sách để Frontend render Card
                    }
                }
            return {"reply": str(rec_result), "action": None}

        # ---- FAST PATH: PERSONAL DASHBOARD ----
        if has_any(q_lower, PERSONAL_KEYWORDS):
            print(f"⚡ Fast Path: Dashboard ({time.time() - start_time:.2f}s)")
            return {"reply": check_personal_dashboard(user_id), "action": None}

        # ---- NAVIGATION ----
        if has_any(q_lower, NAV_CARD):
            return {
                "reply": "Để đăng ký thẻ thư viện, bạn vui lòng điền thông tin tại trang đăng ký sau:",
                "action": {"type": "navigate", "payload": self.nav_map["card"]}
            }

        if has_any(q_lower, NAV_ROOM):
            return {
                "reply": "Để đặt phòng họp/nhóm, mời bạn truy cập hệ thống đặt phòng trực tuyến:",
                "action": {"type": "navigate", "payload": self.nav_map["room"]}
            }

        if has_any(q_lower, NAV_SHIP):
            return {
                "reply": "Bạn có thể yêu cầu giao tài liệu tận nơi tại đây:",
                "action": {"type": "navigate", "payload": self.nav_map["ship"]}
            }

        # ---- BOOK ACTION ----
        if "gia hạn" in q_lower or "đặt trước" in q_lower:
            action = "renew" if "gia hạn" in q_lower else "reserve"
            target = entities.get("book_name")
            if target:
                return {"reply": handle_book_action(user_id, target, action), "action": None}

        # ---- BOOK SEARCH ----
        if has_any(q_lower, BOOK_SEARCH):
            result = search_library_sql(
                keyword=entities.get("book_name"),
                author=entities.get("author"),
                category=entities.get("category"),
                available_only=entities.get("available")
            )

            if isinstance(result, dict):
                response = {"reply": result["message"], "action": None}
                if result.get("data"):
                    response["action"] = {
                        "type": "show_books",
                        "payload": result["data"]
                    }
                return response

            return {"reply": str(result), "action": None}

        # ---- DEVICE / FACILITY ----
        if has_any(q_lower, DEVICE_SEARCH):
            if entities.get("device_name"):
                return {
                    "reply": search_equipment_sql(
                        device_name=entities.get("device_name"),
                        room_name=entities.get("room_name")
                    ),
                    "action": None
                }
            return {"reply": get_facility_status(entities.get("room_name")), "action": None}

        # ---- ARTICLES ----
        if has_any(q_lower, ARTICLE_SEARCH):
            return {
                "reply": search_articles_sql(
                    article_topic=entities.get("article_topic") or ""
                ),
                "action": None
            }

        # ---- SEATS ----
        if has_any(q_lower, SEAT_SEARCH):
            return {
                "reply": search_seats_sql(room_name=entities.get("room_name")),
                "action": None
            }

        # ---- RAG FALLBACK ----
        context = query_rag_context(user_query)

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

        save_chat_history(user_id, session_id, "user", user_query)
        save_chat_history(user_id, session_id, "assistant", final_response)

        return {"reply": final_response, "action": None}

    # -------------------- LEGACY SUPPORT --------------------

    def extract_target(self, query: str, history: str) -> str:
        prompt = (
            f"Lịch sử chat (mới nhất ở dưới):\n{history}\n"
            f"Câu hiện tại: {query}\n"
            "Trích xuất tên riêng/danh từ/tên sách/tên chủ đề được nhắc đến GẦN NHẤT. "
            "Chỉ trả về tên, không giải thích. Nếu không có, trả về 'NONE'."
        )
        res = self.llm.invoke(prompt).content.strip()
        return "" if "NONE" in res else res
