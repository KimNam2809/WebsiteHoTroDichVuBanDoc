<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 selection:bg-cyan-500 selection:text-slate-950">
    <!-- Loading Screen -->
    <div v-if="isLoading" class="min-h-screen flex items-center justify-center bg-slate-950">
      <div class="flex flex-col items-center gap-4">
        <Loader2 class="animate-spin text-cyan-400" :size="48" />
        <p class="text-slate-400 text-sm font-light">Đang tải chi tiết tài liệu...</p>
      </div>
    </div>

    <!-- Error Screen -->
    <div v-else-if="errorMsg" class="min-h-screen flex flex-col items-center justify-center bg-slate-950">
      <div class="text-center space-y-6 max-w-md px-4">
        <div class="w-20 h-20 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto text-rose-400">
          <BookOpen :size="36" />
        </div>
        <h1 class="text-2xl font-bold text-slate-200">Không tìm thấy tài liệu</h1>
        <p class="text-slate-400 text-sm font-light leading-relaxed">{{ errorMsg }}</p>
        <router-link to="/tim_kiem" class="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-cyan-400 font-bold px-6 py-3 rounded-xl transition-all w-fit">
          <ArrowLeft :size="16" /> Quay lại tìm kiếm
        </router-link>
      </div>
    </div>

    <!-- Detail View -->
    <div v-else>
      <!-- Hero Header Section with Dynamic Ambient Glow -->
      <div class="relative bg-gradient-to-b from-indigo-950/40 via-slate-950 to-slate-950 min-h-[350px] flex flex-col justify-center overflow-hidden pb-24 pt-20 border-b border-slate-900">
        <div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))]"></div>
        <div class="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div class="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
        <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0"></div>

        <div class="relative z-10 max-w-6xl mx-auto px-4 w-full">
          <router-link to="/tim_kiem" class="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 font-bold transition-all w-fit px-4 py-1.5 rounded-full bg-slate-900/50 border border-slate-850 hover:bg-slate-900">
            <ArrowLeft :size="16" /> Quay lại danh mục
          </router-link>

          <div class="max-w-4xl space-y-4">
            <div class="flex flex-wrap gap-2">
              <span v-for="cat in categories" :key="cat.madanhmuc" class="px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-bold uppercase tracking-wider rounded-lg">
                {{ cat.tendanhmuc }}
              </span>
            </div>
            
            <h1 class="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300 leading-tight tracking-tight">
              {{ work.tentacpham }}
            </h1>
            
            <div class="flex items-center gap-4 text-slate-400 text-sm md:text-base">
              <span class="flex items-center gap-2"><User :size="18" class="text-cyan-400" /> {{ work.tacgia }}</span>
              <span class="opacity-30">|</span>
              <span class="flex items-center gap-2 font-light">Năm XB: {{ work.namxuatban }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Details Card Overlapping Hero -->
      <div class="max-w-6xl mx-auto px-4 -mt-16 relative z-20">
        <div class="bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col md:flex-row">
          
          <!-- Left info sidebar -->
          <div class="md:w-1/3 lg:w-[28%] bg-slate-900/40 p-8 flex flex-col items-center border-b md:border-b-0 md:border-r border-slate-800">
            <div class="relative w-48 md:w-52 aspect-[3/4] shadow-2xl rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-500 z-10 mb-6 bg-slate-950 border border-slate-800">
              <img
                v-if="work.anhbia"
                :src="work.anhbia"
                :alt="work.tentacpham"
                class="object-cover w-full h-full"
              />
              <div v-else class="w-full h-full flex flex-col items-center justify-center text-slate-700 bg-slate-950">
                <BookOpen :size="48" :stroke-width="1" />
                <span class="text-[10px] mt-2 font-bold uppercase">Không có ảnh bìa</span>
              </div>
            </div>

            <!-- Parameters checklist -->
            <div class="w-full bg-slate-950/60 rounded-2xl border border-slate-850 p-4 space-y-3">
              <div class="flex justify-between items-center text-xs border-b border-slate-900 pb-2">
                <span class="text-slate-500 flex items-center gap-1.5"><Hash :size="12" /> ISBN</span>
                <span class="font-mono font-bold text-slate-300">{{ work.isbn || '---' }}</span>
              </div>
              <div class="flex justify-between items-center text-xs border-b border-slate-900 pb-2">
                <span class="text-slate-500 flex items-center gap-1.5"><Calendar :size="12" /> Xuất bản</span>
                <span class="font-medium text-slate-300">{{ work.namxuatban || '---' }}</span>
              </div>
              <div class="flex justify-between items-center text-xs pt-1">
                <span class="text-slate-500 flex items-center gap-1.5"><Clock :size="12" /> Trạng thái</span>
                <span class="font-medium text-cyan-400">Đang hoạt động</span>
              </div>
            </div>

            <!-- Quick interactions -->
            <div class="flex gap-3 mt-6 w-full text-xs font-bold">
              <button @click="toggleFavorite" :class="['flex-1 py-2.5 rounded-xl border transition-all flex items-center justify-center gap-1.5', isFavorited ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-800']">
                <Heart :size="14" :fill="isFavorited ? 'currentColor' : 'none'" /> {{ isFavorited ? 'Đã thích' : 'Yêu thích' }}
              </button>
              <button @click="shareBook" class="flex-1 py-2.5 rounded-xl border bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center gap-1.5">
                <Share2 :size="14" /> Chia sẻ
              </button>
            </div>
          </div>

          <!-- Right column details & copies list -->
          <div class="md:w-2/3 lg:w-[72%] p-8 md:p-10 flex flex-col">
            <!-- Availability Header info -->
            <div :class="['mb-8 p-5 rounded-2xl border flex items-start sm:items-center justify-between shadow-sm', availableCount > 0 ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400' : 'bg-amber-950/20 border-amber-500/20 text-amber-400']">
              <div class="flex gap-4">
                <div :class="['p-2 rounded-full shrink-0 flex items-center justify-center', availableCount > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400']">
                  <CheckCircle v-if="availableCount > 0" :size="20" />
                  <Clock v-else :size="20" />
                </div>
                <div>
                  <h3 class="font-bold text-base">{{ availableCount > 0 ? 'Tài liệu đang có sẵn' : 'Tạm thời hết bản sao' }}</h3>
                  <p class="text-xs text-slate-400 mt-1 font-light leading-relaxed">
                    {{ availableCount > 0 ? `Hiện còn ${availableCount} bản sao vật lý tại thư viện. Đăng ký mượn ngay!` : 'Các bản sao hiện đang được mượn bởi độc giả khác. Bạn có thể đăng ký hàng đợi đặt trước.' }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Description -->
            <div class="mb-10">
              <h3 class="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-slate-900 pb-3">
                <Info :size="16" class="text-cyan-400" /> Giới thiệu nội dung
              </h3>
              <div class="text-slate-400 font-light leading-relaxed text-sm whitespace-pre-line">
                {{ work.mota || "Thông tin giới thiệu nội dung cuốn sách đang được cập nhật..." }}
              </div>
            </div>

            <!-- Physical Copies list -->
            <div class="border-t border-slate-900 pt-8 mt-auto">
              <BookCopiesList
                v-if="copies.length >= 0"
                :copies="copies"
                :initialOwnedIds="myBorrowedIds"
                :initialReservedIds="myReservedIds"
                @refresh="loadBookData"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from 'axios'
import BookCopiesList from '../components/BookCopiesList.vue'
import { ArrowLeft, BookOpen, Calendar, User, Info, Hash, Clock, CheckCircle, Heart, Share2, Loader2 } from 'lucide-vue-next'

const route = useRoute()
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const bookId = route.params.id
const isLoading = ref(true)
const errorMsg = ref(null)

const work = ref(null)
const categories = ref([])
const copies = ref([])
const availableCount = ref(0)
const myBorrowedIds = ref([])
const myReservedIds = ref([])
const isFavorited = ref(false)

const toggleFavorite = () => {
  isFavorited.value = !isFavorited.value
}

const shareBook = () => {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href)
    alert('Đã sao chép liên kết vào khay nhớ tạm!')
  } else {
    alert(`Liên kết của bạn: ${window.location.href}`)
  }
}

