from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from typing import List, Optional, Dict
import logging, asyncio, time, re
from math import ceil

from app.models.bai_viet import BaiViet, BaiVietCreate, BaiVietUpdate
from app.connect.db import supabase_client
from app.connect.auth import get_current_staff_profile
from app.utils import to_json_safe

router = APIRouter()
logger = logging.getLogger(__name__)

TABLE_NAME = "baiviet"
STORAGE_BUCKET = "news_images"

@router.get("/", summary="Lấy danh sách bài viết (Phân trang & Lọc)")
async def get_list_posts(
    page: int = Query(1, ge=1, description="Số trang hiện tại (bắt đầu từ 1)"),
    limit: int = Query(15, ge=1, le=100, description="Số lượng bài viết mỗi trang (Mặc định 15)"),
    category: Optional[str] = Query(None, description="Lọc theo từ khóa: tin-tuc, su-kien, hoat-dong..."),
    search: Optional[str] = Query(None, description="Tìm kiếm theo tiêu đề bài viết")
):
    """
    API lấy danh sách bài viết public cho trang chủ/trang tin tức.
    - Hỗ trợ phân trang.
    - Hỗ trợ lọc theo từ khóa (trong mảng tukhoa).
    - Hỗ trợ tìm kiếm tiêu đề.
    """
    CATEGORY_MAPPING = {
    "tin-tuc": "tin tức",
    "su-kien": "sự kiện",
    "hoat-dong": "hoạt động",
    "thong-bao": "thông báo",
    "noi-bat": "nổi bật",
}
    try:
        start = (page - 1) * limit
        end = start + limit - 1

        # 2. Xây dựng Query cơ bản
        # count="exact" để lấy tổng số dòng thỏa mãn điều kiện (dùng tính tổng số trang)
        # Chỉ lấy các cột cần thiết để hiển thị list (bỏ noidung nếu quá nặng, hoặc lấy để cắt chuỗi)
        query = supabase_client.table("baiviet")\
            .select("mabaiviet, tieude, anhdaidien, ngaydang, tukhoa, soluotxem, ghichu, noidung, trangthai", count="exact")\
            .eq("trangthai", True)\
            .order("ngaydang", desc=True)

        # 3. Áp dụng bộ lọc
        if category and category != 'all':
            # Logic:
            # - Thử tìm trong từ điển Mapping trước (VD: tin-tuc -> tin tức)
            # - Nếu không có trong từ điển, dùng chính giá trị gửi lên (đề phòng trường hợp frontend gửi đúng tiếng việt)
            # - .lower() để đảm bảo không lỗi do viết hoa/thường

            clean_category = category.strip().lower() # Xóa khoảng trắng thừa và viết thường

            # Tìm trong map, nếu không thấy thì giữ nguyên giá trị gốc
            db_category_value = CATEGORY_MAPPING.get(clean_category, clean_category)

            # In ra log để debug xem nó đang tìm từ khóa gì
            # logger.info(f"Searching category: Input={category} -> DB={db_category_value}")

            # Query vào DB
            query = query.contains("tukhoa", [db_category_value])

        if search:
            # Tìm kiếm không phân biệt hoa thường (%search%)
            query = query.ilike("tieude", f"%{search}%")

        # 4. Áp dụng phân trang
        query = query.range(start, end)

        # 5. Thực thi
        response = query.execute()

        # 6. Tính toán Metadata phân trang
        total_items = response.count if response.count else 0
        total_pages = ceil(total_items / limit)

        return {
            "data": response.data,
            "meta": {
                "current_page": page,
                "items_per_page": limit,
                "total_items": total_items,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        }

    except Exception as e:
        logger.error(f"Lỗi lấy danh sách bài viết: {e}")
        return {
            "data": [],
            "meta": {
                "current_page": page,
                "items_per_page": limit,
                "total_items": 0,
                "total_pages": 0
            }
        }

# --- API TĂNG LƯỢT XEM ---
@router.post("/{maBaiViet}/tang-luot-xem", status_code=status.HTTP_200_OK, summary="Tăng lượt xem bài viết lên 1")
async def increase_view_count(maBaiViet: int):
    try:
        # Cách tối ưu nhất: Gọi RPC (Stored Procedure) trong Supabase để đảm bảo tính toàn vẹn (Atomic Update)
        # Tuy nhiên, để đơn giản và không cần cấu hình SQL phức tạp, ta dùng cách python thủ công:

        # B1: Lấy lượt xem hiện tại
        res = supabase_client.table("baiviet").select("soluotxem").eq("mabaiviet", maBaiViet).execute()
        if not res.data:
            return {"message": "Bài viết không tồn tại"}

        current_view = res.data[0].get("soluotxem", 0) or 0

        # B2: Cập nhật +1
        supabase_client.table("baiviet").update({"soluotxem": current_view + 1}).eq("mabaiviet", maBaiViet).execute()

        return {"success": True, "new_view": current_view + 1}
    except Exception as e:
        logger.error(f"Lỗi tăng view bài {maBaiViet}: {e}")
        # Không raise lỗi 500 để tránh ảnh hưởng trải nghiệm người dùng, chỉ log lỗi
        return {"success": False, "error": str(e)}

# --- API LẤY BÀI VIẾT LIÊN QUAN (MỚI NHẤT) ---
@router.get("/lien-quan/{maBaiViet}", response_model=List[dict], summary="Lấy 4 bài viết mới nhất (trừ bài hiện tại)")
async def get_related_posts(maBaiViet: int):
    try:
        # Logic: Lấy 4 bài viết có maBaiViet KHÁC maBaiViet hiện tại, sắp xếp mới nhất
        response = supabase_client.table("baiviet")\
            .select("mabaiviet, tieude, anhdaidien, ngaydang, tukhoa, soluotxem")\
            .neq("mabaiviet", maBaiViet)\
            .eq("trangthai", True)\
            .order("ngaydang", desc=True)\
            .limit(4)\
            .execute()

        return response.data
    except Exception as e:
        logger.error(f"Lỗi lấy bài liên quan: {e}")
        return []

# Upload ảnh lẻ để lấy URL
# Hàm helper upload đơn lẻ (để dùng trong vòng lặp bất đồng bộ)
async def upload_single_file_to_supabase(file: UploadFile):
    try:
        # Validate ảnh
        if not file.content_type.startswith("image/"):
            return {"filename": file.filename, "error": "Không phải file ảnh"}

        # Tạo tên file
        clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '', file.filename.replace(" ", "_"))
        # Thêm random string nhỏ để tránh trùng lặp tuyệt đối nếu upload nhanh
        file_name = f"batch_{int(time.time()*1000)}_{clean_name}"

        # Đọc file (Async read)
        file_content = await file.read()

        # Upload
        supabase_client.storage.from_(STORAGE_BUCKET).upload(
            path=file_name,
            file=file_content,
            file_options={"content-type": file.content_type}
        )

        # Lấy URL
        url = supabase_client.storage.from_(STORAGE_BUCKET).get_public_url(file_name)

        # Trả về kết quả mapping: Tên gốc -> URL mới
        # Dùng filename làm key để Frontend dễ map lại
        return {
            "original_name": file.filename,
            "url": url,
            "success": True
        }
    except Exception as e:
        return {"original_name": file.filename, "error": str(e), "success": False}

