from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.models.nguoi_dung import NguoiDung, NguoiDungCreate, NguoiDungUpdate, UserProfileResponse
from app.models.yeu_cau_the import LatestRequestInfo
from app.connect.db import supabase_client
from app.connect.auth import get_current_staff_profile, get_current_user_from_db, get_user_owner_or_staff
from app.connect.security import get_password_hash
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

TABLE_NAME = "nguoidung"

@router.get(
    "/profile",
    response_model=UserProfileResponse,
    status_code=status.HTTP_200_OK,
    summary="Lấy thông tin hồ sơ người dùng hiện tại"
)

def get_user_profile(
    current_user: dict = Depends(get_current_user_from_db)
):
    """
    Lấy profile người dùng với logic Fallback:
    1. Lấy thông tin từ bảng BanDoc/NhanVien.
    2. Lấy thông tin từ YeuCauThe mới nhất.
    3. Tự động điền 'hoten' từ Yêu cầu thẻ nếu chưa có hồ sơ chính thức.
    """
    user_id = current_user.get("manguoidung")
    email = current_user.get("email")
    role = current_user.get("vaitro")

    # Dữ liệu trả về mặc định (chưa có hồ sơ)
    result = {
        "hoten": "Chưa cập nhật hồ sơ",
        "email": email,
        "vaitro": role,
        "yeu_cau_moi_nhat": None
    }

    try:
        # =================================================
        # BƯỚC 1: LẤY YÊU CẦU THẺ MỚI NHẤT (QUAN TRỌNG)
        # =================================================
        # Vì bảng 'yeucauthe' lưu user_id trong JSONB 'thongtinbosung',
        # ta phải dùng filter đặc biệt của Supabase/PostgREST.
        # Cú pháp: col->>key.eq.value

        latest_req_res = (
            supabase_client.table("yeucauthe")
            .select("mayeucauthe, trangthaiquytrinh, thoigianbatdau, thongtinbosung, loaithe(tenthe)")
            .filter("thongtinbosung->>ma_nguoi_dung_dang_ky", "eq", str(user_id))
            .order("thoigianbatdau", desc=True)
            .limit(1)
            .execute()
        )

        latest_req_data = None
        if latest_req_res.data and len(latest_req_res.data) > 0:
            latest_req_data = latest_req_res.data[0]

            # Map vào model response
            info = latest_req_data.get("thongtinbosung") or {}
            loai_the = latest_req_data.get("loaithe") or {}

            result["yeu_cau_moi_nhat"] = {
                "ma_yeu_cau": latest_req_data["mayeucauthe"],
                "trang_thai": latest_req_data["trangthaiquytrinh"],
                "ten_loai_the": loai_the.get("tenthe", "Không xác định"),
                "ngay_yeu_cau": latest_req_data["thoigianbatdau"],
                "ly_do_tu_choi": info.get("ly_do_tu_choi")
            }

        # =================================================
        # BƯỚC 2: LẤY HỒ SƠ CHÍNH THỨC (BanDoc/NhanVien)
        # =================================================

        if role == "nguoiDung":
            # Logic lấy Bạn Đọc
            query = """
                hoten,
                thebandoc (
                    sothe,
                    ngayhethan,
                    trangthaithe,
                    loaithe (
                        tenthe,
                        tailieumuontoida
                    )
                )
            """
            bd_res = supabase_client.table("bandoc").select(query).eq("manguoidung", user_id).execute()

            if bd_res.data and len(bd_res.data) > 0:
                # --> TRƯỜNG HỢP 1: ĐÃ CÓ HỒ SƠ
                data = bd_res.data[0]
                result["hoten"] = data.get("hoten")

                if data.get("thebandoc") and len(data["thebandoc"]) > 0:
                    # Lấy thẻ mới nhất (thường Supabase trả về list, ta lấy cái đầu hoặc sort nếu cần)
                    # Giả sử lấy cái đầu tiên
                    the = data["thebandoc"][0]
                    lt = the.get("loaithe") or {}

                    result.update({
                        "sothe": the.get("sothe"),
                        "ngayhethan": the.get("ngayhethan"),
                        "trangthaithe": "Hoạt động" if the.get("trangthaithe") else "Đã khóa",
                        "tenthe": lt.get("tenthe"),
                        "tailieumuontoida": lt.get("tailieumuontoida")
                    })
                else:
                    # Có hồ sơ nhưng chưa có thẻ (hoặc thẻ đang chờ tạo)
                    result["sothe"] = "Đang cập nhật..."

            else:
                # --> TRƯỜNG HỢP 2: CHƯA CÓ HỒ SƠ (Mới đăng ký xong, chờ duyệt)
                # Fallback: Lấy tên từ Yêu Cầu Thẻ
                if latest_req_data:
                    info = latest_req_data.get("thongtinbosung") or {}
                    result["hoten"] = info.get("ho_ten", "Người dùng mới")
                else:
                    result["hoten"] = "Khách (Chưa có hồ sơ)"


        elif role == "nhanVien":
            # Logic lấy Nhân viên (như cũ)
            nv_res = supabase_client.table("nhanvien").select("*").eq("manguoidung", user_id).execute()
            if nv_res.data:
                data = nv_res.data[0]
                result.update({
                    "hoten": data.get("hoten"),
                    "manhanviennoibo": data.get("manhanviennoibo"),
                    "phongban": data.get("phongban"),
                    "chucvu": data.get("chucvu"),
                    "ngaytuyendung": data.get("ngaytuyendung")
                })

        return result

    except Exception as e:
        logger.error(f"Lỗi lấy profile user {user_id}: {e}")
        # Trả về dữ liệu an toàn để frontend không bị crash
        return result

