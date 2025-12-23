import math
import re, time
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status, Query
from typing import List, Optional
from app.connect.auth import get_current_staff_profile
from app.models.tac_pham import TacPham, TacPhamCreate, TacPhamUpdate, TimKiemTacPham, TacPhamFullInfo
from app.models.ban_sao import BanSao
from app.connect.db import supabase_client
import logging

from app.utils import to_json_safe

logger = logging.getLogger(__name__)
router = APIRouter()
TABLE_NAME = "tacpham"
STORAGE_BUCKET = "image_books"

# Tìm kiếm nâng cao (Công khai)
@router.get(
    "/tim-kiem-nang-cao",
    response_model=TimKiemTacPham,
    summary="Tìm kiếm nâng cao (Có tổng số trang)"
)
def tim_kiem_nang_cao(
    q: Optional[str] = Query(None, description="Từ khóa tìm kiếm (Tên sách, Tác giả)"),
    danh_muc_id: Optional[int] = Query(None, description="ID Danh mục để lọc"),
    tu_khoa_id: Optional[int] = Query(None, description="ID Từ khóa để lọc"),
    page: int = Query(1, ge=1, description="Số trang (mặc định 1)"),
    limit: int = Query(8, ge=1, le=100, description="Số lượng kết quả/trang")
):
    """
    Tìm kiếm sách và trả về kết quả kèm thông tin phân trang.
    """
    try:
        # 1. Tính toán offset
        offset = (page - 1) * limit

        # 2. Chuẩn bị params
        params = {
            "p_keyword": q,
            "p_ma_danh_muc": danh_muc_id,
            "p_ma_tu_khoa": tu_khoa_id,
            "p_limit": limit,
            "p_offset": offset
        }

        # 3. Gọi RPC (Lúc này RPC trả về 1 cục JSON duy nhất)
        response = supabase_client.rpc("fn_tim_kiem_nang_cao", params).execute()

        # Dữ liệu trả về nằm trong response.data (là một dict do SQL trả về JSON)
        result = response.data

        if not result:
            # Trường hợp lỗi hoặc không có gì trả về
            return {
                "data": [],
                "total": 0,
                "page": page,
                "limit": limit,
                "total_pages": 0
            }

        total_items = result.get("total", 0)
        data_list = result.get("data", [])

        # 4. Tính tổng số trang (Làm tròn lên)
        # Ví dụ: 15 item, limit 10 -> 1.5 -> 2 trang
        total_pages = math.ceil(total_items / limit) if limit > 0 else 0

        # 5. Trả về đúng cấu trúc SearchResponse
        return {
            "data": data_list,
            "total": total_items,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        }

    except Exception as e:
        logger.error(f"Lỗi tìm kiếm nâng cao: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# Lấy danh sách tất cả tác phẩm (Công khai)
@router.get(
    "/",
    response_model=List[TacPham],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách tất cả tác phẩm",
)

def get_all_tac_pham():
    """
    Lấy danh sách tất cả tác phẩm, sắp xếp theo ID tăng dần.
    """
    try:
        response = supabase_client.table(TABLE_NAME).select("*").order("matacpham", desc=False).execute()

        if response.data:
            return response.data
        return []
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# Lấy 1 tác phẩm (Công khai)
@router.get(
    "/{maTacPham}",
    response_model=TacPham,
    status_code=status.HTTP_200_OK,
    summary="Lấy thông tin chi tiết một tác phẩm",
)

def get_tac_pham_by_id(maTacPham: int):
    """
    Lấy thông tin chi tiết một tác phẩm theo mã tác phẩm.
    - **maTacPham**: Mã tác phẩm (bắt buộc).
    """
    try:
        # .eq() là "equals"
        # .single() để yêu cầu Supabase trả về 1 object, nếu ko tìm thấy sẽ báo lỗi
        response = supabase_client.table(TABLE_NAME).select("*").eq("matacpham", maTacPham).single().execute()

        if response.data:
            return response.data
        else:
            # Lỗi .single() thường xảy ra khi không tìm thấy bản ghi nào
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy tác phẩm với id={maTacPham}")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# Lấy tất cả bản sao của 1 tác phẩm
@router.get(
    "/{maTacPham}/ban-sao",
    response_model=List[BanSao],
    status_code=status.HTTP_200_OK,
    summary="Lấy tất cả bản sao của một tác phẩm cụ thể"
)
def get_ban_sao_for_tac_pham(maTacPham: int):
    """
    Lấy danh sách tất cả các bản sao (copies)
    thuộc về một tác phẩm (work) dựa trên `maTacPham`.
    """
    try:
        # Đây là một câu lệnh WHERE đơn giản
        response = (
            supabase_client.table("bansao")
            .select("*")
            .eq("matacpham", maTacPham)
            .order("mabansao", desc=False)
            .execute()
        )

        if response.data:
            return response.data
        return [] # Trả về list rỗng nếu tác phẩm này chưa có bản sao nào

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# Lấy thông tin chi tiết đầy đủ của một tác phẩm
@router.get(
    "/{maTacPham}/full-info",
    response_model=TacPhamFullInfo,
    summary="Lấy thông tin chi tiết đầy đủ của tác phẩm"
)
def get_tac_pham_full_info(maTacPham: int):
    """
    Lấy thông tin tác phẩm bao gồm:
    - Thông tin cơ bản.
    - Danh sách các danh mục thuộc về.
    - Danh sách các bản sao vật lý.
    - Tính toán số lượng tồn kho.
    """
    try:
        # 1. Query dữ liệu liên kết (JOIN)
        # Cú pháp: tên_bảng_con(các_cột)
        # tacpham_danhmuc(...) : Lấy bảng trung gian
        # danhmuc(...) : Từ bảng trung gian lấy thông tin danh mục
        # bansao(*) : Lấy toàn bộ bản sao
        query = """
            *,
            tacpham_danhmuc(
                danhmuc(*)
            ),
            bansao(*)
        """

        response = (
            supabase_client.table("tacpham")
            .select(query)
            .eq("matacpham", maTacPham)
            .single()
            .execute()
        )

        data = response.data
        if not data:
            raise HTTPException(status_code=404, detail="Không tìm thấy tác phẩm")

        # 2. Xử lý dữ liệu (Data Transformation)

        # a. Trích xuất danh mục từ bảng trung gian
        # Data trả về dạng: [{'danhmuc': {'id': 1, 'ten': 'A'}}, ...]
        list_danh_muc_raw = data.get("tacpham_danhmuc", [])
        list_danh_muc = [item["danhmuc"] for item in list_danh_muc_raw if item.get("danhmuc")]

        # b. Trích xuất bản sao
        list_ban_sao = data.get("bansao", [])

        # c. Tính toán số lượng
        tong_so = len(list_ban_sao)
        # Đếm số bản sao có trangthaichomuon = True
        co_san = sum(1 for bs in list_ban_sao if bs.get("trangthaichomuon") is True)

        # 3. Tạo response theo Model đã định nghĩa
        result = {
            "thong_tin_chung": data, # Pydantic sẽ tự lọc các trường thừa
            "danh_muc": list_danh_muc,
            "ban_sao": list_ban_sao,
            "so_luong_tong": tong_so,
            "so_luong_co_san": co_san
        }

        return result

    except Exception as e:
        logger.error(f"Lỗi lấy full info tác phẩm {maTacPham}: {e}")
        # Bắt lỗi 404 nếu .single() thất bại
        if "JSON object requested, multiple (or no) rows returned" in str(e):
            raise HTTPException(status_code=404, detail="Không tìm thấy tác phẩm")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# Tạo mới tác phẩm (Chỉ nhân viên)
@router.post(
    "/",
    response_model=TacPham,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo mới tác phẩm (Chỉ Nhân viên)",
)
async def create_tac_pham(
    ten_tac_pham: str = Form(...),
    tac_gia: Optional[str] = Form(None),
    mo_ta: Optional[str] = Form(None),
    isbn: Optional[str] = Form(None),
    nam_xuat_ban: Optional[int] = Form(None),
    anh_bia: UploadFile = File(None),
    current_staff: dict = Depends(get_current_staff_profile)
):
    anh_bia_url = None
    if anh_bia:
        try:
            clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '', anh_bia.filename.replace(" ", "_"))
            file_name = f"book_{int(time.time())}_{clean_name}"
            file_content = await anh_bia.read()
            supabase_client.storage.from_(STORAGE_BUCKET).upload(
                path=file_name,
                file=file_content,
                file_options={"content-type": anh_bia.content_type}
            )
            anh_bia_url = supabase_client.storage.from_(STORAGE_BUCKET).get_public_url(file_name)
        except Exception as e:
            logger.error(f"Lỗi upload ảnh bìa: {e}")
            raise HTTPException(status_code=500, detail="Lỗi khi tải ảnh bìa lên hệ thống.")

    book_data = {
        "tentacpham": ten_tac_pham,
        "tacgia": tac_gia,
        "mota": mo_ta,
        "isbn": isbn,
        "namxuatban": nam_xuat_ban,
        "anhbia": anh_bia_url
    }

    try:
        response = supabase_client.table(TABLE_NAME).insert(to_json_safe(book_data)).execute()
        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Không thể tạo tác phẩm.")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# Cập nhật thông tin tác phẩm (Chỉ nhân viên)
