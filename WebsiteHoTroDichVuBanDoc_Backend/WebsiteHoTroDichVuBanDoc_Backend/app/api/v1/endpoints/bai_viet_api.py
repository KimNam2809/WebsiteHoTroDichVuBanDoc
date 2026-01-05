from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from typing import List, Optional, Dict
import logging, asyncio, time, re

from app.models.bai_viet import BaiViet, BaiVietCreate
from app.connect.db import supabase_client
from app.connect.auth import get_current_staff_profile
from app.utils import to_json_safe

router = APIRouter()
logger = logging.getLogger(__name__)

TABLE_NAME = "baiviet"
STORAGE_BUCKET = "news_images" # Tên bucket chứa ảnh bài viết

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

# 2. READ ALL
@router.get(
    "/",
    response_model=List[BaiViet],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách tất cả bài viết"
)
def get_all_bai_viet():
    """
    Lấy danh sách tất cả bài viết,
    sắp xếp theo ngày đăng mới nhất lên trước.
    """
    try:
        response = supabase_client.table(TABLE_NAME).select("*").order("ngaydang", desc=True).execute()
        if response.data:
            return response.data
        return []
    except Exception as e:
        logger.error("Lỗi khi lấy tất cả BaiViet: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 3. READ ONE
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

# 4. UPDATE
@router.put(
    "/{maBaiViet}",
    response_model=BaiViet,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật thông tin bài viết (Có hỗ trợ upload ảnh mới)"
)
async def update_bai_viet(
    maBaiViet: int,
    # Các trường update optional
    tieude: Optional[str] = Form(None),
    noidung: Optional[str] = Form(None),
    tukhoa: Optional[str] = Form(None),
    ghichu: Optional[str] = Form(None),
    trangthai: Optional[bool] = Form(None),
    # Files mới (nếu muốn thay thế hoặc thêm)
    # Lưu ý: Logic update ảnh ở đây là: Nếu gửi ảnh mới -> Thay thế toàn bộ ảnh cũ.
    anh_dai_dien: List[UploadFile] = File(None),
    current_staff: dict = Depends(get_current_staff_profile)
):
    """
    Cập nhật thông tin cho một bài viết.
    Nếu có `anh_dai_dien` được gửi lên, sẽ thay thế toàn bộ ảnh cũ bằng ảnh mới.
    """
    try:
        # 1. Chuẩn bị dữ liệu update
        update_data = {}
        if tieude is not None: update_data["tieude"] = tieude
        if noidung is not None: update_data["noidung"] = noidung
        if ghichu is not None: update_data["ghichu"] = ghichu
        if trangthai is not None: update_data["trangthai"] = trangthai
        if tukhoa is not None:
            update_data["tukhoa"] = [k.strip() for k in tukhoa.split(",")]

        # 2. Xử lý ảnh mới (Nếu có)
        if anh_dai_dien:
            anh_dai_dien_json: Dict[str, str] = {}
            for idx, file in enumerate(anh_dai_dien):
                if file.filename:
                    try:
                        clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '', file.filename.replace(" ", "_"))
                        file_name = f"post_{maBaiViet}_{int(time.time())}_{idx}_{clean_name}"

                        file_content = await file.read()

                        supabase_client.storage.from_(STORAGE_BUCKET).upload(
                            path=file_name,
                            file=file_content,
                            file_options={"content-type": file.content_type}
                        )

                        url = supabase_client.storage.from_(STORAGE_BUCKET).get_public_url(file_name)

                        key_name = f"anh_{idx + 1}"
                        anh_dai_dien_json[key_name] = url
                    except Exception as e:
                        logger.error(f"Lỗi upload ảnh update {file.filename}: {e}")
                        pass

            if anh_dai_dien_json:
                update_data["anhdaidien"] = anh_dai_dien_json

        if not update_data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có thông tin nào được gửi để cập nhật")

        # 3. Update vào DB
        # Sử dụng to_json_safe để convert các kiểu dữ liệu
        safe_update_data = to_json_safe(update_data)

        response = supabase_client.table(TABLE_NAME).update(safe_update_data).eq("mabaiviet", maBaiViet).execute()

        if response.data:
            return response.data[0]
        else:
            # Có thể do ID không tồn tại
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy bài viết với id={maBaiViet} để cập nhật")

    except HTTPException as he:
        raise he
    except Exception as e:
        error_str = str(e)
        logger.error("Lỗi khi cập nhật BaiViet ID %s: %s", maBaiViet, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 5. DELETE
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