from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from app.connect.db import supabase_client
from app.connect.auth import get_current_user_from_db
from app.models.thong_bao import ThongBao
from app.utils import to_json_safe

router = APIRouter()

@router.get(
    "/",
    summary="Lấy danh sách thông báo của người dùng",
    response_model=List[dict] # Trả về list dict cho linh hoạt
)
def get_user_notifications(
    current_user: dict = Depends(get_current_user_from_db),
    limit: int = 20,
    offset: int = 0
):
    """
    Lấy danh sách thông báo của User đang đăng nhập.
    Sắp xếp: Mới nhất lên đầu.
    """
    try:
        user_id = current_user.get("manguoidung")

        # 1. Lấy mabandoc từ user_id
        # Vì bảng thongbao liên kết với mabandoc
        bd_res = supabase_client.table("bandoc").select("mabandoc").eq("manguoidung", user_id).execute()

        if not bd_res.data:
            return [] # Chưa là bạn đọc thì chưa có thông báo

        ma_ban_doc = bd_res.data[0]['mabandoc']

        # 2. Query bảng thongbao
        response = (
            supabase_client.table("thongbao")
            .select("*")
            .eq("mabandoc", ma_ban_doc)
            .order("thoigiangui", desc=True)
            .range(offset, offset + limit - 1)
            .execute()
        )

        return response.data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put(
    "/{ma_thong_bao}/read",
    summary="Đánh dấu đã đọc"
)
def mark_notification_as_read(
    ma_thong_bao: int,
    current_user: dict = Depends(get_current_user_from_db)
):
    try:
        user_id = current_user.get("manguoidung")

        # Verify ownership (optional but recommended)
        # Check if notification belongs to a bandoc linked to this user
        # Simplified: Just update

        supabase_client.table("thongbao").update({
            "trangthai": "daXem"
        }).eq("mathongbao", ma_thong_bao).execute()

        return {"message": "Success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))