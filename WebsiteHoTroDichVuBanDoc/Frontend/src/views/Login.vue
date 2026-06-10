<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-4 pt-24 relative overflow-hidden font-sans">
    <!-- Background -->
    <div class="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 z-0"></div>
    <div class="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[size:16px_16px] z-0"></div>
    <div class="absolute top-0 left-0 w-96 h-96 bg-blue-500/30 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
    <div class="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"></div>

    <div class="relative z-10 w-full max-w-[480px]">
      <router-link to="/" class="inline-flex items-center gap-2 text-blue-200 hover:text-white mb-8 transition-colors group">
        <ArrowLeft :size="20" class="group-hover:-translate-x-1 transition-transform" /> Quay về Trang chủ
      </router-link>

      <div class="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
        <div class="p-8 pb-0 text-center">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
            <BookOpen :size="32" />
          </div>
          <h2 class="text-3xl font-extrabold text-gray-900 mb-2">
            {{ activeTab === 'login' ? 'Đăng nhập hệ thống' : 'Đăng ký thành viên' }}
          </h2>
          <p class="text-gray-500 text-sm">
            {{ activeTab === 'login' ? 'Truy cập thư viện số & quản lý mượn trả' : 'Trải nghiệm không gian tri thức không giới hạn' }}
          </p>
        </div>

        <div class="flex p-1.5 mx-8 mt-6 bg-gray-100/80 rounded-xl">
          <button
            @click="activeTab = 'login'"
            :class="[
              'flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300',
              activeTab === 'login' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            ]"
          >
            Đăng nhập
          </button>
          <button
            @click="activeTab = 'register'"
            :class="[
              'flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300',
              activeTab === 'register' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            ]"
          >
            Đăng ký
          </button>
        </div>

        <div class="p-8">
          <!-- 1. FORM ĐĂNG NHẬP -->
          <form v-if="activeTab === 'login'" @submit.prevent="handleLogin" class="space-y-5">
            <div class="space-y-1">
              <label class="text-sm font-semibold text-gray-700 ml-1">Tài khoản</label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <User :size="20" />
                </div>
                <input
                  v-model="loginUsername"
                  type="text"
                  placeholder="Tên đăng nhập / Email"
                  class="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div class="space-y-1">
              <div class="flex justify-between ml-1">
                <label class="text-sm font-semibold text-gray-700">Mật khẩu</label>
                <a href="#" class="text-xs font-medium text-blue-600 hover:underline">Quên mật khẩu?</a>
              </div>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <Lock :size="20" />
                </div>
                <input
                  v-model="loginPassword"
                  type="password"
                  placeholder="••••••••"
                  class="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div v-if="loginError" class="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-2 animate-pulse">
              ⚠️ {{ loginError }}
            </div>

            <div class="pt-2">
              <button
                type="submit"
                :disabled="loginLoading"
                class="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Loader2 v-if="loginLoading" class="animate-spin" />
                <LogIn v-else :size="20" />
                <span>{{ loginLoading ? 'Đang xử lý...' : 'Đăng nhập' }}</span>
              </button>
            </div>

            <div class="relative py-2">
              <div class="absolute inset-0 flex items-center"><span class="w-full border-t border-gray-200"></span></div>
              <div class="relative flex justify-center text-xs uppercase"><span class="bg-white px-2 text-gray-500">Hoặc tiếp tục với</span></div>
            </div>

            <div class="pt-2">
              <button
                type="button"
                @click="handleGoogleLogin"
                :disabled="googleLoading"
                class="w-full py-3 px-4 border border-gray-200 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <Loader2 v-if="googleLoading" class="animate-spin" :size="20"/>
                <svg v-else class="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                <span>{{ googleLoading ? 'Đang chuyển hướng...' : 'Tiếp tục với Google' }}</span>
              </button>
            </div>
          </form>

          <!-- 2. FORM ĐĂNG KÝ -->
          <form v-else @submit.prevent="handleRegister" class="space-y-5">
            <div class="space-y-1">
              <label class="text-sm font-semibold text-gray-700 ml-1">Họ tên</label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <User :size="18" />
                </div>
                <input v-model="regFullname" type="text" required class="block w-full pl-10 pr-3 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm" placeholder="Nguyễn Văn A" />
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-sm font-semibold text-gray-700 ml-1">Email</label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Mail :size="20" />
                </div>
                <input v-model="regEmail" type="email" required class="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all" placeholder="email@example.com" />
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-sm font-semibold text-gray-700 ml-1">Mật khẩu</label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Lock :size="20" />
                </div>
                <input v-model="regPassword" type="password" required minlength="6" class="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all" placeholder="••••••••" />
              </div>
            </div>

            <div v-if="regMessage" :class="[
              'p-3 rounded-lg text-sm font-medium border flex items-center gap-2',
              regMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'
            ]">
              <span>{{ regMessage.type === 'success' ? '✅' : '⚠️' }}</span>
              <span>{{ regMessage.text }}</span>
            </div>

            <button :disabled="regLoading" class="w-full py-3.5 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
              <Loader2 v-if="regLoading" class="animate-spin" />
              <UserPlus v-else :size="20" />
              <span>{{ regLoading ? 'Đang gửi...' : 'Đăng ký tài khoản' }}</span>
            </button>
          </form>
        </div>
      </div>

      <p class="text-center text-blue-200/60 text-xs mt-8">
        © 2024 Smart Lib DN. Hệ thống được bảo mật tuyệt đối.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { supabase } from '../lib/supabase'
