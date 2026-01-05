'use server';

import { cookies } from 'next/headers';

// Sử dụng biến môi trường chuẩn của Server (không cần NEXT_PUBLIC)
const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL || 'http://127.0.0.1:8000';

async function getAuthToken() {
    const cookieStore = await cookies();
    return cookieStore.get('auth_token')?.value;
}

// 1. Action Upload Ảnh
export async function uploadImagesAction(formData) {
    try {
        const token = await getAuthToken();

        // Debug: In ra để xem Server Action có nhận được file không
        const files = formData.getAll('files');
        console.log(`[Server Action] Đang upload ${files.length} file...`);

        const res = await fetch(`${FASTAPI_URL}/api/v1/bai-viet/images`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`, // Bỏ comment nếu cần token
            },
            body: formData, // Truyền trực tiếp FormData nhận được
            cache: 'no-store'
        });

        if (!res.ok) {
            const errorText = await res.text();
            console.error(`[FastAPI Error] Status: ${res.status}, Body: ${errorText}`);
            // Trả về lỗi có cấu trúc để page.js xử lý
            return {
                success: false,
                error: `Lỗi Server (${res.status}): ${errorText}`
            };
        }

        const data = await res.json();
        // Trả về thành công
        return { success: true, data: data.data }; // FastAPI trả về { data: [...] } nên ta lấy .data

    } catch (error) {
        console.error("[Action Error]", error);
        return { success: false, error: error.message };
    }
}

// 2. Action Tạo bài viết (Giữ nguyên, chỉ chỉnh lại return chuẩn)
export async function createPostAction(payload) {
    try {
        const token = await getAuthToken();

        const res = await fetch(`${FASTAPI_URL}/api/v1/bai-viet/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload),
            cache: 'no-store'
        });

        if (!res.ok) {
            const errorText = await res.text();
            return { success: false, error: errorText };
        }

        const data = await res.json();
        return { success: true, data: data };

    } catch (error) {
        return { success: false, error: error.message };
    }
}