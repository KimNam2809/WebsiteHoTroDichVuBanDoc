// src/app/tim_kiem/actions.js
'use server';

import { cookies } from 'next/headers';

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL;

async function fetchFromAPI(url, options = {}) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url.toString(), {
        headers,
        ...options
    });

    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    return res.json();
}

// 1. Tìm kiếm (Có Cache 60s để tăng tốc)
export async function searchBooksAction({ q, danh_muc_id, page = 1, limit = 8 }) {
    try {
        const url = new URL(`${FASTAPI_URL}/api/v1/tac-pham/tim-kiem-nang-cao`);
        if (q) url.searchParams.append('q', q);
        if (danh_muc_id) url.searchParams.append('danh_muc_id', danh_muc_id);
        url.searchParams.append('page', page);
        url.searchParams.append('limit', limit);

        // 🔥 Tăng tốc: Cache kết quả tìm kiếm trong 60 giây
        const response = await fetchFromAPI(url, {
            next: { revalidate: 60 }
        });

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

// 2. Lấy Danh mục (Cache 1 giờ vì ít thay đổi)
export async function getAllDanhMucAction() {
    try {
        const url = new URL(`${FASTAPI_URL}/api/v1/danh-muc/`);
        const data = await fetchFromAPI(url, {
            next: { revalidate: 3600 }
        });
        return { data };
    } catch (error) {
        return { error: error.message };
    }
}