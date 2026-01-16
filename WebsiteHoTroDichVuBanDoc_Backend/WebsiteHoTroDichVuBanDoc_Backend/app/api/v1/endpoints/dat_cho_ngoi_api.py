from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional, Dict
from datetime import datetime
# Import DatChoNgoiUpdate
from app.models.dat_cho_ngoi import DatChoNgoi, DatChoNgoiCreate, DatChoNgoiUpdate, DatChoNgoiCheckIn
from app.connect.db import supabase_client
from app.connect.auth import get_booking_seat_owner_or_staff, get_current_staff_profile, get_current_user_from_db
from app.utils import to_json_safe
import logging, ast

def send_notification(ma_ban_doc: Optional[int], tieu_de: str, noi_dung: str, extra_data: Dict = None):
    try:
        # Schema allows maBanDoc to be Null

        data = {
            "mabandoc": ma_ban_doc,
            "tieude": tieu_de,
            "noidung": noi_dung,
            "hinhthuc": "HeThong",
            "trangthai": "chuaXem",
            "thoigiangui": datetime.now().isoformat(),
            "thamchieu": "Đặt chỗ ngồi",
            "dulieugoc": None
        }
        supabase_client.table("thongbao").insert(to_json_safe(data)).execute()
    except Exception as e:
        logger.error(f"Lỗi gửi thông báo: {e}")

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
def create_dat_cho_ngoi(dat_cho_in: DatChoNgoiCreate, current_user: dict = Depends(get_current_user_from_db)):
    """
    Gọi RPC fn_dat_cho để tạo một lượt đặt chỗ mới.
    Hàm này sẽ tự động:
    1. Kiểm tra thời gian hợp lệ.
    2. Kiểm tra xung đột (overlap) thời gian với các lượt đặt khác.
    3. Tạo bản ghi `DatChoNgoi` mới.

    - Bạn đọc: Chỉ được tự đặt cho chính mình.
    - Nhân viên: Được phép đặt cho bất kỳ bạn đọc nào.
    """
    user_role = current_user.get("vaitro")
    user_id_from_token = current_user.get("manguoidung")
    mabandoc_from_body = dat_cho_in.maBanDoc

    if user_role == "nhanVien":
        # Nhân viên được phép đặt cho bất kỳ ai (kể cả chính họ
        # nếu họ cũng là bạn đọc), không cần kiểm tra thêm.
        pass

    elif user_role == "nguoiDung":
        # Bạn đọc phải tự đặt cho chính mình
        try:
            # Lấy hồ sơ bạn đọc của người đang đăng nhập
            profile_res = supabase_client.table("bandoc") \
                .select("mabandoc") \
                .eq("manguoidung", user_id_from_token) \
                .single() \
                .execute()

            if not profile_res.data:
                raise HTTPException(status_code=403, detail="Bạn không có hồ sơ bạn đọc hợp lệ.")

            own_maBanDoc = profile_res.data["mabandoc"]

            # So sánh maBanDoc từ token VỚI maBanDoc từ body
            if own_maBanDoc != mabandoc_from_body:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Bạn đọc chỉ được phép đặt chỗ cho chính mình."
                )

        except Exception as e:
            if isinstance(e, HTTPException): raise e
            logger.error(f"Lỗi khi xác thực quyền Bạn đọc: {e}")
            raise HTTPException(status_code=500, detail="Lỗi khi xác thực hồ sơ bạn đọc.")
    else:
        # Nếu vai trò không phải 'nhanVien' hay 'nguoiDung'
        raise HTTPException(status_code=403, detail="Vai trò của bạn không được phép đặt chỗ.")

    params = {
        "p_ma_cho_ngoi": dat_cho_in.maChoNgoi,
        "p_ma_ban_doc": mabandoc_from_body,
        # Đảm bảo Pydantic model dùng `datetime` để parse
        "p_thoi_gian_bat_dau": dat_cho_in.thoiGianBatDau,
        "p_thoi_gian_ket_thuc": dat_cho_in.thoiGianKetThuc
    }
    # Dùng to_json_safe vì có timestamptz
    safe_params = to_json_safe(params)

    try:
        response = supabase_client.rpc("fn_dat_cho_ngoi", safe_params).execute()
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

        send_notification(
                mabandoc_from_body,
                "Đăng ký thẻ thành công",
                f"Chúc mừng! Chỗ ngồi của bạn đã được đặt thành công (Mã chỗ ngồi: {dat_cho_in.maChoNgoi}) đã được đặt thành công. Vui lòng đến thư viện để nhận chỗ ngồi.",

            )

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
def get_all_dat_cho_ngoi(current_user: dict = Depends(get_current_user_from_db)):
    """
    Lấy danh sách đặt chỗ dựa trên vai trò:
    - Nhân viên: Thấy TẤT CẢ.
    - Bạn đọc: Chỉ thấy CỦA MÌNH.
    """
    try:
        user_role = current_user.get("vaitro")
        user_id = current_user.get("manguoidung")

        # 2. Xây dựng câu query cơ bản
        query = supabase_client.table(TABLE_NAME).select("*")

        # 3. Phân nhánh logic
        if user_role == "nhanVien":
            # Nhân viên thấy tất cả, không cần lọc thêm
            pass

        elif user_role == "nguoiDung":
            # Bạn đọc chỉ thấy của mình. Cần lấy maBanDoc của họ.
            try:
                profile_res = supabase_client.table("bandoc") \
                    .select("mabandoc") \
                    .eq("manguoidung", user_id) \
                    .single() \
                    .execute()

                if not profile_res.data:
                    return [] # User này có token nhưng không có hồ sơ bạn đọc

                ma_ban_doc = profile_res.data["mabandoc"]

                # Thêm bộ lọc "CHÍNH CHỦ" vào query
                query = query.eq("mabandoc", ma_ban_doc)

            except Exception as profile_e:
                logger.error(f"Lỗi khi lấy hồ sơ bạn đọc (ID: {user_id}): {profile_e}")
                raise HTTPException(status_code=500, detail="Lỗi khi truy xuất hồ sơ bạn đọc.")

        else:
            # Vai trò khác (nếu có)
            return []

        # 4. Thực thi câu query đã được xây dựng
        response = query.order("madatcho", desc=True).execute()

        return response.data or []

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
def get_dat_cho_ngoi_by_id(maDatCho: int, current_user: dict = Depends(get_booking_seat_owner_or_staff)):
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
def update_dat_cho_ngoi(maDatCho: int, dat_cho_in: DatChoNgoiUpdate, current_user: dict = Depends(get_booking_seat_owner_or_staff)):
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
def delete_dat_cho_ngoi(maDatCho: int, current_user: dict = Depends(get_current_staff_profile)):
    """(Hành chính) Xóa một bản ghi đặt chỗ."""
    try:
        response = supabase_client.table(TABLE_NAME).delete().eq("madatcho", maDatCho).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy lượt đặt chỗ với id={maDatCho} để xóa")
        return
    except Exception as e:
        logger.error("Lỗi khi xóa DatChoNgoi ID %s: %s", maDatCho, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 6. ACTION (Nghiệp vụ Check-in)
@router.post(
    "/{maDatCho}/check-in",
    response_model=DatChoNgoi,
    status_code=status.HTTP_200_OK, # 200 OK vì là cập nhật
    summary="Nhân viên xác nhận (check-in) một lượt đặt chỗ"
)
def check_in_cho_ngoi(maDatCho: int, check_in_in: DatChoNgoiCheckIn, current_staff: dict = Depends(get_current_staff_profile)):
    """
    Gọi RPC fn_check_in_cho_ngoi để nhân viên xác nhận lượt đặt.
    Hàm này sẽ tự động:
    1. Kiểm tra lượt đặt có hợp lệ không (chưa hủy, chưa check-in).
    2. Cập nhật `DatChoNgoi` -> `manhanvien = [ID]`.
    3. Cập nhật `ChoNgoi` -> `trangthai = 'dangSuDung'`.
    """
    params = {
        "p_ma_dat_cho": maDatCho,
        "p_ma_nhan_vien_check_in": check_in_in.maNhanVien
    }
    safe_params = to_json_safe(params)

    try:
        response = supabase_client.rpc("fn_check_in_cho_ngoi", safe_params).execute()
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể check-in (RPC không trả về data)")

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