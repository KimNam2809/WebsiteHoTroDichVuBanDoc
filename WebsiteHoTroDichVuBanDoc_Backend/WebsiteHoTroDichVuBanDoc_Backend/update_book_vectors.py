import os
import sys
import re
import glob
import unicodedata
from datetime import datetime
import ollama

# Thêm đường dẫn project để import config
sys.path.append(os.getcwd())

from app.connect.config import settings
from supabase import create_client

# --- CẤU HÌNH ---
supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
OLLAMA_MODEL = "nomic-embed-text"

# Đường dẫn thư mục Markdown của bạn
MARKDOWN_ROOT = "rag_data"

def normalize_vi(text: str) -> str:
    """Chuẩn hóa tiếng Việt cho tìm kiếm Hybrid"""
    if not text: return ""
    text = text.lower().strip()
    text = unicodedata.normalize('NFD', text)
    text = ''.join(c for c in text if unicodedata.category(c) != 'Mn')
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()

def chunk_markdown_by_heading(text: str) -> list[str]:
    """Cắt file Markdown dựa trên Heading #, ##"""
    lines = text.split('\n')
    chunks = []
    current_chunk = []
    current_header = ""

    for line in lines:
        stripped = line.strip()
        # Nếu gặp Header mới (# hoặc ##)
        if stripped.startswith('#'):
            if current_chunk:
                full_text = f"{current_header}\n" + "\n".join(current_chunk)
                chunks.append(full_text.strip())
                current_chunk = []
            current_header = stripped.lstrip('#').strip()
        else:
            if stripped:
                current_chunk.append(stripped)

    # Add đoạn cuối
    if current_chunk:
        full_text = f"{current_header}\n" + "\n".join(current_chunk)
        chunks.append(full_text.strip())

    return chunks

# ============================================================
# PHẦN 1: XỬ LÝ DỮ LIỆU CẤU TRÚC (SQL JOIN)
# ============================================================

def ingest_structured_data():
    print("\n🔵 [PHASE 1] Đang xử lý dữ liệu SQL (Books + Location)...")

    # Dùng Client Library để lấy dữ liệu thay vì Raw SQL
    # Cú pháp select: Lấy cột của TacPham, kèm theo BanSao và DanhMuc
    # Lưu ý: Tên bảng phải khớp chính xác với trong Database (TacPham, BanSao...)
    try:
        response = supabase.table("tacpham").select(
            "matacpham, tentacpham, tacgia, mota, namxuatban, bansao(vitri, vitrikengan), tacpham_danhmuc(danhmuc(tendanhmuc)), tacpham_tukhoa(tukhoa(tentukhoa))"
        ).execute()

        books = response.data
        processed_chunks = []

        print(f"--> Tìm thấy {len(books)} đầu sách. Đang tạo Rich Context...")

        for book in books:
            # 1. Xử lý Vị trí (Từ bảng BanSao)
            locations = set()
            if book.get('bansao'):
                for bs in book['bansao']:
                    # Kiểm tra null/None
                    vt = bs.get('vitri') or "Kho chung"
                    ke = bs.get('vitrikenngan') or "Chưa xếp"
                    loc = f"{vt} - {ke}"
                    locations.add(loc)

            location_str = "; ".join(locations) if locations else "Đang cập nhật vị trí"

            # 2. Xử lý Danh mục (Từ bảng trung gian TacPham_DanhMuc -> DanhMuc)
            categories = []
            if book.get('tacpham_danhmuc'):
                for item in book['tacpham_danhmuc']:
                    # item là dict chứa key 'DanhMuc', bên trong mới có 'tenDanhMuc'
                    if item.get('danhmuc'):
                        categories.append(item['danhmuc'].get('tendanhmuc', ''))
            category_str = ", ".join(filter(None, categories)) # Lọc bỏ chuỗi rỗng

            # 3. Xử lý Danh mục (Từ bảng trung gian TacPham_DanhMuc -> DanhMuc)
            keywords = []
            if book.get('tacpham_tukhoa'):
                for item in book['tacpham_tukhoa']:
                    # item là dict chứa key 'tukhoa', bên trong mới có 'tentukhoa'
                    if item.get('tukhoa'):
                        keywords.append(item['tukhoa'].get('tentukhoa', ''))
            keyword_str = ", ".join(filter(None, keywords)) # Lọc bỏ chuỗi rỗng

            # 4. TẠO ĐOẠN VĂN MÔ TẢ (Rich Text) cho AI đọc
            content = (
                f"Thông tin sách: {book.get('tentacpham', '')}. "
                f"Tác giả: {book.get('tacgia', 'Chưa rõ')}. "
                f"Thể loại/Danh mục: {category_str}. "
                f"Thể loại/Từ khóa: {keyword_str}. "
                f"Vị trí lưu trữ trong thư viện: {location_str}. "
                f"Mô tả nội dung: {book.get('mota', '')}"
            )

            # Làm sạch khoảng trắng thừa
            content = " ".join(content.split())

            processed_chunks.append({
                "content": content,
                "filename": "DATABASE_SACH",
                "category": "sach_va_vi_tri"
            })

        return processed_chunks

    except Exception as e:
        print(f"❌ Lỗi khi lấy dữ liệu từ Supabase: {e}")
        # In thêm chi tiết để debug nếu tên bảng sai
        import traceback
        traceback.print_exc()
        return []

