from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
# Thêm DatTruocUpdate vào import
from app.models.dat_truoc import DatTruoc, DatTruocCreate, DatTruocUpdate
from app.connect.db import supabase_client
from app.utils import to_json_safe
import logging, ast

router = APIRouter()
logger = logging.getLogger(__name__)

# 1. CREATE (Nghiệp vụ Đặt Trước)
@router.post(
    "/",
    response_model=DatTruoc,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo một lượt đặt trước sách (Đã có logic nghiệp vụ)"
)
def create_dat_truoc(dat_truoc_in: DatTruocCreate):
    """
    Gọi RPC fn_dat_truoc để tạo một lượt đặt trước mới.
    Hàm này sẽ tự động:
    1. Kiểm tra sách có đang được mượn không.
    2. Kiểm tra bạn đọc đã đặt sách này chưa.
    3. Tạo bản ghi `DatTruoc` mới.
    """
    params = {
        "p_ma_ban_sao": dat_truoc_in.maBanSao,
        "p_ma_ban_doc": dat_truoc_in.maBanDoc
    }
    safe_params = to_json_safe(params) # Dùng cho nhất quán

    try:
        response = supabase_client.rpc("fn_dat_truoc", safe_params).execute()
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể đặt trước (RPC không trả về data)")

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
    response_model=List[DatTruoc],
    status_code=status.HTTP_200_OK,
    summary="Lấy tất cả các lượt đặt trước"
)
def get_all_dat_truoc():
    """Lấy danh sách tất cả các lượt đặt trước trong hệ thống."""
    try:
        response = supabase_client.table("dattruoc").select("*").order("madattruoc", desc=True).execute()
        if response.data:
            return response.data
        return []
    except Exception as e:
        logger.error("Lỗi khi lấy tất cả DatTruoc: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 3. READ ONE (Lấy một)
@router.get(
    "/{maDatTruoc}",
    response_model=DatTruoc,
    status_code=status.HTTP_200_OK,
    summary="Lấy chi tiết một lượt đặt trước"
)
def get_dat_truoc_by_id(maDatTruoc: int):
    """Lấy chi tiết một lượt đặt trước bằng ID."""
    try:
        response = supabase_client.table("dattruoc").select("*").eq("madattruoc", maDatTruoc).single().execute()
        if response.data:
            return response.data
    except Exception as e:
        logger.warning("Không tìm thấy DatTruoc ID %s: %s", maDatTruoc, e)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy lượt đặt trước với id={maDatTruoc}")

# 4. UPDATE (Cập nhật trạng thái)
@router.put(
    "/{maDatTruoc}",
    response_model=DatTruoc,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật trạng thái đặt trước (ví dụ: Hủy, Hoàn thành)"
)
def update_dat_truoc(maDatTruoc: int, dat_truoc_in: DatTruocUpdate):
    """
    Cập nhật trạng thái của một lượt đặt trước.
    Thường dùng để chuyển `trangThaiDatTruoc` thành 'daHuy' hoặc 'daHoanThanh'.
    """
    try:
        data = to_json_safe(dat_truoc_in.model_dump(exclude_unset=True, by_alias=True))
        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có thông tin nào được gửi để cập nhật")

        response = supabase_client.table("dattruoc").update(data).eq("madattruoc", maDatTruoc).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy lượt đặt trước với id={maDatTruoc} để cập nhật")

    except Exception as e:
        logger.error("Lỗi khi cập nhật DatTruoc ID %s: %s", maDatTruoc, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 5. DELETE (Xóa)
@router.delete(
    "/{maDatTruoc}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa một lượt đặt trước"
)
def delete_dat_truoc(maDatTruoc: int):
    """(Hành chính) Xóa một bản ghi đặt trước."""
    try:
        response = supabase_client.table("dattruoc").delete().eq("madattruoc", maDatTruoc).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy lượt đặt trước với id={maDatTruoc} để xóa")
        return
    except Exception as e:
        logger.error("Lỗi khi xóa DatTruoc ID %s: %s", maDatTruoc, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))