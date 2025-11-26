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
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
        return { error: 'Vui lòng đăng nhập để thực hiện chức năng này.' };
    }

    // 1. KIỂM TRA DỮ LIỆU TRƯỚC KHI GỬI (VALIDATION)
    // FastAPI yêu cầu int, nếu gửi "" sẽ bị lỗi 422
    const maLoaiThe = formData.get('ma_loai_the');
    const maPhuongXa = formData.get('ma_phuong_xa');

    if (!maLoaiThe) return { error: "Vui lòng chọn Loại thẻ." };
    if (!maPhuongXa) return { error: "Vui lòng chọn Phường/Xã." };

    // (Tùy chọn) Kiểm tra file ảnh
    const anhThe = formData.get('anh_the');
    if (!anhThe || anhThe.size === 0) return { error: "Vui lòng tải lên ảnh thẻ." };

    try {
        // 2. Gửi FormData sang FastAPI
        const response = await fetch(`${FASTAPI_URL}/api/v1/yeu-cau-the/dang-ky`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                // KHÔNG thêm Content-Type, để fetch tự xử lý boundary của multipart
            },
            body: formData,
        });

        if (!response.ok) {
            // 3. ĐỌC CHI TIẾT LỖI TỪ FASTAPI
            const errorText = await response.text();
            console.error("❌ FastAPI Error Detail:", errorText);

            // Cố gắng parse JSON lỗi để hiển thị đẹp hơn
            try {
                const errorJson = JSON.parse(errorText);
                if (errorJson.detail && Array.isArray(errorJson.detail)) {
                    // Lấy lỗi đầu tiên trong mảng
                    const firstError = errorJson.detail[0];
                    const field = firstError.loc[firstError.loc.length - 1];
                    return { error: `Lỗi dữ liệu tại trường '${field}': ${firstError.msg}` };
                }
            } catch (e) {
                // Nếu không parse được JSON
            }

            return { error: `Lỗi đăng ký (${response.status}): ${errorText}` };
        }

        const result = await response.json();

        return {
            success: true,
            data: result.data
        };

    } catch (error) {
        console.error("Network Error:", error);
        return { error: 'Lỗi kết nối đến máy chủ (Backend không phản hồi).' };
    }
}