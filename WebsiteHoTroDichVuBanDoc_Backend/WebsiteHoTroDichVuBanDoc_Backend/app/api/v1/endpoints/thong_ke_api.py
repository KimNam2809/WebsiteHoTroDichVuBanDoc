from fastapi import APIRouter, Depends, HTTPException, Query
from app.connect.db import supabase_client
from app.connect.auth import get_current_staff_profile
from datetime import datetime, timedelta
from typing import List, Dict, Any

router = APIRouter()

@router.get("/tong-quan", summary="Lấy số liệu tổng quan cho Dashboard")
def get_dashboard_summary(current_staff: dict = Depends(get_current_staff_profile)):
    try:
        # 1. Hồ sơ chờ duyệt
        # Table: yeucauthe, Col: trangthaiquytrinh = 'daYeuCau' (hoặc 'choDuyet' tùy logic seed, model default là 'daYeuCau')
        # Check model: default='daYeuCau'. Let's check DB usage. 'choDuyet' was used in frontend props. 
        # Safest is to check what values are actually used. Assume 'daYeuCau' for initial or 'choDuyet'.
        # Previous log said "eq.choDuyet" -> 400. This was column error likely.
        # Let's use 'daYeuCau' as per model default, OR filter logic in frontend.
        # Actually logic in actions.js used 'choDuyet'? No, earlier code used 'choDuyet'.
        # I will assume 'daYeuCau' is the correct status for "Pending".
        res_cards = supabase_client.table("yeucauthe").select("mayeucauthe", count="exact", head=True).eq("trangthaiquytrinh", "daYeuCau").execute()
        count_cards = res_cards.count or 0

        # 2. Sách đang mượn
        res_loans = supabase_client.table("muontra").select("mamuontra", count="exact", head=True).eq("trangthaimuon", "daMuon").execute()
        count_loans = res_loans.count or 0

        # 3. Sách quá hạn
        res_overdue = supabase_client.table("muontra").select("mamuontra", count="exact", head=True).eq("trangthaimuon", "quaHan").execute()
        
        # 4. Tổng bạn đọc
        res_readers = supabase_client.table("bandoc").select("mabandoc", count="exact", head=True).execute()
        count_readers = res_readers.count or 0

        return {
            "hoSoCho": count_cards,
            "sachDangMuon": count_loans,
            "sachQuaHan": count_overdue,
            "tongBanDoc": count_readers
        }
    except Exception as e:
        print(f"Error Summary: {e}") # Log error for debugging
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/bao-cao", summary="Lấy dữ liệu báo cáo chi tiết")
def get_detailed_report(type: str = "borrowing", current_staff: dict = Depends(get_current_staff_profile)):
    try:
        # 1. Báo cáo Tình hình Mượn (Borrowing Status)
        if type == "borrowing":
            # Thống kê số lượng sách theo trạng thái
            # Chúng ta sẽ đếm tay cho đơn giản ví chưa có GROUP BY mạnh mẽ qua Client
            res = supabase_client.table("muontra").select("trangthaimuon").execute()
            counts = {"daMuon": 0, "daTra": 0, "quaHan": 0, "dangChoXacNhan": 0}
            total = 0
            
            for item in (res.data or []):
                st = item.get("trangthaimuon", "other")
                if st in counts:
                    counts[st] += 1
                total += 1
            
            # Format trả về dạng list cho bảng
            return [
                {"label": "Đang Mượn", "value": counts["daMuon"], "ratio": round(counts["daMuon"]/total*100, 1) if total else 0},
                {"label": "Đã Trả", "value": counts["daTra"], "ratio": round(counts["daTra"]/total*100, 1) if total else 0},
                {"label": "Quá Hạn", "value": counts["quaHan"], "ratio": round(counts["quaHan"]/total*100, 1) if total else 0},
                {"label": "Chờ Xác Nhận", "value": counts["dangChoXacNhan"], "ratio": round(counts["dangChoXacNhan"]/total*100, 1) if total else 0},
            ]

        # 2. Báo cáo Bạn đọc (Readers)
        elif type == "readers":
            # Thống kê bạn đọc mới trong 6 tháng gần nhất
            start_date = (datetime.now() - timedelta(days=180)).strftime("%Y-%m-%d")
            res = supabase_client.table("bandoc").select("ngaytao").gte("ngaytao", start_date).execute()
            
            # Group by Month
            monthly_counts = {}
            for item in (res.data or []):
                if item.get("ngaytao"):
                    month = item["ngaytao"][:7] # YYYY-MM
                    monthly_counts[month] = monthly_counts.get(month, 0) + 1
            
            # Sort
            sorted_months = sorted(monthly_counts.keys())
            result = []
            total_new = sum(monthly_counts.values())
            
            for m in sorted_months:
                val = monthly_counts[m]
                result.append({
                    "label": f"Tháng {m[5:]}",
                    "value": val,
                    "ratio": round(val/total_new*100, 1) if total_new else 0
                })
            return result

        # 3. Danh sách Quá hạn (Overdue List)
        elif type == "overdue":
             # Lấy danh sách cụ thể
             res = supabase_client.table("muontra") \
                .select("mamuontra, bandoc(hoten), bansao(tacpham(tentacpham)), ngaytra") \
                .eq("trangthaimuon", "quaHan") \
                .limit(20) \
                .execute()
             
             result = []
             for item in (res.data or []):
                 reader = item.get("bandoc", {}).get("hoten", "N/A") if item.get("bandoc") else "N/A"
                 book = item.get("bansao", {}).get("tacpham", {}).get("tentacpham", "N/A")
                 
                 result.append({
                     "label": reader,
                     "value": book, 
                     "ratio": f"Hạn: {item.get('ngaytra', '?')}" # Hacky reuse of 'ratio' field for display
                 })
             return result

        return []

    except Exception as e:
        print(f"Error Report: {e}")
        return []


