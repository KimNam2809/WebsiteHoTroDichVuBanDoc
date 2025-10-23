from fastapi import APIRouter, HTTPException, status
from typing import List
from app.models.muon_tra import MuonTra, MuonTraCreate, MuonTraUpdate
from app.connect.db import supabase_client
from app.utils import to_json_safe

router = APIRouter()

# 1. CREATE (Bắt đầu một lượt mượn)
@router.post(
    "/",
    response_model=MuonTra,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo một lượt mượn sách mới"
)
def create_muon_tra(muon_tra_in: MuonTraCreate):
    """
    Tạo một lượt mượn trả mới bằng cách gọi hàm RPC `fn_muon_sach`.
    Hàm này sẽ tự động:
    1. Kiểm tra tính khả dụng của `BanSao`.
    2. Cập nhật `BanSao` -> `trangThaiChoMuon = False`.
    3. Tạo bản ghi `MuonTra`.
    Toàn bộ là một giao dịch (transaction) an toàn.
    """
    try:
        # 1. Tạo dict tham số cho hàm RPC
        params = {
            "p_ma_ban_sao": muon_tra_in.maBanSao,
            "p_ma_ban_doc": muon_tra_in.maBanDoc,
            "p_ma_nhan_vien": muon_tra_in.maNhanVien,
            "p_ngay_tra": muon_tra_in.ngayTra
        }
        # 2. Dùng hàm "to_json_safe" của bạn để xử lý `date`
        safe_params = to_json_safe(params)
        # 3. Gọi hàm RPC (Remote Procedure Call)
        response = supabase_client.rpc("fn_muon_tai_lieu", safe_params).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể tạo lượt mượn")

    except Exception as e:
        # Nếu hàm SQL `RAISE EXCEPTION`, nó sẽ bị bắt ở đây
        # 'message' sẽ chứa thông báo lỗi chúng ta tự định nghĩa
        error_detail = str(e)
        if "message" in error_detail:
            # Lấy thông báo lỗi từ Postgres
            try:
                # Cấu trúc lỗi của postgrest: {'message': '...', 'code': '...'}
                error_json = eval(error_detail)
                error_detail = error_json.get("message", "Lỗi nghiệp vụ không xác định")
            except:
                pass # Giữ nguyên error_detail
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,detail=error_detail)

# 2. READ ALL
@router.get(
    "/",
    response_model=List[MuonTra],
    status_code=status.HTTP_200_OK,
    summary="Lấy tất cả lịch sử mượn/trả"
)
def get_all_muon_tra():
    """
    Lấy danh sách tất cả các lượt mượn/trả trong hệ thống.
    """
    try:
        response = supabase_client.table("muontra").select("*").order("mamuontra", desc=True).execute()

        if response.data:
            return response.data
        return []

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 3. READ ONE
@router.get(
    "/{maMuonTra}",
    response_model=MuonTra,
    status_code=status.HTTP_200_OK,
    summary="Lấy chi tiết một lượt mượn/trả"
)
def get_muon_tra_by_id(maMuonTra: int):
    """
    Lấy thông tin chi tiết của một lượt mượn bằng ID.
    """
    try:
        response = supabase_client.table("muontra").select("*").eq("mamuontra", maMuonTra).single().execute()

        if response.data:
            return response.data

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy lượt mượn với id={maMuonTra}")

# 4. UPDATE (Cập nhật lượt mượn - ví dụ: Trả sách)
@router.put(
    "/{maMuonTra}",
    response_model=MuonTra,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật một lượt mượn (ví dụ: trả sách, ghi phạt)"
)
def update_muon_tra(maMuonTra: int, muon_tra_in: MuonTraUpdate):
    """
    Cập nhật thông tin cho một lượt mượn.
    Thường dùng khi bạn đọc trả sách (`ngayTraThucTe`, `trangThaiMuon`),
    hoặc cập nhật tiền phạt (`tienPhat`).
    **Logic nghiệp vụ (ví dụ: cập nhật 'BanSao') sẽ được thêm ở bài sau.**
    """
    try:
        data = to_json_safe(muon_tra_in.model_dump(exclude_unset=True, by_alias=True))

        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có thông tin nào được gửi để cập nhật")

        response = supabase_client.table("muontra").update(data).eq("mamuontra", maMuonTra).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy lượt mượn với id={maMuonTra} để cập nhật")

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 5. DELETE
@router.delete(
    "/{maMuonTra}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa một lượt mượn/trả"
)
def delete_muon_tra(maMuonTra: int):
    """
    (Hành chính) Xóa một bản ghi mượn/trả.
    """
    try:
        response = supabase_client.table("muontra").delete().eq("mamuontra", maMuonTra).execute()

        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy lượt mượn với id={maMuonTra} để xóa")

        return

    except Exception as e:
        if "foreign key constraint" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Không thể xóa: Lượt mượn này đang được 'GiaHan' hoặc 'YeuCauGiao' tham chiếu đến."
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))