// src/app/admin/actions.js
'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache'; // Để refresh trang sau khi duyệt

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL;

/**
 * Hàm Helper để gọi API Admin an toàn
 * Tự động lấy token từ cookie và thêm vào header
 */
async function fetchAdmin(endpoint, options = {}) {
    const cookieStore = await cookies(); // Next.js 15 yêu cầu await
    const token = cookieStore.get('auth_token')?.value;

    const res = await fetch(`${FASTAPI_URL}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers,
        },
        cache: 'no-store', // Luôn lấy dữ liệu mới nhất
    });
    return res;
}

// 1. Lấy danh sách hồ sơ đang chờ duyệt
// Endpoint: GET /api/v1/yeu-cau-the/danh-sach-cho-duyet
export async function getPendingCardsAction() {
    try {
        const res = await fetchAdmin('/api/v1/yeu-cau-the/danh-sach-cho-duyet');
        if (!res.ok) {
            console.error("Lỗi lấy danh sách chờ duyệt:", res.status);
            return [];
        }
        return await res.json();
    } catch (error) {
        console.error("Lỗi kết nối:", error);
        return [];
    }
}

// 2. Lấy chi tiết đầy đủ của một hồ sơ (bao gồm ảnh, địa chỉ, v.v.)
// Endpoint: GET /api/v1/yeu-cau-the/{id}
export async function getCardRequestDetailAction(id) {
    try {
        const res = await fetchAdmin(`/api/v1/yeu-cau-the/${id}`);
        if (!res.ok) {
            console.error(`Lỗi lấy chi tiết hồ sơ ${id}:`, res.status);
            return null;
        }
        return await res.json();
    } catch (error) {
        console.error("Lỗi kết nối:", error);
        return null;
    }
}

// 3. Duyệt hoặc Từ chối hồ sơ
// Endpoint: PUT /api/v1/yeu-cau-the/phe-duyet/{id}
export async function approveCardAction(id, status, reason = '') {
    try {
        const bodyData = {
            trang_thai: status, // 'daDuyet' hoặc 'tuChoi'
            ly_do: reason       // Lý do (bắt buộc nếu từ chối, tùy chọn nếu duyệt)
        };

        const res = await fetchAdmin(`/api/v1/yeu-cau-the/phe-duyet/${id}`, {
            method: 'PUT',
            body: JSON.stringify(bodyData)
        });

        if (res.ok) {
            // Làm mới dữ liệu trang admin để danh sách cập nhật ngay lập tức
            revalidatePath('/admin/phe_duyet_the');
            return { success: true };
        }

        // Xử lý lỗi trả về từ backend (nếu có)
        const errText = await res.text();
        return { error: `Lỗi từ Server: ${errText}` };

    } catch (error) {
        console.error("Lỗi xử lý hồ sơ:", error);
        return { error: 'Lỗi kết nối đến máy chủ.' };
    }
}