'use server';

import { cookies } from 'next/headers';

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL;

async function getAuthToken() {
    const cookieStore = await cookies();
    return cookieStore.get('auth_token')?.value;
}

// 1. Lấy chi tiết bài viết cũ để điền vào form
export async function getPostDetailAction(id) {
    const token = await getAuthToken();
    try {
        const res = await fetch(`${FASTAPI_URL}/api/v1/bai-viet/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store'
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        return null;
    }
}

// 2. Action Upload ảnh (Dùng lại logic cũ)
export async function uploadImagesAction(formData) {
    // ... Copy y hệt hàm uploadImagesAction từ trang tạo mới ...
    // Hoặc tốt nhất là import từ file shared actions nếu bạn đã tách ra
    try {
        const res = await fetch(`${FASTAPI_URL}/api/v1/bai-viet/images`, {
            method: 'POST',
            body: formData, // Fetch tự xử lý boundary
            cache: 'no-store'
        });
        if (!res.ok) {
            const txt = await res.text();
            return { success: false, error: txt };
        }
        const json = await res.json();
        return { success: true, data: json.data };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

// 3. Action Update bài viết
export async function updatePostAction(id, payload) {
    const token = await getAuthToken();
    try {
        const res = await fetch(`${FASTAPI_URL}/api/v1/bai-viet/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload),
            cache: 'no-store'
        });

        if (!res.ok) {
            const err = await res.text();
            return { success: false, error: err };
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}