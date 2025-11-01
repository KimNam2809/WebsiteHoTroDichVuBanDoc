from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from app.models.gia_han import GiaHan, GiaHanCreate, GiaHanUpdate
from app.connect.db import supabase_client
from app.utils import to_json_safe
import logging, ast
# Ép chuỗi lỗi thành dict an toàn: ast. Ví dụ: "{'message': 'Lỗi...'}" -> {'message': 'Lỗi...'}


router = APIRouter()
logger = logging.getLogger(__name__)

@router.post(
    "/",
    response_model=GiaHan,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo một lượt gia hạn mượn sách mới"
)
def create_gia_han(gia_han_in: GiaHanCreate):
    """
    Gọi RPC fn_gia_han. Xử lý response/error từ supabase chính xác.
    """
    params = {
        "p_ma_muon_tra": gia_han_in.maMuonTra,
        "p_ma_nhan_vien": gia_han_in.maNhanVien,
        "p_ngay_tra_moi": gia_han_in.ngayTraMoi,
        "p_ly_do_gia_han": gia_han_in.lyDoGiaHan
    }

    # chuyển datetime/Decimal trước khi gửi
    safe_params = to_json_safe(params)

    try:
        response = supabase_client.rpc("fn_gia_han", safe_params).execute()
        # Debug logging (giúp debug nếu cần)
        logger.debug("RPC response: status=%s, data=%s, error=%s", getattr(response, "status_code", None), getattr(response, "data", None), getattr(response, "error", None))

        # 1) Nếu supabase báo lỗi (ví dụ do RAISE EXCEPTION trong SQL), resp.error thường chứa chi tiết
        if getattr(response, "error", None):
            err = response.error
            # err có thể là dict hoặc string — xử lý an toàn
            if isinstance(err, dict):
                # postgrest error có thể có keys: message, details, hint
                message = err.get("message") or err.get("details") or str(err)
            else:
                message = str(err)
            # Trả về 400 để báo lỗi nghiệp vụ
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

        # 2) Nếu không có error và có data => trả về data phù hợp
        data = getattr(response, "data", None)
        if data:
            # data có thể là list chứa record(s) hoặc scalar/obj
            if isinstance(data, list):
                # trả item đầu (theo hàm SQL bạn RETURN record)
                return data[0]
            # nếu không phải list, trả về trực tiếp (nếu model tương thích)
            return data

        # 3) Nếu không có data và không có error -> coi là không tạo được
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể tạo lượt gia hạn")

    except HTTPException:
        # Bắt và ném lại HTTPException để giữ nguyên status/detail
        raise
    except Exception as e:
        error_str = str(e)

        # 🧩 Trường hợp lỗi nghiệp vụ từ Supabase (Postgres function)
        if "'message':" in error_str:
            try:
                error_dict = ast.literal_eval(error_str)

                # Lấy phần message nếu có
                message = error_dict.get("message", "Lỗi nghiệp vụ không xác định")

                # Nếu là lỗi nghiệp vụ (vd: vượt giới hạn, sai trạng thái)
                if "Không thể gia hạn" in message or "Không tìm thấy" in message:
                    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)
            except Exception:
                pass  # Nếu parse lỗi, vẫn rơi xuống xử lý chung bên dưới

        # 🧩 Các lỗi nghiệp vụ được đánh dấu bằng 'BUSINESS_ERROR'
        if "BUSINESS_ERROR" in error_str:
            cleaned = (
                error_str.split("BUSINESS_ERROR")[0]
                .replace("ERROR: ", "")
                .replace("DETAIL:", "")
                .strip()
            )
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=cleaned)

        # 🧩 Nếu không khớp trường hợp nào => lỗi hệ thống
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lỗi hệ thống. Vui lòng thử lại sau."
        )

# 2. READ (Lấy lịch sử gia hạn của 1 lượt mượn)
@router.get(
    "/muon-tra/{maMuonTra}",
    response_model=List[GiaHan],
    status_code=status.HTTP_200_OK,
    summary="Lấy lịch sử gia hạn của một lượt mượn"
)
def get_gia_han_by_muon_tra(maMuonTra: int):
    """
    Lấy danh sách tất cả các lần gia hạn
    thuộc về một bản ghi mượn/trả (muontra).
    """
    try:
        response = (
            supabase_client.table("giahan")
            .select("*")
            .eq("mamuontra", maMuonTra)
            .order("thoidiemgiahan", desc=False) # Sắp xếp theo thứ tự gia hạn
            .execute()
        )

        if response.data:
            return response.data
        return [] # Trả về list rỗng nếu không có

    except Exception as e:
        logger.error("Lỗi khi lấy GiaHan theo maMuonTra %s: %s", maMuonTra, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 3. READ ALL (Đọc tất cả)
@router.get(
    "/",
    response_model=List[GiaHan],
    status_code=status.HTTP_200_OK,
    summary="Lấy tất cả các lượt gia hạn"
)
def get_all_gia_han():
    """
    Lấy danh sách tất cả các lượt gia hạn trong hệ thống.
    """
    try:
        response = supabase_client.table("giahan").select("*").order("magiahan", desc=True).execute()

        if response.data:
            return response.data
        return []

    except Exception as e:
        logger.error("Lỗi khi lấy tất cả GiaHan: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 4. READ ONE (Đọc một)
@router.get(
    "/{maGiaHan}",
    response_model=GiaHan,
    status_code=status.HTTP_200_OK,
    summary="Lấy chi tiết một lượt gia hạn"
)
def get_gia_han_by_id(maGiaHan: int):
    """
    Lấy thông tin chi tiết của một lượt gia hạn bằng ID (magiahan).
    """
    try:
        response = supabase_client.table("giahan").select("*").eq("magiahan", maGiaHan).single().execute()

        if response.data:
            return response.data

    except Exception as e:
        logger.warning("Không tìm thấy GiaHan ID %s: %s", maGiaHan, e)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy lượt gia hạn với id={maGiaHan}")

# 5. UPDATE (Cập nhật)
@router.put(
    "/{maGiaHan}",
    response_model=GiaHan,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật thông tin một lượt gia hạn (ví dụ: sửa lý do)"
)
def update_gia_han(maGiaHan: int, gia_han_in: GiaHanUpdate):
    """
    Cập nhật thông tin cho một lượt gia hạn (ví dụ: sửa lỗi chính tả lý do).
    Hàm này không chứa logic nghiệp vụ, chỉ cập nhật dữ liệu.
    """
    try:
        # Dùng to_json_safe phòng trường hợp update ngày (dù model hiện tại ko có)
        data = to_json_safe(gia_han_in.model_dump(exclude_unset=True, by_alias=True))

        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có thông tin nào được gửi để cập nhật")

        response = supabase_client.table("giahan").update(data).eq("magiahan", maGiaHan).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy lượt gia hạn với id={maGiaHan} để cập nhật")

    except Exception as e:
        logger.error("Lỗi khi cập nhật GiaHan ID %s: %s", maGiaHan, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 6. DELETE (Xóa)
@router.delete(
    "/{maGiaHan}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa một lượt gia hạn"
)
def delete_gia_han(maGiaHan: int):
    """
    (Hành chính) Xóa một bản ghi gia hạn.
    Lưu ý: Việc này không tự động cập nhật lại soLanGiaHan trong 'muontra'.
    """
    try:
        response = supabase_client.table("giahan").delete().eq("magiahan", maGiaHan).execute()

        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy lượt gia hạn với id={maGiaHan} để xóa")

        return

    except Exception as e:
        logger.error("Lỗi khi xóa GiaHan ID %s: %s", maGiaHan, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
