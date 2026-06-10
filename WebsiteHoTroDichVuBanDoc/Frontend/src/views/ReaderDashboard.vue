<template>
  <div class="min-h-screen bg-gray-50 relative pb-20">
    <!-- 1. HERO GRADIENT BACKGROUND -->
    <div class="absolute top-0 left-0 w-full h-[350px] bg-gradient-to-r from-blue-900 to-indigo-900 z-0 overflow-hidden">
      <div class="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      <div class="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/30 rounded-full blur-[100px]"></div>
      <div class="absolute top-1/2 left-10 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]"></div>
    </div>

    <!-- 2. MAIN CONTAINER -->
    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">
      
      <!-- Loading state -->
      <div v-if="isLoading" class="min-h-[50vh] flex items-center justify-center">
        <Loader2 class="animate-spin text-white w-12 h-12" />
      </div>

      <!-- Loaded state -->
      <div v-else-if="profile" class="space-y-8 animate-fade-in">
        
        <!-- Header Dashboard Info -->
        <div class="text-white flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-2">
          <div>
            <div class="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-blue-50 mb-3 border border-white/20 shadow-sm">
              <Calendar :size="12" />
              {{ todayStr }}
            </div>
            <h1 class="text-3xl md:text-5xl font-extrabold mb-3 leading-tight drop-shadow-md">
              Xin chào, {{ profile.hoten || 'Bạn đọc' }}! 👋
            </h1>
            <p class="text-blue-100 text-lg font-light max-w-xl leading-relaxed">
              Hôm nay là một ngày tuyệt vời để khám phá những cuốn sách mới.
            </p>
          </div>

          <!-- Avatar & Notifications Info -->
          <div class="flex items-center gap-4">
            <router-link to="/thong_bao" class="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 flex items-center justify-center text-white border border-white/20 cursor-pointer transition-colors relative shadow-lg">
              <Bell :size="20" />
              <span v-if="overdueCount > 0" class="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-indigo-900 animate-pulse"></span>
            </router-link>
            <div class="w-20 h-20 rounded-full bg-gradient-to-br from-white to-blue-50 p-1 shadow-2xl">
              <div class="w-full h-full rounded-full bg-white flex items-center justify-center text-3xl font-extrabold text-blue-700 select-none">
                {{ (profile.hoten || 'U').charAt(0).toUpperCase() }}
              </div>
            </div>
          </div>
        </div>

        <!-- 3. STATS GRID -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Card Status Section Component -->
          <CardStatusSection :profile="profile" :is-staff="false" />

          <!-- Active Borrowing Count -->
          <div class="bg-white p-6 rounded-3xl shadow-lg shadow-blue-900/5 border border-white/50 hover:shadow-xl transition-all duration-300 group relative overflow-hidden flex flex-col justify-between min-h-[160px]">
            <div class="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div>
              <div class="flex items-center gap-3 mb-4 relative z-10">
                <div class="p-3 bg-purple-100 text-purple-600 rounded-2xl"><BookOpen :size="24"/></div>
                <h3 class="font-bold text-gray-700 text-lg">Đang mượn</h3>
              </div>
              <div class="relative z-10">
                <div class="flex items-baseline gap-1">
                  <span class="text-4xl font-extrabold text-gray-900">{{ activeLoans.length }}</span>
                  <span class="text-gray-400 font-medium text-lg">/ {{ profile.tailieumuontoida || 5 }}</span>
                </div>
                <p class="text-sm text-gray-500 mt-1 font-medium">cuốn sách</p>
              </div>
            </div>
            <button @click="activeTab = 'active'" class="mt-6 inline-flex items-center gap-2 text-sm font-bold text-purple-600 hover:text-purple-800 transition-colors relative z-10 w-fit">
              Xem chi tiết <ChevronRight :size="16"/>
            </button>
          </div>

          <!-- Overdue Stats -->
          <div :class="[
            'p-6 rounded-3xl shadow-lg shadow-blue-900/5 border flex flex-col justify-between min-h-[160px] relative overflow-hidden transition-all duration-300',
            overdueCount > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-white/50'
          ]">
            <div>
              <div class="flex items-center gap-3 mb-4">
                <div :class="['p-3 rounded-2xl', overdueCount > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600']">
                  <AlertTriangle v-if="overdueCount > 0" :size="24"/>
                  <Clock v-else :size="24"/>
                </div>
                <h3 :class="['font-bold text-lg', overdueCount > 0 ? 'text-red-800' : 'text-gray-700']">
                  {{ overdueCount > 0 ? 'Cần chú ý!' : 'Trạng thái' }}
                </h3>
              </div>
              <div v-if="overdueCount > 0">
                <p class="text-3xl font-extrabold text-red-600">{{ overdueCount }}</p>
                <p class="text-sm text-red-700 font-bold mt-1">Sách quá hạn trả</p>
                <p class="text-xs text-red-500 mt-2 leading-relaxed">Vui lòng trả sách sớm để tránh phí phạt.</p>
              </div>
              <div v-else>
                <p class="text-xl font-bold text-green-700">Rất tốt!</p>
                <p class="text-sm text-gray-500 mt-1">Tài khoản hoạt động bình thường.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. DETAILED LOANS VIEW TABS -->
        <div class="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-white/50 overflow-hidden">
          <div class="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-wrap gap-4 items-center justify-between">
            <div>
              <h2 class="text-xl font-extrabold text-gray-800">Lịch sử hoạt động của bạn</h2>
              <p class="text-gray-500 text-sm mt-1">Tra cứu chi tiết các tài liệu mượn trả và gia hạn trực tuyến.</p>
            </div>
            
            <div class="flex flex-wrap bg-gray-100 p-1.5 rounded-xl border border-gray-200">
              <button 
                @click="activeTab = 'overview'" 
                :class="['px-4 py-2 text-xs font-bold rounded-lg transition-all', activeTab === 'overview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700']"
              >
                Tổng quan
              </button>
              <button 
                @click="activeTab = 'active'" 
                :class="['px-4 py-2 text-xs font-bold rounded-lg transition-all', activeTab === 'active' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700']"
              >
                Đang mượn ({{ activeLoans.length }})
              </button>
              <button 
                @click="activeTab = 'completed'" 
                :class="['px-4 py-2 text-xs font-bold rounded-lg transition-all', activeTab === 'completed' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700']"
              >
                Đã trả ({{ completedLoans.length }})
              </button>
              <button 
                @click="activeTab = 'overdue'" 
                :class="['px-4 py-2 text-xs font-bold rounded-lg transition-all', activeTab === 'overdue' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500 hover:text-gray-700']"
              >
                Quá hạn ({{ overdueCount }})
              </button>
            </div>
          </div>

          <div class="p-6">
            <!-- TAB 1: OVERVIEW -->
            <div v-if="activeTab === 'overview'" class="space-y-6">
              <div v-if="allLoans.length > 0">
                <h3 class="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Tài liệu mượn mới nhất</h3>
                <div class="overflow-x-auto">
                  <table class="w-full text-left">
                    <thead class="bg-gray-50/50 text-gray-500 text-xs uppercase font-bold border-b border-gray-100">
                      <tr>
                        <th class="px-6 py-4 md:pl-8">Tên tác phẩm</th>
                        <th class="px-6 py-4">Ngày mượn</th>
                        <th class="px-6 py-4">Hạn trả</th>
                        <th class="px-6 py-4 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50 text-sm text-gray-700">
                      <tr v-for="loan in allLoans.slice(0, 5)" :key="loan.mamuontra" class="hover:bg-blue-50/30 transition-colors">
                        <td class="px-6 py-4 md:pl-8 font-medium text-gray-900">{{ loan.tentacpham }}</td>
                        <td class="px-6 py-4 text-gray-500">{{ formatDate(loan.ngaymuon) }}</td>
                        <td class="px-6 py-4">{{ formatDate(loan.ngaytradukien) }}</td>
                        <td class="px-6 py-4 text-center">
                          <span :class="[
                            'px-3 py-1 rounded-full text-xs font-bold border',
                            loan.trangthai === 'quaHan'
                              ? 'bg-red-50 text-red-600 border-red-100'
                              : loan.trangthai === 'daTra'
                                ? 'bg-green-50 text-green-600 border-green-100'
                                : 'bg-blue-50 text-blue-600 border-blue-100'
                          ]">
                            {{ loan.trangthai === 'quaHan' ? 'Quá hạn' : (loan.trangthai === 'daTra' ? 'Đã trả' : 'Đang đọc') }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div v-else class="text-center py-10">
                <p class="text-gray-500 mb-4">Bạn chưa mượn cuốn sách nào.</p>
                <router-link to="/tim_kiem" class="text-blue-600 font-bold hover:underline">Tìm sách ngay &rarr;</router-link>
              </div>
            </div>

            <!-- TAB 2: ACTIVE LOANS TABLE -->
            <div v-if="activeTab === 'active'">
              <LoanListTable 
                :loans="activeLoans" 
                title="Sách đang mượn" 
                empty-message="Bạn không có tài liệu nào đang mượn." 
                @renew-success="loadData"
              />
            </div>

            <!-- TAB 3: COMPLETED LOANS TABLE -->
            <div v-if="activeTab === 'completed'">
              <LoanListTable 
                :loans="completedLoans" 
                title="Lịch sử đã trả" 
                empty-message="Bạn chưa có lịch sử trả sách nào." 
              />
            </div>

            <!-- TAB 4: OVERDUE LOANS TABLE -->
            <div v-if="activeTab === 'overdue'">
              <LoanListTable 
                :loans="overdueList" 
                title="Sách quá hạn trả" 
                empty-message="Tuyệt vời! Bạn không có sách nào quá hạn." 
                @renew-success="loadData"
              />
            </div>
          </div>
        </div>

      </div>

      <!-- Unauthorized / Session Expired fallback -->
      <div v-else class="min-h-[50vh] flex flex-col items-center justify-center text-center p-4">
        <div class="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle :size="32" />
        </div>
        <h2 class="text-xl font-bold text-gray-800 mb-2">Phiên đăng nhập đã hết hạn</h2>
        <router-link to="/dang_nhap" class="px-6 py-2 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-colors">
          Đăng nhập lại ngay
        </router-link>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import CardStatusSection from '../components/CardStatusSection.vue'
import LoanListTable from '../components/LoanListTable.vue'
import { BookOpen, Clock, AlertTriangle, ChevronRight, Calendar, Bell, Loader2 } from 'lucide-vue-next'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
const authStore = useAuthStore()

const profile = ref(null)
const allLoans = ref([])
const activeLoans = ref([])
const completedLoans = ref([])
const overdueList = ref([])

const isLoading = ref(true)
const activeTab = ref('overview')

const todayStr = computed(() => {
  return new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })
})

const overdueCount = computed(() => {
  return overdueList.value.length
})

const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('vi-VN')
}

const loadData = async () => {
  if (!authStore.isAuthenticated) {
    isLoading.value = false
    return
  }

  try {
    // 1. Fetch Profile info
    const profileRes = await axios.get(`${API_BASE_URL}/nguoi-dung/profile`)
    profile.value = profileRes.data

    // 2. Fetch Loans lists
    const [borrowingRes, completedRes, overdueRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/muon-tra/danh-sach-chi-tiet-muon-tra?trang_thai=daMuon`),
      axios.get(`${API_BASE_URL}/muon-tra/danh-sach-chi-tiet-muon-tra?trang_thai=daTra`),
      axios.get(`${API_BASE_URL}/muon-tra/danh-sach-chi-tiet-muon-tra?trang_thai=quaHan`)
    ])

    activeLoans.value = borrowingRes.data || []
    completedLoans.value = completedRes.data || []
    overdueList.value = overdueRes.data || []

    allLoans.value = [...activeLoans.value, ...overdueList.value, ...completedLoans.value]
  } catch (error) {
    console.error("Lỗi lấy dữ liệu tài khoản:", error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
