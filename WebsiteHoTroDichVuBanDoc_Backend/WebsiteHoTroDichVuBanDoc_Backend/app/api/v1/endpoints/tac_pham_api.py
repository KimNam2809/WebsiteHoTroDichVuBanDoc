from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.connect.auth import get_current_staff_profile
from app.models.tac_pham import TacPham, TacPhamCreate, TacPhamUpdate
from app.models.ban_sao import BanSao
from app.connect.db import supabase_client

router = APIRouter()

TABLE_NAME = "tacpham"

# 1. Tạo mới tác phẩm
@router.post(
    "/",
    response_model=TacPham,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo mới tác phẩm",
)

def create_tac_pham(tac_pham_in: TacPhamCreate, current_staff: dict = Depends(get_current_staff_profile)):
    """
    Tạo một tác phẩm mới.
    - **tenTacPham**: Tên của tác phẩm (bắt buộc).
    - Các trường khác là tùy chọn.
    """
    try:
        # Chuyển pydantic model thành dict
        # **QUAN TRỌNG: model_dump(by_alias=True)**
        # Yêu cầu Pydantic dump ra dict dùng "alias" (chữ thường)
        data = tac_pham_in.model_dump(by_alias=True)

        # Gửi lệnh insert đến Supabase
        response = supabase_client.table(TABLE_NAME).insert(data).execute()

        # Supabase sẽ trả về một list data, ta lấy phần tử đầu tiên
        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Không thể tạo tác phẩm.")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 2. Lấy danh sách tất cả tác phẩm
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
        return [] # Trả về list rỗng nếu không có dữ liệu
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 3. Lấy 1 tác phẩm
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

# 4. Cập nhật thông tin tác phẩm
@router.put(
    "/{maTacPham}",
    response_model=TacPham,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật thông tin tác phẩm",
)

def update_tac_pham(maTacPham: int, tac_pham_in: TacPhamUpdate, current_staff: dict = Depends(get_current_staff_profile)):
    """
    Cập nhật thông tin cho một tác phẩm đã có.
    Gửi lên trường nào thì trường đó sẽ bị ghi đè.
    """
    try:
        # .model_dump(exclude_unset=True) rất quan trọng
        # Nó chỉ tạo dict từ những trường bạn gửi lên,
        # bỏ qua các trường "None" (Optional) mà bạn không gửi
        data = tac_pham_in.model_dump(exclude_unset=True, by_alias=True) # Chỉ lấy các trường được gửi lên

        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có thông tin nào được gửi để cập nhật.")

        response = supabase_client.table(TABLE_NAME).update(data).eq("matacpham", maTacPham).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy tác phẩm với id={maTacPham} để cập nhật")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 5. Xóa tác phẩm
@router.delete(
    "/{maTacPham}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa tác phẩm",
)

def delete_tac_pham(maTacPham: int, current_staff: dict = Depends(get_current_staff_profile)):
    """
    Xóa một tác phẩm khỏi cơ sở dữ liệu bằng maTacPham.
    Lưu ý: Nếu có khóa ngoại trỏ đến, có thể gây lỗi.
    """
    try:
        response = supabase_client.table(TABLE_NAME).delete().eq("matacpham", maTacPham).execute()

        if not response.data:
            # Nếu data rỗng, tức là không tìm thấy tác phẩm để xoá
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy tác phẩm với id={maTacPham} để xóa")
        # Nếu xoá thành công, không trả về nội dung gì
        return
    except Exception as e:
        # Bắt lỗi khoá ngoại
        if "foreign_key_constraint" in str(e):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                # Tác phẩm này đang được tham chiếu bởi bảng khác (ví dụ: BanSao, TacPham_DanhMuc...)
                detail=f"Không thể xóa tác phẩm với id={maTacPham} do có dữ liệu liên quan."
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 6. Lấy tất cả bản sao của 1 tác phẩm
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
