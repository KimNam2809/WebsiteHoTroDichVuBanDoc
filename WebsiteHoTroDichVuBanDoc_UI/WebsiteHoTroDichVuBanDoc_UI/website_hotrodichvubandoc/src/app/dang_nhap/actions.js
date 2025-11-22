// src/app/dang_nhap/actions.js
'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers'; // 👈 1. Import hàm cookies của Next.js

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL;

export async function loginAction(prevState, formData) {
    const username = formData.get('username');
    const password = formData.get('password');

    const formBody = new URLSearchParams();
    formBody.append('username', username);
    formBody.append('password', password);

    try {
        const response = await fetch(`${FASTAPI_URL}/api/v1/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formBody.toString(),
        });

        if (!response.ok) {
            return { error: 'Tên đăng nhập hoặc mật khẩu không chính xác' };
        }

        const data = await response.json();
        const accessToken = data.access_token;

        // 5. 👈 THAY ĐỔI LỚN: TỰ LƯU COOKIE BẢO MẬT
        // Chúng ta không dùng Supabase ở đây nữa
        const cookieStore = await cookies();
        cookieStore.set('auth_token', accessToken, {
            httpOnly: true, // Quan trọng: JavaScript phía client không thể đọc được
            secure: process.env.NODE_ENV === 'production', // Chỉ gửi qua HTTPS khi deploy
            path: '/', // Áp dụng cho toàn bộ trang web
            maxAge: 60 * 60 * 24 * 7, // 7 ngày (giống API FastAPI của bạn)
        });

    } catch (error) {
        console.error('Lỗi Server Action khi gọi FastAPI:', error);
        return { error: 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.' };
    }

    redirect('/tai_khoan');
}

// 6. 👈 THAY ĐỔI HÀM LOGOUT
export async function logoutAction() {
    // 1. Xóa cookie 'auth_token' của chúng ta
    cookies().delete('auth_token');

    // 2. Chuyển hướng về trang chủ
    redirect('/');
}