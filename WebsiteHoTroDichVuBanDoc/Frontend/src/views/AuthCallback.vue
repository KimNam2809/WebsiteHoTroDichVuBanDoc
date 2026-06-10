<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 flex items-center justify-center p-4 text-white">
    <div class="text-center space-y-4">
      <Loader2 class="animate-spin text-cyan-400 w-12 h-12 mx-auto" />
      <h2 class="text-xl font-bold">Đang xác thực tài khoản Google...</h2>
      <p class="text-sm text-blue-200">Vui lòng chờ giây lát, hệ thống đang đồng bộ dữ liệu.</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'
import axios from 'axios'
import { Loader2 } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  try {
    // Supabase will automatically parse query / hash parameters on redirect
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error("Supabase session retrieval error:", error)
      router.push('/dang_nhap?error=SupabaseCallbackError')
      return
    }

    if (session) {
      const token = session.access_token
      authStore.token = token
      localStorage.setItem('auth_token', token)
      
      // Configure Axios default headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

      // Fetch profile data
      await authStore.fetchProfile()
      
      // Redirect to Reader Dashboard
      router.push('/tai_khoan')
    } else {
      console.warn("No active session found in callback.")
      router.push('/dang_nhap?error=NoSessionInCallback')
    }
  } catch (err) {
    console.error("Auth callback exception:", err)
    router.push('/dang_nhap?error=CallbackException')
  }
})
</script>
