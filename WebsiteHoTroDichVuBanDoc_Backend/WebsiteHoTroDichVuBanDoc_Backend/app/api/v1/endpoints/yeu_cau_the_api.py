from fastapi import APIRouter, HTTPException, Query, status, Depends, UploadFile, File, Form, BackgroundTasks
from typing import List, Optional, Dict, Any
from app.api.v1.endpoints.mock_national_db_api import generate_username_from_name, perform_verification
from app.connect.security import get_password_hash
from app.models.yeu_cau_the import TraCuuRequest, YeuCauThe, YeuCauTheCreate, YeuCauTheDetailResponse, YeuCauTheUpdate, YeuCauTheAdminView, DuyetTheRequest, TraCuuYeuCauResponse
from app.connect.db import supabase_client
from app.utils import to_json_safe
from app.connect.auth import get_current_user_from_db, get_current_staff_profile, get_card_request_owner_or_staff
import logging, ast, uuid, time, re
from datetime import date, datetime, timedelta

router = APIRouter()
logger = logging.getLogger(__name__)

TABLE_NAME = "yeucauthe"
STORAGE_BUCKET = "card_requests"

# ==========================================
# 1. HELPER FUNCTIONS (Tách biệt logic)
# ==========================================

def generate_smart_card_number(ma_loai_the: int) -> str:
    """Sinh số thẻ thông minh."""
    try:
        res = supabase_client.table("loaithe").select("tenthe").eq("maloaithe", ma_loai_the).single().execute()
        ten_the = res.data.get("tenthe", "").strip() if res.data else ""
        clean_name = re.sub(r'^thẻ\s+', '', ten_the, flags=re.IGNORECASE).strip()
        if not clean_name: return f"TV{int(time.time())}"

        words = clean_name.split()
        raw_prefix = "".join([w[0] for w in words])

        s1 = 'ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĂĐĨŨƠƯẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼẾỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴÝỶỸ'
        s0 = 'AAAAEEEIIOOOOUUYADIUOOUUUUUUUUUUUUUUUUUUEEEEEEEEEEEEIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYY'
        prefix = ""
        for c in raw_prefix.upper():
            if c in s1: prefix += s0[s1.index(c)]
            else: prefix += c
        prefix = re.sub(r'[^A-Z0-9]', '', prefix)
        return f"{prefix or 'TV'}{int(time.time())}"
    except:
        return f"TV{int(time.time())}"

def send_notification(ma_ban_doc: Optional[int], tieu_de: str, noi_dung: str, extra_data: Dict = None):
    """Gửi thông báo vào bảng thongbao."""
    if not ma_ban_doc: return # Không có mã bạn đọc thì không gửi được (tránh lỗi DB)
    try:
        data = {
            "mabandoc": ma_ban_doc,
            "tieude": tieu_de,
            "noidung": noi_dung,
            "hinhthuc": "HeThong",
            "trangthai": "chuaXem",
            "thoigiangui": datetime.now().isoformat(),
            "thamchieu": "Đăng ký thẻ",
            "dulieugoc": to_json_safe(extra_data) if extra_data else None
        }
        supabase_client.table("thongbao").insert(to_json_safe(data)).execute()
    except Exception as e:
        logger.error(f"Lỗi gửi thông báo: {e}")

