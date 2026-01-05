'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL;

async function getAuthToken() {
    const cookieStore = await cookies();
    return cookieStore.get('auth_token')?.value;
}

// 1. Lấy danh sách bài viết (Có hỗ trợ tìm kiếm)
// Endpoint giả định: GET /api/v1/bai-viet/?search=...&skip=0&limit=100
export async function getPostsAction(query = '') {
    try {
        const token = await getAuthToken();
        // Xây dựng URL có query string
        const url = new URL(`${FASTAPI_URL}/api/v1/bai-viet/`);
        if (query) url.searchParams.append('search', query);
        // Mặc định lấy 50 bài mới nhất
        url.searchParams.append('limit', '50');
        url.searchParams.append('desc', 'true'); // Sắp xếp mới nhất

        const res = await fetch(url.toString(), {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            cache: 'no-store' // Luôn lấy dữ liệu mới
        });

        if (!res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error("Get Posts Error:", error);
        return [];
    }
}

// 2. Xóa bài viết
export async function deletePostAction(id) {
    try {
        const token = await getAuthToken();
        const res = await fetch(`${FASTAPI_URL}/api/v1/bai-viet/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (res.ok) {
            revalidatePath('/admin/quan_ly_bai_viet'); // Làm mới danh sách
            return { success: true };
        }

        const errText = await res.text();
        return { success: false, error: errText };
    } catch (error) {
        return { success: false, error: error.message };
    }
}