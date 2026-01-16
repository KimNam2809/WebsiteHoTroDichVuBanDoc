from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from typing import List, Optional
from app.models.gia_han import GiaHan, GiaHanCreate, GiaHanUpdate
from app.connect.db import supabase_client
from app.connect.auth import get_current_staff_profile, get_current_user_from_db, get_renewal_owner_or_staff, get_loan_owner_or_staff
from app.utils import to_json_safe
import logging, ast, re
from datetime import datetime


router = APIRouter()
logger = logging.getLogger(__name__)

TABLE_NAME = "giahan"


def send_notification(ma_ban_doc: int, tieu_de: str, noi_dung: str):
    try:
        data = {
            "mabandoc": ma_ban_doc,
            "tieude": tieu_de,
            "noidung": noi_dung,
            "hinhthuc": "HeThong",
            "trangthai": "chuaXem",
            "thoigiangui": datetime.now().isoformat(),
            "thamchieu": "GiaHan"
        }
        supabase_client.table("thongbao").insert(to_json_safe(data)).execute()
    except Exception as e:
        logger.error(f"Lỗi gửi thông báo: {e}")

@router.post(
    "/",
    response_model=GiaHan,
    status_code=status.HTTP_201_CREATED,
    summary="Tạo một lượt gia hạn mượn sách mới"
)
def create_gia_han(gia_han_in: GiaHanCreate, background_tasks: BackgroundTasks, current_user: dict = Depends(get_current_user_from_db)):
    """
    Tạo một lượt gia hạn mới (gọi RPC fn_gia_han).
    - Nhân viên: Được phép tạo (với maNhanVien của họ).
    - Bạn đọc: Chỉ được phép tạo cho lượt mượn CỦA CHÍNH MÌNH.
    """

    try:
        user_role = current_user.get("vaitro")
        user_id_from_token = current_user.get("manguoidung")
        ma_muon_tra_can_gia_han = gia_han_in.maMuonTra

        if user_role == "nhanVien":
                # Nhân viên được phép, nhưng phải dùng maNhanVien của mình
                # (Chúng ta giả định Nhân viên tự truyền maNhanVien của họ vào body)
                pass

        elif user_role == "nguoiDung":
            # Bạn đọc phải là chủ của lượt mượn
            profile_res = supabase_client.table("bandoc") \
                .select("mabandoc") \
                .eq("manguoidung", user_id_from_token) \
                .single().execute()

            if not profile_res.data:
                raise HTTPException(status_code=403, detail="Bạn không có hồ sơ bạn đọc hợp lệ.")

            own_maBanDoc = profile_res.data["mabandoc"]

            # Kiểm tra xem lượt mượn có thuộc về họ không
            loan_res = supabase_client.table("muontra") \
                .select("mabandoc") \
                .eq("mamuontra", ma_muon_tra_can_gia_han) \
                .single().execute()

            if not loan_res.data:
                raise HTTPException(status_code=404, detail="Không tìm thấy lượt mượn để gia hạn.")

            loan_owner_id = loan_res.data["mabandoc"]

            if own_maBanDoc != loan_owner_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Bạn đọc chỉ được phép gia hạn cho lượt mượn của chính mình."
                )
        else:
            raise HTTPException(status_code=403, detail="Vai trò của bạn không được phép gia hạn.")

        params = {
            "p_ma_muon_tra": gia_han_in.maMuonTra,
            "p_ma_nhan_vien": gia_han_in.maNhanVien,
            "p_ngay_tra_moi": gia_han_in.ngayTraMoi,
            "p_ly_do_gia_han": gia_han_in.lyDoGiaHan
        }

        # chuyển datetime/Decimal trước khi gửi
        safe_params = to_json_safe(params)

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
            result = data
            if isinstance(data, list):
                result = data[0]
            
            # [NOTIFY] Gửi thông báo
            try:
                # Cần lấy mabandoc. Nhưng giahan RPC có thể không trả về mabandoc trực tiếp (nó trả về record giahan).
                # Giahan record -> mamuontra -> mabandoc.
                # Tuy nhiên, ở trên ta đã check `own_maBanDoc` (nếu là user). Nếu nhân viên thì chưa có maBanDoc.
                # Ta sẽ lấy từ kết quả RPC trả về nếu có (nếu view return đủ). 
                # Nếu RPC chỉ trả `magiahan`, ta phải query lại.
                # Nhưng logic đơn giản:
                if result:
                    # Async get info and notify
                    pass
                    # Lưu ý: result là record GiaHan. Cần query MuonTra để lấy MaBanDoc.
                    # Cách tốt nhất là dùng một hàm helper async khác hoặc query ngay đây.
                    # Để đơn giản và nhanh, tôi sẽ query ngay đây (vì đã có exception handler bao bọc).
                    
                    # Lấy mamuontra từ result
                    ma_muon_tra = result.get("mamuontra")
                    if ma_muon_tra:
                        # Query maBanDoc
                        res_mt = supabase_client.table("muontra").select("mabandoc").eq("mamuontra", ma_muon_tra).single().execute()
                        if res_mt.data:
                            mdoc = res_mt.data["mabandoc"]
                            ngay_moi = result.get("ngaytramoi", "N/A")
                            background_tasks.add_task(
                                send_notification,
                                mdoc,
                                "Gia hạn tài liệu thành công",
                                f"Bạn đã gia hạn thành công. Hạn trả mới: {ngay_moi}."
                            )

            except Exception as notify_e:
                logger.warning(f"Lỗi gửi thông báo gia hạn: {notify_e}")

            return result

        # 3) Nếu không có data và không có error -> coi là không tạo được
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể tạo lượt gia hạn")

    except HTTPException:
        # Bắt và ném lại HTTPException để giữ nguyên status/detail
        raise
    except Exception as e:
        error_str = str(e)
        logger.error(f"Lỗi gia hạn: {error_str}")

        # Tìm chuỗi nằm giữa 'message': ' VÀ ' kế tiếp
        match = re.search(r"'message':\s*'([^']*)'", error_str)

        if match:
            clean_message = match.group(1) # Lấy nội dung trong ngoặc đơn
            raise HTTPException(status_code=400, detail=clean_message)

        # Fallback: Nếu không lọc được thì mới trả về lỗi gốc
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Gia hạn thất bại: {error_str}"
        )

