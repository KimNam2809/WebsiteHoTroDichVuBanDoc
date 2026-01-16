from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from app.connect.db import supabase_client
from app.connect.auth import get_owner_or_staff, get_notification_owner_or_staff

router = APIRouter()

TABLE_NAME = "thongbao"

@router.get(
    "/",
    summary="Lấy danh sách thông báo của người dùng",
    response_model=List[dict] # Trả về list dict cho linh hoạt
)
def get_user_notifications(
    current_user: dict = Depends(get_owner_or_staff),
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
    "/{maThongBao}/read",
    summary="Đánh dấu đã đọc"
)
def mark_notification_as_read(
    maThongBao: int,
    current_user: dict = Depends(get_notification_owner_or_staff)
):
    try:
        supabase_client.table(TABLE_NAME).update({
            "trangthai": "daXem"
        }).eq("mathongbao", maThongBao).execute()

        return {"message": "Success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get(
    "/unread-count",
    summary="Đếm số lượng thông báo chưa đọc"
)
def count_unread_notifications(
    ma_ban_doc: int = Query(..., alias="maBanDoc"),
    current_user: dict = Depends(get_owner_or_staff)
):
    try:
        # count exact
        response = (
            supabase_client.table(TABLE_NAME)
            .select("mathongbao", count="exact")
            .eq("mabandoc", ma_ban_doc)
            .eq("trangthai", "chuaXem")
            .execute()
        )

        return {"count": response.count}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

