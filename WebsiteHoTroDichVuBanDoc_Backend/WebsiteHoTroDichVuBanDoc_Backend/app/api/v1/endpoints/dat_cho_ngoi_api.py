from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
# Import DatChoNgoiUpdate
from app.models.dat_cho_ngoi import DatChoNgoi, DatChoNgoiCreate, DatChoNgoiUpdate
from app.connect.db import supabase_client
from app.utils import to_json_safe
import logging, ast

router = APIRouter()
logger = logging.getLogger(__name__)

TABLE_NAME = "datchongoi"

# 1. CREATE (Nghiệp vụ Đặt Chỗ)
@router.post(
    "/",
    response_model=DatChoNgoi,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo một lượt đặt chỗ ngồi mới (Đã có logic nghiệp vụ)"
)
def create_dat_cho_ngoi(dat_cho_in: DatChoNgoiCreate):
    """
    Gọi RPC fn_dat_cho để tạo một lượt đặt chỗ mới.
    Hàm này sẽ tự động:
    1. Kiểm tra thời gian hợp lệ.
    2. Kiểm tra xung đột (overlap) thời gian với các lượt đặt khác.
    3. Tạo bản ghi `DatChoNgoi` mới.
    """
    params = {
        "p_ma_cho_ngoi": dat_cho_in.maChoNgoi,
        "p_ma_ban_doc": dat_cho_in.maBanDoc,
        # Đảm bảo Pydantic model dùng `datetime` để parse
        "p_thoi_gian_bat_dau": dat_cho_in.thoiGianBatDau,
        "p_thoi_gian_ket_thuc": dat_cho_in.thoiGianKetThuc
    }
    # Dùng to_json_safe vì có timestamptz
    safe_params = to_json_safe(params)

    try:
        response = supabase_client.rpc("fn_dat_cho", safe_params).execute()
        logger.debug("RPC response: status=%s, data=%s, error=%s", getattr(response, "status_code", None), getattr(response, "data", None), getattr(response, "error", None))

        # 1) Xử lý lỗi "mềm"
        if getattr(response, "error", None):
            err = response.error
            message = str(err.get("message")) if isinstance(err, dict) else str(err)
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

        # 2) Xử lý thành công
        data = getattr(response, "data", None)
        if data:
            if isinstance(data, list):
                return data[0]
            return data

        # 3) Thành công nhưng không có data
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể đặt chỗ (RPC không trả về data)")

    except HTTPException:
        raise

    except Exception as e:
        error_str = str(e)

        # 1. Ưu tiên kiểm tra "lá cờ" nghiệp vụ
        if "BUSINESS_ERROR" in error_str:
            detail_message = "Lỗi nghiệp vụ (Không thể phân tích chi tiết)"
            try:
                start = error_str.find("{")
                end = error_str.rfind("}") + 1
                if start != -1 and end != 0:
                    error_dict = ast.literal_eval(error_str[start:end])
                    detail_message = error_dict.get("message", "Lỗi nghiệp vụ (Không có 'message' trong dict)")
                else:
                    if "MESSAGE:" in error_str.upper():
                        detail_message = error_str.split("MESSAGE:")[1].split("DETAIL:")[0].strip().replace("\"", "")
                    else:
                        detail_message = error_str.replace("Exception:", "").replace("PostgrestError:", "").strip()

            except Exception as parse_error:
                logger.warning("Không thể parse lỗi nghiệp vụ: %s. Lỗi gốc: %s", parse_error, error_str)
                detail_message = error_str.replace("Exception:", "").replace("PostgrestError:", "").strip()

            # 3. Trả về 400
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail_message)

        # 4. Nếu không phải BUSINESS_ERROR => Lỗi 500
        logger.exception("Lỗi hệ thống không mong muốn: %s", error_str)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lỗi hệ thống. Vui lòng thử lại sau."
        )

# 2. READ ALL (Lấy tất cả)
@router.get(
    "/",
    response_model=List[DatChoNgoi],
    status_code=status.HTTP_200_OK,
    summary="Lấy tất cả các lượt đặt chỗ"
)
def get_all_dat_cho_ngoi():
    """Lấy danh sách tất cả các lượt đặt chỗ trong hệ thống."""
    try:
        response = supabase_client.table(TABLE_NAME).select("*").order("madatcho", desc=True).execute()
        if response.data:
            return response.data
        return []
    except Exception as e:
        logger.error("Lỗi khi lấy tất cả DatChoNgoi: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 3. READ ONE (Lấy một)
@router.get(
    "/{maDatCho}",
    response_model=DatChoNgoi,
    status_code=status.HTTP_200_OK,
    summary="Lấy chi tiết một lượt đặt chỗ"
)
def get_dat_cho_ngoi_by_id(maDatCho: int):
    """Lấy chi tiết một lượt đặt chỗ bằng ID."""
    try:
        response = supabase_client.table(TABLE_NAME).select("*").eq("madatcho", maDatCho).single().execute()
        if response.data:
            return response.data
    except Exception as e:
        logger.warning("Không tìm thấy DatChoNgoi ID %s: %s", maDatCho, e)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy lượt đặt chỗ với id={maDatCho}")

# 4. UPDATE (Cập nhật trạng thái - Hủy)
@router.put(
    "/{maDatCho}",
    response_model=DatChoNgoi,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật trạng thái đặt chỗ (ví dụ: Hủy)"
)
def update_dat_cho_ngoi(maDatCho: int, dat_cho_in: DatChoNgoiUpdate):
    """
    Cập nhật trạng thái của một lượt đặt chỗ.
    Thường dùng để chuyển `trangThaiDatCho` thành 'daHuy'.
    """
    try:
        data = to_json_safe(dat_cho_in.model_dump(exclude_unset=True, by_alias=True))
        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có thông tin nào được gửi để cập nhật")

        response = supabase_client.table(TABLE_NAME).update(data).eq("madatcho", maDatCho).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy lượt đặt chỗ với id={maDatCho} để cập nhật")

    except Exception as e:
        logger.error("Lỗi khi cập nhật DatChoNgoi ID %s: %s", maDatCho, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 5. DELETE (Xóa)
@router.delete(
    "/{maDatCho}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa một lượt đặt chỗ"
)
def delete_dat_cho_ngoi(maDatCho: int):
    """(Hành chính) Xóa một bản ghi đặt chỗ."""
    try:
        response = supabase_client.table(TABLE_NAME).delete().eq("madatcho", maDatCho).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy lượt đặt chỗ với id={maDatCho} để xóa")
        return
    except Exception as e:
        logger.error("Lỗi khi xóa DatChoNgoi ID %s: %s", maDatCho, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))