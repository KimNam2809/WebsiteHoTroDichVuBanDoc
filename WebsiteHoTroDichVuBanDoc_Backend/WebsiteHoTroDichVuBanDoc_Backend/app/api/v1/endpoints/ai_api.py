import json
import os
from fastapi import APIRouter, HTTPException
from typing import List

# --- CÁC IMPORT CŨ ---
from app.models.tac_pham import SearchRequest, BookSearchResult
from app.connect.config import settings
from supabase import create_client
import google.generativeai as genai

# --- IMPORT MỚI CHO FLASHRANK ---
from flashrank import Ranker, RerankRequest

router = APIRouter()
genai.configure(api_key=settings.GOOGLE_API_KEY)
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

# --- CẤU HÌNH FLASHRANK ---
# Load model TinyBERT (nhẹ, nhanh ~30MB). Cache tại thư mục 'opt'
print("--- [System] Đang tải model FlashRank... ---")
ranker = Ranker(model_name="ms-marco-TinyBERT-L-2-v2", cache_dir="opt")
print("--- [System] FlashRank sẵn sàng! ---")

# --- CẤU HÌNH TÌM KIẾM ---
INTERNAL_LIMIT = 50       # Lấy về nhiều để lọc
PHASE1_THRESHOLD = 0.15   # Ngưỡng thấp cho Phase 1 (Có Keyword bảo kê)
PHASE2_THRESHOLD = 0.45   # Ngưỡng cao cho Phase 2 (Vector thuần túy)

def extract_search_intent(user_query: str):
    """
    Dùng Gemini 2.5 Pro phân tích intent.
    """
    generation_config = {"temperature": 0.1, "response_mime_type": "application/json"}
    model_name = "models/gemini-2.5-pro"  # Hoặc gemini-1.5-flash nếu muốn nhanh hơn

    try:
        model = genai.GenerativeModel(model_name, generation_config=generation_config)
        prompt = f"""
        Bạn là chuyên gia tìm kiếm sách. Phân tích câu: "{user_query}"
        Trả về JSON:
        {{
            "topic": "Chủ đề chính để tìm Vector (VD: 'tư duy tài chính').",
            "author": "Tên tác giả (VD: 'Nguyễn Nhật Ánh').",
            "year_min": "Năm bắt đầu (int/null).",
            "year_max": "Năm kết thúc (int/null).",
            "keyword": "Trích xuất 1 từ khóa ĐỊNH DANH (Ưu tiên: Tên tác giả, Tên công nghệ 'Python', Thể loại 'Trinh thám'). Nếu là câu mô tả cảm xúc chung chung, hãy để null."
        }}
        """
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"): text = text[7:-3]
        return json.loads(text)
    except:
        return {"topic": user_query, "keyword": None}

