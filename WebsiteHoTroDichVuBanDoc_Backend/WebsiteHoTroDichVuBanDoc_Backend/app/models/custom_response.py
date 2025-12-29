from typing import List, Optional, Dict, Any
from app.models.tac_pham import TacPham
from app.models.ban_sao import BanSao
from app.models.danh_muc import DanhMuc
from app.models.db_base import DBModel


# Model trả về cho API Full Info
class TacPhamFullInfo(DBModel):
    thong_tin_chung: TacPham
    danh_muc: List[DanhMuc]
    ban_sao: List[BanSao]
    so_luong_co_san: int
    so_luong_tong: int

class ClientAction(DBModel):
    type: str  # "none", "navigate", "show_tool_result"
    payload: Optional[str] = None # Đường dẫn URL hoặc nội dung khác
    label: Optional[str] = None # Nhãn của nút bấm (VD: "Đi đến trang đăng ký")

class ChatRequest(DBModel):
    user_id: Optional[int] = None
    session_id: Optional[str] = None
    message: str

class ChatResponse(DBModel):
    reply: str
    session_id: Optional[str] = None
    action: Optional[Dict[str, Any]] = None