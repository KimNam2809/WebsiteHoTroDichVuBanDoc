from fastapi import APIRouter, HTTPException, status
from typing import List
from app.models.nhan_vien import NhanVien, NhanVienCreate, NhanVienUpdate
from app.connect.db import supabase_client
from app.utils import to_json_safe

router = APIRouter()

# 1. CREATE
@router.post(
    "/",
    response_model=NhanVien,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo hồ sơ Nhân viên mới"
)
def create_nhan_vien(nhan_vien_in: NhanVienCreate):
    """
    Tạo một hồ sơ nhân viên mới, liên kết với một `NguoiDung` đã có.
    - **maNguoiDung**: ID của `NguoiDung` (bắt buộc).
    - **hoTen**, **maNhanVienNoiBo**, **phongBan**, v.v...
    """
    try:
        data = to_json_safe(nhan_vien_in.model_dump(exclude_unset=True, by_alias=True))

        response = supabase_client.table("nhanvien").insert(data).execute()

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
def get_all_nhan_vien():
    """
    Lấy danh sách tất cả hồ sơ nhân viên.
    """
    try:
        response = supabase_client.table("nhanvien").select("*").order("manhanvien", desc=False).execute()

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
def get_nhan_vien_by_id(maNhanVien: int):
    """
    Lấy thông tin chi tiết của một nhân viên bằng `maNhanVien`.
    """
    try:
        response = supabase_client.table("nhanvien").select("*").eq("manhanvien", maNhanVien).single().execute()

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
def update_nhan_vien(maNhanVien: int, nhan_vien_in: NhanVienUpdate):
    """
    Cập nhật thông tin hồ sơ cho một nhân viên (ví dụ: địa chỉ, nghề nghiệp...).
    Không cho phép cập nhật `maNguoiDung`.
    """
    try:
        data = to_json_safe(nhan_vien_in.model_dump(exclude_unset=True, by_alias=True))

        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có thông tin nào được gửi để cập nhật")

        response = supabase_client.table("nhanvien").update(data).eq("manhanvien", maNhanVien).execute()

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
def delete_nhan_vien(maNhanVien: int):
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