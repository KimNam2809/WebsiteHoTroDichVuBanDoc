// src/app/dich_vu/dat_lich/actions.js
'use server';

import { cookies } from 'next/headers';

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL;

// Copy exact helper from tai_khoan/actions.js for consistency
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
            cache: 'no-store', // Ensure no caching for sensitive operations
        });

        const data = await res.json();

        if (!res.ok) {
            // Log for server-side debugging
            console.error(`API Error ${endpoint}: ${res.status}`, data);
            throw new Error(data.detail || `API Error: ${res.status}`);
        }
        return data;
    } catch (error) {
        console.error(`Fetch API Error (${endpoint}):`, error);
        throw error;
    }
}

// 1. Lấy danh sách Phòng
export async function getAllRoomsAction() {
    try {
        // Allows caching for 5 minutes
        const res = await fetch(`${FASTAPI_URL}/api/v1/phong/`, {
            next: { revalidate: 300 }
        });
        const data = await res.json();
        return { data: Array.isArray(data) ? data : [] };
    } catch (error) {
        return { error: error.message, data: [] };
    }
}

// 2. Lấy danh sách Chỗ ngồi
export async function getAllSeatsAction() {
    try {
        // Real-time needed
        const data = await fetchWithAuth('/api/v1/cho-ngoi/');
        return { data: Array.isArray(data) ? data : [] };
    } catch (error) {
        return { error: error.message, data: [] };
    }
}

// 3. Tạo Đặt chỗ ngồi
export async function createSeatBookingAction(bookingData) {
    try {
        // Step 1: Get Current User Profile for maBanDoc
        // IMPORTANT: Must use fetchWithAuth to ensure Token is passed and Cache is skipped
        const profileData = await fetchWithAuth('/api/v1/nguoi-dung/profile');

        if (!profileData || !profileData.maBanDoc) {
            return { success: false, error: "Bạn chưa có hồ sơ bạn đọc hoặc chưa đăng nhập." };
        }

        // Step 2: Inject maBanDoc
        // Ensure "maBanDoc" overwrites any placeholder in bookingData
        const payload = {
            ...bookingData,
            maBanDoc: profileData.maBanDoc
        };

        const data = await fetchWithAuth('/api/v1/dat-cho-ngoi/', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// 4. Tạo Đặt phòng
export async function createRoomBookingAction(bookingData) {
    try {
        // Step 1: Get Profile
        const profileData = await fetchWithAuth('/api/v1/nguoi-dung/profile');

        // Step 2: Inject Identity
        const payload = {
            ...bookingData,
            nguoiToChuc: bookingData.nguoiToChuc || profileData.hoten || "Người dùng Web",
        };

        const data = await fetchWithAuth('/api/v1/dat-phong/', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}