def ensure_reader_exists(user_id: int, info: dict) -> int:
    """
    Quan trọng: Đảm bảo user đã có hồ sơ trong bảng bandoc.
    - Nếu chưa (User Google mới) -> Tạo mới -> Trả về ID mới.
    - Nếu có -> Update thông tin mới nhất -> Trả về ID cũ.
    """
    check_bd = supabase_client.table("bandoc").select("mabandoc").eq("manguoidung", user_id).execute()

    if check_bd.data:
        # --- Update Bạn Đọc Cũ ---
        ma_ban_doc = check_bd.data[0]['mabandoc']
        current_bd = supabase_client.table("bandoc").select("thongtinbosung").eq("mabandoc", ma_ban_doc).single().execute()
        bd_info_api = current_bd.data.get("thongtinbosung") or {}
        if info.get("anh_the_url"): bd_info_api["anh_the_url"] = info.get("anh_the_url")

        update_bd_data = {
            "hoten": info.get("ho_ten"),
            "ngaysinh": info.get("ngay_sinh"),
            "gioitinh": info.get("gioi_tinh"),
            "cccd": info.get("cccd"),
            "diachi": info.get("dia_chi"),
            "maphuongxa": info.get("ma_phuong_xa"),
            "nghenghiep": info.get("nghe_nghiep"),
            "thongtinbosung": to_json_safe(bd_info_api)
        }
        supabase_client.table("bandoc").update(to_json_safe(update_bd_data)).eq("mabandoc", ma_ban_doc).execute()

        # Update User Contact (Email/SĐT)
        user_update = {}
        if info.get("sdt"): user_update["sodienthoai"] = info.get("sdt")
        if info.get("email"): user_update["email"] = info.get("email")
        if user_update: supabase_client.table("nguoidung").update(user_update).eq("manguoidung", user_id).execute()

        return ma_ban_doc
    else:
        # --- Tạo Bạn Đọc Mới ---
        new_bandoc_data = {
            "manguoidung": user_id,
            "hoten": info.get("ho_ten"),
            "ngaysinh": info.get("ngay_sinh"),
            "gioitinh": info.get("gioi_tinh", "Khác"),
            "cccd": info.get("cccd"),
            "diachi": info.get("dia_chi"),
            "maphuongxa": info.get("ma_phuong_xa"),
            "nghenghiep": info.get("nghe_nghiep"),
            "thongtinbosung": to_json_safe({"anh_the_url": info.get("anh_the_url")})
        }
        bd_res = supabase_client.table("bandoc").insert(to_json_safe(new_bandoc_data)).execute()
        return bd_res.data[0]['mabandoc']

def create_new_reader_and_card(request_data: dict, approver_id: Optional[int] = None):
    """
    Hàm này CHỈ ĐƯỢC GỌI khi Admin bấm DUYỆT.
    Tạo/Update Bạn đọc -> Tạo Thẻ -> Update Yêu cầu thành daDuyet.
    """
    info = request_data.get("thongtinbosung") or {}
    user_id = info.get("ma_nguoi_dung_dang_ky")
    ma_yeu_cau = request_data["mayeucauthe"]

    if not user_id:
        raise ValueError("Dữ liệu lỗi: Không tìm thấy User ID.")

    # 1. Tính toán ngày trả thẻ (Hẹn 7 ngày sau)
    ngay_du_kien = (datetime.now() + timedelta(days=7)).isoformat()
    info["thoi_gian_du_kien"] = ngay_du_kien

    # 2. Xử lý Bạn Đọc
    check_bd = supabase_client.table("bandoc").select("mabandoc").eq("manguoidung", user_id).execute()
    ma_ban_doc_moi = None

    if check_bd.data:
        # Update Bạn Đọc Cũ
        ma_ban_doc_moi = check_bd.data[0]['mabandoc']
        current_bd = supabase_client.table("bandoc").select("thongtinbosung").eq("mabandoc", ma_ban_doc_moi).single().execute()
        bd_info_api = current_bd.data.get("thongtinbosung") or {}
        if info.get("anh_the_url"): bd_info_api["anh_the_url"] = info.get("anh_the_url")

        update_bd_data = {
            "hoten": info.get("ho_ten"),
            "ngaysinh": info.get("ngay_sinh"),
            "gioitinh": info.get("gioi_tinh"),
            "cccd": info.get("cccd"),
            "diachi": info.get("dia_chi"),
            "maphuongxa": info.get("ma_phuong_xa"),
            "nghenghiep": info.get("nghe_nghiep"),
            "thongtinbosung": to_json_safe(bd_info_api)
        }
        supabase_client.table("bandoc").update(to_json_safe(update_bd_data)).eq("mabandoc", ma_ban_doc_moi).execute()

        # Update User Contact
        user_update = {}
        if info.get("sdt"): user_update["sodienthoai"] = info.get("sdt")
        if info.get("email"): user_update["email"] = info.get("email")
        if user_update: supabase_client.table("nguoidung").update(user_update).eq("manguoidung", user_id).execute()

    else:
        # Tạo Bạn Đọc Mới
        new_bandoc_data = {
            "manguoidung": user_id,
            "hoten": info.get("ho_ten"),
            "ngaysinh": info.get("ngay_sinh"),
            "gioitinh": info.get("gioi_tinh", "Khác"),
            "cccd": info.get("cccd"),
            "diachi": info.get("dia_chi"),
            "maphuongxa": info.get("ma_phuong_xa"),
            "nghenghiep": info.get("nghe_nghiep"),
            "thongtinbosung": to_json_safe({"anh_the_url": info.get("anh_the_url")})
        }
        bd_res = supabase_client.table("bandoc").insert(to_json_safe(new_bandoc_data)).execute()
        ma_ban_doc_moi = bd_res.data[0]['mabandoc']

    # 3. Tạo Thẻ Mới
    so_the_moi = generate_smart_card_number(request_data["maloaithe"])
    ngay_het_han = (datetime.now() + timedelta(days=365)).date()

    new_card_data = {
        "mabandoc": ma_ban_doc_moi,
        "maloaithe": request_data["maloaithe"],
        "sothe": so_the_moi,
        "manhanvien": approver_id,
        "ngayhethan": ngay_het_han,
        "trangthaithe": True,
        "phuongthucvanchuyen": "TaiQuay"
    }
    supabase_client.table("thebandoc").insert(to_json_safe(new_card_data)).execute()

    # 4. Update Yêu Cầu thành daDuyet
    info["ngay_xu_ly"] = datetime.now().isoformat()

    supabase_client.table(TABLE_NAME).update({
        "trangthaiquytrinh": "daDuyet",
        "manhanvien": approver_id,
        "mabandoc": ma_ban_doc_moi,
        "thoigianxuly": "now()",
        "thoigiandukien": ngay_du_kien,
        "noinhanthe": "Tại thư viện",
        "thongtinbosung": to_json_safe(info)
    }).eq("mayeucauthe", ma_yeu_cau).execute()

    # 5. Gửi thông báo Hoàn tất (Notification B)
    # "Hồ sơ #... đã được nhân viên duyệt..."
    send_notification(
        ma_ban_doc_moi,
        "Đăng ký thẻ thành công (Đã duyệt)",
        f"Hồ sơ #{ma_yeu_cau} đã được nhân viên duyệt. Bạn có thể nhận thẻ vào ngày {datetime.fromisoformat(ngay_du_kien).strftime('%d/%m/%Y')}.",
        extra_data=info
    )

    return ma_ban_doc_moi


