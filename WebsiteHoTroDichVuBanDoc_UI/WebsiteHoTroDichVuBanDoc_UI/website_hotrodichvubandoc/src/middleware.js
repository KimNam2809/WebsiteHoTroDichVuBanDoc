// src/middleware.js
import { NextResponse } from 'next/server';
// 1. 👈 Không cần import Supabase ở đây nữa

export async function middleware(request) {
    // 2. 👈 Lấy cookie 'auth_token' của chúng ta
    const token = request.cookies.get('auth_token');
    const url = request.nextUrl.clone();

    // 3. LOGIC BẢO VỆ
    // Nếu KHÔNG có token VÀ đang cố vào khu vực bảo vệ
    if (!token && (
        request.nextUrl.pathname.startsWith('/tai_khoan') ||
        request.nextUrl.pathname.startsWith('/admin')
        )) {
        // Chuyển hướng về trang đăng nhập
        url.pathname = '/dang_nhap';
        return NextResponse.redirect(url);
    }

    // 4. LOGIC CHUYỂN HƯỚNG
    // Nếu ĐÃ CÓ token VÀ đang cố vào trang đăng nhập
    if (token && request.nextUrl.pathname === '/dang_nhap') {
        // Chuyển hướng về trang tài khoản
        url.pathname = '/tai_khoan';
        return NextResponse.redirect(url);
    }

    // Nếu mọi thứ ổn, cho phép đi tiếp
    return NextResponse.next();
}

// 5. CONFIG MATCHER (Giữ nguyên)
export const config = {
    matcher: [
        '/dang_nhap',
        '/tai_khoan/:path*',
        '/admin/:path*',
    ],
}