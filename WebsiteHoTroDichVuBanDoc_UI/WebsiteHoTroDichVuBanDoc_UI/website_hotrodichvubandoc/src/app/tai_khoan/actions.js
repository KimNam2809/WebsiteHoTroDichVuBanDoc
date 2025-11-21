// src/app/tai_khoan/actions.js
'use server';

import { cookies } from 'next/headers';

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL;

async function fetchWithAuth(endpoint) {
    const token = cookies().get('auth_token')?.value;
    if (!token) return null;

    const res = await fetch(`${FASTAPI_URL}${endpoint}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        cache: 'no-store',
    });

    if (!res.ok) {
        console.error(`API Error ${endpoint}:`, res.status);
        return null;
    }
    return res.json();
}

// 1. Lấy thông tin Profile (Đã cập nhật endpoint)
export async function getUserProfileAction() {
    const data = await fetchWithAuth('/api/v1/nguoi-dung/profile');
    return data;
}

// 2. Lấy danh sách mượn (Đã cập nhật endpoint)
// Hàm này hỗ trợ lọc theo trạng thái: 'daMuon', 'daTra', 'quaHan'
export async function getLoansByStatusAction(status) {
    const endpoint = `/api/v1/muon-tra/danh-sach-chi-tiet-muon-tra?trang_thai=${status}`;
    const data = await fetchWithAuth(endpoint);
    return data || [];
}

// 3. Hàm tiện ích lấy TẤT CẢ sách đang giữ (Đang mượn + Quá hạn)
// Dùng cho Dashboard để hiển thị tổng quan
export async function getCurrentHoldingsAction() {
    // Gọi song song 2 API để lấy cả sách đang mượn và sách quá hạn
    const [borrowing, overdue] = await Promise.all([
        getLoansByStatusAction('daMuon'),
        getLoansByStatusAction('quaHan')
    ]);

    // Nếu API lỗi (trả về null), ta coi như là mảng rỗng []
    const safeBorrowing = Array.isArray(borrowing) ? borrowing : [];
    const safeOverdue = Array.isArray(overdue) ? overdue : [];

    return [...safeBorrowing, ...safeOverdue];
}