# app/services/embedding_service.py
from sentence_transformers import SentenceTransformer

print("--- [System] Đang tải BKAI Embedding Model (Chỉ load 1 lần)... ---")
# Model này chạy trên CPU/RAM, tạo vector 768 chiều
model = SentenceTransformer("bkai-foundation-models/vietnamese-bi-encoder")

def get_embedding(text: str) -> list:
    """Hàm chung để tạo vector"""
    # normalize_embeddings=True giúp so sánh cosine tốt hơn
    return model.encode(text, normalize_embeddings=True).tolist()