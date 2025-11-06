from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.connect.auth import get_current_staff_profile
from app.models.tu_khoa import TuKhoa, TuKhoaCreate, TuKhoaUpdate
from app.connect.db import supabase_client

router = APIRouter()

TABLE_NAME = "tukhoa"

# 1. Tạo mới từ khóa
@router.post(
    "/",
    response_model=TuKhoa,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo mới từ khóa",
)

def create_tu_khoa(tu_khoa_in: TuKhoaCreate, current_staff: dict = Depends(get_current_staff_profile)):
    """
    Tạo một từ khóa mới.
    - **tenTuKhoa**: Tên của từ khóa (bắt buộc).
    - **maTuKhoaCha**: (Tùy chọn) ID của từ khóa cha nếu đây là từ khóa con.
    """
    try:
        data = tu_khoa_in.model_dump(by_alias=True)

        response = supabase_client.table(TABLE_NAME).insert(data).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Không thể tạo từ khóa.")
    except Exception as e:
        if "unique constraint" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tên từ khóa '{tu_khoa_in.tenTuKhoa}' đã tồn tại. Vui lòng chọn tên khác.",
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 2. Lấy danh sách tất cả từ khóa
@router.get(
    "/",
    response_model=List[TuKhoa],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách tất cả từ khóa",
)

def get_all_tu_khoa():
    """
    Lấy danh sách tất cả từ khóa, sắp xếp theo ID tăng dần.
    """
    try:
        response = supabase_client.table(TABLE_NAME).select("*").order("matukhoa", desc=False).execute()

        if response.data:
            return response.data
        return [] # Trả về list rỗng nếu không có dữ liệu
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 3. Lấy 1 từ khóa theo ID
@router.get(
    "/{maTuKhoa}",
    response_model=TuKhoa,
    status_code=status.HTTP_200_OK,
    summary="Lấy thông tin từ khóa theo ID",
)

def get_tu_khoa(maTuKhoa: int):
    """
    Lấy thông tin chi tiết một từ khóa theo ID.
    - **maTuKhoa**: ID của từ khóa cần lấy thông tin.
    """
    try:
        response = supabase_client.table(TABLE_NAME).select("*").eq("matukhoa", maTuKhoa).execute()

        if response.data and len(response.data) > 0:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Từ khóa không tồn tại.")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 4. Cập nhật thông tin từ khóa
@router.put(
    "/{maTuKhoa}",
    response_model=TuKhoa,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật thông tin từ khóa",
)

def update_tu_khoa(maTuKhoa: int, tu_khoa_in: TuKhoaUpdate, current_staff: dict = Depends(get_current_staff_profile)):
    """
    Cập nhật thông tin của một từ khóa.
    - **maTuKhoa**: ID của từ khóa cần cập nhật.
    - **tenTuKhoa**: (Tùy chọn) Tên mới của từ khóa.
    - **maTuKhoaCha**: (Tùy chọn) ID của từ khóa cha mới.
    """
    try:
        data = {tu_khoa_in.model_dump(exclude_unset=True, by_alias=True)}

        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có dữ liệu để cập nhật.")

        response = supabase_client.table(TABLE_NAME).update(data).eq("matukhoa", maTuKhoa).execute()

        if response.data and len(response.data) > 0:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Từ khóa không tồn tại.")
    except Exception as e:
        if "unique constraint" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tên từ khóa '{tu_khoa_in.tenTuKhoa}' đã tồn tại. Vui lòng chọn tên khác.",
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 5. Xóa từ khóa
@router.delete(
    "/{maTuKhoa}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa từ khóa",
)

def delete_tu_khoa(maTuKhoa: int, current_staff: dict = Depends(get_current_staff_profile)):
    """
    Xóa một từ khóa khỏi cơ sở dữ liệu bằng ID.
    - **maTuKhoa**: ID của từ khóa cần xóa.
    """
    try:
        response = supabase_client.table(TABLE_NAME).delete().eq("matukhoa", maTuKhoa).execute()

        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Từ khóa không tồn tại.")
        else:
            return
    except Exception as e:
        if "foreign_key_constraint" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Không thể xóa từ khóa này vì nó đang được tham chiếu bởi các bản ghi khác.",
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


