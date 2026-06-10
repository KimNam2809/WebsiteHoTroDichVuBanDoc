<template>
  <div class="min-h-screen bg-gray-50 font-sans relative">
    
    <!-- === 1. NỀN HERO CHUNG (Background Layer) === -->
    <div class="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-r from-blue-900 to-indigo-900 z-0 overflow-hidden">
      <div class="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      <!-- Hiệu ứng đốm sáng trang trí -->
      <div class="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-gray-50/10"></div>
      <div class="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/30 rounded-full blur-[100px]"></div>
      <div class="absolute top-1/2 left-10 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]"></div>
    </div>

    <!-- Mobile Header/Trigger -->
    <div class="relative z-20 md:hidden bg-blue-950/80 backdrop-blur-md px-4 py-4 flex justify-between items-center text-white border-b border-white/10">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
          <Library :size="16" />
        </div>
        <span class="font-bold">Quản Trị Viên</span>
      </div>
      <button @click="isMobileMenuOpen = !isMobileMenuOpen" class="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
        <Menu v-if="!isMobileMenuOpen" :size="24" />
        <X v-else :size="24" />
      </button>
    </div>

    <!-- === 2. CONTAINER CHÍNH (Content Layer) === -->
    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-6 pt-10 md:pt-28 pb-10">
      
      <!-- === SIDEBAR === -->
      <aside :class="[
        'w-full md:w-72 shrink-0 md:block z-20 transition-all duration-300',
        isMobileMenuOpen ? 'block' : 'hidden'
      ]">
        <div class="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 sticky top-28 overflow-hidden">
          
          <!-- Logo Area -->
          <div class="p-6 border-b border-gray-100 flex items-center gap-3 bg-gradient-to-r from-blue-50/50 to-transparent">
            <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <Library :size="20" />
            </div>
            <div>
              <h2 class="font-bold text-gray-800 text-lg">Quản Trị Viên</h2>
              <p class="text-xs text-gray-500 font-medium">System Admin</p>
            </div>
          </div>

          <!-- Navigation -->
          <nav class="p-4 space-y-1 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar">
            <template v-for="item in adminNav" :key="item.name">
              <h3 v-if="item.type === 'divider'" class="px-4 pt-4 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                {{ item.name }}
              </h3>
              <router-link
                v-else
                :to="item.href"
                @click="isMobileMenuOpen = false"
                :class="[
                  'flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group font-medium',
                  route.path === item.href
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                ]"
              >
                <div class="flex items-center gap-3">
                  <component 
                    :is="item.icon" 
                    :size="20" 
                    :class="['transition-colors', route.path === item.href ? 'text-white' : 'text-gray-400 group-hover:text-blue-600']" 
                  />
                  <span class="text-sm">{{ item.name }}</span>
                </div>
                <ChevronRight v-if="route.path === item.href" :size="16" class="text-blue-200" />
              </router-link>
            </template>
          </nav>

          <!-- Footer Sidebar -->
          <div class="p-4 border-t border-gray-100 bg-gray-50/50">
            <button @click="handleLogout" class="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left text-red-600 hover:bg-red-50 hover:text-red-700 font-medium transition-colors">
              <LogOut :size="20" />
              <span>Đăng xuất</span>
            </button>
          </div>

        </div>
      </aside>

      <!-- === MAIN CONTENT === -->
      <main class="flex-1 min-w-0">
        <router-view />
      </main>

    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import {
  LayoutDashboard, Users, BookMarked, CalendarCheck, FileText, 
  ShieldAlert, BellPlus, Settings, Activity, LogOut, ChevronRight, Library, Menu, X
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isMobileMenuOpen = ref(false)

const adminNav = [
  { name: 'Tổng quan', href: '/admin', icon: LayoutDashboard },
  { name: 'Phê duyệt thẻ', href: '/admin/phe_duyet_the', icon: Users },
  { name: 'Quản lý mượn/trả', href: '/admin/quan_ly_muon_tra', icon: BookMarked },
  { name: 'Quản lý đặt chỗ', href: '/admin/quan_ly_dat_cho', icon: CalendarCheck },
  { name: 'Quản lý bài viết', href: '/admin/quan_ly_bai_viet', icon: FileText },
  { name: 'Quản lý vi phạm', href: '/admin/vi_pham', icon: ShieldAlert },
  { name: 'Gửi thông báo', href: '/admin/gui_thong_bao', icon: BellPlus },
  
  { type: 'divider', name: 'Quản trị viên' },
  { name: 'Quản lý tài khoản', href: '/admin/quan_ly_tai_khoan', icon: Settings },
  { name: 'Giám sát hệ thống', href: '/admin/giam_sat', icon: Activity },
  { name: 'Cấu hình', href: '/admin/cau_hinh', icon: Settings }
]

const handleLogout = () => {
  authStore.logout()
  router.push('/dang_nhap')
}
</script>
