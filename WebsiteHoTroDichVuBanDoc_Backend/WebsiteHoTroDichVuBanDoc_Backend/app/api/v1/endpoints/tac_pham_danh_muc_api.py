from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.connect.auth import get_current_staff_profile
from app.models.danh_muc import DanhMuc
from app.models.tac_pham import TacPham
from app.models.tac_pham_danh_muc import TacPhamDanhMuc
from app.connect.db import supabase_client

router = APIRouter()

TABLE_NAME = "tacpham_danhmuc"

# 1. Gán danh mục cho tác phẩm (Tạo mới)
@router.post(
    "/",
    response_model=TacPhamDanhMuc,
    status_code=status.HTTP_201_CREATED,
    summary="Gán danh mục cho tác phẩm",
)

def assign_danh_muc_to_tac_pham(tac_pham_danh_muc_in: TacPhamDanhMuc, current_staff: dict = Depends(get_current_staff_profile)):
    """
    Tạo một liên kết Nhiều-Nhiều giữa Tác phẩm và Danh mục.
    - **maTacPham**: ID của tác phẩm
    - **maDanhMuc**: ID của danh mục
    """
    try:
        data = tac_pham_danh_muc_in.model_dump(by_alias=True)

        response = supabase_client.table(TABLE_NAME).insert(data).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Không thể gán danh mục cho tác phẩm.")

    except Exception as e:
        error_str = str(e).lower()
        if "unique constraint" in error_str:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tác phẩm với ID '{tac_pham_danh_muc_in.maTacPham}' đã được gán danh mục với ID '{tac_pham_danh_muc_in.maDanhMuc}'.",
            )
        if "foreign key constraint" in error_str:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID tác phẩm hoặc ID danh mục không tồn tại.",
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 2. Lấy danh sách danh mục của một tác phẩm
@router.get(
    "/{maTacPham}",
    response_model=List[DanhMuc],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách danh mục của một tác phẩm",
)

def get_danh_muc_of_tac_pham(maTacPham: int):
    """
    Lấy về một danh sách các Danh Mục (đã JOIN)
    từ ID của một Tác Phẩm.
    """
    try:
        # Cú pháp JOIN của Supabase:
        # 1. Chọn bảng trung gian: table(TABLE_NAME)
        # 2. Chỉ định cột muốn JOIN và các cột muốn lấy: select("danhmuc(*)")
        # 3. Điều kiện lọc: eq("matacpham", maTacPham)
        response = supabase_client.table(TABLE_NAME)\
            .select("danhmuc(*)")\
            .eq("matacpham", maTacPham)\
            .execute()

        if response.data:
            # Dữ liệu trả về có dạng:
            # [
            #   {
            #     "danhmuc": {
            #       "madanhmuc": 1,
            #       "tenDanhMuc": "Văn học",
            #       ...
            #     }
            #   },
            #   ...
            # ]
            # Ta cần trích xuất phần "danhmuc" ra khỏi mỗi phần tử
            danh_muc_list = [item["danhmuc"] for item in response.data if "danhmuc" in item]
            return danh_muc_list
        return []  # Trả về list rỗng nếu không có dữ liệu
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 4. Lấy tất cả tác phẩm của 1 danh mục
@router.get(
    "/danh-muc/{maDanhMuc}",
    response_model=List[TacPham],
    status_code=status.HTTP_200_OK,
    summary="Lấy tất cả tác phẩm của một danh mục",
)

def get_tac_pham_of_danh_muc(maDanhMuc: int):
    """
    Lấy về một danh sách các Tác Phẩm (đã JOIN)
    từ ID của một Danh Mục.
    """
    try:
        response = supabase_client.table(TABLE_NAME)\
            .select("tacpham(*)")\
            .eq("madanhmuc", maDanhMuc)\
            .execute()

        if response.data:
            tac_pham_list = [item["tacpham"] for item in response.data if "tacpham" in item]
            return tac_pham_list
        return []  # Trả về list rỗng nếu không có dữ liệu
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 5. Xoá liên kết danh mục của một tác phẩm
@router.delete(
    "/",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xoá liên kết danh mục của một tác phẩm",
)

def remove_danh_muc_from_tac_pham(maTacPham: int, maDanhMuc: int, current_staff: dict = Depends(get_current_staff_profile)):
    """
    Xoá liên kết giữa tác phẩm và danh mục.
    - **maTacPham**: ID của tác phẩm
    - **maDanhMuc**: ID của danh mục
    """
    try:
        response = supabase_client.table(TABLE_NAME)\
            .delete()\
            .eq("matacpham", maTacPham)\
            .eq("madanhmuc", maDanhMuc)\
            .execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Liên kết giữa tác phẩm và danh mục không tồn tại.",
            )
        return
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))