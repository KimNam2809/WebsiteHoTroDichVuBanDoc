from fastapi import APIRouter
from app.api.v1.endpoints import (
    tac_pham_api, danh_muc_api, tu_khoa_api, tac_pham_danh_muc_api,
    ban_sao_api, nguoi_dung_api, ban_doc_api, nhan_vien_api, muon_tra_api
)

api_router = APIRouter()
# api_router.include_router(books.router, prefix="/books", tags=["Books"])
api_router.include_router(tac_pham_api.router, prefix="/tac-pham", tags=["Tác Phẩm"])
api_router.include_router(danh_muc_api.router, prefix="/danh-muc", tags=["Danh Mục"])
api_router.include_router(tu_khoa_api.router, prefix="/tu-khoa", tags=["Từ Khóa"])
api_router.include_router(tac_pham_danh_muc_api.router, prefix="/tac-pham-danh-muc", tags=["Tác Phẩm - Danh Mục"])
api_router.include_router(ban_sao_api.router, prefix="/ban-sao", tags=["Bản Sao"])
api_router.include_router(nguoi_dung_api.router, prefix="/nguoi-dung", tags=["Người Dùng"])
api_router.include_router(ban_doc_api.router, prefix="/ban-doc", tags=["Bạn Đọc"])
api_router.include_router(nhan_vien_api.router, prefix="/nhan-vien", tags=["Nhân Viên"])
api_router.include_router(muon_tra_api.router, prefix="/muon-tra", tags=["Mượn Trả"])