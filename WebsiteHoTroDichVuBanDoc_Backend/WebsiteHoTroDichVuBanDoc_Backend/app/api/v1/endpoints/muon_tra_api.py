from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.models.muon_tra import MuonTra, MuonTraCreate, MuonTraUpdate, MuonTraTraSach
from app.connect.db import supabase_client
from app.connect.auth import get_current_staff_profile, get_current_user_from_db, get_loan_owner_or_staff
from app.utils import to_json_safe
import logging, ast

router = APIRouter()
logger = logging.getLogger(__name__)

TABLE_NAME = "muontra"

# 1. CREATE (ĐÃ SỬA LỖI EXCEPT)
@router.post(
    "/",
    response_model=MuonTra,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo một lượt mượn sách mới (Nhân viên/Bạn đọc)"
)
def create_muon_tra(muon_tra_in: MuonTraCreate, current_user: dict = Depends(get_current_user_from_db)):
    """
    Tạo một lượt mượn (RPC fn_muon_tai_lieu).
    - Nhân viên: Được phép tạo cho bất kỳ ai.
    - Bạn đọc: Chỉ được tạo cho chính mình (maNhanVien sẽ là NULL).
    """
    user_role = current_user.get("vaitro")
    user_id_from_token = current_user.get("manguoidung")

    p_ma_nhan_vien_param: Optional[int] = None # Mặc định là NULL

    try:
        # === LOGIC PHÂN QUYỀN ===
        if user_role == "nhanVien":
            # Nhân viên phải tự điền ID của mình
            profile_res = supabase_client.table("nhanvien") \
                .select("manhanvien") \
                .eq("manguoidung", user_id_from_token) \
                .single().execute()

            if not profile_res.data:
                raise HTTPException(status_code=403, detail="Tài khoản Nhân viên không có hồ sơ hợp lệ.")

            p_ma_nhan_vien_param = profile_res.data["manhanvien"]

            # (An toàn): Ghi đè maNhanVien từ body bằng maNhanVien từ token
            if muon_tra_in.maNhanVien and muon_tra_in.maNhanVien != p_ma_nhan_vien_param:
                raise HTTPException(status_code=403, detail="Nhân viên chỉ có thể tạo lượt mượn bằng ID của chính mình.")
            # Nếu nhân viên không gửi maNhanVien, tự động dùng của họ
            muon_tra_in.maNhanVien = p_ma_nhan_vien_param

        elif user_role == "nguoiDung":
            # Bạn đọc phải tự tạo cho chính mình
            profile_res = supabase_client.table("bandoc") \
                .select("mabandoc") \
                .eq("manguoidung", user_id_from_token) \
                .single().execute()

            if not profile_res.data:
                raise HTTPException(status_code=403, detail="Bạn không có hồ sơ bạn đọc hợp lệ.")

            own_maBanDoc = profile_res.data["mabandoc"]

            # Kiểm tra xem maBanDoc trong body có khớp không
            if own_maBanDoc != muon_tra_in.maBanDoc:
                raise HTTPException(status_code=403, detail="Bạn đọc chỉ được tạo lượt mượn cho chính mình.")
            # Bạn đọc tự tạo -> maNhanVien là NULL
            p_ma_nhan_vien_param = None
        else:
            raise HTTPException(status_code=403, detail="Vai trò của bạn không được phép tạo lượt mượn.")

        params = {
            "p_ma_ban_sao": muon_tra_in.maBanSao,
            "p_ma_ban_doc": muon_tra_in.maBanDoc,
            "p_ma_nhan_vien": p_ma_nhan_vien_param, # Sẽ là Int (Nhân viên) hoặc None (Bạn đọc)
            "p_ngay_tra": muon_tra_in.ngayTra
        }
        safe_params = to_json_safe(params)

        response = supabase_client.rpc("fn_muon_tai_lieu", safe_params).execute()
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể tạo lượt mượn (RPC không trả về data)")

    except HTTPException:
        raise

    except Exception as e:
        error_str = str(e)

        # 1. Ưu tiên kiểm tra "lá cờ" nghiệp vụ
        if "BUSINESS_ERROR" in error_str:
            detail_message = "Lỗi nghiệp vụ (Không thể phân tích chi tiết)" # Fallback

            # 2. Cố gắng lấy message đẹp
            try:
                # Tìm dict bằng ast.literal_eval
                start = error_str.find("{")
                end = error_str.rfind("}") + 1

                if start != -1 and end != 0:
                    error_dict = ast.literal_eval(error_str[start:end])
                    detail_message = error_dict.get("message", "Lỗi nghiệp vụ (Không có 'message' trong dict)")
                else:
                    # Nếu không tìm thấy dict, thử tìm message thô (Postgres style)
                    if "MESSAGE:" in error_str.upper():
                        detail_message = error_str.split("MESSAGE:")[1].split("DETAIL:")[0].strip().replace("\"", "")
                    else:
                        detail_message = error_str # Trả về lỗi thô (đã dọn)
            except Exception as parse_error:
                # Dù parse lỗi, ta vẫn biết đây là lỗi 400.
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

