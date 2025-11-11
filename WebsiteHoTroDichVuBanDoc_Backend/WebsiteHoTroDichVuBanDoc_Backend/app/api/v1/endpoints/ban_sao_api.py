from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.models.ban_sao import BanSao, BanSaoCreate, BanSaoUpdate
from app.connect.db import supabase_client
from app.connect.auth import get_current_staff_profile

router = APIRouter()

TABLE_NAME = "bansao"

# 1. CREATE
@router.post(
    "/",
    response_model=BanSao,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo một bản sao mới (nhập sách mới)"
)
def create_ban_sao(ban_sao_in: BanSaoCreate, current_staff: dict = Depends(get_current_staff_profile)):
    """
    Tạo một bản sao mới, liên kết với một tác phẩm đã có.
    - **maTacPham**: ID của tác phẩm (bắt buộc).
    - **maBanSaoNoiBo**: (Tùy chọn) Mã nội bộ để quản lý.
    """
    try:
        data = ban_sao_in.model_dump(by_alias=True)

        response = supabase_client.table(TABLE_NAME).insert(data).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể tạo bản sao")

    except Exception as e:
        error_str = str(e).lower()
        if "foreign key constraint" in error_str:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy Tác phẩm với ID: {ban_sao_in.maTacPham}."
            )
        if "unique constraint" in error_str and "mabansaonoibo_key" in error_str:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Mã bản sao nội bộ '{ban_sao_in.maBanSaoNoiBo}' đã tồn tại."
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 2. READ ALL
@router.get(
    "/",
    response_model=List[BanSao],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách tất cả bản sao"
)
def get_all_ban_sao():
    """
    Lấy danh sách tất cả các bản sao trong hệ thống.
    """
    try:
        response = supabase_client.table(TABLE_NAME).select("*").order("mabansao", desc=False).execute()

        if response.data:
            return response.data
        return []

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 3. READ ONE
@router.get(
    "/{maBanSao}",
    response_model=BanSao,
    status_code=status.HTTP_200_OK,
    summary="Lấy thông tin chi tiết một bản sao"
)
def get_ban_sao_by_id(maBanSao: int):
    """
    Lấy thông tin chi tiết của một bản sao bằng ID.
    """
    try:
        response = supabase_client.table(TABLE_NAME).select("*").eq("mabansao", maBanSao).single().execute()

        if response.data:
            return response.data

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy bản sao với id={maBanSao}")

# 4. UPDATE
@router.put(
    "/{maBanSao}",
    response_model=BanSao,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật thông tin bản sao"
)
def update_ban_sao(maBanSao: int, ban_sao_in: BanSaoUpdate, current_staff: dict = Depends(get_current_staff_profile)):
    """
    Cập nhật thông tin cho một bản sao.
    Thường dùng để thay đổi Vị trí, Trạng thái vật lý,
    hoặc quan trọng nhất là `trangThaiChoMuon` (khi cho mượn/trả).
    """
    try:
        data = ban_sao_in.model_dump(exclude_unset=True, by_alias=True)

        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có thông tin nào được gửi để cập nhật")

        response = supabase_client.table(TABLE_NAME).update(data).eq("mabansao", maBanSao).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy bản sao với id={maBanSao} để cập nhật")

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 5. DELETE
@router.delete(
    "/{maBanSao}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa một bản sao (thanh lý sách)"
)
def delete_ban_sao(maBanSao: int, current_staff: dict = Depends(get_current_staff_profile)):
    """
    Xóa một bản sao (ví dụ: sách hỏng, thanh lý).
    """
    try:
        response = supabase_client.table(TABLE_NAME).delete().eq("mabansao", maBanSao).execute()

        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy bản sao với id={maBanSao} để xóa")

        return

    except Exception as e:
        if "foreign key constraint" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Không thể xóa: Bản sao này đang được tham chiếu (ví dụ: đang có người mượn trong 'MuonTra' hoặc đang được 'DatTruoc')."
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))