# ==========================================
# 2. BACKGROUND TASK (Xử lý ngầm)
# ==========================================

def process_card_application(ma_yeu_cau: int, form_data: dict, filename: str):
    """
    Hàm chạy ngầm:
    - Gọi Mock API xác thực.
    - LOW -> Tạo Hồ sơ Bạn đọc (chưa tạo thẻ) -> Update 'choDuyet' -> Gửi thông báo kèm QR.
    - MEDIUM -> Update 'choDuyet' (Chưa gửi thông báo nếu chưa có hồ sơ bạn đọc).
    - HIGH -> Update 'tuChoi'.
    """
    logger.info(f"🚀 Bắt đầu xử lý ngầm hồ sơ {ma_yeu_cau}...")
    time.sleep(2) # Giả lập delay

    try:
        # 1. Gọi Mock API
        verify_result = perform_verification(
            cccd=form_data["cccd"],
            ho_ten=form_data["ho_ten"],
            ngay_sinh=form_data["ngay_sinh"],
            sdt=form_data["sdt"],
            filename=filename
        )
        risk = verify_result["risk_level"]
        logger.info(f"🔍 Kết quả xác thực {ma_yeu_cau}: {risk}")

        # Lấy dữ liệu mới nhất từ DB
        current_req = supabase_client.table(TABLE_NAME).select("*").eq("mayeucauthe", ma_yeu_cau).single().execute()
        request_data = current_req.data
        info = request_data["thongtinbosung"]
        info["ket_qua_xac_thuc"] = verify_result

        user_id = info.get("ma_nguoi_dung_dang_ky")
        le_phi = request_data.get("lephi", 0)

        # 2. Phân luồng xử lý
        if risk == "LOW":
            # --- LUỒNG XANH (PRE-APPROVE) ---
            # A. Tạo/Đảm bảo hồ sơ Bạn Đọc tồn tại NGAY BÂY GIỜ
            # Để người dùng có mã bạn đọc -> nhận được thông báo
            if user_id:
                ma_ban_doc = ensure_reader_exists(user_id, info)

                # B. Update Yêu cầu
                info["qr_payment_content"] = f"PAYMENT|{ma_yeu_cau}|{le_phi}"
                info["tong_tien"] = le_phi

                supabase_client.table(TABLE_NAME).update({
                    "trangthaiquytrinh": "choDuyet", # Vẫn chờ nhân viên duyệt lần cuối
                    "mabandoc": ma_ban_doc, # Link luôn vào hồ sơ vừa tạo
                    "thongtinbosung": to_json_safe(info)
                }).eq("mayeucauthe", ma_yeu_cau).execute()

                # C. Gửi thông báo (Lúc này chắc chắn thành công)
                send_notification(
                    ma_ban_doc,
                    "Hồ sơ được hệ thống duyệt tự động",
                    f"Hồ sơ #{ma_yeu_cau} đã được hệ thống duyệt tự động. Bạn hãy đến thư viện xác thực sớm nhất để hoàn tất thủ tục cấp thẻ.",
                    extra_data=info
                )

        elif risk == "MEDIUM":
            # --- LUỒNG VÀNG ---
            supabase_client.table(TABLE_NAME).update({
                "trangthaiquytrinh": "choDuyet",
                "thongtinbosung": to_json_safe(info)
            }).eq("mayeucauthe", ma_yeu_cau).execute()

            # Có thể gửi thông báo nếu user cũ, user mới thì chịu (chờ nhân viên duyệt mới tạo hồ sơ)
            if user_id:
                try:
                    bd = supabase_client.table("bandoc").select("mabandoc").eq("manguoidung", user_id).execute()
                    if bd.data:
                        send_notification(bd.data[0]['mabandoc'], "Đã tiếp nhận hồ sơ", "Vui lòng chờ nhân viên kiểm tra.")
                except: pass

        elif risk == "HIGH":
            # --- LUỒNG ĐỎ ---
            supabase_client.table(TABLE_NAME).update({
                "trangthaiquytrinh": "tuChoi",
                "thoigianxuly": datetime.now().isoformat(),
                "ghichu": f"Hệ thống từ chối: {', '.join(verify_result['details'])}",
                "thongtinbosung": to_json_safe(info)
            }).eq("mayeucauthe", ma_yeu_cau).execute()

            # Gửi thông báo nếu có thể
            if user_id:
                try:
                    bd = supabase_client.table("bandoc").select("mabandoc").eq("manguoidung", user_id).execute()
                    if bd.data:
                        send_notification(bd.data[0]['mabandoc'], "Yêu cầu bị từ chối", f"Lý do: {', '.join(verify_result['details'])}")
                except: pass

    except Exception as e:
        logger.error(f"Lỗi xử lý nền hồ sơ {ma_yeu_cau}: {e}")


