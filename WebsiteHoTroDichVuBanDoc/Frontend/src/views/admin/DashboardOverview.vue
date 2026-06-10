<template>
  <div class="space-y-8 animate-fade-in pb-20">

    <!-- 1. HERO CONTENT -->
    <div class="mb-10 text-white flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-4">
      <div>
        <div class="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-blue-50 mb-3 border border-white/20 shadow-sm">
          <Calendar :size="12" />
          {{ currentDateTime }}
        </div>
        <h1 class="text-3xl md:text-5xl font-extrabold mb-3 leading-tight drop-shadow-md">
          Tổng quan hệ thống
        </h1>
        <p class="text-blue-100 text-lg font-light max-w-xl leading-relaxed">
          Chào mừng quản trị viên. Dưới đây là báo cáo nhanh về tình hình hoạt động của thư viện hôm nay.
        </p>
      </div>

      <button
        @click="showReportModal = true"
        class="group flex items-center gap-2 px-6 py-3 bg-white text-blue-900 hover:bg-blue-50 rounded-full font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
      >
        <FileText :size="20" />
        Xem báo cáo
        <ArrowRight :size="18" class="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>

    <!-- 2. STATS GRID -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        v-for="(stat, index) in statsConfig"
        :key="index"
        class="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-blue-900/5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group"
      >
        <div class="flex justify-between items-start mb-4">
          <div :class="['p-3 rounded-2xl transition-transform group-hover:scale-110', stat.bg, stat.color]">
            <component :is="stat.icon" :size="24" />
          </div>
          <span class="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
            {{ stat.trend }}
          </span>
        </div>

        <div>
          <h3 class="text-4xl font-extrabold text-gray-900 mb-1 tracking-tight">
            {{ isLoading ? '-' : stat.value }}
          </h3>
          <p class="font-bold text-gray-700 text-sm">{{ stat.title }}</p>
          <p class="text-xs text-gray-400 mt-1">{{ stat.label }}</p>
        </div>
      </div>
    </div>

    <!-- 3. CHARTS & RECENT ACTIVITY -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- TRENDING BOOKS -->
      <div class="lg:col-span-2 bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden flex flex-col">
        <div class="p-6 border-b border-gray-50 flex justify-between items-center">
          <div>
            <h2 class="font-bold text-gray-800 text-lg flex items-center gap-2">
              <TrendingUp class="text-blue-600" /> Xu hướng đọc
            </h2>
            <p class="text-xs text-gray-400 mt-1">Top sách được mượn nhiều nhất 30 ngày qua</p>
          </div>
        </div>

        <div class="flex-1 p-6">
          <div v-if="topBooks.length > 0" class="space-y-4">
            <div v-for="(book, index) in topBooks" :key="book.id" class="flex items-center gap-4 group p-3 hover:bg-gray-50 rounded-2xl transition-all">
              
              <!-- Rank Badge -->
              <div :class="[
                'w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm shrink-0',
                index === 0 ? 'bg-yellow-100 text-yellow-700' :
                index === 1 ? 'bg-gray-100 text-gray-700' :
                index === 2 ? 'bg-orange-100 text-orange-700' :
                'bg-blue-50 text-blue-600'
              ]">
                #{{ index + 1 }}
              </div>

              <!-- Image -->
              <div class="w-12 h-16 shrink-0 rounded-lg overflow-hidden shadow-sm relative bg-gray-200">
                <img
                  v-if="book.image"
                  :src="book.image"
                  :alt="book.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                  <BookOpen :size="16" />
                </div>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {{ book.title }}
                </h3>
                <p class="text-xs text-gray-500 truncate">{{ book.author }}</p>
              </div>

              <!-- Count -->
              <div class="text-right">
                <span class="block text-lg font-extrabold text-gray-800">{{ book.count }}</span>
                <span class="text-[10px] uppercase font-bold text-gray-400">Lượt</span>
              </div>
            </div>
          </div>
          <div v-else class="h-full flex flex-col items-center justify-center text-center py-10">
            <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-gray-300">
              <BookOpen :size="24" />
            </div>
            <p class="text-gray-400 text-sm">Chưa có dữ liệu xu hướng.</p>
          </div>
        </div>
      </div>

      <!-- RECENT ACTIVITY -->
      <div class="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden flex flex-col">
        <div class="p-6 border-b border-gray-50">
          <h2 class="font-bold text-gray-800 text-lg">Hoạt động mới</h2>
        </div>
        <div class="flex-1 p-6 space-y-6 overflow-y-auto max-h-[400px]">
          <div v-if="activities.length > 0" class="space-y-6">
            <div 
              v-for="(act, i) in activities" 
              :key="i" 
              class="flex gap-4 items-start"
            >
              <div :class="['w-2 h-2 mt-2 rounded-full shrink-0', act.type === 'loan' ? 'bg-blue-500' : 'bg-green-500']"></div>
              <div>
                <p class="text-sm text-gray-800 font-medium leading-snug">
                  {{ act.content }}
                </p>
                <p class="text-xs text-gray-400 mt-1">
                  {{ formatTime(act.time) }}
                </p>
              </div>
            </div>
          </div>
          <div v-else class="text-center text-gray-400 text-sm italic py-10">Chưa có hoạt động nào.</div>

          <div v-if="activities.length > 0" class="pt-4 border-t border-gray-50">
            <router-link to="/admin/gui_thong_bao" class="block text-center py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
              Xem tất cả thông báo
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- === REPORT MODAL === -->
    <div v-if="showReportModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh] animate-fade-in">
        <div class="p-6 border-b flex justify-between items-center bg-gray-50">
          <h3 class="text-xl font-bold text-gray-800 flex items-center gap-2">
            <PieChart class="text-blue-600" /> Báo cáo chi tiết
          </h3>
          <button @click="showReportModal = false" class="text-gray-400 hover:text-gray-700">
            <X :size="24" />
          </button>
        </div>

        <div class="p-6 space-y-6 overflow-y-auto">
          <!-- Controls -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">Loại báo cáo</label>
              <select
                v-model="selectedReportType"
                class="w-full px-4 py-2 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="borrowing">Thống kê mượn trả theo ngày</option>
                <option value="readers">Tăng trưởng bạn đọc</option>
                <option value="overdue">Danh sách quá hạn</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 mb-2">Thời gian</label>
              <select class="w-full px-4 py-2 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none">
                <option>Tháng này</option>
                <option>Quý này</option>
                <option>Năm nay</option>
              </select>
            </div>
          </div>

          <!-- Preview Table -->
          <div class="border rounded-xl overflow-hidden">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-100">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Tiêu chí</th>
                  <th class="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Số liệu</th>
                  <th class="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Tỷ lệ</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-if="isReportLoading">
                  <td colSpan="3" class="px-6 py-10 text-center text-gray-500">
                    <div class="flex justify-center items-center gap-2">
                      <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
                <template v-else-if="reportData.length > 0">
                  <tr v-for="(item, idx) in reportData" :key="idx" class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 text-sm text-gray-800 font-medium">
                      {{ item.label }}
                    </td>
                    <td class="px-6 py-4 text-right font-mono font-bold text-gray-900">
                      {{ item.value }}
                    </td>
                    <td :class="[
                      'px-6 py-4 text-right font-bold',
                      typeof item.ratio === 'string' ? 'text-gray-600 text-xs' : 'text-blue-600'
                    ]">
                      {{ typeof item.ratio === 'number' ? `${item.ratio}%` : item.ratio }}
                    </td>
                  </tr>
                </template>
                <tr v-else>
                  <td colSpan="3" class="px-6 py-10 text-center text-gray-400 italic">
                    Không có dữ liệu cho báo cáo này.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button @click="showReportModal = false" class="px-5 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-100 font-bold text-gray-700">Đóng</button>
          <button @click="exportToExcel" class="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold text-white flex items-center gap-2 shadow-lg hover:shadow-blue-500/40">
            <Download :size="18" /> Xuất Excel
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import {
  Activity, Users, BookOpen, AlertTriangle,
  TrendingUp, Calendar, ArrowRight, FileText, Download, X, PieChart
} from 'lucide-vue-next'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const statsData = ref(null)
const topBooks = ref([])
const activities = ref([])
const reportData = ref([])
const isLoading = ref(true)
const isReportLoading = ref(false)