# 2. READ ALL (Đọc tất cả)
@router.get(
    "/",
    response_model=List[MuonTra],
    status_code=status.HTTP_200_OK,
    summary="Lấy tất cả lịch sử mượn/trả"
)
def get_all_muon_tra(current_user: dict = Depends(get_current_user_from_db)):
    """
    Lấy danh sách các lượt mượn/trả.
    - Nhân viên: Thấy TẤT CẢ.
    - Bạn đọc: Chỉ thấy CỦA MÌNH.
    """
    try:
        user_role = current_user.get("vaitro")
        user_id = current_user.get("manguoidung")

        query = supabase_client.table(TABLE_NAME).select("*")

        if user_role == "nhanVien":
            pass # Nhân viên thấy tất cả

        elif user_role == "nguoiDung":
            try:
                profile_res = supabase_client.table("bandoc") \
                    .select("mabandoc") \
                    .eq("manguoidung", user_id) \
                    .single().execute()

                if not profile_res.data:
                    return [] # Không có hồ sơ

                ma_ban_doc = profile_res.data["mabandoc"]
                query = query.eq("mabandoc", ma_ban_doc)

            except Exception as profile_e:
                logger.error(f"Lỗi khi lấy hồ sơ bạn đọc (ID: {user_id}): {profile_e}")
                raise HTTPException(status_code=500, detail="Lỗi khi truy xuất hồ sơ bạn đọc.")
        else:
            return []

        response = query.order("mamuontra", desc=True).execute()
        return response.data or []

    except Exception as e:
        logger.error("Lỗi khi lấy tất cả MuonTra: %s", e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 3. READ ONE (Đọc một)
@router.get(
    "/{maMuonTra}",
    response_model=MuonTra,
    status_code=status.HTTP_200_OK,
    summary="Lấy chi tiết một lượt mượn/trả"
)
def get_muon_tra_by_id(maMuonTra: int, current_user: dict = Depends(get_loan_owner_or_staff)):
    """
    Lấy thông tin chi tiết của một lượt mượn.
    - Nhân viên: Thấy bất kỳ.
    - Bạn đọc: Chỉ thấy của mình.
    """
    try:
        response = supabase_client.table(TABLE_NAME).select("*").eq("mamuontra", maMuonTra).single().execute()

        if response.data:
            return response.data

    except Exception as e:
        # Lỗi .single() khi không tìm thấy sẽ ném exception
        logger.warning("Không tìm thấy MuonTra ID %s: %s", maMuonTra, e)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy lượt mượn với id={maMuonTra}")

# 4. UPDATE (Cập nhật)
@router.put(
    "/{maMuonTra}",
    response_model=MuonTra,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật một lượt mượn (ví dụ: ghi phạt, ghi chú)"
)
def update_muon_tra(maMuonTra: int, muon_tra_in: MuonTraUpdate, current_staff: dict = Depends(get_current_staff_profile)):
    """
    Cập nhật thông tin cho một lượt mượn (ví dụ: thêm tiền phạt, ghi chú).

    LƯU Ý: Hàm này là một hàm UPDATE đơn giản. Nó KHÔNG xử lý
    logic nghiệp vụ "Trả Sách" (cập nhật lại bansao.trangThaiChoMuon = True).
    Chúng ta sẽ làm điều đó bằng một RPC riêng (fn_tra_sach).
    """
    try:
        # Dùng hàm to_json_safe vì có thể cập nhật tienPhat (Decimal)
        data = to_json_safe(muon_tra_in.model_dump(exclude_unset=True, by_alias=True))

        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có thông tin nào được gửi để cập nhật")

        response = supabase_client.table(TABLE_NAME).update(data).eq("mamuontra", maMuonTra).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy lượt mượn với id={maMuonTra} để cập nhật")

    except Exception as e:
        logger.error("Lỗi khi cập nhật MuonTra ID %s: %s", maMuonTra, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 5. DELETE (Xóa)
@router.delete(
    "/{maMuonTra}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa một lượt mượn/trả"
)
def delete_muon_tra(maMuonTra: int, current_staff: dict = Depends(get_current_staff_profile)):
    """
    (Hành chính) Xóa một bản ghi mượn/trả.
    """
    try:
        response = supabase_client.table(TABLE_NAME).delete().eq("mamuontra", maMuonTra).execute()

        # .delete() trả về data của bản ghi đã xóa
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy lượt mượn với id={maMuonTra} để xóa")

        return

    except Exception as e:
        error_str = str(e)
        if "foreign key constraint" in error_str:
            logger.warning("Không thể xóa MuonTra ID %s do khóa ngoại: %s", maMuonTra, e)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Không thể xóa: Lượt mượn này đang được 'GiaHan' hoặc 'YeuCauGiao' tham chiếu đến."
            )
        logger.error("Lỗi khi xóa MuonTra ID %s: %s", maMuonTra, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 6. TRẢ SÁCH (RPC)
@router.post(
    "/{maMuonTra}/tra-sach",
    response_model=MuonTra,
    status_code=status.HTTP_200_OK, # Trả về 200 OK vì đây là cập nhật
    summary="Xử lý nghiệp vụ trả sách"
)
def tra_sach(maMuonTra: int, tra_sach_in: MuonTraTraSach, current_staff: dict = Depends(get_current_staff_profile)):
    """
    Gọi RPC fn_tra_sach để xử lý nghiệp vụ trả sách.
    Hàm này sẽ tự động:
    1. Kiểm tra xem sách đã trả chưa.
    2. Cập nhật `MuonTra` -> `trangthaimuon = 'daTra'`, `ngaytrathucte = now()`.
    3. Cập nhật `BanSao` -> `trangthaichomuon = True`.
    """
    params = {
        "p_ma_muon_tra": maMuonTra,
        "p_ma_nhan_vien_tra": tra_sach_in.maNhanVien
    }

    # safe_params không thực sự cần ở đây (vì toàn bigint)
    # nhưng dùng cho nhất quán cũng tốt
    safe_params = to_json_safe(params)

    try:
        response = supabase_client.rpc("fn_tra_sach", safe_params).execute()
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể trả sách (RPC không trả về data)")

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