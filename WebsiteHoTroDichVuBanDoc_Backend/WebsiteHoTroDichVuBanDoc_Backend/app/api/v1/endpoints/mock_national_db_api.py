from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import unicodedata, logging, time
from app.connect.security import get_password_hash
from app.connect.auth import get_current_staff_profile

router = APIRouter()
logger = logging.getLogger(__name__)

# --- MOCK DATA (CSDL Quốc Gia Giả lập) ---
MOCK_CITIZENS = [
    {
        "cccd": "048203001231",
        "ho_ten": "Lê Kim Vân",
        "ngay_sinh": "1975-11-20",
        "sdt": "0935860812",
        "blacklisted": False
    },
    {
        "cccd": "048203001234",
        "ho_ten": "NGUYEN VAN A",
        "ngay_sinh": "2003-05-20",
        "sdt": "0905123456",
        "blacklisted": False
    },
    {
        "cccd": "000000000000", # Case nợ xấu hoặc danh sách đen, ...
        "ho_ten": "PHAM VAN XU",
        "ngay_sinh": "1990-01-01",
        "sdt": "0999999999",
        "blacklisted": True
    },
    # Có thể thêm user thật vào đây để test luồng Xanh
    {
        "cccd": "055548799514",
        "ho_ten": "NGUYEN THI BINH",
        "ngay_sinh": "1974-01-01",
        "sdt": "0905111222",
        "blacklisted": False
    },
    {
        "cccd": "048203004295",
        "ho_ten": "Lê Kim Nam",
        "ngay_sinh": "2003-09-28",
        "sdt": "0367814254",
        "blacklisted": False
    },
    {
        "cccd": "048203030001",
        "ho_ten": "Lê Thành Phong",
        "ngay_sinh": "2003-04-12",
        "sdt": "0341234567",
        "blacklisted": False
    },
    {
        "cccd": "048299250002",
        "ho_ten": "Lý Hoạ Anh",
        "ngay_sinh": "1999-11-25",
        "sdt": "0359876543",
        "blacklisted": False
    },
    {
        "cccd": "048205070003",
        "ho_ten": "Trần Bảo Ngọc",
        "ngay_sinh": "2005-07-01",
        "sdt": "0375552345",
        "blacklisted": False
    },
    {
        "cccd": "001085020004",
        "ho_ten": "Phạm Quốc Bảo",
        "ngay_sinh": "1985-02-10",
        "sdt": "0388765432",
        "blacklisted": False
    },
    {
        "cccd": "079303090005",
        "ho_ten": "Nguyễn Mai Phương",
        "ngay_sinh": "2003-09-30",
        "sdt": "0392345678",
        "blacklisted": False
    },
    {
        "cccd": "055574010007",
        "ho_ten": "Nguyễn Thị Bình",
        "ngay_sinh": "1974-01-01",
        "sdt": "0767890123",
        "blacklisted": False
    },
    {
        "cccd": "012303010008",
        "ho_ten": "Lê Hà Bình",
        "ngay_sinh": "2003-01-01",
        "sdt": "0774567890",
        "blacklisted": False
    },
    {
        "cccd": "048203001235",
        "ho_ten": "Trần Minh Tuấn",
        "ngay_sinh": "1995-03-15",
        "sdt": "0912345678",
        "blacklisted": False
    },
    {
        "cccd": "048203001236",
        "ho_ten": "Phạm Thị Hồng",
        "ngay_sinh": "1988-12-05",
        "sdt": "0923456789",
        "blacklisted": False
    }
]

class VerifyResult(BaseModel):
    status: str   # "MATCH", "MISMATCH", "NOT_FOUND", "ERROR"
    face_match_score: float
    details: List[str] = []
    risk_level: str # "LOW", "MEDIUM", "HIGH"

def generate_username_from_name(full_name: str) -> str:
    """
    Chuyển "Lê Công Phước" -> "bd_congphuoc"
    """
    # 1. Loại bỏ dấu tiếng Việt
    text = unicodedata.normalize('NFKD', full_name).encode('ASCII', 'ignore').decode('utf-8')
    # 2. Chuyển về chữ thường
    text = text.lower()
    # 3. Tách từ
    words = text.split()

    if not words:
        return f"bd_user_{int(time.time())}" # Fallback

    # Lấy tên + tên lót (2 từ cuối)
    if len(words) >= 2:
        suffix = f"{words[-2]}{words[-1]}"
    else:
        suffix = words[0]

    # Thêm prefix bd_
    # (Thêm timestamp nhỏ để tránh trùng lặp nếu có nhiều người cùng tên)
    return f"bd_{suffix}_{int(time.time()) % 1000}"

def normalize_text(text: str):
    if not text: return ""
    return unicodedata.normalize('NFKD', text).encode('ASCII', 'ignore').decode('utf-8').upper().strip()

# Hàm logic xác thực (Tách ra để Background Task có thể gọi trực tiếp nếu muốn)
def perform_verification(cccd, ho_ten, ngay_sinh, sdt, filename):
    # 1. Giả lập Face Matching dựa trên tên file
    if "fail" in filename.lower():
        face_score = 0.65 # Thấp -> Vàng/Đỏ
    elif "fake" in filename.lower():
        face_score = 0.30 # Rất thấp -> Đỏ
    else:
        face_score = 0.98 # Cao -> Xanh

    # 2. Tìm trong DB
    citizen = next((c for c in MOCK_CITIZENS if c["cccd"] == cccd), None)

    if not citizen:
        return {
            "status": "NOT_FOUND",
            "face_match_score": face_score,
            "details": ["Số CCCD không tồn tại trong hệ thống quốc gia"],
            "risk_level": "HIGH"
        }

    if citizen["blacklisted"]:
        return {
            "status": "ERROR",
            "face_match_score": face_score,
            "details": ["Công dân nằm trong danh sách hạn chế dịch vụ (Blacklist)"],
            "risk_level": "HIGH"
        }

    # 3. So sánh thông tin
    mismatches = []
    if normalize_text(ho_ten) != normalize_text(citizen["ho_ten"]):
        mismatches.append(f"Họ tên không khớp (Gốc: {citizen['ho_ten']})")

    # So sánh ngày sinh (String compare đơn giản)
    if ngay_sinh != citizen["ngay_sinh"]:
        mismatches.append(f"Ngày sinh không khớp (Gốc: {citizen['ngay_sinh']})")

    if sdt != citizen["sdt"]:
        mismatches.append(f"SĐT không chính chủ (Gốc: {citizen['sdt']})")

    # 4. Quyết định Luồng (Decision Engine)
    risk = "LOW"
    status = "MATCH"

    # Logic Luồng Vàng: Có sai lệch text HOẶC mặt hơi không giống
    if len(mismatches) > 0 or face_score < 0.85:
        risk = "MEDIUM"
        status = "MISMATCH"

    # Logic Luồng Đỏ: Mặt quá khác
    if face_score < 0.50:
        risk = "HIGH"
        status = "MISMATCH"

    return {
        "status": status,
        "face_match_score": face_score,
        "details": mismatches,
        "risk_level": risk
    }

@router.post(
    "/verify-citizen",
    response_model=VerifyResult,
)
async def verify_citizen_endpoint(
    cccd: str = Form(...),
    ho_ten: str = Form(...),
    ngay_sinh: str = Form(...),
    sdt: str = Form(...),
    anh_the: UploadFile = File(...),
    current_staff: dict = Depends(get_current_staff_profile)
):
    """API Giả lập Cổng xác thực Quốc gia"""
    result = perform_verification(cccd, ho_ten, ngay_sinh, sdt, anh_the.filename)
    return result