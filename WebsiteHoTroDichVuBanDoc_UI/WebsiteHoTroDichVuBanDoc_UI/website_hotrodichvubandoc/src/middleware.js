// src/middleware.js
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request) {
    const tokenCookie = request.cookies.get('auth_token');
    const token = tokenCookie?.value;
    const url = request.nextUrl.clone();
    const pathname = request.nextUrl.pathname;

    // 1. KIỂM TRA BIẾN MÔI TRƯỜNG
    const secretStr = process.env.FASTAPI_JWT_SECRET;
    if (!secretStr) {
        console.error("LỖI: Chưa cấu hình FASTAPI_JWT_SECRET");
        return NextResponse.next();
    }
    const JWT_SECRET = new TextEncoder().encode(secretStr);

    let userRole = 'guest';

    if (token) {
        try {
            const { payload } = await jwtVerify(token, JWT_SECRET);

            // --- 🔴 LOGIC XỬ LÝ ROLE MỚI (QUAN TRỌNG) ---

            // Trường hợp 1: Token từ FastAPI (Login thường) -> Có field 'vaiTro'
            if (payload.vaiTro) {
                userRole = payload.vaiTro;
            }
            // Trường hợp 2: Token từ Supabase (Google) -> Không có 'vaiTro', chỉ có 'role'
            else if (payload.role === 'authenticated') {
                // Mặc định user Google là Bạn đọc
                userRole = 'ban_doc';
            }

            // [DEBUG] Xem kết quả nhận diện
            // console.log(`Middleware: ${pathname} | Role identified: ${userRole}`);

        } catch (err) {
            console.error("Middleware JWT Error:", err.message);
            // Xóa cookie token lỗi
            const response = pathname === '/dang_nhap'
                ? NextResponse.next()
                : NextResponse.redirect(new URL('/dang_nhap', request.url));

            response.cookies.delete('auth_token');
            return response;
        }
    }

    // --- LOGIC BẢO VỆ ROUTE (GIỮ NGUYÊN) ---

    // 1. Nếu là Khách (guest) - Chưa đăng nhập
    if (userRole === 'guest') {
        if (pathname.startsWith('/tai_khoan') || pathname.startsWith('/admin')) {
            return NextResponse.redirect(new URL('/dang_nhap', request.url));
        }
    }

    // 2. Nếu là Bạn Đọc ('ban_doc' hoặc 'nguoiDung')
    if (userRole === 'ban_doc' || userRole === 'nguoiDung') {
        // Cố vào trang Admin -> Đá về Dashboard người dùng
        if (pathname.startsWith('/admin')) {
            return NextResponse.redirect(new URL('/tai_khoan', request.url));
        }
        // Đã login mà vào lại trang Login -> Đá về Dashboard
        if (pathname === '/dang_nhap') {
            return NextResponse.redirect(new URL('/tai_khoan', request.url));
        }
    }

    // 3. Nếu là Nhân viên ('nhan_vien' hoặc 'nhanVien')
    if (userRole === 'nhan_vien' || userRole === 'nhanVien') {
        // Nhân viên không vào trang cá nhân của bạn đọc -> Vào Admin
        if (pathname.startsWith('/tai_khoan')) {
            return NextResponse.redirect(new URL('/admin', request.url));
        }
        if (pathname === '/dang_nhap') {
            return NextResponse.redirect(new URL('/admin', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/dang_nhap',
        '/tai_khoan/:path*',
        '/admin/:path*',
    ],
}