// src/app/dang_ky_the/actions.js
'use server';

import { cookies } from 'next/headers';

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL;

async function fetchPublic(endpoint) {
    const res = await fetch(`${FASTAPI_URL}${endpoint}`, {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store', // Hoặc 'force-cache' nếu dữ liệu ít thay đổi
    });
    if (!res.ok) return [];
    return res.json();
}

// === API Lấy Tỉnh/Thành phố ===
export async function getProvincesAction() {
    return await fetchPublic('/api/v1/tinh-thanh-pho/');
}

// === API Lấy Phường/Xã theo Tỉnh ===
export async function getWardsByProvinceAction(provinceId) {
    if (!provinceId) return [];
    return await fetchPublic(`/api/v1/phuong-xa/tinh-thanh-pho/${provinceId}`);
}

export async function getCardTypesAction() {
    try {
        const res = await fetch(`${FASTAPI_URL}/api/v1/loai-the/`, {
            cache: 'no-store', // Luôn lấy dữ liệu mới nhất
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!res.ok) return [];
        return await res.json();
    } catch (error) {
        console.error("Lỗi lấy loại thẻ:", error);
        return [];
    }
}

export async function registerCardAction(prevState, formData) {
    const token = (await cookies()).get('auth_token')?.value;

    // 1. Kiểm tra đăng nhập
    if (!token) {
        return { error: 'Vui lòng đăng nhập để thực hiện chức năng này.' };
    }

    try {
        // 2. Gọi API FastAPI (Gửi trực tiếp FormData để xử lý file upload)
        // Lưu ý: Khi gửi FormData, KHÔNG cần set Content-Type header,
        // trình duyệt/fetch sẽ tự động set multipart/form-data boundary.
        const response = await fetch(`${FASTAPI_URL}/api/v1/yeu-cau-the/dang-ky`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                // KHÔNG thêm 'Content-Type': 'multipart/form-data' ở đây!
            },
            body: formData, // Gửi nguyên formData nhận được từ client
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("API Error:", errorText);
            return { error: `Lỗi đăng ký: ${response.statusText}` };
        }

        const result = await response.json();

        // 3. Trả về kết quả thành công
        return {
            success: true,
            data: result.data // Chứa mã hồ sơ, tổng tiền, v.v. để hiển thị QR
        };

    } catch (error) {
        console.error("Network Error:", error);
        return { error: 'Lỗi kết nối đến máy chủ.' };
    }
}