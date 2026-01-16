'use server';

import { cookies } from 'next/headers';

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL;

// Helper: Fetch with Auth Token automatically
async function fetchWithAuth(endpoint, options = {}) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const res = await fetch(`${FASTAPI_URL}${endpoint}`, {
            ...options,
            headers,
            cache: 'no-store',
        });

        // Handle empty response (e.g. 204 No Content for PUT/DELETE)
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};

        if (!res.ok) {
            console.error(`API Error ${endpoint}: ${res.status}`, data);
            // Return null or throw depending on strategy. For list, return empty.
            if (options.method === 'GET') return null;
            return false;
        }
        return data;
    } catch (error) {
        console.error(`Fetch API Error (${endpoint}):`, error);
        if (options.method === 'GET') return [];
        return false;
    }
}

// 1. Get Notifications
export async function getNotificationsAction() {
    console.log("🚀 [Action] Đang lấy thông báo (Google Auth Supported)...");

    try {
        // Step 1: Get User Profile to find maBanDoc
        const profileData = await fetchWithAuth('/api/v1/nguoi-dung/profile');

        if (!profileData) {
            console.warn("⚠️ [Action] Không lấy được thông tin profile");
            return [];
        }

        // Robust maBanDoc extraction
        const maBanDoc = profileData.maBanDoc || profileData.ma_ban_doc || profileData.mabandoc;

        if (!maBanDoc) {
            console.warn("⚠️ [Action] Người dùng chưa có hồ sơ bạn đọc");
            return [];
        }

        // Step 2: Fetch notifications with maBanDoc
        const notifications = await fetchWithAuth(`/api/v1/thong-bao/?maBanDoc=${maBanDoc}`);

        // Ensure array return
        if (Array.isArray(notifications)) {
            console.log(`✅ [Action] Lấy thành công ${notifications.length} thông báo`);
            return notifications;
        } else {
            // Backend might return { "data": [...] } or something else?
            // Based on previous code, likely returns list directly.
            // Or my helper returns null on error.
            return [];
        }

    } catch (error) {
        console.error("🔥 [Action] Lỗi không xác định:", error);
        return [];
    }
}

// 2. Mark as Read
export async function markAsReadAction(maThongBao) {
    console.log(`🚀 [Action] Đánh dấu đã đọc: ${maThongBao}`);
    try {
        const result = await fetchWithAuth(`/api/v1/thong-bao/${maThongBao}/read`, {
            method: 'PUT'
        });

        const mathongbao = result.maThongBao || result.mathongbao || result.ma_thong_bao;

        // fetchWithAuth returns false on error (for non-GET)
        if (result === false) {
            console.error(`❌ [Action] Đánh dấu thất bại cho ID: ${maThongBao}`);
            return false;
        }

        console.log(`✅ [Action] Đánh dấu thành công: ${maThongBao}`);
        return true;
    } catch (error) {
        console.error(`🔥 [Action] Exception markAsRead:`, error);
        return false;
    }
}
