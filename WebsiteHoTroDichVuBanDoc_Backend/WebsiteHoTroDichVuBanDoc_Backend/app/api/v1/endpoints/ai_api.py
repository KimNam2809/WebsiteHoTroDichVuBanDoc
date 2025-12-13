from fastapi import APIRouter, HTTPException, status
from app.models.tac_pham import SearchRequest, BookSearchResult
from app.connect.config import settings
from supabase import create_client, Client
import google.generativeai as genai
from typing import List

router = APIRouter()

# Cấu hình Gemini
genai.configure(api_key=settings.GOOGLE_API_KEY)

# Kết nối Supabase
supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

# Hàm làm sạch câu hỏi
def clean_query(text: str) -> str:
    # Danh sách từ đệm gây nhiễu
    stop_words = ["tôi muốn tìm", "tìm cho tôi", "tìm sách", "có sách nào", "về", "nói về", "cho mình xin"]
    text_lower = text.lower()
    for word in stop_words:
        text_lower = text_lower.replace(word, "")
    return text_lower.strip()

@router.post("/search", response_model=List[BookSearchResult])
async def search_books_by_ai(request: SearchRequest):
    """
    API Tìm kiếm sách thông minh bằng Semantic Search (Vector)
    """
    try:
        # 1. Làm sạch câu hỏi trước khi Vector hóa
        # Input: "Tôi muốn tìm sách về tuổi thơ nghịch ngợm"
        # Output: "tuổi thơ nghịch ngợm" (Tập trung hoàn toàn vào ngữ nghĩa chính)
        cleaned_query = clean_query(request.query)

        # Nếu user gõ quá ngắn hoặc xóa hết từ thì dùng lại query gốc
        final_query = cleaned_query if len(cleaned_query) > 3 else request.query

        print(f"🔍 Original: {request.query} -> Cleaned: {final_query}") # Log để kiểm tra

        # 2. Vector hóa (Dùng final_query)
        embedding_result = genai.embed_content(
            model="models/text-embedding-004",
            content=final_query,
            task_type="retrieval_query"
        )
        query_vector = embedding_result['embedding']

        # 3. Nâng Threshold lên cao hơn
        # Gemini thường trả điểm khá cao, nên set mặc định là 0.55 hoặc 0.6
        effective_threshold = max(request.threshold, 0.55)

        params = {
            "query_embedding": query_vector,
            "match_threshold": effective_threshold,
            "match_count": request.limit
        }

        response = supabase.rpc("fn_tim_kiem_sach_ai", params).execute()

        return response.data

    except Exception as e:
        print(f"Lỗi AI Search: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi xử lý tìm kiếm AI: {str(e)}"
        )