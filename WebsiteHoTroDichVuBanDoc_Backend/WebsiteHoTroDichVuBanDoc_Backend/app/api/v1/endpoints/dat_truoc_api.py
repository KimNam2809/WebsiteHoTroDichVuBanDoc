from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List, Optional
from app.models.dat_truoc import DatTruoc, DatTruocCreate, DatTruocUpdate
from app.connect.db import supabase_client
from app.connect.auth import get_current_user_from_db, get_owner_or_staff, get_reservation_owner_or_staff
from app.utils import to_json_safe
import logging, ast
from datetime import datetime

router = APIRouter()
logger = logging.getLogger(__name__)

TABLE_NAME = "dattruoc"

def send_notification(ma_ban_doc: int, tieu_de: str, noi_dung: str):
    try:
        data = {
            "mabandoc": ma_ban_doc,
            "tieude": tieu_de,
            "noidung": noi_dung,
            "hinhthuc": "HeThong",
            "trangthai": "chuaXem",
            "thoigiangui": datetime.now().isoformat(),
            "thamchieu": "DatTruoc"
        }
        supabase_client.table("thongbao").insert(to_json_safe(data)).execute()
    except Exception as e:
        logger.error(f"Lỗi gửi thông báo: {e}")

# 1. CREATE (Nghiệp vụ Đặt Trước)
@router.post(
    "/",
    response_model=DatTruoc,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo một lượt đặt trước sách (Đã có logic nghiệp vụ)"
)
def create_dat_truoc(
    dat_truoc_in: DatTruocCreate, 
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_owner_or_staff)
):
    """
    Gọi RPC fn_dat_truoc để tạo một lượt đặt trước mới.
    Hàm này sẽ tự động:
    1. Kiểm tra sách có đang được mượn không.
    2. Kiểm tra bạn đọc đã đặt sách này chưa.
    3. Tạo bản ghi `DatTruoc` mới.
    """
    """
    Tạo một lượt đặt trước mới.
    - Bạn đọc: Chỉ được tự đặt cho chính mình.
    - Nhân viên: Được phép đặt cho bất kỳ bạn đọc nào.
    """
    user_role = current_user.get("vaitro")
    user_id_from_token = current_user.get("manguoidung")
    mabandoc_from_body = dat_truoc_in.maBanDoc

    if user_role == "nhanVien":
        pass # Nhân viên được phép

    elif user_role == "nguoiDung":
        try:
            profile_res = supabase_client.table("bandoc") \
                .select("mabandoc") \
                .eq("manguoidung", user_id_from_token) \
                .single() \
                .execute()

            if not profile_res.data:
                raise HTTPException(status_code=403, detail="Bạn không có hồ sơ bạn đọc hợp lệ.")

            own_maBanDoc = profile_res.data["mabandoc"]

            if own_maBanDoc != mabandoc_from_body:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Bạn đọc chỉ được phép đặt trước cho chính mình."
                )
        except Exception as e:
            if isinstance(e, HTTPException): raise e
            raise HTTPException(status_code=500, detail="Lỗi khi xác thực hồ sơ bạn đọc.")
    else:
        raise HTTPException(status_code=403, detail="Vai trò của bạn không được phép đặt trước.")

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
            result = data[0] if isinstance(data, list) else data
            
            # [NOTIFY] Gửi thông báo
            try:
                ma_ban_doc = result.get("mabandoc")
                ma_dat_truoc = result.get("madattruoc")
                background_tasks.add_task(
                    send_notification,
                    ma_ban_doc,
                    "Đặt trước thành công",
                    f"Bạn đã đặt trước thành công (Mã: {ma_dat_truoc}). Hệ thống sẽ thông báo khi có sách."
                )
            except Exception as notify_e:
                logger.warning(f"Không thể gửi thông báo đặt trước: {notify_e}")

            return result

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
def get_all_dat_truoc(current_user: dict = Depends(get_current_user_from_db)):
    """
    Lấy danh sách tất cả các lượt đặt trước trong hệ thống.
    - Bạn đọc chỉ thấy lượt đặt trước của chính mình.
    - Nhân viên thấy tất cả lượt đặt trước.
    """
    try:
        user_role = current_user.get("vaitro")
        current_id = current_user.get("manguoidung")

        query = supabase_client.table(TABLE_NAME).select("*")

        if user_role == "nhanVien":
            pass # Nhân viên thấy tất cả

        elif user_role == "nguoiDung":
            try:
                profile_response = supabase_client.table("bandoc") \
                    .select("mabandoc") \
                    .eq("manguoidung", current_id) \
                    .single().execute()

                if not profile_response.data:
                    return [] # Không có hồ sơ

                ma_ban_doc = profile_response.data.get("mabandoc") # Sửa: mabandoc

                # SỬA LỖI CHÍNH: DÙNG 'mabandoc' (viết thường)
                query = query.eq("mabandoc", ma_ban_doc)

            except Exception as profile_e:
                logger.error(f"Lỗi khi lấy hồ sơ bạn đọc (ID: {current_id}): {profile_e}")
                raise HTTPException(status_code=500, detail="Lỗi khi truy xuất hồ sơ bạn đọc.")
        else:
            return [] # Vai trò không xác định

        response = query.order("madattruoc", desc=True).execute()
        return response.data or []

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
def get_dat_truoc_by_id(maDatTruoc: int, current_user: dict = Depends(get_reservation_owner_or_staff)):
    """Lấy chi tiết một lượt đặt trước bằng ID."""
    try:
        response = supabase_client.table(TABLE_NAME).select("*").eq("madattruoc", maDatTruoc).single().execute()
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
def update_dat_truoc(maDatTruoc: int, dat_truoc_in: DatTruocUpdate, current_user: dict = Depends(get_reservation_owner_or_staff)):
    """
    Cập nhật trạng thái của một lượt đặt trước.
    Thường dùng để chuyển `trangThaiDatTruoc` thành 'daHuy' hoặc 'daHoanThanh'.
    """
    try:
        data = to_json_safe(dat_truoc_in.model_dump(exclude_unset=True, by_alias=True))
        if not data:
            raise HTTPException(status_code=400, detail="Không có thông tin nào được gửi để cập nhật")

        response = supabase_client.table(TABLE_NAME).update(data).eq("madattruoc", maDatTruoc).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=404, detail=f"Không tìm thấy lượt đặt trước với id={maDatTruoc}")

    except Exception as e:
        logger.error("Lỗi khi cập nhật DatTruoc ID %s: %s", maDatTruoc, e)
        raise HTTPException(status_code=500, detail=str(e))

# 5. DELETE (Xóa)
@router.delete(
    "/{maDatTruoc}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa một lượt đặt trước"
)
def delete_dat_truoc(maDatTruoc: int, current_user: dict = Depends(get_reservation_owner_or_staff)):
    """(Hành chính) Xóa một bản ghi đặt trước."""
    try:
        response = supabase_client.table("dattruoc").delete().eq("madattruoc", maDatTruoc).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy lượt đặt trước với id={maDatTruoc} để xóa")
        return
    except Exception as e:
        logger.error("Lỗi khi xóa DatTruoc ID %s: %s", maDatTruoc, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))