from app.connect.db import supabase_client

def search_books_by_title(keyword: str):
    """
    Tìm sách trong bảng TacPham (CSDL thật)
    """
    try:
        # Tìm gần đúng (ilike)
        response = supabase_client.table("tacpham")\
            .select("tentacpham, tacgia, namxuatban, mota, bansao(vitri)")\
            .ilike("tentacpham", f"%{keyword}%")\
            .limit(5)\
            .execute()

        books = response.data
        if not books:
            return {"books": []}

        # Format lại dữ liệu cho đẹp
        result = []
        for b in books:
            vi_tri = "Chưa cập nhật"
            if b.get('bansao') and len(b['bansao']) > 0:
                vi_tri = b['bansao'][0].get('vitri', 'Kho chung')

            result.append({
                "tentacpham": b['tentacpham'],
                "tacgia": b.get('tacgia', 'N/A'),
                "nam": b.get('namxuatban', 'N/A'),
                "vi_tri": vi_tri
            })

        return {"books": result}
    except Exception as e:
        print(f"Lỗi tìm sách: {e}")
        return f"Lỗi hệ thống khi tìm sách: {str(e)}"