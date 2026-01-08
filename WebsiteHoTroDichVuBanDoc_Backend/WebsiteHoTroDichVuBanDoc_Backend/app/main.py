from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.api.v1.api import api_router # Import router v1
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="API Thư viện Thông minh",
    description="Backend cho dự án tốt nghiệp - Quản lý thư viện và Chatbot AI",
    version="1.0.0"
)

# --- CẤU HÌNH CORS ---
origins = [
    "http://localhost:3000",      # Frontend Next.js chạy local
    "http://127.0.0.1:3000",      # Đôi khi trình duyệt dùng IP này
    "https://domain-cua-ban.com", # Domain thật khi deploy (sau này thêm vào)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        # Cho phép các nguồn này gọi API
    allow_credentials=True,       # Cho phép gửi cookie/token
    allow_methods=["*"],          # Cho phép tất cả các method (GET, POST, PUT, DELETE...)
    allow_headers=["*"],          # Cho phép tất cả các header
)

# Gắn router v1 vào app chính với tiền tố /api/v1
app.include_router(api_router, prefix="/api/v1")

app.mount("/static", StaticFiles(directory="static_files"), name="static")

@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Chào mừng đến với API Thư viện!"}