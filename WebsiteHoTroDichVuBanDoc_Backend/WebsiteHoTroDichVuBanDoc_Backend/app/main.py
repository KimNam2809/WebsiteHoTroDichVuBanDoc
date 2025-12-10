from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.api.v1.api import api_router # Import router v1

app = FastAPI(
    title="API Thư viện Thông minh",
    description="Backend cho dự án tốt nghiệp - Quản lý thư viện và Chatbot AI",
    version="1.0.0"
)

# Gắn router v1 vào app chính với tiền tố /api/v1
app.include_router(api_router, prefix="/api/v1")

app.mount("/static", StaticFiles(directory="static_files"), name="static")

@app.get("/", tags=["Root"])
def read_root():
    return {"message": "Chào mừng đến với API Thư viện!"}