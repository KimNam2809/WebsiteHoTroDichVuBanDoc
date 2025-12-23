import sys
import os

# Thêm đường dẫn hiện tại vào sys path để import các file cùng thư mục
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from load_files import load_rag_files
from chunker import chunk_documents
from embedder import embed_texts
from push_to_db import push_chunks

def main():
    # 1. Load Files
    print("📂 Loading files from rag_data...")
    # Giả sử chạy từ root, đường dẫn là rag_data
    docs = load_rag_files("rag_data")
    print(f"   -> Loaded {len(docs)} files.")

    # 2. Chunking
    print("✂️ Chunking...")
    chunks = chunk_documents(docs)
    print(f"   -> Created {len(chunks)} chunks.")

    # 3. Embedding
    print(f"🧠 Embedding {len(chunks)} chunks (This may take a while)...")
    texts = [c["content"] for c in chunks]
    embeddings = embed_texts(texts)

    # 4. Push DB
    print("📤 Pushing to Supabase...")
    push_chunks(chunks, embeddings)

    print("✅ INGEST DONE!")

if __name__ == "__main__":
    main()