const loadBookData = async () => {
  try {
    const [workRes, catRes, copiesRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/tac-pham/${bookId}`),
      axios.get(`${API_BASE_URL}/tac-pham-danh-muc/${bookId}`),
      axios.get(`${API_BASE_URL}/tac-pham/${bookId}/ban-sao`)
    ])

    work.value = workRes.data
    categories.value = catRes.data || []
    copies.value = copiesRes.data || []

    const availableCopies = copies.value.filter(c => c.trangthaichomuon === true)
    availableCount.value = availableCopies.length

    // Load user loan/reservation statuses if authenticated
    try {
      const token = localStorage.getItem('auth_token')
      if (token) {
        const [loansRes, overdueRes, reservedRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/muon-tra/danh-sach-chi-tiet-muon-tra?trang_thai=daMuon`),
          axios.get(`${API_BASE_URL}/muon-tra/danh-sach-chi-tiet-muon-tra?trang_thai=quaHan`),
          axios.get(`${API_BASE_URL}/dat-truoc/`)
        ])

        const loansList = Array.isArray(loansRes.data) ? loansRes.data : []
        const overdueList = Array.isArray(overdueRes.data) ? overdueRes.data : []
        const allLoans = [...loansList, ...overdueList]

        myBorrowedIds.value = allLoans.map(loan => {
          return String(loan.mabansao || loan.maBanSao || loan.ma_ban_sao)
        }).filter(id => id && id !== 'undefined')

        const reservations = Array.isArray(reservedRes.data) ? reservedRes.data : (reservedRes.data?.data || [])
        myReservedIds.value = reservations.map(r => {
          const rId = r.mabansao || r.maBanSao || r.ma_ban_sao
          return {
            id: String(rId),
            status: r.trangThaiDatTruoc || r.trangthaidattruoc
          }
        }).filter(item => item.id && item.id !== 'undefined')
      }
    } catch (authError) {
      console.warn('Ignore auth states fetching if user is guest:', authError)
    }

  } catch (error) {
    console.error('Lỗi khi tải chi tiết tác phẩm:', error)
    errorMsg.value = error.response?.data?.detail || 'Không thể lấy thông tin tác phẩm.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadBookData()
})
</script>