# Upload nhiều ảnh cùng lúc (Batch Upload)
@router.post("/images", summary="Upload nhiều ảnh cùng lúc (Batch Upload)")
async def upload_multiple_images(files: List[UploadFile] = File(...)):
    """
    API nhận danh sách file, upload song song lên Supabase và trả về danh sách URL.
    """
    if not files:
        raise HTTPException(status_code=400, detail="Không có file nào được gửi lên")

    # Bắt đầu thời gian đo
    start_time = time.time()

    # Tạo danh sách các tác vụ (Tasks) để chạy song song
    tasks = [upload_single_file_to_supabase(file) for file in files]

    # Chạy tất cả cùng lúc và chờ kết quả
    results = await asyncio.gather(*tasks)

    process_time = time.time() - start_time

    return {
        "data": results,
        "process_time_seconds": round(process_time, 2),
        "total_files": len(files)
    }

# 1. CREATE
@router.post("/", summary="Tạo mới bài viết", status_code=201)
async def create_bai_viet(
    post_data: BaiVietCreate,
    current_staff: dict = Depends(get_current_staff_profile)
):
    try:
        # 1. Chuyển đổi danh sách ảnh sang cấu trúc JSONB yêu cầu
        # Cấu trúc: { "anh_1": url1, "anh_2": url2 ... }
        # Lưu ý: Bạn có thể muốn lưu cả chú thích vào JSONB này nếu cần
        anh_dai_dien_json = {}
        if post_data.danh_sach_anh:
            for idx, img in enumerate(post_data.danh_sach_anh):
                # Lưu URL. Nếu muốn lưu cả chú thích thì đổi value thành dict
                anh_dai_dien_json[f"anh_{idx + 1}"] = img.url

        # 2. Chuẩn bị data DB
        new_record = {
            "manhanvien": current_staff["manhanvien"],
            "tieude": post_data.tieude,
            "noidung": post_data.noidung,
            "anhdaidien": anh_dai_dien_json, # JSONB
            "tukhoa": post_data.tukhoa, # Supabase hỗ trợ lưu mảng text[]
            "ghichu": post_data.ghichu,
            "trangthai": post_data.trangthai,
            "soluotxem": 0,
            "soluotchiase": 0
            # ngaydang, updated_at tự động gen
        }

        # 3. Insert
        res = supabase_client.table("baiviet").insert(new_record).execute()

        if res.data:
            return res.data[0]
        raise HTTPException(status_code=400, detail="Không có dữ liệu trả về từ DB")

    except Exception as e:
        # Log error
        raise HTTPException(status_code=500, detail=str(e))

