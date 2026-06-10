<template>
  <div class="min-h-screen bg-gray-50 pb-20 font-sans">
    
    <!-- 1. HERO HEADER -->
    <div class="relative bg-gradient-to-r from-blue-900 to-indigo-900 h-[300px] flex items-center justify-center overflow-hidden pb-10">
      <div class="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      <div class="relative z-10 text-center px-4 max-w-4xl mx-auto pt-8">
        <h1 class="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight drop-shadow-lg">
          Tra Cứu Hồ Sơ
        </h1>
        <p class="text-blue-100 text-lg font-light max-w-2xl mx-auto">
          Kiểm tra trạng thái thẻ và tiến độ xử lý hồ sơ của bạn.
        </p>
      </div>
    </div>

    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
      
      <!-- Nút Quay lại -->
      <div class="mb-4">
        <router-link to="/dang_ky_the" class="inline-flex items-center gap-2 text-white/80 hover:text-white font-medium transition-colors">
          <ArrowLeft :size="18"/> Quay lại đăng ký
        </router-link>
      </div>

      <!-- 2. CARD TRA CỨU -->
      <div class="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-8">
        <form @submit.prevent="handleSearch" class="relative space-y-6">
          <div class="text-center">
            <p class="text-gray-600">Nhập số <strong>CCCD</strong> hoặc <strong>Số điện thoại</strong> đã đăng ký.</p>
          </div>

          <div class="relative flex items-center">
            <Search class="absolute left-4 text-gray-400 pointer-events-none" :size="22" />
            <input
              type="text"
              v-model="keyword"
              class="w-full pl-12 pr-36 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg font-medium text-gray-800 placeholder-gray-400"
              placeholder="Ví dụ: 0905123..."
              required
              minlength="6"
            />
            <div class="absolute right-2 top-2 bottom-2">
              <button
                type="submit"
                :disabled="isLoading"
                class="h-full px-6 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-70 transition-all shadow-md flex items-center gap-2"
              >
                <Loader2 v-if="isLoading" class="animate-spin w-5 h-5"/>
                <span v-else>Tìm kiếm</span>
              </button>
            </div>
          </div>
        </form>

        <!-- 3. KẾT QUẢ -->
        <div class="mt-8 space-y-4">
          <div v-if="errorMessage" class="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center gap-3 animate-fade-in">
            <AlertCircle :size="20" class="shrink-0"/> {{ errorMessage }}
          </div>

          <div v-if="results !== null && results.length === 0" class="text-center text-gray-500 py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            Không tìm thấy dữ liệu nào phù hợp.
          </div>

          <div v-if="results && results.length > 0" class="space-y-4 animate-fade-in">
            <h2 class="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2">Kết quả tìm thấy ({{ results.length }})</h2>

            <div 
              v-for="(item, index) in results" 
              :key="index" 
              :class="[
                'relative bg-white border rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all flex flex-col sm:flex-row gap-6 overflow-hidden',
                item.trang_thai === 'THE_DANG_HOAT_DONG' ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-200'
              ]"
            >
              <!-- Dải màu trạng thái -->
              <div :class="[
                'absolute top-0 left-0 w-1.5 h-full',
                item.trang_thai === 'THE_DANG_HOAT_DONG' ? 'bg-blue-500' : (item.trang_thai === 'tuChoi' ? 'bg-red-500' : 'bg-yellow-400')
              ]"></div>

              <!-- Ảnh thẻ -->
              <div class="w-24 h-32 bg-gray-100 rounded-xl overflow-hidden shrink-0 relative border border-gray-200 mx-auto sm:mx-0 shadow-inner">
                <img v-if="item.anh_the_url" :src="item.anh_the_url" alt="Ảnh thẻ" class="w-full h-full object-cover" />
                <div v-else class="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <User :size="32"/>
                  <span class="text-[10px] mt-1">No Img</span>
                </div>
              </div>

              <!-- Thông tin chi tiết -->
              <div class="flex-1 space-y-3 text-center sm:text-left">
                <div class="flex flex-col sm:flex-row justify-between items-start gap-2">
                  <div>
                    <h3 class="text-xl font-bold text-gray-900">{{ item.ho_ten }}</h3>
                    <p class="text-sm text-gray-500 font-mono flex items-center gap-1 sm:justify-start justify-center">
                      <CreditCard :size="14"/> CCCD: {{ item.cccd || '---' }}
                    </p>
                  </div>
                  <div class="mx-auto sm:mx-0" v-html="renderStatusBadge(item.trang_thai)"></div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm bg-gray-50 p-3 rounded-xl border border-gray-100 mt-2">
                  <div v-if="item.trang_thai === 'THE_DANG_HOAT_DONG'" class="col-span-2 flex justify-between items-center">
                    <span class="text-gray-500">Số thẻ thư viện:</span>
                    <span class="text-lg font-mono font-bold text-blue-600 tracking-wide">{{ item.sothe }}</span>
                  </div>
                  <template v-else>
                    <div class="flex justify-between sm:justify-start sm:gap-2">
                      <span class="text-gray-500">Mã hồ sơ:</span>
                      <span class="font-mono font-semibold text-gray-800">#{{ item.ma_yeu_cau }}</span>
                    </div>
                    <div class="flex justify-between sm:justify-start sm:gap-2">
                      <span class="text-gray-500">Ngày nộp:</span>
                      <span class="font-medium text-gray-800">{{ item.ngay_dang_ky ? formatDate(item.ngay_dang_ky) : '---' }}</span>
                    </div>
                  </template>
                  <div class="col-span-2 pt-2 border-t border-gray-200 mt-1 flex justify-between sm:justify-start sm:gap-2">
                    <span class="text-gray-500">Loại thẻ:</span>
                    <span class="font-bold text-purple-700">{{ item.ten_loai_the }}</span>
                  </div>
                </div>

                <div v-if="item.trang_thai === 'tuChoi'" class="mt-3 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-start gap-2 text-left">
                  <AlertCircle :size="18" class="mt-0.5 shrink-0"/>
                  <span><strong>Lý do từ chối:</strong> {{ item.ly_do_tu_choi || "Hồ sơ không đạt yêu cầu." }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { Loader2, Search, ArrowLeft, CreditCard, Clock, CheckCircle, XCircle, AlertCircle, User } from 'lucide-vue-next'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const keyword = ref('')
const results = ref(null)
const errorMessage = ref('')
const isLoading = ref(false)

const handleSearch = async () => {
  if (keyword.value.trim().length < 9) {
    errorMessage.value = "Vui lòng nhập ít nhất 9 ký tự (CCCD hoặc SĐT)."
    return
  }

  isLoading.value = true
  results.value = null
  errorMessage.value = ''

  try {
    const response = await axios.post(`${API_BASE_URL}/yeu-cau-the/tra-cuu`, {
      keyword: keyword.value.trim()
    })
    results.value = response.data || []
  } catch (err) {
    console.error("Lỗi tra cứu hồ sơ:", err)
    if (err.response?.status === 404) {
      results.value = []
    } else {
      errorMessage.value = err.response?.data?.detail || "Lỗi kết nối đến máy chủ."
    }
  } finally {
    isLoading.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('vi-VN')
}

const renderStatusBadge = (status) => {
  switch (status) {
    case 'THE_DANG_HOAT_DONG':
      return `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200"><span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span> ĐANG HOẠT ĐỘNG</span>`
    case 'daDuyet':
      return `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200"><span class="w-1.5 h-1.5 rounded-full bg-green-500"></span> Đã duyệt</span>`
    case 'choDuyet':
      return `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200"><span class="w-1.5 h-1.5 rounded-full bg-yellow-500"></span> Đang chờ duyệt</span>`
    case 'tuChoi':
      return `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200"><span class="w-1.5 h-1.5 rounded-full bg-red-500"></span> Bị từ chối</span>`
    default:
      return `<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">${status}</span>`
  }
}
</script>
