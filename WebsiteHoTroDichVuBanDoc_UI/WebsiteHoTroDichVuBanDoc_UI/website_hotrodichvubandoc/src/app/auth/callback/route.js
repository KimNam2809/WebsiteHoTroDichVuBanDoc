import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/tai_khoan'

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    getAll() { return cookieStore.getAll() },
                    setAll(cookiesToSet) {
                        try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
                    },
                },
            }
        )

        // Đổi Code lấy Session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error && data?.session) {
            // 1. Lưu Token vào Cookie 'auth_token' (để đồng bộ với logic cũ của bạn)
            cookieStore.set('auth_token', data.session.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                maxAge: 60 * 60 * 24 * 7, // 7 ngày
            });

            // 2. Kiểm tra User mới (Dựa vào thời gian tạo)
            const userCreatedAt = new Date(data.user.created_at).getTime();
            const now = new Date().getTime();
            const isNewUser = (now - userCreatedAt) < 60000; // Trong vòng 1 phút

            // 3. Chuyển hướng
            if (isNewUser) {
                return NextResponse.redirect(`${origin}${next}?new_user=true`)
            }
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Nếu lỗi
    return NextResponse.redirect(`${origin}/dang_nhap?error=AuthError`)
}