import json
import ollama
from typing import List
from fastapi import APIRouter, HTTPException

from app.models.tac_pham import SearchRequest, BookSearchResult
from app.connect.config import settings
from supabase import create_client

# Import Service Embedding chung (BKAI)
from app.api.v1.services.embedding_service import get_embedding

# FlashRank
from flashrank import Ranker, RerankRequest

router = APIRouter()
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

# Cấu hình Ollama & FlashRank
OLLAMA_CHAT_MODEL = "qwen2.5"
print("--- [System] Loading FlashRank... ---")
ranker = Ranker(model_name="ms-marco-TinyBERT-L-2-v2", cache_dir="opt")

# Ngưỡng tìm kiếm (BKAI có độ chính xác cao nên threshold có thể để chặt)
INTERNAL_LIMIT = 50
PHASE1_THRESHOLD = 0.35
PHASE2_THRESHOLD = 0.55

def extract_search_intent(user_query: str):
    """
    Dùng Ollama Qwen 2.5 để phân tích ý định (Intent).
    """
    print(f"🤖 [Ollama] Analyzing Intent: {user_query}")
    prompt = f"""
    Phân tích câu tìm sách: "{user_query}"
    Trả về JSON:
    {{
        "topic": "Chủ đề chính",
        "author": "Tên tác giả hoặc null",
        "year_min": null,
        "year_max": null,
        "keyword": "Từ khóa định danh hoặc null"
    }}
    Chỉ trả về JSON.
    """
    try:
        response = ollama.chat(
            model=OLLAMA_CHAT_MODEL,
            messages=[{'role': 'user', 'content': prompt}],
            format='json'
        )
        return json.loads(response['message']['content'])
    except:
        return {"topic": user_query, "keyword": None}

async def execute_search(query_vector, threshold, limit, intent, force_keyword=None):
    # Gọi hàm SQL
    params = {
        "query_embedding": query_vector,
        "match_threshold": threshold,
        "match_count": limit,
        "filter_author": intent.get('author'),
        "filter_year_min": intent.get('year_min'),
        "filter_year_max": intent.get('year_max'),
        "filter_keyword": force_keyword
    }
    return supabase.rpc("fn_tim_kiem_sach_ai", params).execute()

@router.post("/search", response_model=List[BookSearchResult])
async def search_books_by_ai(request: SearchRequest):
    try:
        print(f"\n--- 🚀 SEARCH START: '{request.query}' ---")

        # 1. Intent (Ollama Qwen)
        intent = extract_search_intent(request.query)
        search_topic = intent.get('topic') or request.query
        ai_keyword = intent.get('keyword')

        # 2. Embedding (BKAI - Local Python)
        # Thay vì gọi genai hay ollama.embeddings, ta gọi hàm Python trực tiếp
        query_vector = get_embedding(search_topic)

        # 3. Retrieval (Supabase)
        candidates = []
        vip_ids = set()

        if ai_keyword:
            res1 = await execute_search(query_vector, PHASE1_THRESHOLD, INTERNAL_LIMIT, intent, force_keyword=ai_keyword)
            if res1.data:
                candidates.extend(res1.data)
                vip_ids = {b['matacpham'] for b in res1.data}

        if len(candidates) < 10:
            res2 = await execute_search(query_vector, PHASE2_THRESHOLD, INTERNAL_LIMIT, intent, force_keyword=None)
            for book in res2.data:
                if book['matacpham'] not in vip_ids:
                    candidates.append(book)

        if not candidates: return []

        # 4. Rerank (FlashRank)
        passages = [{"id": str(b['matacpham']), "text": f"{b['tentacpham']}. {b['tomtat']}", "meta": b} for b in candidates]
        rerank_req = RerankRequest(query=request.query, passages=passages)
        ranked = ranker.rerank(rerank_req)

        # 5. Filter
        final_results = []
        for item in ranked:
            if item['score'] >= 0.5:
                item['meta']['similarity'] = item['score']
                final_results.append(item['meta'])

        # Fallback
        if not final_results and ranked:
            top = ranked[0]
            top['meta']['similarity'] = top['score']
            final_results.append(top['meta'])

        return final_results[:10]

    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))