const showReportModal = ref(false)
const selectedReportType = ref('borrowing')

const currentDateTime = computed(() => {
  return new Date().toLocaleDateString('vi-VN', { 
    weekday: 'long', 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  })
})

const statsConfig = computed(() => [
  {
    title: 'Hồ sơ chờ duyệt',
    value: statsData.value?.hoSoCho || 0,
    label: 'Cần xử lý ngay',
    icon: Users,
    color: 'text-yellow-600',
    bg: 'bg-yellow-100',
    trend: 'Thời gian thực'
  },
  {
    title: 'Sách đang mượn',
    value: statsData.value?.sachDangMuon || 0,
    label: 'Tài liệu lưu thông',
    icon: BookOpen,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    trend: 'Cập nhật liên tục'
  },
  {
    title: 'Sách quá hạn',
    value: statsData.value?.sachQuaHan || 0,
    label: 'Cần thu hồi',
    icon: AlertTriangle,
    color: 'text-red-600',
    bg: 'bg-red-100',
    trend: 'Cảnh báo'
  },
  {
    title: 'Tổng bạn đọc',
    value: statsData.value?.tongBanDoc || 0,
    label: 'Thành viên hệ thống',
    icon: Activity,
    color: 'text-green-600',
    bg: 'bg-green-100',
    trend: 'Tích lũy'
  }
])

const loadDashboardData = async () => {
  isLoading.value = true
  try {
    const [statsRes, booksRes, activitiesRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/thong-ke/tong-quan`),
      axios.get(`${API_BASE_URL}/thong-ke/bao-cao?type=top_books`),
      axios.get(`${API_BASE_URL}/thong-ke/hoat-dong-moi?limit=5`)
    ])
    statsData.value = statsRes.data
    topBooks.value = booksRes.data || []
    activities.value = activitiesRes.data || []
  } catch (error) {
    console.error('Lỗi tải dữ liệu Dashboard:', error)
  } finally {
    isLoading.value = false
  }
}

const loadReportData = async () => {
  if (!showReportModal.value) return
  isReportLoading.value = true
  try {
    const res = await axios.get(`${API_BASE_URL}/thong-ke/bao-cao?type=${selectedReportType.value}`)
    reportData.value = res.data || []
  } catch (error) {
    console.error('Lỗi tải báo cáo:', error)
    reportData.value = []
  } finally {
    isReportLoading.value = false
  }
}

watch(showReportModal, (newVal) => {
  if (newVal) {
    loadReportData()
  } else {
    reportData.value = []
  }
})

watch(selectedReportType, loadReportData)

onMounted(() => {
  loadDashboardData()
})

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const d = new Date(timeStr)
  return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${d.toLocaleDateString('vi-VN')}`
}

const exportToExcel = () => {
  alert('Đang chuẩn bị xuất dữ liệu ra Excel...')
}
</script>
