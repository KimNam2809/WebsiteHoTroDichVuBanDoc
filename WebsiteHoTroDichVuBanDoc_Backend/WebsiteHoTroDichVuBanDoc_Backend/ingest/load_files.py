import os

def load_rag_files(base_path="rag_data"):
    docs = []
    if not os.path.exists(base_path):
        print(f"❌ Không tìm thấy thư mục: {base_path}")
        return []

    for root, _, files in os.walk(base_path):
        for file in files:
            if file.endswith((".md", ".json", ".txt")):
                path = os.path.join(root, file)
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        docs.append({
                            "source": path,
                            "category": os.path.basename(root), # Lấy tên thư mục làm category
                            "content": f.read()
                        })
                except Exception as e:
                    print(f"Lỗi đọc file {path}: {e}")
    return docs