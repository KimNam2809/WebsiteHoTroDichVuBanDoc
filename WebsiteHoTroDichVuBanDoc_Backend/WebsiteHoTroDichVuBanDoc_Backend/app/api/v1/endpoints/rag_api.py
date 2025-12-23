import os
import shutil
import re
import traceback
import unicodedata
from datetime import datetime
from typing import List

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
import pypdf
import docx

# --- LIBS MỚI: OLLAMA & FLASHRANK ---
import ollama
from flashrank import Ranker, RerankRequest

# --- SUPABASE ---
from supabase import create_client

# --- APP MODULES ---
from app.connect.auth import get_current_staff_profile
from app.connect.config import settings
from app.models.rag_models import DocumentResponse, RetrieveRequest

# ============================================================
# 1. INITIALIZE & CONFIG
# ============================================================

router = APIRouter()

# Kết nối Supabase
supabase = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY
)

# Cấu hình Model Ollama & FlashRank
OLLAMA_EMBED_MODEL = "nomic-embed-text"  # Vector 768 chiều

print("--- [System] Loading FlashRank Reranker... ---")
# Đường dẫn cache trỏ về thư mục 'opt' ở root project
cache_path = os.path.join(os.getcwd(), "opt")
ranker = Ranker(model_name="ms-marco-TinyBERT-L-2-v2", cache_dir=cache_path)
print("--- [OK] FlashRank Ready")


# ============================================================
# 2. HELPER FUNCTIONS
# ============================================================

def normalize_vi(text: str) -> str:
    """
    Chuẩn hóa tiếng Việt phục vụ tìm kiếm Hybrid (Keyword search).
    Chuyển về chữ thường, bỏ dấu, bỏ ký tự đặc biệt.
    """
    text = text.lower().strip()
    text = unicodedata.normalize('NFD', text)
    text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def extract_text_from_file(file_path: str, filename: str) -> str:
    """Đọc text từ file PDF, DOCX, TXT"""
    ext = filename.split('.')[-1].lower()
    text = ""
    try:
        if ext == 'pdf':
            reader = pypdf.PdfReader(file_path)
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
        elif ext == 'docx':
            doc = docx.Document(file_path)
            for para in doc.paragraphs:
                clean_para = para.text.strip()
                if clean_para:
                    text += clean_para + "\n"
        elif ext == 'txt':
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
        else:
            raise ValueError("Định dạng file không hỗ trợ (chỉ nhận .pdf, .docx, .txt)")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Lỗi đọc file: {str(e)}")

    return text


def chunk_text_with_heading(text: str) -> List[str]:
    """
    Cắt đoạn văn bản thông minh (Regex) dựa trên cấu trúc Heading/Gạch đầu dòng.
    Giúp giữ ngữ cảnh tốt hơn việc cắt theo số lượng ký tự cố định.
    """
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    chunks = []

    current_heading = None
    buffer = []

    def flush():
        if buffer:
            combined = ""
            if current_heading:
                combined += f"{current_heading}: "
            combined += " ".join(buffer)

            # Chỉ lấy đoạn có độ dài nhất định để tránh rác
            if len(combined) >= 20:
                chunks.append(combined)
            buffer.clear()

    for line in lines:
        # Nhận diện bullet points hoặc dòng ngắn làm tiêu đề
        is_bullet = line.startswith(("+", "-", "*"))
        is_short = len(line) < 80 and not line.endswith((".", ";"))

        if not is_bullet and is_short:
            flush()
            current_heading = line
        else:
            # Xóa ký tự bullet để nội dung sạch hơn
            clean_line = re.sub(r"^[\+\-\*]\s*", "", line)
            buffer.append(clean_line)

    flush()
    return chunks


def get_ollama_embedding(text: str) -> List[float]:
    """
    Tạo vector embedding bằng Ollama (nomic-embed-text).
    Input: Text string
    Output: List[float] (768 chiều)
    """
    try:
        response = ollama.embeddings(
            model=OLLAMA_EMBED_MODEL,
            prompt=text
        )
        return response['embedding']
    except Exception as e:
        print(f"❌ Lỗi kết nối Ollama: {str(e)}")
        # Có thể raise lỗi hoặc return list rỗng tùy logic xử lý
        raise HTTPException(status_code=503, detail="Ollama Service không phản hồi. Hãy kiểm tra ollama serve.")


# ============================================================
# 3. API ENDPOINTS
# ============================================================

