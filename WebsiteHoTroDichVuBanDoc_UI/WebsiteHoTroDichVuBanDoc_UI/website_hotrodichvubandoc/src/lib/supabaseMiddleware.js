// src/lib/supabaseMiddleware.js
import { createServerClient } from '@supabase/ssr'

// Đây là hàm tạo client DÀNH RIÊNG CHO MIDDLEWARE
export function createSupabaseMiddlewareClient(request) {
    // Lấy hàm 'cookies' từ chính 'request' (thay vì 'next/headers')
    const cookies = request.cookies;

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
        cookies: {
            async get(name) {
                return cookies.get(name)?.value
            },
            set(name, value, options) {
                cookies.set({ name, value, ...options })
            },
            remove(name, options) {
                cookies.set({ name, value: '', ...options })
            },
        },
        }
    )
}