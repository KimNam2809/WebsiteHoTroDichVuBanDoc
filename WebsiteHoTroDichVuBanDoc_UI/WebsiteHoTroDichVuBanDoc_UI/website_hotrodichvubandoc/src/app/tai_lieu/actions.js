// src/app/tai_lieu/actions.js
'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL;

async function fetchWithAuth(endpoint, options = {}) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };

    const res = await fetch(`${FASTAPI_URL}${endpoint}`, {
        ...options,
        headers: { ...headers, ...options.headers },
        cache: 'no-store'
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