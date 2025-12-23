# app/api/v1/endpoints/chatbot_api.py
from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.models.custom_response import ChatRequest, ChatResponse
from typing import Optional, Dict, Any
import uuid

# Import Brain của bạn
from app.api.v1.services.brain import LibraryBrain
# Import service lưu lịch sử (nếu bạn có dùng)
# from app.api.v1.services.history_service import save_chat_history

router = APIRouter()

# Khởi tạo Brain (Load model Llama3 1 lần duy nhất khi khởi động server)
print("🧠 Đang khởi động LibraryBrain (Llama3)...")
brain = LibraryBrain()
print("✅ LibraryBrain sẵn sàng!")

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        # Nếu Client không gửi session_id (lần đầu chat), tự tạo mới
        current_session = request.session_id if request.session_id else str(uuid.uuid4())

        # Truyền session_id vào brain
        ai_reply = brain.process_chat(request.message, request.user_id, current_session)

        return ChatResponse(
            reply=ai_reply,
            session_id=current_session
        )

    except Exception as e:
        print(f"❌ Lỗi API Chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))