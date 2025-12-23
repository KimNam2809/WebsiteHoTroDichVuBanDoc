from sentence_transformers import SentenceTransformer

# Load model 1 lần
print("⏳ Loading embedding model BAAI/bge-m3...")
model = SentenceTransformer("BAAI/bge-m3", trust_remote_code=True)
print("✅ Model loaded.")

def embed_texts(texts):
    # bge-m3 không bắt buộc prefix "document:" nhưng thêm vào cũng tốt
    # Tuy nhiên code test của bạn dùng "document: ", ta giữ nguyên
    processed_texts = ["document: " + t for t in texts]

    embeddings = model.encode(
        processed_texts,
        normalize_embeddings=True,
        show_progress_bar=True,
        batch_size=16
    )
    return embeddings.tolist()