# ==========================================
# 3. API ENDPOINTS
# ==========================================

# --- API ĐĂNG KÝ THẺ ---
@router.post("/dang-ky", status_code=status.HTTP_201_CREATED, summary="Gửi yêu cầu làm thẻ (Ảnh + Form)")
async def dang_ky_the_ban_doc(
    background_tasks: BackgroundTasks,
    ho_ten: str = Form(...),
    ngay_sinh: str = Form(...),
    gioi_tinh: str = Form(...),
    nghe_nghiep: str = Form(...),
    cccd: str = Form(...),
    dia_chi: str = Form(...),
    email: str = Form(...),
    sdt: str = Form(...),
    ma_loai_the: int = Form(...),
    ma_phuong_xa: int = Form(...),
    giao_hang: bool = Form(False),
    anh_the: UploadFile = File(None),
    current_user: dict = Depends(get_current_user_from_db)
):
    user_id = current_user.get("manguoidung")
    anh_the_url = None

    # 1. Upload Ảnh
    if anh_the:
        try:
            original_filename = anh_the.filename.replace(" ", "_")
            clean_name = re.sub(r'[^a-zA-Z0-9_.-]', '', original_filename)
            timestamp = int(time.time())
            file_name = f"u{user_id}_{timestamp}_{clean_name}"
            file_content = await anh_the.read()

            supabase_client.storage.from_(STORAGE_BUCKET).upload(
                path=file_name, file=file_content, file_options={"content-type": anh_the.content_type}
            )
            anh_the_url = supabase_client.storage.from_(STORAGE_BUCKET).get_public_url(file_name)
        except Exception as e:
            logger.error(f"Upload error: {e}")
            raise HTTPException(status_code=500, detail="Lỗi tải ảnh.")

    # 2. Dữ liệu bổ sung
    thong_tin_bo_sung = {
        "ho_ten": ho_ten, "ngay_sinh": ngay_sinh, "gioi_tinh": gioi_tinh,
        "nghe_nghiep": nghe_nghiep, "cccd": cccd, "dia_chi": dia_chi,
        "ma_phuong_xa": ma_phuong_xa, "email": email, "sdt": sdt,
        "giao_hang": giao_hang, "anh_the_url": anh_the_url,
        "ma_nguoi_dung_dang_ky": user_id
    }

    # 3. Lấy lệ phí
    loai_the_info = supabase_client.table("loaithe").select("lephi").eq("maloaithe", ma_loai_the).single().execute()
    le_phi = loai_the_info.data.get("lephi", 0) if loai_the_info.data else 0

    # 4. Insert DB (Trạng thái ban đầu: dangXuLy)
    db_data = {
        "maloaithe": ma_loai_the,
        "mabandoc": None,
        "trangthaiquytrinh": "dangXuLy",
        "maphuongxa": None,
        "thongtinbosung": to_json_safe(thong_tin_bo_sung),
        "hinhthucyeucau": "Online",
        "lephi": le_phi,
    }

    res = supabase_client.table(TABLE_NAME).insert(db_data).execute()
    if not res.data: raise HTTPException(500, "Lỗi tạo hồ sơ")
    new_req = res.data[0]

    # 5. Background Task (Logic thông báo nằm ở đây)
    background_tasks.add_task(
        process_card_application,
        ma_yeu_cau=new_req["mayeucauthe"],
        form_data=thong_tin_bo_sung,
        filename=anh_the.filename if anh_the else ""
    )

    return {
        "message": "Hồ sơ đã gửi thành công. Hệ thống đang xử lý.",
        "data": {"mayeucauthe": new_req["mayeucauthe"], "trangthai": "dangXuLy"}
    }


