from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv() # Load .env

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not url or not key:
    raise ValueError("Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env")

supabase = create_client(url, key)

def push_chunks(chunks, embeddings):
    rows = []
    for chunk, embedding in zip(chunks, embeddings):
        rows.append({
            "source": chunk["source"],
            "category": chunk["category"],
            "content": chunk["content"],
            "embedding": embedding
        })

    # Insert batch 50 dòng để tránh lỗi timeout
    batch_size = 50
    for i in range(0, len(rows), batch_size):
        batch = rows[i:i+batch_size]
        try:
            supabase.table("rag_documents").insert(batch).execute()
            print(f"Saved batch {i} -> {i+len(batch)}")
        except Exception as e:
            print(f"Error inserting batch: {e}")