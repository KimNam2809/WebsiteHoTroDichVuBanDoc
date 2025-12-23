# app/api/v1/endpoints/chatbot_api.py
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Dict, Any

# Import Brain của bạn
from app.api.v1.services.brain import LibraryBrain
# Import service lưu lịch sử (nếu bạn có dùng)
# from app.api.v1.services.history_service import save_chat_history

router = APIRouter()

# Khởi tạo Brain (Load model Llama3 1 lần duy nhất khi khởi động server)
print("🧠 Đang khởi động LibraryBrain (Llama3)...")
brain = LibraryBrain()
print("✅ LibraryBrain sẵn sàng!")

# Input Model
class ChatRequest(BaseModel):
    user_id: int
    message: str

# Output Model
class ChatResponse(BaseModel):
    reply: str

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest, background_tasks: BackgroundTasks):
    try:
        # 1. Gọi Brain xử lý (RAG + Tool + Chat)
        ai_reply = brain.process_chat(request.message, request.user_id)

        # 2. Lưu lịch sử (Chạy ngầm để trả lời nhanh)
        # Nếu bạn chưa setup bảng history thì comment 2 dòng này lại
        # background_tasks.add_task(save_chat_history, request.user_id, "user", request.message)
        # background_tasks.add_task(save_chat_history, request.user_id, "assistant", ai_reply)

        return ChatResponse(reply=ai_reply)

    except Exception as e:
        print(f"❌ Lỗi API Chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))