# --- API ADMIN DUYỆT THỦ CÔNG ---
@router.put("/phe-duyet/{maYeuCauThe}", summary="Admin duyệt và tạo thẻ")
def phe_duyet_yeu_cau_the(
    maYeuCauThe: int,
    duyet_in: DuyetTheRequest,
    current_staff: dict = Depends(get_current_staff_profile)
):
    if duyet_in.trang_thai not in ["daDuyet", "tuChoi"]:
        raise HTTPException(400, "Trạng thái không hợp lệ.")

    try:
        req_res = supabase_client.table(TABLE_NAME).select("*").eq("mayeucauthe", maYeuCauThe).single().execute()
        if not req_res.data: raise HTTPException(404, "Không tìm thấy yêu cầu.")
        request_data = req_res.data

        if request_data["trangthaiquytrinh"] == "daDuyet":
            raise HTTPException(400, "Yêu cầu này đã được duyệt rồi.")

        info = request_data.get("thongtinbosung") or {}
        user_id = info.get("ma_nguoi_dung_dang_ky")
        manhanvien = current_staff.get("manhanvien")

        # --- TRƯỜNG HỢP 1: TỪ CHỐI ---
        if duyet_in.trang_thai == "tuChoi":
            if not duyet_in.ly_do: raise HTTPException(400, "Nhập lý do từ chối.")
            info["ly_do_tu_choi"] = duyet_in.ly_do
            info["ngay_xu_ly"] = datetime.now().isoformat()

            supabase_client.table(TABLE_NAME).update({
                "trangthaiquytrinh": "tuChoi", "manhanvien": manhanvien,
                "thoigianxuly": "now()", "thongtinbosung": to_json_safe(info)
            }).eq("mayeucauthe", maYeuCauThe).execute()

            # Tìm bạn đọc để báo (nếu có)
            if user_id:
                try:
                    bd = supabase_client.table("bandoc").select("mabandoc").eq("manguoidung", user_id).execute()
                    if bd.data:
                        send_notification(bd.data[0]['mabandoc'], "Bị từ chối (Admin)", f"Lý do: {duyet_in.ly_do}")
                except: pass

            return {"message": "Đã từ chối."}

        # --- TRƯỜNG HỢP 2: DUYỆT (TẠO THẺ) ---
        if duyet_in.trang_thai == "daDuyet":
            # 1. Đảm bảo Hồ sơ Bạn Đọc (Nếu bước Background đã tạo rồi thì lấy ID cũ, chưa thì tạo mới)
            ma_ban_doc = ensure_reader_exists(user_id, info)

            # 2. Sinh số thẻ và Tạo Thẻ (Đây là bước quyết định)
            so_the_moi = generate_smart_card_number(request_data["maloaithe"])
            ngay_het_han = (datetime.now() + timedelta(days=365)).date()
            ngay_du_kien = (datetime.now() + timedelta(days=7)).isoformat()
            info["thoi_gian_du_kien"] = ngay_du_kien # Update ngày hẹn mới nhất

            new_card_data = {
                "mabandoc": ma_ban_doc,
                "maloaithe": request_data["maloaithe"],
                "sothe": so_the_moi,
                "manhanvien": manhanvien,
                "ngayhethan": ngay_het_han,
                "trangthaithe": True,
                "phuongthucvanchuyen": "TaiQuay"
            }
            supabase_client.table("thebandoc").insert(to_json_safe(new_card_data)).execute()

            # 3. Cập nhật Yêu cầu -> daDuyet
            info["ngay_xu_ly"] = datetime.now().isoformat()
            supabase_client.table(TABLE_NAME).update({
                "trangthaiquytrinh": "daDuyet",
                "manhanvien": manhanvien,
                "mabandoc": ma_ban_doc,
                "thoigianxuly": "now()",
                "thoigiandukien": ngay_du_kien,
                "thongtinbosung": to_json_safe(info)
            }).eq("mayeucauthe", maYeuCauThe).execute()

            # 4. Gửi thông báo Nhận thẻ
            ngay_ht_str = datetime.fromisoformat(ngay_du_kien).strftime('%d/%m/%Y')
            send_notification(
                ma_ban_doc,
                "Đã duyệt cấp thẻ",
                f"Hồ sơ #{maYeuCauThe} đã được nhân viên duyệt. Bạn có thể nhận thẻ vào ngày {ngay_ht_str}.",
                extra_data=info
            )

            return {"message": "Admin đã duyệt thành công.", "so_the": so_the_moi}

    except Exception as e:
        logger.error(f"Lỗi duyệt thẻ thủ công: {e}")
        raise HTTPException(500, detail=str(e))

