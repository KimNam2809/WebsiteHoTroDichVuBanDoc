import re, time, json
from langchain_ollama import ChatOllama
from langchain_groq import ChatGroq
from app.api.v1.services.rag_service import query_rag_context
from app.api.v1.services.history_service import get_recent_history_as_text, save_chat_history
from app.api.v1.tools.db_tools import (
    search_library_sql, get_facility_status, search_articles_sql,
    search_equipment_sql, search_seats_sql, analyze_and_recommend,
    search_staff_sql, get_library_policies_sql
)
from app.api.v1.tools.action_tools import (
    check_personal_dashboard, handle_book_action,
    check_notifications, check_shipping_status, check_fine_history
)
from app.connect.config import settings

class LibraryBrain:
    def __init__(self):
        # self.llm = ChatOllama(model="llama3", base_url="http://localhost:11434", temperature=0.0)
        self.llm = ChatGroq(temperature=0, model_name="llama-3.3-70b-versatile", api_key=settings.GROQ_API_KEY)

        self.nav_map = {
            "card": {"url": "/dang_ky_the", "label": "Đăng ký thẻ"},
            "rules": {"url": "/dang_ky_the/noi_quy", "label": "Nội quy làm thẻ"},
            "room": {"url": "/dich_vu/dat_lich", "label": "Đặt phòng họp"},
            "ship": {"url": "/van_chuyen/giao_sach", "label": "Yêu cầu giao sách"}
        }

    def call_llm_with_retry(self, prompt: str, max_retries: int = 3) -> str:
        for attempt in range(max_retries):
            try:
                return self.llm.invoke(prompt).content
            except Exception as e:
                error_str = str(e)
                if "429" in error_str or "Too Many Requests" in error_str:
                    wait_time = (attempt + 1) * 2
                    print(f"⚠️ Groq Rate Limit (429). Retry in {wait_time}s... ({attempt+1}/{max_retries})")
                    time.sleep(wait_time)
                else:
                    raise e
        return "Xin lỗi, hệ thống đang quá tải. Vui lòng thử lại sau giây lát."

    def extract_entities(self, query: str, history: str):
        prompt = f"""
        Nhiệm vụ: Trích xuất thông tin từ câu hỏi.
        BẮT BUỘC: Chỉ trả về JSON, không giải thích.

        [Cấu trúc JSON]:
        {{
            "book_name": "tên sách",
            "author": "tên tác giả",
            "category": "thể loại/chủ đề",
            "device_name": "tên thiết bị",
            "article_topic": "chủ đề bài viết",
            "room_name": "tên phòng",
            "staff_name": "tên nhân viên",
            "department": "phòng ban (hành chính, phục vụ...)",
            "policy_topic": "chủ đề chính sách (thẻ, phí, nội quy...)",
            "available": true/false
        }}

        [LỊCH SỬ]: {history}
        [CÂU HỎI]: {query}
        JSON:"""

        try:
            res = self.call_llm_with_retry(prompt).strip()
            json_match = re.search(r'\{.*\}', res, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            return {}
        except:
            return {}

    def process_chat(self, user_query: str, user_id: int, session_id: str):
        start_time = time.time()
        history = get_recent_history_as_text(user_id, session_id)
        q_lower = user_query.lower()

        entities = self.extract_entities(user_query, history)

        # A. TRA CỨU NHÂN VIÊN (Staff)
        if any(w in q_lower for w in ["nhân viên", "ai quản lý", "trưởng phòng", "liên hệ ai"]):
            return {"reply": search_staff_sql(entities.get("staff_name"), entities.get("department")), "action": None}

        # B. TRA CỨU CHÍNH SÁCH / THẺ (Policies)
        if any(w in q_lower for w in ["phí làm thẻ", "quy định thẻ", "hạn mức mượn", "thẻ sinh viên", "loại thẻ"]):
            return {"reply": get_library_policies_sql(user_query), "action": None}

        # C. TRA CỨU ĐƠN GIAO SÁCH (Shipping)
        if any(w in q_lower for w in ["giao sách", "đơn ship", "vận chuyển"]):
            return {"reply": check_shipping_status(user_id), "action": None}

        # D. TRA CỨU CÁ NHÂN (Dashboard / Fines / Notifs)
        if "thông báo" in q_lower:
            return {"reply": check_notifications(user_id), "action": None}

        if any(w in q_lower for w in ["phạt", "nợ", "tiền"]):
            return {"reply": check_fine_history(user_id), "action": None}

        # Các thông tin cá nhân chung khác
        personal_keywords = ["tôi đang mượn", "sách đã mượn", "hạn trả", "lịch sử mượn", "thẻ của tôi", "quá hạn chưa"]
        if any(w in q_lower for w in personal_keywords):
            print(f"⚡ Fast Path: Dashboard")
            return {"reply": check_personal_dashboard(user_id), "action": None}

        # E. GIA HẠN / ĐẶT TRƯỚC
        if "gia hạn" in q_lower or "đặt trước" in q_lower:
            action = "renew" if "gia hạn" in q_lower else "reserve"
            target = entities.get("book_name")
            if target:
                return {"reply": handle_book_action(user_id, target, action), "action": None}

        # F. ĐIỀU HƯỚNG LINK (Khi xin Link)
        if "link" in q_lower or "trang web" in q_lower:
            for key, val in self.nav_map.items():
                if val['label'].lower() in q_lower or key in q_lower:
                    return {"reply": f"Mời bạn truy cập {val['label']}:", "action": {"type": "navigate", "payload": val}}

        # G. TÌM SÁCH (Search Books)
        if entities.get("book_name") or entities.get("author") or "tìm sách" in q_lower or "có sách" in q_lower:
            result = search_library_sql(
                keyword=entities.get("book_name"),
                author=entities.get("author"),
                category=entities.get("category"),
                available_only=entities.get("available")
            )
            if isinstance(result, dict):
                return {"reply": result["message"], "action": {"type": "show_books", "payload": result["data"]} if result["data"] else None}
            return {"reply": str(result), "action": None}

        # H. GỢI Ý SÁCH
        recommend_keywords = ["gợi ý", "recommend", "sách gì hay", "tư vấn sách"]
        if any(w in q_lower for w in recommend_keywords):
            topic = entities.get("category") or entities.get("book_name")
            rec_result = analyze_and_recommend(user_id, topic)
            if isinstance(rec_result, dict):
                return {"reply": rec_result["message"], "action": {"type": "show_books", "payload": rec_result["data"]}}
            return {"reply": str(rec_result), "action": None}

        # I. CƠ SỞ VẬT CHẤT & BÀI VIẾT
        if any(w in q_lower for w in ["máy tính", "máy chiếu", "thiết bị", "điều hòa", "wifi", "internet"]):
            return {"reply": search_equipment_sql(device_name=entities.get("device_name"), room_name=entities.get("room_name")), "action": None}

        if any(w in q_lower for w in ["bài viết", "tin tức", "sự kiện", "hoạt động"]):
            topic = entities.get("article_topic") or ""
            return {"reply": search_articles_sql(article_topic=topic), "action": None}

        if any(w in q_lower for w in ["chỗ ngồi", "đặt chỗ", "ghế trống", "phòng"]):
            return {"reply": get_facility_status(room_name=entities.get("room_name")), "action": None}

        # J. RAG FALLBACK
        context = query_rag_context(user_query)
        prompt = f"""
        <SYSTEM>
        Nhiệm vụ: Hỗ trợ bạn đọc Thư viện Đà Nẵng.

        [Dữ liệu]: {context}
        [Lịch sử]: {history}

        [Yêu cầu]:
        - Trả lời dựa trên dữ liệu.
        - Nếu hỏi về giờ làm việc, địa chỉ -> Dùng RAG.
        - Thân thiện, ngắn gọn, đầy đủ.
        </SYSTEM>
        User: {user_query}
        Assistant:"""

        try:
            final_response = self.call_llm_with_retry(prompt)
        except Exception as e:
            print(f"❌ LLM Error: {e}")
            final_response = "Xin lỗi, hiện tại hệ thống đang bận. Vui lòng thử lại sau."

        save_chat_history(user_id, session_id, "user", user_query)
        save_chat_history(user_id, session_id, "assistant", final_response)

        return {"reply": final_response, "action": None}

    def extract_target(self, query: str, history: str):
        pass