@router.post("/documents")
async def upload_document(
    file: UploadFile = File(...),
    category: str = Form("general"),
    current_staff: dict = Depends(get_current_staff_profile)
):
    """
    Upload tài liệu -> Extract -> Chunk -> Embed (Ollama) -> Lưu DB
    """
    temp_path = f"temp_{file.filename}"

    # Lưu file tạm
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # 1. Extract Text
        raw_text = extract_text_from_file(temp_path, file.filename)

        # 2. Chunking
        chunks = chunk_text_with_heading(raw_text)
        if not chunks:
            raise HTTPException(status_code=400, detail="Không trích xuất được nội dung có nghĩa từ file.")

        # 3. Lưu Metadata vào bảng rag_documents
        doc_data = {
            "filename": file.filename,
            "category": category,
            "created_at": datetime.now().isoformat()
        }
        doc_res = supabase.table("rag_documents").insert(doc_data).execute()
        if not doc_res.data:
            raise HTTPException(status_code=500, detail="Lỗi lưu metadata document.")

        document_id = doc_res.data[0]['id']

        # 4. Embedding & Lưu Chunks vào bảng rag_chunks
        chunk_rows = []
        for chunk in chunks:
            # Tạo vector bằng Ollama
            vector = get_ollama_embedding(chunk)

            chunk_rows.append({
                "document_id": document_id,
                "content": chunk,
                "content_norm": normalize_vi(chunk), # Lưu bản không dấu để search keyword
                "embedding": vector
            })

        # Insert batch
        if chunk_rows:
            supabase.table("rag_chunks").insert(chunk_rows).execute()

        return {
            "document_id": document_id,
            "filename": file.filename,
            "chunks_count": len(chunk_rows),
            "status": "success",
            "embed_model": OLLAMA_EMBED_MODEL
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        # Dọn dẹp file tạm
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.get("/documents", response_model=List[DocumentResponse])
async def list_documents(current_staff: dict = Depends(get_current_staff_profile)):
    """Liệt kê các tài liệu đã upload"""
    try:
        response = supabase.table("rag_documents").select("*").order("created_at", desc=True).execute()
        results = []
        for doc in response.data:
            results.append({
                "id": doc['id'],
                "filename": doc['filename'],
                "category": doc['category'],
                "created_at": doc['created_at'],
                "status": "indexed"
            })
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: int,
    current_staff: dict = Depends(get_current_staff_profile)
):
    """Xóa tài liệu và các chunk liên quan"""
    try:
        response = supabase.table("rag_documents").delete().eq("id", document_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Không tìm thấy tài liệu")
        return {"message": "Đã xóa tài liệu thành công", "id": document_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/retrieve")
async def retrieve_context(
    request: RetrieveRequest,
    current_staff: dict = Depends(get_current_staff_profile)
):
    """
    Search RAG:
    1. Embed query (Ollama)
    2. Hybrid Search (Vector + Keyword) via Supabase RPC
    3. Rerank (FlashRank)
    """
    try:
        print(f"\n--- 🔎 RAG SEARCH: '{request.query}' ---")

        # 1. Tạo Vector cho câu hỏi (Ollama)
        query_vector = get_ollama_embedding(request.query)
        query_norm = normalize_vi(request.query)

        # 2. Gọi RPC Hybrid Search (Lấy rộng 40 kết quả)
        params = {
            "query_embedding": query_vector,
            "query_text": query_norm,
            "match_threshold": 0.35, # Ngưỡng tương đối cho Nomic
            "match_count": 40
        }

        res = supabase.rpc("hybrid_match_rag_chunks", params).execute()
        candidates = res.data or []

        if not candidates:
            print("   -> Không tìm thấy ứng viên nào từ Vector/Keyword.")
            return []

        # 3. Rerank bằng FlashRank (Local)
        print(f"⚡ Reranking {len(candidates)} candidates with FlashRank...")

        passages = []
        for item in candidates:
            passages.append({
                "id": str(item['id']),
                "text": item['content'],
                "meta": item
            })

        rerank_request = RerankRequest(query=request.query, passages=passages)
        ranked_results = ranker.rerank(rerank_request)

        # 4. Filter & Format Results
        final_results = []
        MIN_SCORE = 0.5  # Ngưỡng FlashRank (có thể chỉnh 0.4 hoặc 0.6)

        print("--- SCORES ---")
        for item in ranked_results:
            score = float(item['score'])
            # Debug log
            # print(f"📄 {item['meta']['content'][:30]}... | Score: {score:.4f}")

            # Logic lấy kết quả: Điểm cao HOẶC có keyword match cứng
            keyword_bonus = item['meta'].get('keyword_score', 0)

            if score >= MIN_SCORE or keyword_bonus > 0:
                item['meta']['similarity'] = score
                final_results.append(item['meta'])

            if len(final_results) >= request.top_k:
                break

        # Fallback: Nếu lọc xong mà rỗng, lấy top 1 dù điểm thấp
        if not final_results and ranked_results:
            print("⚠️ Fallback to Top 1 result.")
            top = ranked_results[0]
            top['meta']['similarity'] = float(top['score'])
            final_results.append(top['meta'])

        return final_results

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))