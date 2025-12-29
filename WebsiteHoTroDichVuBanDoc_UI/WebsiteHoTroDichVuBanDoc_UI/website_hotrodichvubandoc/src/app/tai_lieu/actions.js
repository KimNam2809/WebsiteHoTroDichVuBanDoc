// src/app/tai_lieu/actions.js
'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL;

async function fetchWithAuth(endpoint, options = {}) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    const res = await fetch(`${FASTAPI_URL}${endpoint}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    });
    return res;
}

// 1. Lấy Profile để lấy mã bạn đọc
async function getMyReaderId() {
    const res = await fetchWithAuth('/api/v1/nguoi-dung/profile');
    if (!res.ok) return null;
    const data = await res.json();
    return data?.mabandoc;
}

// 2. Action Mượn Sách
export async function borrowBookAction(maBanSao, ngayTra) {
    try {
        // B1: Lấy ID bạn đọc của user đang đăng nhập
        const profileRes = await fetchWithAuth('/api/v1/nguoi-dung/profile');
        if (!profileRes.ok) return { error: "Vui lòng đăng nhập lại." };
        const profile = await profileRes.json();

        const maBanDoc = profile.mabandoc;

        if (!maBanDoc) {
            return { error: "Bạn chưa có thẻ bạn đọc hợp lệ hoặc hồ sơ chưa được duyệt." };
        }

        // B2: Gửi yêu cầu mượn
        const bodyData = {
            maBanSao: maBanSao,
            maBanDoc: maBanDoc,
            maNhanVien: null, // Bạn đọc tự mượn
            ngayTra: ngayTra  // YYYY-MM-DD
        };

        const res = await fetchWithAuth('/api/v1/muon-tra/', {
            method: 'POST',
            body: JSON.stringify(bodyData)
        });

        if (!res.ok) {
            const errText = await res.text();
            try {
                const errJson = JSON.parse(errText);
                return { error: errJson.detail || "Lỗi khi mượn sách." };
            } catch {
                return { error: `Lỗi: ${errText}` };
            }
        }

        // Thành công -> Refresh lại trang để cập nhật trạng thái "Đã mượn" của bản sao
        revalidatePath('/tai_lieu/[id]', 'page');
        return { success: true };

    } catch (error) {
        console.error("Borrow error:", error);
        return { error: "Lỗi kết nối đến hệ thống." };
    }
}

// Action Đặt trước sách
export async function reserveBookAction(maBanSao) {
    try {
        // 1. Lấy thông tin user
        const profileRes = await fetchWithAuth('/api/v1/nguoi-dung/profile');
        if (!profileRes || !profileRes.ok) return { error: "Không thể xác thực người dùng." };

        const profileData = await profileRes.json();
        const maBanDoc = profileData.mabandoc || profileData.id;

        if (!maBanDoc) return { error: "Tài khoản chưa có hồ sơ bạn đọc." };

        // 2. Gửi request đặt trước
        // Gửi maBanDoc ở cả URL (cho Depends check quyền) và Body (cho logic nghiệp vụ)
        const endpoint = `/api/v1/dat-truoc/?maBanDoc=${maBanDoc}`;
        const payload = {
            maBanSao: Number(maBanSao),
            maBanDoc: Number(maBanDoc)
        };

        const res = await fetchWithAuth(endpoint, {
            method: 'POST',
            body: JSON.stringify(payload),
            cache: 'no-store'
        });

        // 3. Xử lý kết quả
        if (res.ok) {
            // Sửa Warning: Thêm 'page' vào tham số thứ 2
            revalidatePath('/tai_lieu/[id]', 'page');
            return { success: true };
        }

        // Xử lý lỗi từ backend
        const errorText = await res.text();
        let errorMessage = "Đặt trước thất bại.";
        try {
            const jsonErr = JSON.parse(errorText);
            if (jsonErr.detail) {
                errorMessage = Array.isArray(jsonErr.detail)
                    ? jsonErr.detail.map(e => e.msg).join(', ')
                    : jsonErr.detail;
            }
        } catch (e) {
            errorMessage = errorText;
        }

        return { error: errorMessage };

    } catch (error) {
        return { error: "Lỗi kết nối hệ thống." };
    }
}