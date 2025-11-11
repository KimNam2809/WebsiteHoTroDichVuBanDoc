from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.models.nhan_vien import NhanVien, NhanVienCreate, NhanVienUpdate
from app.connect.db import supabase_client
from app.connect.auth import get_current_admin_profile, get_staff_self_or_admin
from app.utils import to_json_safe

router = APIRouter()

TABLE_NAME = "nhanvien"

# 1. CREATE
@router.post(
    "/",
    response_model=NhanVien,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo hồ sơ Nhân viên mới"
)
def create_nhan_vien(nhan_vien_in: NhanVienCreate, current_admin: dict = Depends(get_current_admin_profile)):
    """
    Tạo một hồ sơ nhân viên mới, liên kết với một `NguoiDung` đã có.
    - **maNguoiDung**: ID của `NguoiDung` (bắt buộc).
    - **hoTen**, **maNhanVienNoiBo**, **phongBan**, v.v...
    """
    try:
        data = to_json_safe(nhan_vien_in.model_dump(exclude_unset=True, by_alias=True))

        response = supabase_client.table(TABLE_NAME).insert(data).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể tạo hồ sơ nhân viên")

    except Exception as e:
        error_str = str(e).lower()
        if "foreign key constraint" in error_str:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Không tìm thấy Người Dùng với ID: {nhan_vien_in.maNguoiDung}. Nhân viên phải được liên kết với một Người dùng."
            )
        if "unique constraint" in error_str and "manguoidung" in error_str:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Người Dùng (ID: {nhan_vien_in.maNguoiDung}) này đã có hồ sơ nhân viên rồi."
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 2. READ ALL
@router.get(
    "/",
    response_model=List[NhanVien],
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách tất cả nhân viên"
)
def get_all_nhan_vien(current_admin: dict = Depends(get_current_admin_profile)):
    """
    Lấy danh sách tất cả hồ sơ nhân viên.
    """
    try:
        response = supabase_client.table(TABLE_NAME).select("*").order("manhanvien", desc=False).execute()

        if response.data:
            return response.data
        return []

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 3. READ ONE
@router.get(
    "/{maNhanVien}",
    response_model=NhanVien,
    status_code=status.HTTP_200_OK,
    summary="Lấy thông tin chi tiết một nhân viên"
)
def get_nhan_vien_by_id(maNhanVien: int, current_user: dict = Depends(get_staff_self_or_admin)):
    """
    Lấy thông tin chi tiết của một nhân viên.
    - Admin: Xem bất kỳ.
    - Nhân viên: Chỉ xem của chính mình.
    """
    try:
        response = supabase_client.table(TABLE_NAME).select("*").eq("manhanvien", maNhanVien).single().execute()

        if response.data:
            return response.data

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy nhân viên với id={maNhanVien}")

# 4. UPDATE
@router.put(
    "/{maNhanVien}",
    response_model=NhanVien,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật thông tin nhân viên"
)
def update_nhan_vien(maNhanVien: int, nhan_vien_in: NhanVienUpdate, current_user: dict = Depends(get_staff_self_or_admin)):
    """
    Cập nhật thông tin hồ sơ cho một nhân viên.
    - Admin: Cập nhật bất kỳ.
    - Nhân viên: Chỉ cập nhật của chính mình.
    """
    try:
        data = to_json_safe(nhan_vien_in.model_dump(exclude_unset=True, by_alias=True))

        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có thông tin nào được gửi để cập nhật")

        response = supabase_client.table(TABLE_NAME).update(data).eq("manhanvien", maNhanVien).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy nhân viên với id={maNhanVien} để cập nhật")

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 5. DELETE
@router.delete(
    "/{maNhanVien}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa hồ sơ một nhân viên"
)
def delete_nhan_vien(maNhanVien: int, current_admin: dict = Depends(get_current_admin_profile)):
    """
    Xóa hồ sơ một nhân viên.
    Lưu ý: Nên xóa `NguoiDung` liên quan sau đó.
    """
    try:
        response = supabase_client.table("nhanvien").delete().eq("manhanvien", maNhanVien).execute()

        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy nhân viên với id={maNhanVien} để xóa")

        return

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))