from pydantic import BaseModel
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

class ChatRequest(DBModel):
    message: str

class ChatResponse(DBModel):
    reply: str