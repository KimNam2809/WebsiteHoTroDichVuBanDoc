import os
import time
import google.generativeai as genai
from supabase import create_client
from app.connect.config import settings

# 1. Cấu hình Google Gemini
genai.configure(api_key=settings.GOOGLE_API_KEY)

# 2. Kết nối Supabase (Cloud)
# Lưu ý: Thao tác trên Cloud, sau đó dùng backup kéo về Local sau
supa_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

def generate_embedding(text):
    """Hàm gọi Google AI để tạo vector"""
    try:
        # Model 'text-embedding-004' là model mới nhất, tối ưu cho tìm kiếm
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="retrieval_document", # Loại tác vụ: Lưu trữ tài liệu để tìm kiếm
            title="Mô tả sách"
        )
        return result['embedding']
    except Exception as e:
        print(f"❌ Lỗi gọi Gemini: {e}")
        return None

def process_books():
    print("🚀 BẮT ĐẦU TIẾN TRÌNH VECTOR HÓA DỮ LIỆU SÁCH...")

    # 3. Lấy danh sách sách từ bảng gốc
    # Chỉ lấy những cuốn sách CHƯA CÓ trong bảng embeddings (để chạy bổ sung)
    # Hoặc lấy tất cả nếu muốn làm mới lại
    print("   ↳ Đang tải danh sách sách...")

    # Lấy toàn bộ sách (bạn có thể tối ưu bằng cách join để lọc sách đã có)
    response = supa_client.table("tacpham").select("*").execute()
    books = response.data

    print(f"   ↳ Tìm thấy {len(books)} cuốn sách.")

    success_count = 0

    for book in books:
        ma_sach = book['matacpham']
        ten_sach = book['tentacpham']
        tac_gia = book['tacgia']
        mo_ta = book.get('mo_ta', '') # Lấy mô tả mới đã chỉnh sửa

        # 4. Tạo "Rich Context" (Nội dung ngữ nghĩa)
        # Đây là đoạn văn bản mà AI sẽ đọc hiểu. Kết hợp nhiều trường lại.
        rich_content = f"Tác phẩm: {ten_sach}. Tác giả: {tac_gia}. Nội dung chi tiết: {mo_ta}"

        print(f"   ⚡ Đang xử lý: {ten_sach}...")

        # 5. Gọi Gemini tạo Vector
        vector = generate_embedding(rich_content)

        if vector:
            # 6. Lưu vào bảng tacpham_embeddings
            data_insert = {
                "matacpham": ma_sach,
                "noi_dung_vector": rich_content,
                "embedding": vector,
                "updated_at": "now()"
            }

            try:
                # Upsert: Nếu có rồi thì cập nhật, chưa có thì thêm mới
                supa_client.table("tacpham_embeddings").upsert(data_insert, on_conflict="matacpham").execute()
                print(f"     ✅ Đã lưu vector thành công.")
                success_count += 1
            except Exception as e:
                print(f"     ❌ Lỗi lưu DB: {e}")

        # Ngủ 0.5 giây để tránh bị Google chặn vì spam request quá nhanh
        time.sleep(0.5)

    print(f"\n🎉 HOÀN TẤT! Đã vector hóa {success_count}/{len(books)} cuốn sách.")

if __name__ == "__main__":
    process_books()