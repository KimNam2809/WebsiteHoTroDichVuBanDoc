from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from app.models.dat_phong import DatPhong, DatPhongCreate, DatPhongUpdate, DatPhongDuyet
from app.connect.db import supabase_client
from app.utils import to_json_safe
import logging, ast

router = APIRouter()
logger = logging.getLogger(__name__)

TABLE_NAME = "datphong"

# 1. CREATE (Nghiệp vụ Đặt Phòng)
@router.post(
    "/",
    response_model=DatPhong,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo một lượt đặt phòng mới (Đã có logic nghiệp vụ)"
)
def create_dat_phong(dat_phong_in: DatPhongCreate):
    """
    Gọi RPC fn_dat_phong để tạo một lượt đặt phòng mới.
    Kiểm tra xung đột thời gian và trạng thái phòng.
    """
    # Lấy các tham số từ model (bao gồm cả các trường không có 'p_')
    params = {
        "p_ma_phong": dat_phong_in.maPhong,
        "p_nguoi_to_chuc": dat_phong_in.nguoiToChuc,
        "p_so_dien_thoai": dat_phong_in.soDienThoai,
        "p_thoi_gian_bat_dau": dat_phong_in.thoiGianBatDau,
        "p_thoi_gian_ket_thuc": dat_phong_in.thoiGianKetThuc,
        "p_muc_dich_su_dung": dat_phong_in.mucDichSuDung,
        "p_so_nguoi_tham_gia_du_kien": dat_phong_in.soNguoiThamDuDuKien
    }
    safe_params = to_json_safe(params)

    try:
        response = supabase_client.rpc("fn_dat_phong", safe_params).execute()
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể đặt phòng (RPC không trả về data)")

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

# 2. READ ALL
@router.get(
    "/",
    response_model=List[DatPhong],
    status_code=status.HTTP_200_OK,
    summary="Lấy tất cả các lượt đặt phòng"
)
def get_all_dat_phong():
    """Lấy danh sách tất cả các lượt đặt phòng trong hệ thống."""
    try:
        response = supabase_client.table(TABLE_NAME).select("*").order("madatphong", desc=True).execute()
        if response.data:
            return response.data
        return []
    except Exception as e:
        logger.error("Lỗi khi lấy tất cả DatPhong: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 3. READ ONE
@router.get(
    "/{maDatPhong}",
    response_model=DatPhong,
    status_code=status.HTTP_200_OK,
    summary="Lấy chi tiết một lượt đặt phòng"
)
def get_dat_phong_by_id(maDatPhong: int):
    """Lấy chi tiết một lượt đặt phòng bằng ID."""
    try:
        response = supabase_client.table(TABLE_NAME).select("*").eq("madatphong", maDatPhong).single().execute()
        if response.data:
            return response.data
    except Exception as e:
        logger.warning("Không tìm thấy DatPhong ID %s: %s", maDatPhong, e)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy lượt đặt phòng với id={maDatPhong}")

# 4. UPDATE (Hủy hoặc duyệt)
@router.put(
    "/{maDatPhong}",
    response_model=DatPhong,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật trạng thái đặt phòng (ví dụ: Hủy, Duyệt)"
)
def update_dat_phong(maDatPhong: int, dat_phong_in: DatPhongUpdate):
    """
    Cập nhật trạng thái của một lượt đặt phòng
    (ví dụ: nhân viên gán `maNhanVien` và đổi `trangThai` thành 'daDuyet' hoặc 'daHuy').
    """
    try:
        data = to_json_safe(dat_phong_in.model_dump(exclude_unset=True, by_alias=True))
        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có thông tin nào được gửi để cập nhật")

        response = supabase_client.table(TABLE_NAME).update(data).eq("madatphong", maDatPhong).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy lượt đặt phòng với id={maDatPhong} để cập nhật")

    except Exception as e:
        logger.error("Lỗi khi cập nhật DatPhong ID %s: %s", maDatPhong, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 5. DELETE
@router.delete(
    "/{maDatPhong}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa một lượt đặt phòng"
)
def delete_dat_phong(maDatPhong: int):
    """(Hành chính) Xóa một bản ghi đặt phòng."""
    try:
        response = supabase_client.table(TABLE_NAME).delete().eq("madatphong", maDatPhong).execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy lượt đặt phòng với id={maDatPhong} để xóa")
        return
    except Exception as e:
        logger.error("Lỗi khi xóa DatPhong ID %s: %s", maDatPhong, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 6. Duyệt đặt phòng (Nghiệp vụ)
@router.post(
    "/{maDatPhong}/duyet",
    response_model=DatPhong,
    status_code=status.HTTP_200_OK,
    summary="Nhân viên duyệt một lượt đặt phòng"
)
def duyet_dat_phong(maDatPhong: int, duyet_in: DatPhongDuyet):
    """
    Gọi RPC fn_duyet_dat_phong để nhân viên duyệt lượt đặt.
    Hàm này sẽ tự động:
    1. Kiểm tra trạng thái ('dangChoDuyet').
    2. Kiểm tra lại xung đột lần cuối.
    3. Cập nhật `DatPhong` -> `trangthai = 'kichHoat'`, `manhanvien = [ID]`.
    """
    params = {
        "p_ma_dat_phong": maDatPhong,
        "p_ma_nhan_vien_duyet": duyet_in.maNhanVien
    }
    safe_params = to_json_safe(params)

    try:
        # (Sao chép y hệt khối try...except...ast.literal_eval
        # từ hàm create_dat_phong, chỉ đổi tên RPC)
        response = supabase_client.rpc("fn_duyet_dat_phong", safe_params).execute()
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể duyệt (RPC không trả về data)")

    except HTTPException:
        raise
    except Exception as e:
        # (Sao chép y hệt khối except Exception...
        # ... với logic "BUSINESS_ERROR" và "ast.literal_eval"
        # từ hàm create_dat_phong)
        error_str = str(e)
        if "BUSINESS_ERROR" in error_str:
            # ... (code parse lỗi 400) ...
            detail_message = "Lỗi nghiệp vụ"
            try:
                start = error_str.find("{")
                end = error_str.rfind("}") + 1
                if start != -1 and end != 0:
                    error_dict = ast.literal_eval(error_str[start:end])
                    detail_message = error_dict.get("message", "Lỗi nghiệp vụ (Không có 'message' trong dict)")
                else:
                    detail_message = error_str.replace("Exception:", "").replace("PostgrestError:", "").strip()
            except Exception as parse_error:
                detail_message = error_str.replace("Exception:", "").replace("PostgrestError:", "").strip()

            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail_message)

        logger.exception("[LỖI HỆ THỐNG 500] Lỗi không mong muốn: %s", error_str)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Lỗi hệ thống. Vui lòng thử lại sau."
        )