# 1. CREATE (Tạo người dùng MỚI)
@router.post(
    "/",
    response_model=NguoiDung, # <-- Trả về NguoiDung (không     có mật khẩu)
    status_code=status.HTTP_201_CREATED,
    summary="Tạo một người dùng mới (đã băm mật khẩu)"
)
def create_nguoi_dung(nguoi_dung_in: NguoiDungCreate, current_staff: dict = Depends(get_current_staff_profile)): # <-- Nhận NguoiDungCreate (có mật khẩu)
    """
    Tạo một người dùng mới. Mật khẩu sẽ tự động được băm.
    """
    try:
        # **PHẦN QUAN TRỌNG VỀ BẢO MẬT**
        # 1. Lấy dữ liệu từ Pydantic model
        data = nguoi_dung_in.model_dump(by_alias=True)

        # 2. Băm mật khẩu
        hashed_password = get_password_hash(nguoi_dung_in.matKhau)

        # 3. Thay thế mật khẩu trần bằng mật khẩu đã băm
        data["matkhau"] = hashed_password

        # 4. Gửi dữ liệu đã băm vào DB
        response = supabase_client.table(TABLE_NAME).insert(data).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không thể tạo người dùng")

    except Exception as e:
        error_str = str(e).lower()
        if "unique constraint" in error_str and "tendangnhap" in error_str:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Tên đăng nhập '{nguoi_dung_in.tenDangNhap}' đã tồn tại."
            )
        if "unique constraint" in error_str and "email" in error_str:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Email '{nguoi_dung_in.email}' đã tồn tại."
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 2. READ ALL
@router.get(
    "/",
    response_model=List[NguoiDung], # <-- Đảm bảo trả về model an toàn
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách tất cả người dùng"
)
def get_all_nguoi_dung(current_staff: dict = Depends(get_current_staff_profile)):
    """
    Lấy danh sách tất cả người dùng.
    **Mật khẩu sẽ không được trả về.**
    """
    try:
        response = supabase_client.table(TABLE_NAME).select("*").order("manguoidung", desc=False).execute()

        if response.data:
            return response.data
        return []

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 3. READ ONE
@router.get(
    "/{maNguoiDung}",
    response_model=NguoiDung, # <-- Đảm bảo trả về model an toàn
    status_code=status.HTTP_200_OK,
    summary="Lấy thông tin chi tiết một người dùng"
)
def get_nguoi_dung_by_id(maNguoiDung: int, current_user: dict = Depends(get_user_owner_or_staff)):
    """
    Lấy thông tin chi tiết của một người dùng.
    - Nhân viên: Được xem bất kỳ.
    - Người dùng: Chỉ được xem của chính mình.
    """
    try:
        response = supabase_client.table(TABLE_NAME).select("*").eq("manguoidung", maNguoiDung).single().execute()

        if response.data:
            return response.data

    except Exception as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy người dùng với id={maNguoiDung}")

# 4. UPDATE
@router.put(
    "/{maNguoiDung}",
    response_model=NguoiDung,
    status_code=status.HTTP_200_OK,
    summary="Cập nhật thông tin người dùng"
)
def update_nguoi_dung(maNguoiDung: int, nguoi_dung_in: NguoiDungUpdate, current_user: dict = Depends(get_user_owner_or_staff)):
    """
    Cập nhật thông tin người dùng.
    Nếu `matKhau` được cung cấp, nó sẽ được băm lại.
    """
    try:
        data = nguoi_dung_in.model_dump(exclude_unset=True, by_alias=True)

        # === BẢN VÁ BẢO MẬT QUAN TRỌNG ===
        # Nếu người dùng cố gắng thay đổi vai trò
        if "vaitro" in data:
            # Và người đó KHÔNG PHẢI là Nhân viên
            if current_user.get("vaitro") != "nhanVien":
                logger.warning(f"Từ chối: User {current_user.get('manguoidung')} cố tự ý đổi vai trò.")
                raise HTTPException(status_code=403, detail="Bạn không có quyền thay đổi vai trò.")

        # Xử lý nếu có cập nhật mật khẩu
        if "matkhau" in data:
            data["matkhau"] = get_password_hash(data["matkhau"])

        if not data:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Không có thông tin nào được gửi để cập nhật")

        response = supabase_client.table(TABLE_NAME).update(data).eq("manguoidung", maNguoiDung).execute()

        if response.data:
            return response.data[0]
        else:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy người dùng với id={maNguoiDung}")

    except Exception as e:
        if isinstance(e, HTTPException): raise e # Ném lại lỗi 403
        logger.error(f"Lỗi khi cập nhật NguoiDung {maNguoiDung}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

# 5. DELETE
@router.delete(
    "/{maNguoiDung}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Xóa một người dùng"
)
def delete_nguoi_dung(maNguoiDung: int, current_staff: dict = Depends(get_current_staff_profile)):
    """
    Xóa một người dùng.
    Lưu ý: Sẽ thất bại nếu người dùng này đang là `BanDoc` hoặc `NhanVien`.
    """
    try:
        response = supabase_client.table(TABLE_NAME).delete().eq("manguoidung", maNguoiDung).execute()

        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Không tìm thấy người dùng với id={maNguoiDung} để xóa")

        return

    except Exception as e:
        if "foreign key constraint" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Không thể xóa: Người dùng này đang được tham chiếu bởi 'BanDoc' hoặc 'NhanVien'."
            )
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))