import { ArrowLeft, BookOpen, User, Lock, Mail, UserPlus, LogIn, Loader2 } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('login')

// Login form states
const loginUsername = ref('')
const loginPassword = ref('')
const loginLoading = ref(false)
const loginError = ref('')
const googleLoading = ref(false)

// Register form states
const regFullname = ref('')
const regEmail = ref('')
const regPassword = ref('')
const regLoading = ref(false)
const regMessage = ref(null)

const handleLogin = async () => {
  loginLoading.value = true
  loginError.value = ''
  
  try {
    const success = await authStore.login(loginUsername.value, loginPassword.value)
    if (success) {
      // Check role and redirect
      if (authStore.role === 'nhanVien' || authStore.role === 'nhan_vien' || authStore.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/tai_khoan')
      }
    } else {
      loginError.value = authStore.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản.'
    }
  } catch (err) {
    loginError.value = 'Lỗi kết nối đến server.'
  } finally {
    loginLoading.value = false
  }
}

const handleGoogleLogin = async () => {
  googleLoading.value = true
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      }
    })
    if (error) {
      alert("Lỗi Supabase OAuth: " + error.message)
      googleLoading.value = false
    }
  } catch (err) {
    alert("Đã xảy ra lỗi hệ thống. Vui lòng thử lại.")
    googleLoading.value = false
  }
}

const handleRegister = async () => {
  regLoading.value = true
  regMessage.value = null

  try {
    const { data, error } = await supabase.auth.signUp({
      email: regEmail.value,
      password: regPassword.value,
      options: {
        data: { full_name: regFullname.value },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      }
    })

    if (error) {
      regMessage.value = { type: 'error', text: error.message }
    } else if (data?.user?.identities?.length === 0) {
      regMessage.value = { type: 'error', text: 'Email này đã tồn tại.' }
    } else {
      regMessage.value = { type: 'success', text: 'Đăng ký thành công! Hãy kiểm tra Email để xác nhận.' }
      regFullname.value = ''
      regEmail.value = ''
      regPassword.value = ''
    }
  } catch (err) {
    regMessage.value = { type: 'error', text: "Lỗi kết nối đến máy chủ." }
  } finally {
    regLoading.value = false
  }
}
</script>
