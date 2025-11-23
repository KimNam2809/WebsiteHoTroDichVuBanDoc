// src/app/admin/actions.js
'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache'; // Để refresh trang sau khi duyệt

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL;

async function fetchAdmin(endpoint, options = {}) {
    const token = (await cookies()).get('auth_token')?.value;
    const res = await fetch(`${FASTAPI_URL}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
        cache: 'no-store',
    });
    return res;
}

// 1. Lấy danh sách chờ duyệt
export async function getPendingCardsAction() {
    const res = await fetchAdmin('/api/v1/yeu-cau-the/danh-sach-cho-duyet');
    if (!res.ok) return [];
    return res.json();
}

// 2. Duyệt / Từ chối hồ sơ
export async function approveCardAction(id, status, reason = '') {
    const res = await fetchAdmin(`/api/v1/yeu-cau-the/phe-duyet/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            trang_thai: status, // 'daDuyet' hoặc 'tuChoi'
            ly_do: reason
        })
    });

    if (res.ok) {
        // Làm mới dữ liệu trang admin để cập nhật danh sách
        revalidatePath('/admin/phe_duyet_the');
        return { success: true };
    }
    return { error: 'Lỗi khi xử lý hồ sơ.' };
}