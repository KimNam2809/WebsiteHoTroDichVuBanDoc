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
    1. Ưu tiên lấy thông tin chính thức từ bảng BanDoc.
    2. Lấy thông tin thẻ (nếu có).
    3. Nếu chưa có hồ sơ BanDoc, fallback sang YeuCauThe mới nhất.
    4. Nếu là nhân viên, lấy từ bảng NhanVien.
    """
    try:
        # Lấy ID từ token đã giải mã (đảm bảo luôn đúng dù login Google hay thường)
        user_id = current_user.get("manguoidung")
        email = current_user.get("email")
        role = current_user.get("vaitro")

        # Dữ liệu trả về mặc định
        result = {
            "manguoidung": user_id,
            "hoten": "Chưa cập nhật hồ sơ",
            "email": email,
            "sodienthoai": current_user.get("sodienthoai"),
            "anhdaidien": current_user.get("anhdaidien"),
            "vaitro": role,

            # Các trường mặc định
            "maBanDoc": None,
            "maNhanVien": None,
            "yeu_cau_moi_nhat": None,
            "sothe": "Chưa cấp",
            "tenthe": "Chưa có hạng thẻ",
            "ngayhethan": None,
            "trangthaithe": "Chưa kích hoạt",
            "tailieumuontoida": 0
        }

        # =================================================
        # BƯỚC 1: LẤY YÊU CẦU THẺ MỚI NHẤT (Để UI hiển thị trạng thái chờ duyệt)
        # =================================================
        latest_req_res = (
            supabase_client.table("yeucauthe")
            .select("mayeucauthe, trangthaiquytrinh, thoigianbatdau, thongtinbosung, loaithe(tenthe)")
            # Query JSONB: tìm theo key ma_nguoi_dung_dang_ky
            .filter("thongtinbosung->>ma_nguoi_dung_dang_ky", "eq", str(user_id))
            .order("thoigianbatdau", desc=True)
            .limit(1)
            .execute()
        )

        # Lưu lại data yêu cầu để fallback tên nếu cần
        latest_req_data = latest_req_res.data[0] if latest_req_res.data else None

        if latest_req_data:
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
        # BƯỚC 2: LẤY HỒ SƠ CHÍNH THỨC (BanDoc hoặc NhanVien)
        # =================================================

        if role == "nguoiDung" or role == "banDoc":
            # --- TRƯỜNG HỢP BẠN ĐỌC ---

            # Query lấy thông tin BanDoc + Thẻ + Loại Thẻ
            # Syntax: thebandoc(...) là lấy bảng con (relation)
            query = "mabandoc, hoten, ngaysinh, gioitinh, diachi, cccd, thebandoc(sothe, ngayhethan, trangthaithe, loaithe(tenthe, tailieumuontoida))"

            bd_res = supabase_client.table("bandoc") \
                .select(query) \
                .eq("manguoidung", user_id) \
                .maybe_single() \
                .execute()

            if bd_res.data:
                # [CASE 1]: ĐÃ CÓ HỒ SƠ BẠN ĐỌC
                bd_data = bd_res.data
                result["maBanDoc"] = bd_data.get("mabandoc")

                # Ưu tiên hiển thị tên chính thức trong hồ sơ
                if bd_data.get("hoten"):
                    result["hoten"] = bd_data.get("hoten")

                # Xử lý danh sách thẻ (Quan hệ 1-N)
                list_the = bd_data.get("thebandoc", [])

                if list_the and len(list_the) > 0:
                    # Lấy thẻ đầu tiên (hoặc xử lý logic tìm thẻ 'hoatDong' nếu cần)
                    # Giả sử Supabase trả về thẻ mới nhất do cách insert
                    the = list_the[0]
                    lt = the.get("loaithe") or {}

                    result.update({
                        "sothe": the.get("sothe"),
                        "ngayhethan": the.get("ngayhethan"),
                        "tenthe": lt.get("tenthe"),
                        "tailieumuontoida": lt.get("tailieumuontoida") or 0
                    })

                    # Map trạng thái sang tiếng Việt
                    status_map = {
                        "hoatDong": "Đang hoạt động",
                        "khoa": "Đã khóa",
                        "hetHan": "Hết hạn",
                        "choDuyet": "Chờ duyệt"
                    }
                    raw_status = the.get("trangthaithe")

                    if raw_status is True:
                        result["trangthaithe"] = "Đang hoạt động"
                    elif raw_status is False:
                        result["trangthaithe"] = "Đã khóa"
                    else:
                        # Nếu là chuỗi (hoatDong, khoa, hetHan...)
                        status_map = {
                            "hoatDong": "Đang hoạt động",
                            "khoa": "Đã khóa",
                            "hetHan": "Hết hạn",
                            "choDuyet": "Chờ duyệt"
                        }
                        result["trangthaithe"] = status_map.get(raw_status, raw_status)

            else:
                # [CASE 2]: CHƯA CÓ HỒ SƠ BẠN ĐỌC -> Fallback lấy tên từ Yêu cầu
                if latest_req_data:
                    info = latest_req_data.get("thongtinbosung") or {}
                    if info.get("ho_ten"):
                        result["hoten"] = info.get("ho_ten")
                else:
                    result["hoten"] = "Khách (Chưa có hồ sơ)"

        elif role == "nhanVien" or role == "admin":
            # --- TRƯỜNG HỢP NHÂN VIÊN ---
            nv_res = supabase_client.table("nhanvien") \
                .select("*") \
                .eq("manguoidung", user_id) \
                .maybe_single() \
                .execute()

            if nv_res.data:
                nv_data = nv_res.data
                result.update({
                    "maNhanVien": nv_data.get("manhanvien"),
                    "hoten": nv_data.get("hoten"),
                    "manhanviennoibo": nv_data.get("manhanviennoibo"),
                    "phongban": nv_data.get("phongban"),
                    "chucvu": nv_data.get("chucvu")
                })

        return result

    except Exception as e:
        logger.error(f"Lỗi lấy profile user {user_id}: {e}")
        # Trả về dữ liệu mặc định để không crash Frontend
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
    # response_model=List[NguoiDung], # Bỏ response_model chặt để cho phép thêm trường mở rộng 'hoten'
    status_code=status.HTTP_200_OK,
    summary="Lấy danh sách tất cả người dùng kèm Họ tên"
)
def get_all_nguoi_dung(current_staff: dict = Depends(get_current_staff_profile)):
    """
    Lấy danh sách tất cả người dùng kèm họ tên (nếu có).
    **Mật khẩu sẽ không được trả về.**
    """
    try:
        # Join với BanDoc và NhanVien để lấy tên
        response = supabase_client.table(TABLE_NAME)\
            .select("*, bandoc(hoten), nhanvien(hoten)")\
            .order("manguoidung", desc=False)\
            .execute()

        results = []
        for user in (response.data or []):
            hoten = "Chưa cập nhật"
            # Ưu tiên lấy tên Nhân viên nếu là NV
            if user.get("nhanvien") and len(user["nhanvien"]) > 0:
                 # Supabase trả về list nếu 1-N, hoặc dict nếu 1-1. Kiểm tra kỹ profile. 
                 # Thường FK là 1-1 ngược nhưng Supabase auto detect có thể là list.
                 # Python client thường trả list cho relation.
                 nv = user["nhanvien"]
                 if isinstance(nv, list) and len(nv) > 0: hoten = nv[0].get("hoten")
                 elif isinstance(nv, dict): hoten = nv.get("hoten")
            
            # Nếu không phải NV hoặc chưa có tên, check BanDoc
            if hoten == "Chưa cập nhật" and user.get("bandoc"):
                 bd = user["bandoc"]
                 if isinstance(bd, list) and len(bd) > 0: hoten = bd[0].get("hoten")
                 elif isinstance(bd, dict): hoten = bd.get("hoten")

            # Clean up nested objects to match flat structure if needed, or keep them.
            # Để đơn giản, ta gán trực tiếp hoten vào dict user
            user["hoten"] = hoten
            # Xóa các trường nested để gọn
            if "bandoc" in user: del user["bandoc"]
            if "nhanvien" in user: del user["nhanvien"]
            
            results.append(user)

        return results

    except Exception as e:
        logger.error(f"Error fetching users: {e}")
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