# --- 2. API KIỂM TRA TRẠNG THÁI HỒ SƠ (POLLING) ---
@router.get("/{maYeuCauThe}/trang-thai", summary="Kiểm tra trạng thái hồ sơ (Polling)")
def check_request_status(maYeuCauThe: int, current_user: dict = Depends(get_current_user_from_db)):
    try:
        res = supabase_client.table(TABLE_NAME).select("*").eq("mayeucauthe", maYeuCauThe).single().execute()
        if not res.data:
            raise HTTPException(404, "Không tìm thấy.")

        data = res.data
        info = data.get("thongtinbosung") or {}
        trang_thai = data["trangthaiquytrinh"]

        # LOGIC LẤY LÝ DO TỪ CHỐI (FIX LỖI 1)
        ly_do = None
        if trang_thai == "tuChoi":
            # Ưu tiên lấy trong JSON (nếu nhân viên nhập tay)
            ly_do = info.get("ly_do_tu_choi")
            # Nếu không có, lấy trong cột ghi chú (nếu hệ thống tự reject)
            if not ly_do:
                ly_do = data.get("ghichu")

        # LOGIC THÔNG BÁO THÀNH CÔNG
        message = None
        if trang_thai == "daDuyet":
            message = "Chúc mừng! Hồ sơ của bạn đã được duyệt và thẻ đã được tạo."

        return {
            "mayeucauthe": maYeuCauThe,
            "trangthai": trang_thai,
            "ket_qua_xac_thuc": info.get("ket_qua_xac_thuc"),
            "ly_do_tu_choi": ly_do,
            "message": message
        }
    except Exception as e:
        raise HTTPException(500, str(e))

