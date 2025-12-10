// src/middleware.js
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.FASTAPI_JWT_SECRET);

export async function middleware(request) {
    const tokenCookie = request.cookies.get('auth_token');
    const token = tokenCookie?.value;
    const url = request.nextUrl.clone();
    const pathname = request.nextUrl.pathname;

    // 1. KIỂM TRA BIẾN MÔI TRƯỜNG (Debug)
    const secretStr = process.env.FASTAPI_JWT_SECRET;
    if (!secretStr) {
        console.error("LỖI NGHIÊM TRỌNG: Chưa cấu hình FASTAPI_JWT_SECRET trong .env.local");
        // Cho qua để không sập web, nhưng sẽ không đăng nhập được
        return NextResponse.next();
    }
    const JWT_SECRET = new TextEncoder().encode(secretStr);

    let userRole = 'guest';

    if (token) {
        try {
            const { payload } = await jwtVerify(token, JWT_SECRET);
            // [DEBUG] In ra terminal để xem role thực sự là gì
            console.log("Middleware Decoded Role:", payload.vaiTro);

            userRole = payload.vaiTro || 'guest';
        } catch (err) {
            console.error("Middleware JWT Error:", err.message);
            // Token lỗi -> Xóa và về đăng nhập
            // Trường hợp A: Đang ở trang đăng nhập -> Không cần redirect, chỉ xóa cookie và cho hiện trang
            if (pathname === '/dang_nhap') {
                const response = NextResponse.next();
                response.cookies.delete('auth_token');
                return response;
            }
            // Trường hợp B: Đang ở trang khác -> Redirect về đăng nhập và xóa cookie
            url.pathname = '/dang_nhap';
            const response = NextResponse.redirect(url);
            response.cookies.delete('auth_token');
            return response;
        }
    }

    // --- LOGIC BẢO VỆ ---

    // 1. Nếu là Khách (guest)
    if (userRole === 'guest') {
        if (pathname.startsWith('/tai_khoan') || pathname.startsWith('/admin')) {
            return NextResponse.redirect(new URL('/dang_nhap', request.url));
        }
    }

    // 2. Nếu là Bạn Đọc (Trong API Profile role là "nguoiDung",
    //    nhưng trong token login cần kiểm tra xem FastAPI trả về string gì.
    //    Ở đây gộp cả 'ban_doc' (cũ) và 'nguoiDung' (mới) để an toàn)
    if (userRole === 'ban_doc' || userRole === 'nguoiDung') {
        // Cố vào trang Admin -> Đá về Dashboard
        if (pathname.startsWith('/admin')) {
            console.log("--> Chặn Bạn đọc vào Admin");
            return NextResponse.redirect(new URL('/tai_khoan', request.url));
        }
        // Cố vào trang Login -> Đá về Dashboard
        if (pathname === '/dang_nhap') {
            return NextResponse.redirect(new URL('/tai_khoan', request.url));
        }
    }

    // 3. Nếu là Nhân viên (nhanVien hoặc nhan_vien)
    if (userRole === 'nhan_vien' || userRole === 'nhanVien') {
        // Cố vào trang Admin cấp cao (chỉ dành cho Admin)
        if (pathname.startsWith('/admin/quan_ly_tai_khoan') ||
            pathname.startsWith('/admin/giam_sat') ||
            pathname.startsWith('/admin/cau_hinh')) {
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