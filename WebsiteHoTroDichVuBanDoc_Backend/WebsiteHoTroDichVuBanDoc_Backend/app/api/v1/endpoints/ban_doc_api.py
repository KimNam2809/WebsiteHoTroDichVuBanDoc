from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.models.ban_doc import BanDoc, BanDocCreate, BanDocUpdate
from app.connect.db import supabase_client
from app.connect.auth import get_current_staff_profile, get_current_reader_profile, get_owner_or_staff
from app.utils import to_json_safe

router = APIRouter()

TABLE_NAME = "bandoc"

# 1. CREATE
@router.post(
    "/",
    response_model=BanDoc,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo hồ sơ Bạn đọc mới"
)
def create_ban_doc(ban_doc_in: BanDocCreate, current_staff: dict = Depends(get_current_staff_profile)):
    """
    Tạo một hồ sơ bạn đọc mới, liên kết với một `NguoiDung` đã có.
    - **maNguoiDung**: ID của `NguoiDung` (bắt buộc).
    - **hoTen**, **ngaySinh**, **cccd**, v.v...
    """
    try:
        data = to_json_safe(ban_doc_in.model_dump(exclude_unset=True, by_alias=True))

        response = supabase_client.table(TABLE_NAME).insert(data).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể tạo hồ sơ bạn đọc")

    except Exception as e:
        error_str = str(e).lower()
        if "foreign key constraint" in error_str:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy Người Dùng với ID: {ban_doc_in.maNguoiDung}. Bạn đọc phải được liên kết với một Người dùng."
            )
        if "unique constraint" in error_str and "manguoidung" in error_str:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Người Dùng (ID: {ban_doc_in.maNguoiDung}) này đã có hồ sơ bạn đọc rồi."
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 2. READ ALL
@router.get(
    "/",
    response_model=List[BanDoc],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách tất cả bạn đọc"
)
def get_all_ban_doc(current_staff: dict = Depends(get_current_staff_profile)):
    """
    Lấy danh sách tất cả hồ sơ bạn đọc.
    """
    try:
        response = supabase_client.table(TABLE_NAME).select("*").order("mabandoc", desc=False).execute()

        if response.data:
            return response.data
        return []

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 3. READ ONE
@router.get(
    "/{maBanDoc}",
    response_model=BanDoc,
    status_code=status.HTTP_200_OK,
    summary="Lấy thông tin chi tiết một bạn đọc"
)
def get_ban_doc_by_id(maBanDoc: int, current_user: dict = Depends(get_owner_or_staff)):
    """
    Lấy thông tin chi tiết của một bạn đọc bằng `maBanDoc`.
    """
    try:
        response = supabase_client.table(TABLE_NAME).select("*").eq("mabandoc", maBanDoc).single().execute()

        if response.data:
            return response.data

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy bạn đọc với id={maBanDoc}")

# 4. UPDATE
@router.put(
    "/{maBanDoc}",
    response_model=BanDoc,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật thông tin bạn đọc"
)
def update_ban_doc(maBanDoc: int, ban_doc_in: BanDocUpdate, current_reader: dict = Depends(get_current_reader_profile)):
    """
    Cập nhật thông tin hồ sơ cho một bạn đọc (ví dụ: địa chỉ, nghề nghiệp...).
    Không cho phép cập nhật `maNguoiDung`.
    """
    try:
        data = to_json_safe(ban_doc_in.model_dump(exclude_unset=True, by_alias=True))

        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có thông tin nào được gửi để cập nhật")

        response = supabase_client.table(TABLE_NAME).update(data).eq("mabandoc", maBanDoc).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy bạn đọc với id={maBanDoc} để cập nhật")

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 5. DELETE
@router.delete(
    "/{maBanDoc}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa hồ sơ một bạn đọc"
)
def delete_ban_doc(maBanDoc: int, current_staff: dict = Depends(get_current_staff_profile)):
    """
    Xóa hồ sơ một bạn đọc.
    Lưu ý: Nên xóa `NguoiDung` liên quan sau đó.
    """
    try:
        response = supabase_client.table(TABLE_NAME).delete().eq("mabandoc", maBanDoc).execute()

        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy bạn đọc với id={maBanDoc} để xóa")

        return

    except Exception as e:
        if "foreign key constraint" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Không thể xóa: Bạn đọc này đang có lịch sử mượn trả hoặc đặt chỗ."
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))