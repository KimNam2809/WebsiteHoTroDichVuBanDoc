from sentence_transformers import SentenceTransformer
from supabase import create_client
from dotenv import load_dotenv
import os

# Load env
load_dotenv()

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

# Load model (CHUNG với ingest)
model = SentenceTransformer(
    "BAAI/bge-m3",
    trust_remote_code=True
)

def embed_query(query: str):
    """
    bge-m3 BẮT BUỘC phân biệt query / document
    """
    query = "query: " + query
    emb = model.encode(
        [query],
        normalize_embeddings=True
    )
    return emb[0].tolist()

def search(query, limit=5):
    query_embedding = embed_query(query)

    response = supabase.rpc(
        "match_rag_documents",
        {
            "query_embedding": query_embedding,
            "match_count": limit
        }
    ).execute()

    return response.data

if __name__ == "__main__":
    query = "Thủ tục cấp thẻ thư viện cho sinh viên"

    print("🔍 QUERY:", query)
    print("=" * 70)

    results = search(query)

    if not results:
        print("❌ Không tìm thấy kết quả nào")
    else:
        for i, r in enumerate(results, 1):
            print(f"\n📌 Result {i}")
            print("📂 Category:", r["category"])
            print("📄 Source:", r["source"])
            print("📊 Similarity:", round(r["similarity"], 4))
            print("📝 Content:\n", r["content"])
