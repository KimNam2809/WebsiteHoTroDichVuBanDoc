'use server';

import { cookies } from 'next/headers';

const BACKEND_URL = process.env.FASTAPI_BACKEND_URL;

export async function getNotificationsAction() {
    console.log("🚀 [Action] Đang lấy thông báo từ:", `${BACKEND_URL}/api/v1/thong-bao/`); // Log URL

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        console.warn("⚠️ [Action] Không tìm thấy token trong cookies");
        return [];
    }

    try {
        const res = await fetch(`${BACKEND_URL}/api/v1/thong-bao/`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store'
        });

        if (!res.ok) {
            const errorText = await res.text(); // Đọc lỗi chi tiết từ Backend (nếu có)
            console.error(`❌ [Action] Lỗi fetch thông báo: ${res.status} - ${errorText}`);
            return [];
        }

        const data = await res.json();
        console.log(`✅ [Action] Lấy thành công ${data.length} thông báo`);
        return data;

    } catch (error) {
        console.error("🔥 [Action] Exception khi gọi API:", error);
        return [];
    }
}

export async function markAsReadAction(maThongBao) {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) return false;

    try {
        const res = await fetch(`${BACKEND_URL}/api/v1/thong-bao/${maThongBao}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        return res.ok;
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return false;
    }
}