@router.put(
    "/{maTacPham}",
    response_model=TacPham,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật thông tin tác phẩm (Chỉ Nhân viên)",
)
async def update_tac_pham(
    maTacPham: int,
    ten_tac_pham: Optional[str] = Form(None),
    tac_gia: Optional[str] = Form(None),
    mo_ta: Optional[str] = Form(None),
    isbn: Optional[str] = Form(None),
    nam_xuat_ban: Optional[str] = Form(None),
    anh_bia: UploadFile = File(None),
    current_staff: dict = Depends(get_current_staff_profile)
):
    update_data = {}
    if ten_tac_pham and ten_tac_pham.strip(): update_data["tentacpham"] = ten_tac_pham
    if tac_gia and tac_gia.strip(): update_data["tacgia"] = tac_gia
    if mo_ta and mo_ta.strip(): update_data["mota"] = mo_ta
    if isbn and isbn.strip(): update_data["isbn"] = isbn
    if nam_xuat_ban and nam_xuat_ban.strip():
        try:
            update_data["namxuatban"] = int(nam_xuat_ban)
        except ValueError:
            raise HTTPException(status_code=400, detail="Năm xuất bản phải là số.")

    if anh_bia:
        try:
            clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '', anh_bia.filename.replace(" ", "_"))
            file_name = f"book_{maTacPham}_{int(time.time())}_{clean_name}"
            file_content = await anh_bia.read()
            supabase_client.storage.from_(STORAGE_BUCKET).upload(
                path=file_name,
                file=file_content,
                file_options={"content-type": anh_bia.content_type}
            )
            new_url = supabase_client.storage.from_(STORAGE_BUCKET).get_public_url(file_name)
            update_data["anhbia"] = new_url
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Lỗi upload ảnh mới: {e}")

    if not update_data:
        raise HTTPException(status_code=400, detail="Không có thông tin nào được gửi để cập nhật")

    try:
        response = supabase_client.table(TABLE_NAME).update(to_json_safe(update_data)).eq("matacpham", maTacPham).execute()
        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy tác phẩm với id={maTacPham} để cập nhật")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 5. Xóa (Chỉ Nhân viên)
@router.delete(
    "/{maTacPham}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa tác phẩm (Chỉ Nhân viên)",
)
def delete_tac_pham(
    maTacPham: int,
    current_staff: dict = Depends(get_current_staff_profile)
):
    """
    Xóa một tác phẩm.
    """
    try:
        response = supabase_client.table(TABLE_NAME).delete().eq("matacpham", maTacPham).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy tác phẩm với id={maTacPham} để xóa")
        return
    except Exception as e:
        if "foreign_key_constraint" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Không thể xóa tác phẩm với id={maTacPham} do có dữ liệu liên quan."
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
