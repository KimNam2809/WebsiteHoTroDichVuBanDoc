from fastapi import APIRouter, HTTPException, status
from typing import List
from app.models.danh_muc import DanhMuc, DanhMucCreate, DanhMucUpdate
from app.connect.db import supabase_client

router = APIRouter()

# 1. Tạo mới danh mục
@router.post(
    "/",
    response_model=DanhMuc,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo mới danh mục",
)

def create_danh_muc(danh_muc_in: DanhMucCreate):
    """
    Tạo một danh mục mới.
    - **tenDanhMuc**: Tên danh mục (bắt buộc).
    - **maDanhMucCha**: (Tùy chọn) ID của danh mục cha nếu đây là danh mục con.
    """
    try:
        data = danh_muc_in.model_dump(by_alias=True)

        response = supabase_client.table("danhmuc").insert(data).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Không thể tạo danh mục.")
    except Exception as e:
        # Bắt lỗi nếu tenDanhMuc bị trùng (UNIQUE)
        if "unique constraint" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tên danh mục '{danh_muc_in.tenDanhMuc}' đã tồn tại. Vui lòng chọn tên khác.",
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 2. Lấy danh sách tất cả danh mục
@router.get(
    "/",
    response_model=List[DanhMuc],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách tất cả danh mục",
)

def get_all_danh_muc():
    """
    Lấy danh sách tất cả danh mục, sắp xếp theo ID tăng dần.
    """
    try:
        response = supabase_client.table("danhmuc").select("*").order("madanhmuc", desc=False).execute()

        if response.data:
            return response.data
        return [] # Trả về list rỗng nếu không có dữ liệu
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 3. Lấy 1 danh mục
@router.get(
    "/{maDanhMuc}",
    response_model=DanhMuc,
    status_code=status.HTTP_200_OK,
    summary="Lấy thông tin một danh mục theo ID",
)

def get_danh_muc_by_id(maDanhMuc: int):
    """
    Lấy thông tin chi tiết của một danh mục dựa trên ID.
    - **ma_danh_muc**: ID của danh mục cần lấy thông tin.
    """
    try:
        response = supabase_client.table("danhmuc").select("*").eq("madanhmuc", maDanhMuc).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Danh mục không tồn tại.")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 4. Cập nhật thông tin danh mục
@router.put(
    "/{maDanhMuc}",
    response_model=DanhMuc,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật thông tin danh mục",
)

def update_danh_muc(maDanhMuc: int, danh_muc_in: DanhMucUpdate):
    """
    Cập nhật thông tin của một danh mục.
    - **ma_danh_muc**: ID của danh mục cần cập nhật.
    - Các trường khác là thông tin cần cập nhật.
    """
    try:
        data = danh_muc_in.model_dump(exclude_unset=True, by_alias=True)

        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có dữ liệu nào được gửi để cập nhật.")

        response = supabase_client.table("danhmuc").update(data).eq("madanhmuc", maDanhMuc).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Danh mục không tồn tại.")
    except Exception as e:
        # Bắt lỗi nếu tenDanhMuc bị trùng (UNIQUE)
        if "unique constraint" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tên danh mục đã tồn tại. Vui lòng chọn tên khác.",
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 5. Xóa danh mục
@router.delete(
    "/{maDanhMuc}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa danh mục",
)

def delete_danh_muc(maDanhMuc: int):
    """
    Xóa một danh mục dựa trên ID.
    - **ma_danh_muc**: ID của danh mục cần xóa.
    Lưu ý: Nếu danh mục này đang được tham chiếu bởi các bản ghi khác, việc xóa có thể thất bại do ràng buộc khoá ngoại.
    """
    try:
        response = supabase_client.table("danhmuc").delete().eq("madanhmuc", maDanhMuc).execute()

        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Danh mục không tồn tại.")
        return
    except Exception as e:
        if "foreign_key_constraint" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Danh mục này đang được tham chiếu bởi các bản ghi khác và không thể xóa.",
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