async def execute_search(query_vector, threshold, limit, intent, force_keyword=None):
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
        print(f"\n--- 🚀 BẮT ĐẦU: '{request.query}' ---")

        # 1. AI Phân tích Intent
        intent = extract_search_intent(request.query)
        search_topic = intent.get('topic') or request.query
        ai_keyword = intent.get('keyword')
        print(f"🤖 Intent: {intent}")

        # 2. Vector hóa (Embedding)
        embedding_result = genai.embed_content(
            model="models/text-embedding-004",
            content=search_topic,
            task_type="retrieval_query"
        )
        query_vector = embedding_result['embedding']

        # 3. Thu thập ứng viên (Retrieval)
        candidates = []
        vip_ids = set()

        # --- PHASE 1: TÌM KIẾM VIP (Có Keyword) ---
        if ai_keyword:
            print(f"🔍 Phase 1 (VIP): Keyword='{ai_keyword}'")
            res1 = await execute_search(query_vector, PHASE1_THRESHOLD, INTERNAL_LIMIT, intent, force_keyword=ai_keyword)
            if res1.data:
                candidates.extend(res1.data)
                vip_ids = {b['matacpham'] for b in res1.data}
                print(f"   -> Phase 1 tìm thấy {len(res1.data)} sách.")

        # --- PHASE 2: TÌM KIẾM MỞ RỘNG (Nếu ít kết quả) ---
        if len(candidates) < 10:
            print(f"🔄 Phase 2 (Backup): Quét Vector diện rộng...")
            res2 = await execute_search(query_vector, PHASE2_THRESHOLD, INTERNAL_LIMIT, intent, force_keyword=None)

            # Lọc trùng: Chỉ lấy sách chưa có trong Phase 1
            for book in res2.data:
                if book['matacpham'] not in vip_ids:
                    candidates.append(book)
            print(f"   -> Phase 2 bổ sung thêm sách. Tổng ứng viên: {len(candidates)}")

        if not candidates:
            return []

        # 4. RERANKING VỚI FLASH RANK (Bước quan trọng mới)
        print("⚡ Bắt đầu Re-rank với FlashRank...")

        # Chuẩn bị dữ liệu cho FlashRank
        passages = []
        for book in candidates:
            # Tạo chuỗi văn bản để AI chấm điểm (Kết hợp Tên + Tóm tắt + Tác giả)
            # Lưu ý: Sửa 'tentacpham', 'tomtat' theo đúng tên cột trong DB của bạn
            text_content = f"{book.get('tentacpham', '')}. {book.get('tomtat', '')}. Tác giả: {book.get('tacgia', '')}"

            passages.append({
                "id": str(book['matacpham']),
                "text": text_content,
                "meta": book # Giữ nguyên object gốc để trả về
            })

        # Thực thi Re-rank
        rerank_request = RerankRequest(query=request.query, passages=passages)
        ranked_results = ranker.rerank(rerank_request)

        # --- BỘ LỌC KHẮT KHE (STRICT FILTER) ---

        # NGƯỠNG CHẤP NHẬN ĐƯỢC:
        # Bạn có thể điều chỉnh số này.
        # 0.6 là khá khắt khe (chất lượng cao).
        # 0.4 là trung bình.
        MIN_RELEVANCE_SCORE = 0.5

        # Lấy danh sách đã sắp xếp
        final_results = []
        print("\n--- ĐIỂM SỐ FLASHRANK (Để Debug) ---")
        for item in ranked_results:
            score = item['score']
            book_data = item['meta']
            book_name = book_data.get('tentacpham', 'Không tên')

            print(f"📚 {book_name} - Score: {score:.4f}")

            # LOGIC QUYẾT ĐỊNH: Chỉ lấy nếu điểm cao hơn ngưỡng
            if score >= MIN_RELEVANCE_SCORE:
                book_data['similarity'] = score # Gán điểm mới
                final_results.append(book_data)
            else:
                # Nếu điểm thấp quá, dừng luôn hoặc bỏ qua?
                # Với FlashRank, vì nó đã sắp xếp giảm dần,
                # nên nếu gặp thằng < 0.5 thì các thằng sau chắc chắn cũng < 0.5
                # -> BREAK luôn cho nhanh!
                print(f"   -> ⛔ Loại bỏ '{book_name}' vì điểm thấp ({score:.4f})")
                break

        # [TÙY CHỌN] Fallback: Nếu lọc xong mà KHÔNG còn cuốn nào (do khắt khe quá)
        # Thì linh động lấy tạm 1-2 cuốn đầu tiên (dù điểm thấp) để không trả về rỗng?
        if not final_results and ranked_results:
            print("⚠️ Cảnh báo: Không có sách nào đạt chuẩn. Lấy tạm Top 1 để an ủi.")
            top_1 = ranked_results[0]['meta']
            top_1['similarity'] = ranked_results[0]['score']
            final_results.append(top_1)

        # Giới hạn số lượng hiển thị tối đa (VD: chỉ hiện tối đa 10 cuốn xịn nhất)
        final_results = final_results[:10]

        print(f"✅ Kết quả cuối cùng: {len(final_results)} cuốn sách chất lượng cao.")
        return final_results

    except Exception as e:
        print(f"❌ Lỗi: {e}")
        raise HTTPException(status_code=500, detail=str(e))