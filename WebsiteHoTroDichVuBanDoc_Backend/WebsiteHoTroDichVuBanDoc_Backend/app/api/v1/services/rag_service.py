from app.connect.db import supabase_client
from sentence_transformers import SentenceTransformer

# Load model BGE-M3 (Vector 1024)
embed_model = SentenceTransformer("BAAI/bge-m3", trust_remote_code=True)

def query_rag_context(user_query: str, match_threshold: float = 0.35, match_count: int = 5):
    """
    Tìm kiếm ngữ cảnh từ bảng rag_documents
    """
    try:
        # 1. Embed query
        # bge-m3 yêu cầu prefix "query: "
        query_text = "query: " + user_query
        query_embedding = embed_model.encode(query_text, normalize_embeddings=True).tolist()

        # 2. Gọi hàm RPC "match_documents" (Đã tạo ở Bước 1)
        rpc_response = supabase_client.rpc("match_documents", {
            "query_embedding": query_embedding,
            "match_threshold": match_threshold,
            "match_count": match_count
        }).execute()

        if not rpc_response.data:
            return "" # Trả về rỗng để Brain biết mà xử lý

        # 3. Format kết quả
        context_parts = []
        for doc in rpc_response.data:
            # Thêm nguồn để AI biết trích dẫn từ đâu
            part = f"--- Nguồn: {doc['category']} ---\n{doc['content']}"
            context_parts.append(part)

        return "\n\n".join(context_parts)

    except Exception as e:
        print(f"❌ Lỗi RAG Service: {e}")
        return ""