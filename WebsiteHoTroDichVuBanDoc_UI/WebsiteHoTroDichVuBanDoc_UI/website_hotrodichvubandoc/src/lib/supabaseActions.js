// src/lib/supabaseActions.js
'use server'; // Đánh dấu đây là tệp chỉ chạy trên Server

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createSupabaseServerActionClient() {
    const cookieStore = cookies()
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                async get(name) {
                    return cookieStore.get(name)?.value
                },
                set(name, value, options) {
                    cookieStore.set({ name, value, ...options })
                },
                remove(name, options) {
                cookieStore.set({ name, value: '', ...options })
                },
            },
        }
    )
}