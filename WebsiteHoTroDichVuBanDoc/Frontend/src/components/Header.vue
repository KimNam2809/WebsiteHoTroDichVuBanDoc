<template>
  <nav :class="[
    'fixed w-full z-50 transition-all duration-300',
    scrolled ? 'bg-white/90 backdrop-blur-md shadow-lg py-2' : 'bg-transparent py-4'
  ]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">

        <!-- --- LOGO --- -->
        <router-link to="/" class="flex items-center gap-3 group">
          <div :class="[
            'p-2.5 rounded-xl transition-all duration-300 shadow-sm',
            scrolled ? 'bg-gradient-to-br from-blue-600 to-cyan-500 text-white' : 'bg-white text-blue-600'
          ]">
            <BookOpen :size="24" :stroke-width="2.5" />
          </div>
          <div class="flex flex-col">
            <span :class="[
              'text-xl font-extrabold tracking-tight transition-colors',
              scrolled ? 'text-gray-900' : 'text-white'
            ]">
              SMART LIB <span class="text-cyan-400">DN</span>
            </span>
            <span :class="[
              'text-[10px] font-bold tracking-widest uppercase',
              scrolled ? 'text-gray-500' : 'text-blue-200'
            ]">
              Thư viện Số Đà Nẵng
            </span>
          </div>
        </router-link>

        <!-- --- DESKTOP MENU --- -->
        <div class="hidden md:flex items-center space-x-1">
          <router-link
            v-for="item in navItems"
            :key="item.name"
            :to="item.href"
            :class="[
              'px-4 py-2 rounded-full text-sm font-medium transition-all duration-300',
              getNavLinkClass(item.href)
            ]"
          >
            {{ item.name }}
          </router-link>

          <!-- Nút Thành Viên / Admin Dashboard tùy theo role -->
          <router-link
            :to="memberDashboardRoute"
            :class="[
              'px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2',
              isDashboardActive
                ? (scrolled ? 'bg-blue-50 text-blue-600 font-bold' : 'bg-white/20 text-white font-bold backdrop-blur-sm')
                : (scrolled ? 'text-gray-600 hover:bg-gray-100' : 'text-blue-100 hover:bg-white/10 hover:text-white')
            ]"
          >
            <User :size="16" /> {{ dashboardLabel }}
          </router-link>

          <!-- Nút Hành động (Đăng nhập / Đăng xuất) -->
          <div class="ml-4 pl-4 border-l border-gray-200/20 flex items-center gap-3">
            <div v-if="authStore.loading" class="px-6 py-2.5">
              <Loader2 :class="['animate-spin', scrolled ? 'text-blue-600' : 'text-white']" :size="20" />
            </div>
            
            <template v-else-if="authStore.isAuthenticated">
              <!-- Bell Icon for Users (Not Staff/Admin) -->
              <router-link
                v-if="!isStaff"
                to="/thong_bao"
                :class="[
                  'p-2.5 rounded-full transition-all relative group/bell',
                  scrolled
                    ? 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                ]"
              >
                <Bell :size="20" />

                <!-- Badge thông báo -->
                <span v-if="unreadCount > 0" class="absolute top-2 right-2 flex h-2.5 w-2.5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
                </span>

                <span class="absolute inset-0 rounded-full bg-current opacity-0 group-hover/bell:opacity-10 transition-opacity"></span>
              </router-link>

              <button
                @click="handleLogout"
                :class="[
                  'px-5 py-2.5 rounded-full text-sm font-bold shadow-lg transition-all hover:-translate-y-0.5 flex items-center gap-2',
                  scrolled
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                    : 'bg-white/10 text-white hover:bg-red-500/80 border border-white/20 backdrop-blur-md'
                ]"
              >
                <LogOut :size="16" /> Đăng xuất
              </button>
            </template>

            <router-link
              v-else
              to="/dang_nhap"
              :class="[
                'px-6 py-2.5 rounded-full text-sm font-bold shadow-lg transition-all hover:-translate-y-0.5 flex items-center gap-2',
                scrolled
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-blue-500/30'
                  : 'bg-white text-blue-900 hover:bg-blue-50'
              ]"
            >
              <LogIn :size="16" /> Đăng nhập
            </router-link>
          </div>
        </div>

        <!-- --- MOBILE TOGGLE --- -->
        <div class="md:hidden">
          <button
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            :class="[
              'p-2 rounded-lg transition-colors',
              scrolled ? 'text-gray-900 hover:bg-gray-100' : 'text-white hover:bg-white/10'
            ]"
          >
            <X v-if="isMobileMenuOpen" :size="28" />
            <Menu v-else :size="28" />
          </button>
        </div>
      </div>
    </div>

    <!-- --- MOBILE MENU (Slide Down) --- -->
    <div :class="[
      'md:hidden absolute w-full bg-white shadow-xl border-t transition-all duration-300 overflow-hidden',
      isMobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
    ]">
      <div class="px-4 pt-4 pb-6 space-y-2">
        <router-link
          v-for="item in navItems"
          :key="item.name"
          :to="item.href"
          @click="isMobileMenuOpen = false"
          :class="[
            'block px-4 py-3 rounded-xl text-base font-medium transition-colors',
            route.path === item.href ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50'
          ]"
        >
          {{ item.name }}
        </router-link>

        <router-link
          :to="memberDashboardRoute"
          @click="isMobileMenuOpen = false"
          class="block px-4 py-3 rounded-xl text-base font-medium text-gray-600 hover:bg-gray-50 border-t border-gray-100 mt-2"
        >
          <div class="flex items-center gap-3">
            <User :size="18" /> {{ dashboardLabel }}
          </div>
        </router-link>

        <div class="pt-2">
          <button
            v-if="authStore.isAuthenticated"
            @click="handleLogout(); isMobileMenuOpen = false;"
            class="w-full text-left px-4 py-3 rounded-xl text-base font-bold text-red-600 bg-red-50 hover:bg-red-100 flex items-center gap-3"
          >
            <LogOut :size="18" /> Đăng xuất
          </button>
          <router-link
            v-else
            to="/dang_nhap"
            @click="isMobileMenuOpen = false"
            class="px-4 py-3 rounded-xl text-base font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center gap-3 justify-center shadow-md hover:opacity-90 transition-opacity"
          >
            <LogIn :size="18" /> Đăng nhập / Đăng ký
          </router-link>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'
