from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.connect.auth import get_current_staff_profile
from app.models.tu_khoa import TuKhoa
from app.models.tac_pham import TacPham
from app.models.tac_pham_tu_khoa import TacPhamTuKhoa
from app.connect.db import supabase_client

router = APIRouter()

TABLE_NAME = "tacpham_tukhoa"

# 1. Gán từ khóa cho tác phẩm (Tạo mới)
@router.post(
    "/",
    response_model=TacPhamTuKhoa,
    status_code=status.HTTP_201_CREATED,
    summary="Gán từ khóa cho tác phẩm",
)

def assign_tu_khoa_to_tac_pham(tac_pham_tu_khoa_in: TacPhamTuKhoa, current_staff: dict = Depends(get_current_staff_profile)):
    """
    Tạo một liên kết Nhiều-Nhiều giữa Tác phẩm và Từ khóa.
    - **maTacPham**: ID của tác phẩm
    - **maTuKhoa**: ID của từ khóa
    """
    try:
        data = tac_pham_tu_khoa_in.model_dump(by_alias=True)

        response = supabase_client.table(TABLE_NAME).insert(data).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Không thể gán từ khoá cho tác phẩm.")

    except Exception as e:
        error_str = str(e).lower()
        if "unique constraint" in error_str:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tác phẩm với ID '{tac_pham_tu_khoa_in.maTacPham}' đã được gán từ khóa với ID '{tac_pham_tu_khoa_in.maTuKhoa}'.",
            )
        if "foreign key constraint" in error_str:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="ID tác phẩm hoặc ID từ khóa không tồn tại.",
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 2. Lấy danh sách từ khóa của một tác phẩm
@router.get(
    "/{maTacPham}",
    response_model=List[TuKhoa],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách từ khóa của một tác phẩm",
)

def get_tu_khoa_of_tac_pham(maTacPham: int):
    """
    Lấy về một danh sách các Từ Khóa (đã JOIN)
    từ ID của một Tác Phẩm.
    """
    try:
        # Cú pháp JOIN của Supabase:
        # 1. Chọn bảng trung gian: table(TABLE_NAME)
        # 2. Chỉ định cột muốn JOIN và các cột muốn lấy: select("tukhoa(*)")
        # 3. Điều kiện lọc: eq("matacpham", maTacPham)
        response = supabase_client.table(TABLE_NAME)\
            .select("tukhoa(*)")\
            .eq("matacpham", maTacPham)\
            .execute()

        if response.data:
            # Dữ liệu trả về có dạng:
            # [
            #   {
            #     "tukhoa": {
            #       "matukhoa": 1,
            #       "tenTuKhoa": "Văn học",
            #       ...
            #     }
            #   },
            #   ...
            # ]
            # Ta cần trích xuất phần "tukhoa" ra khỏi mỗi phần tử
            tu_khoa_list = [item["tukhoa"] for item in response.data if "tukhoa" in item]
            return tu_khoa_list
        return []  # Trả về list rỗng nếu không có dữ liệu
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 4. Lấy tất cả tác phẩm của 1 từ khóa
@router.get(
    "/tu-khoa/{maTuKhoa}",
    response_model=List[TacPham],
    status_code=status.HTTP_200_OK,
    summary="Lấy tất cả tác phẩm của một từ khóa",
)

def get_tac_pham_of_tu_khoa(maTuKhoa: int):
    """
    Lấy về một danh sách các Tác Phẩm (đã JOIN)
    từ ID của một Từ Khóa.
    """
    try:
        response = supabase_client.table(TABLE_NAME)\
            .select("tacpham(*)")\
            .eq("matukhoa", maTuKhoa)\
            .execute()

        if response.data:
            tac_pham_list = [item["tacpham"] for item in response.data if "tacpham" in item]
            return tac_pham_list
        return []  # Trả về list rỗng nếu không có dữ liệu
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 5. Xoá liên kết từ khóa của một tác phẩm
@router.delete(
    "/",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xoá liên kết từ khóa của một tác phẩm",
)

def remove_tu_khoa_from_tac_pham(maTacPham: int, maTuKhoa: int, current_staff: dict = Depends(get_current_staff_profile)):
    """
    Xoá liên kết giữa tác phẩm và từ khóa.
    - **maTacPham**: ID của tác phẩm
    - **maTuKhoa**: ID của từ khóa
    """
    try:
        response = supabase_client.table(TABLE_NAME)\
            .delete()\
            .eq("matacpham", maTacPham)\
            .eq("matukhoa", maTuKhoa)\
            .execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Liên kết giữa tác phẩm và từ khóa không tồn tại.",
            )
        return
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))