# --- API LẤY DANH SÁCH CHỜ DUYỆT (Cho Admin) ---
@router.get(
    "/danh-sach-cho-duyet",
    response_model=List[YeuCauTheAdminView],
    summary="Lấy danh sách yêu cầu thẻ đang chờ duyệt (Admin)"
)
def get_danh_sach_cho_duyet(
    current_staff: dict = Depends(get_current_staff_profile)
):
    """
    Lấy danh sách các yêu cầu có trạng thái 'choDuyet'.
    Dữ liệu JSONB sẽ được làm phẳng (flatten) ra để Admin dễ xem.
    """
    try:
        # Query: Lấy yêu cầu + Join tên loại thẻ
        query = """
            mayeucauthe,
            thoigianbatdau,
            trangthaiquytrinh,
            thongtinbosung,
            loaithe (tenthe)
        """

        # Lọc: Chỉ lấy 'choDuyet' và maBanDoc IS NULL (đăng ký mới)
        # (Hoặc có thể bỏ điều kiện maBanDoc is null nếu muốn xem cả yêu cầu cấp lại thẻ)
        response = (
            supabase_client.table(TABLE_NAME)
            .select(query)
            .eq("trangthaiquytrinh", "choDuyet")
            .order("thoigianbatdau", desc=False) # Cũ nhất lên đầu để duyệt trước
            .execute()
        )

        result_list = []
        for item in response.data:
            info = item.get("thongtinbosung") or {}
            loai_the = item.get("loaithe") or {}

            # Map dữ liệu vào Model trả về
            view_item = {
                "ma_ho_so": item["mayeucauthe"],
                "ho_ten": info.get("ho_ten", "Không tên"),
                "loai_the": loai_the.get("tenthe", "Không xác định"),
                "ngay_dang_ky": item["thoigianbatdau"],
                "trang_thai": item["trangthaiquytrinh"],
                "anh_the_url": info.get("anh_the_url"),
                "email": info.get("email"),
                "sdt": info.get("sdt")
            }
            result_list.append(view_item)

        return result_list

    except Exception as e:
        logger.error(f"Lỗi lấy danh sách chờ duyệt: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- API LẤY CHI TIẾT YÊU CẦU (MỚI) ---
@router.get(
    "/{maYeuCauThe}",
    response_model=YeuCauTheDetailResponse,
    summary="Lấy chi tiết đầy đủ một yêu cầu thẻ (Admin)"
)
def get_chi_tiet_yeu_cau_the(
    maYeuCauThe: int,
    current_staff: dict = Depends(get_current_staff_profile)
):
    """
    Lấy thông tin chi tiết.
    Hệ thống sẽ tự động lấy ID phường xã trong JSON, tra cứu tên Phường/Tỉnh
    và trả về cho Admin xem (thay vì trả về số ID vô nghĩa).
    """
    try:
        # 1. Lấy thông tin yêu cầu
        query = "*, loaithe(tenthe)"
        response = supabase_client.table(TABLE_NAME).select(query).eq("mayeucauthe", maYeuCauThe).single().execute()

        if not response.data:
            raise HTTPException(status_code=404, detail="Không tìm thấy yêu cầu.")

        data = response.data
        loai_the = data.get("loaithe") or {}
        info = data.get("thongtinbosung") or {}

        # 2. Xử lý Địa chỉ (Logic Mới)
        # Lấy ID từ JSON
        ma_phuong_xa = info.get("ma_phuong_xa")

        dia_chi_full = info.get("dia_chi", "") # Mặc định là số nhà
        ten_phuong = ""
        ten_tinh = ""

        if ma_phuong_xa:
            try:
                # Query bảng Phường Xã (kèm Tỉnh Thành)
                px_res = supabase_client.table("phuongxa") \
                    .select("tenphuongxa, tinhthanhpho(tentinhthanhpho)") \
                    .eq("maphuongxa", ma_phuong_xa) \
                    .single().execute()

                if px_res.data:
                    ten_phuong = px_res.data.get("tenphuongxa")
                    tinh_data = px_res.data.get("tinhthanhpho") or {}
                    ten_tinh = tinh_data.get("tentinhthanhpho")

                    # Gắn thêm thông tin hiển thị vào JSON trả về (không lưu vào DB)
                    info["ten_phuong_xa"] = ten_phuong
                    info["ten_tinh_thanh_pho"] = ten_tinh
                    info["dia_chi_hien_thi"] = f"{dia_chi_full}, {ten_phuong}, {ten_tinh}"
            except Exception:
                pass # Nếu lỗi lấy địa chỉ thì vẫn trả về các thông tin khác

        return {
            "mayeucauthe": data["mayeucauthe"],
            "thoigianbatdau": data["thoigianbatdau"],
            "tenloaithe": loai_the.get("tenthe", "Không xác định"),
            "thongtinbosung": info, # JSON bây giờ đã có thêm tên phường/tỉnh
            "lephi": data.get("lephi") or 0,
            "trangthaiquytrinh": data["trangthaiquytrinh"]
        }
    except Exception as e:
        logger.error(f"Lỗi xem chi tiết yêu cầu {maYeuCauThe}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- API TRA CỨU CÔNG KHAI (Public Search) ---
@router.post(
    "/tra-cuu",
    response_model=List[TraCuuYeuCauResponse],
    summary="Tra cứu trạng thái yêu cầu thẻ & Thẻ hiện có (Công khai)"
)
def tra_cuu_yeu_cau_the(
    search_in: TraCuuRequest # Nhận JSON Body
):
    """
    API dành cho khách. Tra cứu dựa trên CCCD hoặc SĐT.
    Method: POST
    Body: { "keyword": "048203..." }
    """
    result_list = []
    keyword = search_in.keyword # Lấy keyword từ body

    # Validate độ dài (Thay cho min_length của Query)
    if len(keyword) < 6:
        # Trả về list rỗng hoặc lỗi tùy bạn. Ở đây trả rỗng cho an toàn.
        return []

    try:
        # =========================================================
        # PHẦN 1: KIỂM TRA THẺ ĐANG HOẠT ĐỘNG (Query bảng BanDoc)
        # =========================================================

        # Nếu keyword giống CCCD (chỉ chứa số và dài >= 9)
        if keyword.isdigit() and len(keyword) >= 9:
            try:
                # Query BanDoc kèm thông tin Thẻ
                existing_member = (
                    supabase_client.table("bandoc")
                    .select("hoten, cccd, thebandoc(sothe, trangthaithe, loaithe(tenthe))")
                    .eq("cccd", keyword)
                    .execute()
                )

                if existing_member.data:
                    info = existing_member.get("thongtinbosung") or {}
                    for member in existing_member.data:
                        cards = member.get("thebandoc", [])
                        for card in cards:
                            if card.get("trangthaithe") is True:
                                loai_the = card.get("loaithe") or {}

                                active_card_item = {
                                    "ma_yeu_cau": None,
                                    "ho_ten": member.get("hoten"),
                                    "cccd": member.get("cccd"),
                                    "sdt": "******",
                                    "ten_loai_the": loai_the.get("tenthe", "Thẻ thành viên"),
                                    "ngay_dang_ky": None,
                                    "trang_thai": "THE_DANG_HOAT_DONG",
                                    "sothe": card.get("sothe"),
                                    "ly_do_tu_choi": None,
                                    "anh_the_url": info.get("anh_the_url")
                                }
                                result_list.append(active_card_item)
            except Exception as e:
                logger.warning(f"Lỗi tìm thẻ active: {e}")

        # =========================================================
        # PHẦN 2: TRA CỨU LỊCH SỬ YÊU CẦU (Query bảng YeuCauThe)
        # =========================================================

        filter_condition = f"thongtinbosung->>sdt.eq.{keyword},thongtinbosung->>cccd.eq.{keyword}"

        req_response = (
            supabase_client.table(TABLE_NAME)
            .select("mayeucauthe, thoigianbatdau, trangthaiquytrinh, thongtinbosung, loaithe(tenthe)")
            .or_(filter_condition)
            .order("thoigianbatdau", desc=True)
            .execute()
        )

        for item in req_response.data:
            info = item.get("thongtinbosung") or {}
            loai_the = item.get("loaithe") or {}

            req_item = {
                "ma_yeu_cau": item["mayeucauthe"],
                "ho_ten": info.get("ho_ten", "Không xác định"),
                "cccd": info.get("cccd", ""),
                "sdt": info.get("sdt", ""),
                "ten_loai_the": loai_the.get("tenthe", "Không xác định"),
                "ngay_dang_ky": item["thoigianbatdau"],
                "trang_thai": item["trangthaiquytrinh"],
                "ly_do_tu_choi": info.get("ly_do_tu_choi"),
                "sothe": None,
                "anh_the_url": info.get("anh_the_url"),
                "giao_hang": info.get("giao_hang")
            }
            result_list.append(req_item)

        return result_list

    except Exception as e:
        logger.error(f"Lỗi tra cứu tổng hợp: {e}")
        return []