import json
import re
from fastapi import APIRouter, HTTPException
from app.models.tac_pham import SearchRequest, BookSearchResult
from app.connect.config import settings
from supabase import create_client
import google.generativeai as genai
from typing import List, Optional

router = APIRouter()
genai.configure(api_key=settings.GOOGLE_API_KEY)
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

def extract_search_intent(user_query: str):
    """
    Dùng Gemini 2.5 Flash để phân tích câu hỏi.
    """
    generation_config = {
        "temperature": 0.1,
        "response_mime_type": "application/json",
    }
    model_name = "models/gemini-2.5-flash"

    try:
        model = genai.GenerativeModel(model_name, generation_config=generation_config)
        prompt = f"""
        Bạn là trợ lý thư viện. Phân tích câu tìm kiếm: "{user_query}"
        Trả về JSON:
        {{
            "topic": "Chủ đề chính ngắn gọn (VD: 'lập trình python', 'tình yêu'). Bỏ các từ nối như 'sách về', 'những cuốn'.",
            "author": "Tên tác giả (hoặc null).",
            "year_min": "Năm bắt đầu (số nguyên hoặc null).",
            "year_max": "Năm kết thúc (số nguyên hoặc null)."
        }}
        """
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"): text = text[7:-3]
        return json.loads(text)
    except Exception as e:
        print(f"⚠️ Lỗi AI: {e}")
        return {"topic": user_query, "author": None, "year_min": None, "year_max": None}

def is_useful_keyword(topic: str) -> bool:
    """
    Quyết định xem có nên dùng topic này làm bộ lọc cứng SQL hay không.
    Nguyên tắc: Chỉ lọc cứng nếu từ khóa NGẮN và KHÔNG chứa từ nối phức tạp.
    """
    if not topic: return False

    # 1. Nếu topic quá dài (> 3 từ), khả năng cao là mô tả cảm xúc -> Không lọc cứng
    words = topic.split()
    if len(words) > 3:
        return False

    # 2. Nếu chứa từ nối "và", "hoặc" -> Không lọc cứng (vì SQL tìm exact match)
    stop_words = [" và ", " hoặc ", " những ", " các ", " giúp ", " chữa "]
    if any(sw in topic.lower() for sw in stop_words):
        return False

    # 3. Còn lại (VD: "Python", "Kinh tế", "Nguyễn Nhật Ánh") -> Lọc cứng cho chính xác
    return True

@router.post("/search", response_model=List[BookSearchResult])
async def search_books_by_ai(request: SearchRequest):
    try:
        print(f"\n--- 🚀 BẮT ĐẦU (SMART FILTER): '{request.query}' ---")

        # BƯỚC 1: AI PHÂN TÍCH
        intent = extract_search_intent(request.query)
        print(f"🤖 AI Intent: {intent}")

        search_topic = intent.get('topic') or request.query
        filter_author = intent.get('author')
        filter_year_min = intent.get('year_min')
        filter_year_max = intent.get('year_max')

        # BƯỚC 2: VECTOR HÓA
        embedding_result = genai.embed_content(
            model="models/text-embedding-004",
            content=search_topic,
            task_type="retrieval_query"
        )
        query_vector = embedding_result['embedding']

        # BƯỚC 3: QUYẾT ĐỊNH CHIẾN LƯỢC TÌM KIẾM
        # Kiểm tra xem topic có nên dùng làm Keyword Filter không
        keyword_filter = search_topic if is_useful_keyword(search_topic) else None

        # Điều chỉnh Threshold
        # Nếu có Keyword Filter xịn (VD: "Python"), giảm threshold xuống thấp để bắt hết
        # Nếu không có Keyword (VD: "chữa lành"), giữ threshold trung bình để Vector lọc
        if keyword_filter or filter_author:
            effective_threshold = 0.30
        else:
            effective_threshold = 0.45

        params = {
            "query_embedding": query_vector,
            "match_threshold": effective_threshold,
            "match_count": request.limit,
            "filter_author": filter_author,
            "filter_year_min": filter_year_min,
            "filter_year_max": filter_year_max,
            "filter_keyword": keyword_filter
        }

        print(f"🔍 Strategy: Keyword='{keyword_filter}' (Topic gốc: '{search_topic}')")

        response = supabase.rpc("fn_tim_kiem_sach_ai", params).execute()

        print(f"✅ Tìm thấy: {len(response.data)} kết quả.")
        return response.data

    except Exception as e:
        print(f"❌ Lỗi: {e}")
        raise HTTPException(status_code=500, detail=str(e))