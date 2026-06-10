<template>
  <div class="min-h-screen bg-gray-50 pb-20 font-sans">
    
    <!-- 1. HERO HEADER -->
    <div class="relative bg-gradient-to-r from-blue-900 to-indigo-900 h-[350px] flex items-center justify-center overflow-hidden pb-10">
      <div class="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      <div class="relative z-10 text-center px-4 max-w-4xl mx-auto pt-10">
        <span class="inline-block py-1 px-3 rounded-full bg-blue-500/20 border border-blue-400/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-sm">
          Thành viên Thư viện
        </span>
        <h1 class="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight drop-shadow-lg">
          Đăng Ký Thẻ Bạn Đọc
        </h1>
        <p class="text-blue-100 text-lg font-light max-w-2xl mx-auto">
          Mở khóa kho tàng tri thức với hàng ngàn đầu sách và tiện ích số. Đăng ký nhanh chóng chỉ trong 5 phút.
        </p>
      </div>
    </div>

    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
      
      <!-- 2. QUY TRÌNH (STEPS) -->
      <div class="bg-white rounded-3xl shadow-xl p-8 mb-12 border border-gray-100">
        <h2 class="text-xl font-bold text-gray-800 mb-8 text-center uppercase tracking-wider">Quy trình thực hiện</h2>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          <!-- Line connecting steps (Desktop only) -->
          <div class="hidden md:block absolute top-7 left-0 w-full h-0.5 bg-gray-200 -z-10 transform scale-x-75"></div>

          <div v-for="step in steps" :key="step.number" class="flex flex-col items-center text-center group">
            <div class="flex items-center justify-center w-14 h-14 bg-white border-2 border-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all rounded-full font-bold text-xl mb-4 shadow-sm z-10">
              {{ step.number }}
            </div>
            <h3 class="font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">{{ step.title }}</h3>
            <p class="text-sm text-gray-500 px-2 leading-relaxed">{{ step.description }}</p>
          </div>
        </div>
      </div>

      <!-- 3. DANH SÁCH THẺ -->
      <div class="mb-16">
        <h2 class="text-2xl font-bold text-gray-800 mb-8 text-center">Lựa chọn loại thẻ phù hợp</h2>
        
        <div v-if="isLoading" class="flex justify-center items-center py-12">
          <Loader2 class="animate-spin text-blue-600 w-10 h-10" />
        </div>
        
        <div v-else-if="cardTypes.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="card in cardTypes" :key="card.maloaithe" class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative overflow-hidden group">
            <div :class="['absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10 transition-transform group-hover:scale-150', card.lephi === 0 ? 'bg-green-500' : 'bg-blue-500']"></div>

            <div class="flex justify-between items-start mb-4 relative z-10">
              <div :class="['p-3 rounded-xl', card.lephi === 0 ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600']">
                <component :is="getIconForCard(card.tenthe)" :size="24" />
              </div>
              <span v-if="card.lephi === 0" class="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase">Miễn phí</span>
              <span v-else class="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                {{ card.lephi.toLocaleString('vi-VN') }} đ
              </span>
            </div>

            <h3 class="text-lg font-bold text-gray-800 mb-2 relative z-10">{{ card.tenthe }}</h3>
            <p class="text-sm text-gray-500 mb-6 flex-1 relative z-10 line-clamp-2">{{ card.mota }}</p>

            <div class="flex items-center gap-4 text-xs text-gray-400 border-t border-gray-100 pt-4 relative z-10">
              <span class="flex items-center gap-1"><BookOpen :size="14"/> Mượn tối đa: {{ card.tailieumuontoida }} cuốn</span>
              <span class="flex items-center gap-1"><CheckCircle :size="14"/> Hạn mượn: {{ card.songaymuonmacdinh }} ngày</span>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-10 text-gray-500 bg-white rounded-2xl shadow-sm border border-dashed">
          Đang cập nhật danh sách thẻ...
        </div>
      </div>

      <!-- 4. CTA BUTTONS -->
      <div class="flex flex-col items-center gap-6">
        <router-link
          to="/dang_ky_the/form"
          class="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-blue-600 rounded-full hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
        >
          <span class="mr-2 text-lg">Bắt đầu Đăng ký Ngay</span>
          <ArrowRight class="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </router-link>

        <div class="flex gap-6 text-sm font-medium">
          <router-link to="/dang_ky_the/tra_cuu" class="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 hover:border-blue-200">
            <Search :size="16" /> Tra cứu hồ sơ
          </router-link>
          <a href="#" class="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 hover:border-blue-200">
            <FileText :size="16" /> Xem quy định
          </a>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { 
  BookOpen, User, Gift, Shield, CheckCircle, ArrowRight, Search, FileText, Loader2 
} from 'lucide-vue-next'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const cardTypes = ref([])
const isLoading = ref(true)

const steps = [
  { number: 1, title: 'Điền thông tin', description: 'Khai báo thông tin cá nhân trực tuyến' },
  { number: 2, title: 'Tải ảnh thẻ', description: 'Upload ảnh chân dung 3x4 rõ nét' },
  { number: 3, title: 'Thanh toán', description: 'Quét mã QR để đóng lệ phí làm thẻ' },
  { number: 4, title: 'Nhận thẻ', description: 'Nhận thẻ cứng tại thư viện hoặc qua bưu điện' }
]

const getIconForCard = (name) => {
  const lowerName = (name || '').toLowerCase()
  if (lowerName.includes('thiếu nhi')) return Gift
  if (lowerName.includes('nghiên cứu')) return Shield
  if (lowerName.includes('đọc')) return BookOpen
  return User
}

onMounted(async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/loai-the/`)
    cardTypes.value = (response.data || []).map((card) => ({
      ...card,
      maloaithe: card.maloaithe ?? card.maLoaiThe,
      tenthe: card.tenthe ?? card.tenThe,
      mota: card.mota ?? card.moTa,
      tailieumuontoida: card.tailieumuontoida ?? card.taiLieuMuonToiDa,
      songaymuonmacdinh: card.songaymuonmacdinh ?? card.soNgayMuonMacDinh,
      lephi: card.lephi ?? card.lePhi,
    }))
  } catch (error) {
    console.error("Lỗi lấy loại thẻ:", error)
  } finally {
    isLoading.value = false
  }
})
</script>