import { Menu, X, BookOpen, LogIn, LogOut, User, Loader2, Bell } from 'lucide-vue-next'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const navItems = [
  { name: 'Trang chủ', href: '/' },
  { name: 'Danh mục sách', href: '/tim_kiem' },
  { name: 'Bài Viết', href: '/bai_viet' },
  { name: 'Dịch vụ', href: '/dich_vu' },
  { name: 'Đăng ký thẻ', href: '/dang_ky_the' }
]

const isMobileMenuOpen = ref(false)
const scrolled = ref(false)
const unreadCount = ref(0)

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Computed properties for Dashboard dynamic routes & labels
const isStaff = computed(() => {
  const role = authStore.role
  return role === 'nhanVien' || role === 'nhan_vien' || role === 'admin'
})

const memberDashboardRoute = computed(() => {
  return isStaff.value ? '/admin' : '/tai_khoan'
})

const dashboardLabel = computed(() => {
  return isStaff.value ? 'Khu vực quản trị' : 'Thành viên'
})

const isDashboardActive = computed(() => {
  return route.path.startsWith('/admin') || route.path.startsWith('/tai_khoan')
})

// Scroll listener
const handleScroll = () => {
  scrolled.value = window.scrollY > 20
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  // Fetch initial profile if we have a token but no user state
  if (authStore.token && !authStore.user) {
    authStore.fetchProfile()
  }
  startPolling()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  stopPolling()
})

// Polling for Notifications
let pollingInterval = null
const fetchUnreadNotifications = async () => {
  if (!authStore.isAuthenticated || isStaff.value) {
    unreadCount.value = 0
    return
  }

  const maBanDoc = authStore.user?.maBanDoc || authStore.user?.ma_ban_doc || authStore.user?.mabandoc
  if (!maBanDoc) return

  try {
    const response = await axios.get(`${API_BASE_URL}/thong-bao/unread-count?maBanDoc=${maBanDoc}`)
    if (response.data && typeof response.data.count === 'number') {
      unreadCount.value = response.data.count
    }
  } catch (error) {
    console.error("Lỗi lấy số lượng thông báo:", error)
  }
}

const startPolling = () => {
  fetchUnreadNotifications()
  pollingInterval = setInterval(fetchUnreadNotifications, 30000)
}

const stopPolling = () => {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
}

// Watchers
watch(() => authStore.user, () => {
  fetchUnreadNotifications()
})

watch(() => route.path, () => {
  isMobileMenuOpen.value = false
  fetchUnreadNotifications()
})

// Logout handling
const handleLogout = () => {
  authStore.logout()
  unreadCount.value = 0
  router.push('/dang_nhap')
}

// Styling helper
const getNavLinkClass = (href) => {
  const isActive = route.path === href
  if (scrolled.value) {
    return isActive
      ? 'bg-blue-50 text-blue-600 font-bold'
      : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
  } else {
    return isActive
      ? 'bg-white/20 text-white font-bold backdrop-blur-sm'
      : 'text-blue-100 hover:bg-white/10 hover:text-white'
  }
}
</script>
