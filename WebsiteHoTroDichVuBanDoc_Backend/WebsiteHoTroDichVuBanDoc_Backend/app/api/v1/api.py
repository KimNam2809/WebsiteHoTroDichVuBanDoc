from fastapi import APIRouter
from app.api.v1.endpoints import (
    mock_national_db_api, tac_pham_api, danh_muc_api, tu_khoa_api, tac_pham_danh_muc_api, tac_pham_tu_khoa_api, ban_sao_api, thiet_bi_api, bai_viet_api,
    nguoi_dung_api, ban_doc_api, nhan_vien_api,
    muon_tra_api, gia_han_api, dat_truoc_api,
    loai_the_api, the_ban_doc_api, yeu_cau_the_api, yeu_cau_giao_api, van_chuyen_api, thong_bao_api,
    cho_ngoi_api, dat_cho_ngoi_api, phong_api, dat_phong_api,
    tinh_thanh_pho_api, phuong_xa_api, auth_api,
    ai_api, rag_api
)

api_router = APIRouter()
# API Xác thực
api_router.include_router(auth_api.router, prefix="/auth", tags=["Xác Thực"])

# API Quản lý Thư viện
api_router.include_router(tac_pham_api.router, prefix="/tac-pham", tags=["Tác Phẩm"])
api_router.include_router(danh_muc_api.router, prefix="/danh-muc", tags=["Danh Mục"])
api_router.include_router(tu_khoa_api.router, prefix="/tu-khoa", tags=["Từ Khóa"])
api_router.include_router(tac_pham_danh_muc_api.router, prefix="/tac-pham-danh-muc", tags=["Tác Phẩm - Danh Mục"])
api_router.include_router(tac_pham_tu_khoa_api.router, prefix="/tac-pham-tu-khoa", tags=["Tác Phẩm - Từ Khóa"])
api_router.include_router(ban_sao_api.router, prefix="/ban-sao", tags=["Bản Sao"])
api_router.include_router(thiet_bi_api.router, prefix="/thiet-bi", tags=["Thiết Bị"])
api_router.include_router(bai_viet_api.router, prefix="/bai-viet", tags=["Bài Viết"])

# API Quản lý Người dùng
api_router.include_router(nguoi_dung_api.router, prefix="/nguoi-dung", tags=["Người Dùng"])
api_router.include_router(ban_doc_api.router, prefix="/ban-doc", tags=["Bạn Đọc"])
api_router.include_router(nhan_vien_api.router, prefix="/nhan-vien", tags=["Nhân Viên"])

# API Quản lý Giao Dịch
api_router.include_router(muon_tra_api.router, prefix="/muon-tra", tags=["Mượn Trả"])
api_router.include_router(gia_han_api.router, prefix="/gia-han", tags=["Gia Hạn"])
api_router.include_router(dat_truoc_api.router, prefix="/dat-truoc", tags=["Đặt Trước"])

# API Quản lý Thẻ Bạn Đọc
api_router.include_router(loai_the_api.router, prefix="/loai-the", tags=["Loại Thẻ"])
api_router.include_router(the_ban_doc_api.router, prefix="/the-ban-doc", tags=["Thẻ Bạn Đọc"])
api_router.include_router(yeu_cau_the_api.router, prefix="/yeu-cau-the", tags=["Yêu Cầu Thẻ"])
api_router.include_router(yeu_cau_giao_api.router, prefix="/yeu-cau-giao", tags=["Yêu Cầu Giao Tài liệu"])
api_router.include_router(van_chuyen_api.router, prefix="/van-chuyen", tags=["Vận Chuyển"])
api_router.include_router(thong_bao_api.router, prefix="/thong-bao", tags=["Thông Báo"])

# API Quản lý Cơ Sở Vật Chất
api_router.include_router(phong_api.router, prefix="/phong", tags=["Phòng"])
api_router.include_router(dat_phong_api.router, prefix="/dat-phong", tags=["Đặt Phòng"])
api_router.include_router(cho_ngoi_api.router, prefix="/cho-ngoi", tags=["Chỗ Ngồi"])
api_router.include_router(dat_cho_ngoi_api.router, prefix="/dat-cho-ngoi", tags=["Đặt Chỗ Ngồi"])

# API Quản lý Địa Lý
api_router.include_router(tinh_thanh_pho_api.router, prefix="/tinh-thanh-pho", tags=["Tỉnh/Thành phố"])
api_router.include_router(phuong_xa_api.router, prefix="/phuong-xa", tags=["Phường/Xã"])

# API Giả lập Cổng Xác Thực Quốc Gia
api_router.include_router(mock_national_db_api.router, prefix="/mock-national-db", tags=["Giả Lập Cổng Xác Thực Quốc Gia"])

# API Tìm kiếm sách thông minh bằng AI
api_router.include_router(ai_api.router, prefix="/ai", tags=["Tìm Kiếm AI"])
# API RAG - Truy vấn tài liệu với Vector
api_router.include_router(rag_api.router, prefix="/rag", tags=["RAG - Truy Vấn Tài Liệu"])
