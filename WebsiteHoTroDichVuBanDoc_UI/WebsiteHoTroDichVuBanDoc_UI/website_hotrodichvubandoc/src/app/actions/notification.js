'use server';

import { cookies } from 'next/headers';

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL;

// Helper: Fetch with Auth Token automatically (Duplicate of thong_bao/actions.js for standalone)
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

        // Handle empty response
        const text = await res.text();
        const data = text ? JSON.parse(text) : {};

        if (!res.ok) {
            console.error(`API Error ${endpoint}: ${res.status}`, data);
            return null;
        }
        return data;
    } catch (error) {
        console.error(`Fetch API Error (${endpoint}):`, error);
        return null;
    }
}

export async function getUnreadCountAction() {
    try {
        // 1. Get User Profile to find maBanDoc
        const profileData = await fetchWithAuth('/api/v1/nguoi-dung/profile');

        if (!profileData) return 0;

        // Robust maBanDoc extraction
        const maBanDoc = profileData.maBanDoc || profileData.ma_ban_doc || profileData.mabandoc;

        if (!maBanDoc) return 0;

        // 2. Call API count
        const data = await fetchWithAuth(`/api/v1/thong-bao/unread-count?maBanDoc=${maBanDoc}`);

        if (data && typeof data.count === 'number') {
            return data.count;
        }
        return 0;

    } catch (error) {
        console.error("Lỗi lấy số lượng thông báo:", error);
        return 0;
    }
}