# 2. READ ONE
@router.get(
    "/{maBaiViet}",
    response_model=BaiViet,
    status_code=status.HTTP_200_OK,
    summary="Lấy chi tiết một bài viết"
)
def get_bai_viet_by_id(maBaiViet: int):
    """Lấy thông tin chi tiết của một bài viết bằng ID."""
    try:
        response = supabase_client.table(TABLE_NAME).select("*").eq("mabaiviet", maBaiViet).single().execute()
        if response.data:
            return response.data
        # Nếu không tìm thấy, .single() sẽ raise exception, sẽ được catch ở dưới
    except Exception as e:
        logger.warning("Không tìm thấy BaiViet ID %s: %s", maBaiViet, e)
        # Kiểm tra nếu lỗi là do không tìm thấy dòng nào
        if "PGRST116" in str(e) or "contains 0 rows" in str(e):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy bài viết với id={maBaiViet}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 3. UPDATE
@router.put(
    "/{maBaiViet}",
    response_model=dict, # Trả về data sau khi update
    status_code=status.HTTP_200_OK,
    summary="Cập nhật bài viết (Nhận JSON)"
)
async def update_bai_viet(
    maBaiViet: int,
    post_data: BaiVietUpdate,
    current_staff: dict = Depends(get_current_staff_profile)
):
    try:
        # 1. Chuẩn bị dữ liệu để update vào DB
        update_data = {
            "ngaycapnhat": "now()", # Cập nhật thời gian
        }

        if post_data.tieude is not None:
            update_data["tieude"] = post_data.tieude
        if post_data.noidung is not None:
            update_data["noidung"] = post_data.noidung
        if post_data.ghichu is not None:
            update_data["ghichu"] = post_data.ghichu
        if post_data.trangthai is not None:
            update_data["trangthai"] = post_data.trangthai
        if post_data.tukhoa is not None:
            update_data["tukhoa"] = post_data.tukhoa

        # 2. Xử lý Ảnh (Chuyển List Object -> JSONB Dict)
        # Frontend gửi: [{url: "...", chu_thich: "..."}]
        # DB lưu: {"anh_1": "url", "anh_2": "url"} (Theo cấu trúc cũ của bạn)
        if post_data.danh_sach_anh is not None:
            anh_dai_dien_json = {}
            for idx, img in enumerate(post_data.danh_sach_anh):
                anh_dai_dien_json[f"anh_{idx + 1}"] = img.url

            update_data["anhdaidien"] = anh_dai_dien_json

        # 3. Thực thi Update
        # Sử dụng to_json_safe (nếu bạn có hàm helper này) hoặc dict thường
        response = supabase_client.table("baiviet").update(update_data).eq("mabaiviet", maBaiViet).execute()

        if response.data:
            return response.data[0]

        raise HTTPException(status_code=404, detail="Không tìm thấy bài viết hoặc không có quyền sửa")

    except Exception as e:
        logger.error(f"Lỗi update bài viết {maBaiViet}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# 4. DELETE
@router.delete(
    "/{maBaiViet}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa một bài viết"
)
def delete_bai_viet(maBaiViet: int, current_staff: dict = Depends(get_current_staff_profile)):
    """Xóa một bài viết."""
    try:
        response = supabase_client.table(TABLE_NAME).delete().eq("mabaiviet", maBaiViet).execute()

        # Supabase delete trả về data là list các dòng đã xóa. Nếu rỗng nghĩa là không xóa được gì (ID sai).
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy bài viết với id={maBaiViet} để xóa")

        return
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error("Lỗi khi xóa BaiViet ID %s: %s", maBaiViet, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))