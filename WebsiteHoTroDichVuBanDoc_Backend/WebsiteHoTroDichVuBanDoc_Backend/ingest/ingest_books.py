import os
import sys
from dotenv import load_dotenv
from supabase import create_client
from sentence_transformers import SentenceTransformer
from tqdm import tqdm

# Load môi trường
load_dotenv()
sys.path.append(os.getcwd())

# Cấu hình Supabase & Model
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

print("⏳ Loading embedding model BAAI/bge-m3...")
model = SentenceTransformer("BAAI/bge-m3", trust_remote_code=True)

def fetch_books_with_relations():
    """
    Lấy dữ liệu sách kèm các quan hệ: Bản sao, Danh mục, Từ khóa
    """
    print("📥 Fetching books from Database...")
    try:
        # Query lồng nhau để lấy dữ liệu liên kết
        response = supabase.table("tacpham").select(
            "matacpham, tentacpham, tacgia, mota, namxuatban, isbn,"
            "bansao(vitri, vitrikengan, trangthaichomuon),"
            "tacpham_danhmuc(danhmuc(tendanhmuc)),"
            "tacpham_tukhoa(tukhoa(tentukhoa))"
        ).execute()
        return response.data
    except Exception as e:
        print(f"❌ Lỗi truy vấn DB: {e}")
        return []

def format_book_content(book):
    """
    Chuyển đổi Object sách thành đoạn văn ngữ nghĩa cho AI đọc
    """
    # 1. Xử lý Vị trí & Trạng thái (Từ bảng BanSao)
    copies_info = []
    if book.get('bansao'):
        for bs in book['bansao']:
            vi_tri = bs.get('vitri') or "Kho chung"
            ke = bs.get('vitrikengan') or "Chưa xếp"
            trang_thai = "Được mượn" if bs.get('trangthaichomuon') else "Chỉ đọc tại chỗ"
            copies_info.append(f"[{vi_tri} - {ke} ({trang_thai})]")

    location_str = "; ".join(copies_info) if copies_info else "Hiện chưa có bản sao nào trong kho."

    # 2. Xử lý Danh mục
    categories = []
    if book.get('tacpham_danhmuc'):
        for item in book['tacpham_danhmuc']:
            if item.get('danhmuc'):
                categories.append(item['danhmuc'].get('tendanhmuc'))
    cat_str = ", ".join(filter(None, categories))

    # 3. Xử lý Từ khóa
    keywords = []
    if book.get('tacpham_tukhoa'):
        for item in book['tacpham_tukhoa']:
            if item.get('tukhoa'):
                keywords.append(item['tukhoa'].get('tentukhoa'))
    kw_str = ", ".join(filter(None, keywords))

    # 4. Tạo nội dung Rich Text
    # Đây là đoạn văn mà AI sẽ "học"
    content = (
        f"Tác phẩm: {book['tentacpham']}\n"
        f"Tác giả: {book.get('tacgia') or 'Chưa rõ'}\n"
        f"Năm xuất bản: {book.get('namxuatban') or 'N/A'}\n"
        f"Thể loại: {cat_str}\n"
        f"Từ khóa: {kw_str}\n"
        f"Mô tả nội dung: {book.get('mota') or 'Đang cập nhật'}\n"
        f"📍 VỊ TRÍ LƯU TRỮ VÀ TRẠNG THÁI: {location_str}"
    )

    return content

def main():
    # 1. Lấy dữ liệu
    books = fetch_books_with_relations()
    if not books:
        print("Không có sách nào để xử lý.")
        return

    print(f"📚 Tìm thấy {len(books)} sách. Bắt đầu Vector hóa...")

    # 2. Xóa dữ liệu sách cũ trong rag_documents (để tránh trùng lặp)
    # Giả sử category cho sách là 'book_database'
    supabase.table("rag_documents").delete().eq("category", "book_database").execute()

    chunks_to_insert = []

    for book in tqdm(books):
        content = format_book_content(book)

        # Tạo embedding (bge-m3 cần prefix cho document)
        embedding = model.encode("document: " + content, normalize_embeddings=True).tolist()

        chunks_to_insert.append({
            "source": f"DB_Book_ID_{book['matacpham']}",
            "category": "book_database", # Đánh dấu đây là dữ liệu sách
            "content": content,
            "embedding": embedding
        })

        # Insert Batch (50 cuốn một lần)
        if len(chunks_to_insert) >= 50:
            supabase.table("rag_documents").insert(chunks_to_insert).execute()
            chunks_to_insert = []

    # Insert số còn lại
    if chunks_to_insert:
        supabase.table("rag_documents").insert(chunks_to_insert).execute()

    print("✅ Đã nạp toàn bộ Sách vào Trí tuệ nhân tạo thành công!")

if __name__ == "__main__":
    main()