// src/app/actions/chat.js
'use server';

import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL;

const JWT_SECRET = new TextEncoder().encode(process.env.FASTAPI_JWT_SECRET);

export async function sendChatMessageAction({ sessionId, message }) {
    let userId = null;

    try {
        // 1. Lấy Cookie
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;

        if (token) {
            try {
                // 2. Giải mã Token
                const { payload } = await jwtVerify(token, JWT_SECRET);

                // [DEBUG QUAN TRỌNG] In ra để xem server đọc được gì
                console.log("🔓 Decoded Token Payload:", payload);

                // 3. 👇 SỬA CHỖ NÀY: Lấy đúng trường "id" theo cấu trúc bạn cung cấp
                if (payload.id) {
                    userId = Number(payload.id); // Ép kiểu về số nguyên cho chắc chắn
                } else {
                    console.warn("⚠️ Token hợp lệ nhưng không tìm thấy trường 'id'");
                }

            } catch (err) {
                console.error("❌ Lỗi giải mã Token:", err.message);
                // Nếu token lỗi/hết hạn thì userId vẫn là null -> Chat như khách
            }
        }

        // 4. Gửi sang FastAPI Brain
        console.log("📤 Sending to AI Brain:", {
            user_id: userId, // Lúc này userId sẽ là số (ví dụ: 10) hoặc null
            session_id: sessionId,
            message
        });

        const res = await fetch(`${FASTAPI_URL}/api/v1/chatbot/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: userId,
                session_id: sessionId || null,
                message: message
            }),
            cache: 'no-store'
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error("❌ FastAPI Error Response:", errorText);
            return { error: "Hệ thống đang bận." };
        }

        const data = await res.json();
        return { success: true, data };

    } catch (error) {
        console.error("Server Action Error:", error);
        return { error: "Lỗi kết nối máy chủ." };
    }
}