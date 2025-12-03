// src/app/tim_kiem/actions.js
'use server';

import { cookies } from 'next/headers';

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL;

async function fetchFromAPI(url) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url.toString(), { headers, cache: 'no-store' });
    if (!res.ok) throw new Error('Lỗi kết nối API');
    return res.json();
}

// 1. Action Tìm kiếm Nâng cao (Cập nhật trả về đúng cấu trúc mới)
export async function searchBooksAction({ q, danh_muc_id, page = 1, limit = 8 }) {
    try {
        const url = new URL(`${FASTAPI_URL}/api/v1/tac-pham/tim-kiem-nang-cao`);

        if (q) url.searchParams.append('q', q);
        if (danh_muc_id) url.searchParams.append('danh_muc_id', danh_muc_id);

        url.searchParams.append('page', page);
        url.searchParams.append('limit', limit);

        // API trả về: { data: [...], total: 25, page: 1, limit: 8, total_pages: 4 }
        const response = await fetchFromAPI(url);

        return {
            data: response.data || [],
            total: response.total || 0,
            totalPages: response.total_pages || 0
        };

    } catch (error) {
        console.error("Search Error:", error);
        return { data: [], total: 0, error: error.message };
    }
}

// 2. Action lấy Danh mục
export async function getAllDanhMucAction() {
    try {
        const url = new URL(`${FASTAPI_URL}/api/v1/danh-muc/`);
        const data = await fetchFromAPI(url);
        return { data };
    } catch (error) {
        return { error: error.message };
    }
}