# 2. READ (Lấy lịch sử gia hạn của 1 lượt mượn)
@router.get(
    "/muon-tra/{maMuonTra}",
    response_model=List[GiaHan],
    status_code=status.HTTP_200_OK,
    summary="Lấy lịch sử gia hạn của một lượt mượn"
)
def get_gia_han_by_muon_tra(maMuonTra: int, current_user: dict = Depends(get_loan_owner_or_staff)):
    """
    Lấy danh sách các lần gia hạn của 1 lượt mượn.
    - Nhân viên: Thấy tất cả.
    - Bạn đọc: Chỉ thấy của mình.
    """
    try:
        response = (
            supabase_client.table(TABLE_NAME)
            .select("*")
            .eq("mamuontra", maMuonTra)
            .order("thoidiemgiahan", desc=False)
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
def get_all_gia_han(current_user: dict = Depends(get_current_user_from_db)):
    """
    Lấy danh sách tất cả các lượt gia hạn.
    - Nhân viên: Thấy tất cả.
    - Bạn đọc: Chỉ thấy của mình.
    """
    try:
        user_role = current_user.get("vaitro")
        current_id = current_user.get("manguoidung")

        # Cần JOIN 2 cấp: GiaHan -> MuonTra -> BanDoc
        query = supabase_client.table(TABLE_NAME).select("*, muontra!inner(mabandoc)")

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

                ma_ban_doc = profile_response.data.get("mabandoc")

                # Lọc: chỉ lấy các lượt gia hạn
                # có `muontra.mabandoc` khớp
                query = query.eq("muontra.mabandoc", ma_ban_doc)

            except Exception as profile_e:
                logger.error(f"Lỗi khi lấy hồ sơ bạn đọc (ID: {current_id}): {profile_e}")
                raise HTTPException(status_code=500, detail="Lỗi khi truy xuất hồ sơ bạn đọc.")
        else:
            return [] # Vai trò không xác định

        response = query.order("magiahan", desc=True).execute()
        return response.data or []

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
def get_gia_han_by_id(maGiaHan: int, current_user: dict = Depends(get_renewal_owner_or_staff)):
    """
    Lấy thông tin chi tiết của một lượt gia hạn bằng ID.
    - Nhân viên: Thấy tất cả.
    - Bạn đọc: Chỉ thấy của mình.
    """
    try:
        response = supabase_client.table(TABLE_NAME).select("*").eq("magiahan", maGiaHan).single().execute()

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
def update_gia_han(maGiaHan: int, gia_han_in: GiaHanUpdate, current_user: dict = Depends(get_renewal_owner_or_staff)):
    """
    Cập nhật thông tin cho một lượt gia hạn (ví dụ: sửa lý do).
    - Nhân viên: Cập nhật.
    - Bạn đọc: Chỉ cập nhật của mình.
    """
    try:
        data = to_json_safe(gia_han_in.model_dump(exclude_unset=True, by_alias=True))

        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có thông tin nào được gửi để cập nhật")

        response = supabase_client.table(TABLE_NAME).update(data).eq("magiahan", maGiaHan).execute()

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
def delete_gia_han(maGiaHan: int, current_user: dict = Depends(get_current_staff_profile)):
    """
    (Hành chính) Xóa một bản ghi gia hạn.
    Lưu ý: Việc này không tự động cập nhật lại soLanGiaHan trong 'muontra'.
    """
    try:
        response = supabase_client.table(TABLE_NAME).delete().eq("magiahan", maGiaHan).execute()

        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy lượt gia hạn với id={maGiaHan} để xóa")

        return

    except Exception as e:
        logger.error("Lỗi khi xóa GiaHan ID %s: %s", maGiaHan, e)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
