# app/api/v1/endpoints/chatbot_api.py
from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.models.custom_response import ChatRequest, ChatResponse
from typing import Optional, Dict, Any
import uuid

# Import Brain của bạn
from app.api.v1.services.brain import LibraryBrain

router = APIRouter()

# Khởi tạo Brain (Load model Llama3 1 lần duy nhất khi khởi động server)
print("🧠 Đang khởi động LibraryBrain (Llama3)...")
brain = LibraryBrain()
print("✅ LibraryBrain sẵn sàng!")

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        current_session = request.session_id if request.session_id else str(uuid.uuid4())

        # brain.process_chat trả về dict {"reply": "...", "action": {...}}
        result = brain.process_chat(request.message, request.user_id, current_session)

        return ChatResponse(
            reply=result["reply"],  # Đảm bảo lấy đúng key "reply" là string
            session_id=current_session,
            action=result.get("action")
        )
    except Exception as e:
        print(f"❌ Lỗi API Chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))