# ============================================================
# PHẦN 2: XỬ LÝ DỮ LIỆU MARKDOWN (FILES)
# ============================================================

def ingest_markdown_files():
    print(f"\n🔵 [PHASE 2] Đang quét thư mục '{MARKDOWN_ROOT}'...")
    processed_chunks = []

    # Dùng glob để quét đệ quy tất cả file .md
    files = glob.glob(f"{MARKDOWN_ROOT}/**/*.md", recursive=True)

    for file_path in files:
        filename = os.path.basename(file_path)
        # Lấy tên thư mục cha làm category (vd: gio_lam_viec, noi_quy)
        category = os.path.basename(os.path.dirname(file_path))

        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()

        # Cắt nhỏ theo heading
        chunks = chunk_markdown_by_heading(text)

        for chunk in chunks:
            # Thêm tên file vào nội dung để AI biết ngữ cảnh
            # Ví dụ: "Theo quy định Tiền cược (le_phi_va_tien_coc.md): ..."
            enriched_content = f"Tài liệu {filename}: {chunk}"

            processed_chunks.append({
                "content": enriched_content,
                "filename": filename,
                "category": category
            })

    print(f"--> Đã xử lý {len(files)} file Markdown thành {len(processed_chunks)} đoạn tin.")
    return processed_chunks

# ============================================================
# PHẦN 3: EMBED VÀ LƯU VÀO SUPABASE
# ============================================================

def main():
    # 1. Xóa dữ liệu cũ (Làm sạch)
    print("🧹 Đang dọn dẹp Database RAG...")
    supabase.table("rag_chunks").delete().neq("id", 0).execute() # Xóa hết
    supabase.table("rag_documents").delete().neq("id", 0).execute()

    # 2. Tổng hợp dữ liệu
    data_books = ingest_structured_data()
    data_files = ingest_markdown_files()

    all_data = data_books + data_files
    print(f"\n🚀 TỔNG CỘNG: {len(all_data)} đoạn dữ liệu cần Vector hóa.")

    # 3. Tạo Document cha (để quản lý)
    # Gom nhóm theo filename để tạo rag_documents
    doc_map = {} # filename -> doc_id

    for item in all_data:
        fname = item['filename']
        if fname not in doc_map:
            res = supabase.table("rag_documents").insert({
                "filename": fname,
                "category": item['category'],
                "created_at": datetime.now().isoformat()
            }).execute()
            doc_map[fname] = res.data[0]['id']

    # 4. Vector hóa & Insert Chunks
    chunk_buffer = []

    for i, item in enumerate(all_data):
        try:
            # Gọi Ollama tạo Vector
            vec_res = ollama.embeddings(model=OLLAMA_MODEL, prompt=item['content'])
            vector = vec_res['embedding']

            chunk_buffer.append({
                "document_id": doc_map[item['filename']],
                "content": item['content'],
                "content_norm": normalize_vi(item['content']),
                "embedding": vector
            })

            # Batch insert 50 cái một
            if len(chunk_buffer) >= 50:
                supabase.table("rag_chunks").insert(chunk_buffer).execute()
                print(f"   ✅ Đã lưu {i+1}/{len(all_data)}...")
                chunk_buffer = []

        except Exception as e:
            print(f"❌ Lỗi dòng {i}: {e}")

    # Insert nốt phần dư
    if chunk_buffer:
        supabase.table("rag_chunks").insert(chunk_buffer).execute()

    print("\n🎉 HOÀN TẤT! Kiến thức đã được nạp đầy đủ.")

if __name__ == "__main__":
    main()