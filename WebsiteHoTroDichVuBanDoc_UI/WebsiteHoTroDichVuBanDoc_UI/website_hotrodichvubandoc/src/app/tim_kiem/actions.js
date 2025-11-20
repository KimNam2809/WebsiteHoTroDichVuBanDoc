'use server';

import { cookies } from 'next/headers';

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL;

// Hàm helper gọi API
async function fetchFromAPI(url) {
    const token = cookies().get('auth_token')?.value;
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(url.toString(), { headers, cache: 'no-store' });
    if (!res.ok) throw new Error('Lỗi kết nối API');
    return res.json();
}

// 1. Action Tìm kiếm Nâng cao (MỚI)
export async function searchBooksAction({ q, danh_muc_id, page = 1, limit = 8 }) {
    try {
        const url = new URL(`${FASTAPI_URL}/api/v1/tac-pham/tim-kiem-nang-cao`);

        // Thêm các params vào URL
        if (q) url.searchParams.append('q', q);
        if (danh_muc_id) url.searchParams.append('danh_muc_id', danh_muc_id);

        // Phân trang
        url.searchParams.append('page', page);
        url.searchParams.append('limit', limit);

        const data = await fetchFromAPI(url);
        return { data };
    } catch (error) {
        console.error("Search Error:", error);
        return { error: error.message };
    }
}

// 2. Action lấy Danh mục (Để đổ vào dropdown)
export async function getAllDanhMucAction() {
    try {
        const url = new URL(`${FASTAPI_URL}/api/v1/danh-muc/`);
        const data = await fetchFromAPI(url);
        return { data };
    } catch (error) {
        return { error: error.message };
    }
}