# rag_api.py
# =============================
# Vietnamese-friendly RAG API (FINAL FIX)
# - Heading-aware Chunking (ROOT CAUSE FIX)
# - Hybrid Search (Vector + Full Text Search Supabase)
# - Vietnamese normalization (remove accents)
# - Public reranker (stable, no auth)
# =============================

import os
import re
import shutil
import traceback
import unicodedata
from datetime import datetime
from typing import List

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends

import pypdf
import docx

# Local AI Models
from sentence_transformers import SentenceTransformer, CrossEncoder

# Supabase
from supabase import create_client

# Auth & Config
from app.connect.auth import get_current_staff_profile
from app.connect.config import settings
from app.models.rag_models import DocumentResponse, RetrieveRequest

# =============================
# INITIALIZE
# =============================

router = APIRouter()

supabase = create_client(
    settings.SUPABASE_URL,
    settings.SUPABASE_SERVICE_ROLE_KEY
)

print("--- [System] Loading Vietnamese Embedding Model...")
embedding_model = SentenceTransformer(
    "bkai-foundation-models/vietnamese-bi-encoder"
)
print("--- [OK] Embedding Model Ready")

print("--- [System] Loading Public Reranker...")
reranker = CrossEncoder(
    "cross-encoder/ms-marco-MiniLM-L-6-v2"
)
print("--- [OK] Reranker Ready")

# =============================
# NORMALIZE (VIETNAMESE)
# =============================

def normalize_vi(text: str) -> str:
    text = text.lower().strip()
    text = unicodedata.normalize('NFD', text)
    text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text)

# =============================
# HELPER FUNCTIONS
# =============================

def extract_text_from_file(file_path: str, filename: str) -> str:
    ext = filename.split('.')[-1].lower()
    text = ""

    try:
        if ext == 'pdf':
            reader = pypdf.PdfReader(file_path)
            for page in reader.pages:
                if page.extract_text():
                    text += page.extract_text() + "\n"

        elif ext == 'docx':
            doc = docx.Document(file_path)
            for para in doc.paragraphs:
                if para.text.strip():
                    text += para.text.strip() + "\n"

        elif ext == 'txt':
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
        else:
            raise ValueError("File không hỗ trợ")

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Lỗi đọc file: {e}")

    return text


# =============================
# HEADING-AWARE CHUNKING (CRITICAL FIX)
# =============================

def chunk_text_with_heading(text: str) -> List[str]:
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
            if len(combined) >= 40:
                chunks.append(combined)
            buffer.clear()

    for line in lines:
        # Detect heading (not bullet, short line)
        if not line.startswith("+") and len(line) < 80:
            flush()
            current_heading = line
        else:
            buffer.append(line.lstrip("+ ").strip())

    flush()
    return chunks


def embed_text(text: str) -> List[float]:
    return embedding_model.encode(
        text,
        normalize_embeddings=True
    ).tolist()

# =============================
# API ENDPOINTS
# =============================

@router.post("/documents")
async def upload_document(
    file: UploadFile = File(...),
    category: str = Form("general"),
    current_staff: dict = Depends(get_current_staff_profile)
):
    temp_path = f"temp_{file.filename}"

    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        raw_text = extract_text_from_file(temp_path, file.filename)
        chunks = chunk_text_with_heading(raw_text)

        doc_res = supabase.table("rag_documents").insert({
            "filename": file.filename,
            "category": category,
            "created_at": datetime.now().isoformat()
        }).execute()

        document_id = doc_res.data[0]['id']

        chunk_rows = []
        for chunk in chunks:
            chunk_rows.append({
                "document_id": document_id,
                "content": chunk,
                "content_norm": normalize_vi(chunk),
                "embedding": embed_text(chunk)
            })

        if chunk_rows:
            supabase.table("rag_chunks").insert(chunk_rows).execute()

        return {
            "document_id": document_id,
            "filename": file.filename,
            "chunks": len(chunk_rows),
            "status": "indexed"
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)


@router.post("/retrieve")
async def retrieve_context(
    request: RetrieveRequest,
    current_staff: dict = Depends(get_current_staff_profile)
):
    try:
        query_norm = normalize_vi(request.query)
        query_vector = embed_text(request.query)

        params = {
            "query_embedding": query_vector,
            "query_text": query_norm,
            "match_threshold": 0.25,
            "match_count": 40
        }

        res = supabase.rpc("hybrid_match_rag_chunks", params).execute()
        candidates = res.data or []

        if not candidates:
            return []

        # Rerank
        pairs = [(request.query, c['content']) for c in candidates]
        scores = reranker.predict(pairs)

        reranked = sorted(
            zip(candidates, scores),
            key=lambda x: x[1],
            reverse=True
        )

        results = []
        for item, score in reranked:
            if score >= 0.35 or item.get("keyword_score", 0) > 0:
                item['similarity'] = float(score)
                results.append(item)
            if len(results) >= request.top_k:
                break

        if not results:
            top = reranked[0]
            top[0]['similarity'] = float(top[1])
            results.append(top[0])

        return results

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