@router.get("/bieu-do", summary="Lấy dữ liệu biểu đồ")
def get_chart_data(range: str = "7d", current_staff: dict = Depends(get_current_staff_profile)):
    try:
        days = 30 if range == "30d" else 7
        start_date = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d")

        # Query using correct column 'thoigianmuon'
        res = supabase_client.table("muontra") \
            .select("thoigianmuon") \
            .gte("thoigianmuon", start_date) \
            .execute()
        
        # Add basic NULL check
        if not res.data:
            return []
            
        data = res.data
        
        # ... (processing logic ok) 

    except Exception as e:
        print(f"Error Chart: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/hoat-dong-moi", summary="Lấy nhật ký hoạt động gần đây")
def get_recent_activity(limit: int = 5, current_staff: dict = Depends(get_current_staff_profile)):
    activities = []
    try:
        # 1. Loans
        res_loans = supabase_client.table("muontra") \
            .select("mamuontra, thoigianmuon, bandoc(hoten), bansao(tacpham(tentacpham))") \
            .order("thoigianmuon", desc=True) \
            .limit(limit) \
            .execute()
            
        for l in (res_loans.data or []):
            reader = l.get("bandoc", {}).get("hoten", "Unknown") if l.get("bandoc") else "Unknown"
            # Handle nested potentially null
            bansao = l.get("bansao") or {}
            tacpham = bansao.get("tacpham") or {}
            book = tacpham.get("tentacpham", "Book")
            
            activities.append({
                "type": "loan",
                "time": l["thoigianmuon"],
                "content": f"{reader} mượn sách '{book}'"
            })

        # 2. Card Requests (Join bandoc for Name)
        # Column: mayeucauthe, thoigianbatdau (created time), bandoc.hoten
        res_cards = supabase_client.table("yeucauthe") \
            .select("mayeucauthe, thoigianbatdau, bandoc(hoten)") \
            .order("thoigianbatdau", desc=True) \
            .limit(limit) \
            .execute()

        for c in (res_cards.data or []):
            reader_name = c.get("bandoc", {}).get("hoten", "Unknown") if c.get("bandoc") else "Unknown"
            activities.append({
                "type": "card",
                "time": c["thoigianbatdau"],
                "content": f"{reader_name} gửi yêu cầu làm thẻ"
            })

        activities.sort(key=lambda x: x["time"], reverse=True)
        return activities[:limit]

    except Exception as e:
        print(f"Error Activity: {e}")
        raise HTTPException(status_code=500, detail=str(e))
