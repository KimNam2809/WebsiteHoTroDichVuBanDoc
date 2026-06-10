<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans flex items-center justify-center p-4">
    <!-- Main Modal-like container -->
    <div class="relative w-full max-w-6xl h-[85vh] bg-slate-900/60 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col md:flex-row">
      
      <!-- Close Button -->
      <button
        @click="goBack"
        class="absolute top-4 right-4 z-50 p-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full transition-all border border-slate-800 shadow-lg"
        title="Quay lại"
      >
        <X :size="20" class="hover:scale-110 transition-transform" />
      </button>

      <!-- LEFT SIDEBAR: Notification list -->
      <div :class="['w-full md:w-1/3 lg:w-1/4 border-r border-slate-900 flex flex-col', selectedNotif ? 'hidden md:flex' : 'flex']" class="h-full">
        <div class="p-5 border-b border-slate-900 bg-slate-950/40 flex justify-between items-center">
          <h2 class="font-extrabold text-slate-200 text-lg flex items-center gap-2">
            <Mail :size="20" class="text-cyan-400" />
            Hộp Thư
          </h2>
          <span class="bg-cyan-500/10 text-cyan-400 text-xs px-2.5 py-1 rounded-full font-semibold border border-cyan-500/20">
            {{ unreadCount }} chưa đọc
          </span>
        </div>

        <!-- Scrollable list -->
        <div class="flex-1 overflow-y-auto divide-y divide-slate-950">
          <div v-if="isLoading" class="p-6 space-y-4">
            <div v-for="i in 3" :key="i" class="h-16 bg-slate-800/40 rounded-xl animate-pulse"></div>
          </div>
          
          <div v-else-if="notifications.length === 0" class="flex flex-col items-center justify-center h-full text-slate-500 p-6 text-center">
            <MailOpen :size="40" class="mb-3 opacity-30 text-cyan-400" />
            <p class="text-sm font-light">Hộp thư của bạn trống.</p>
          </div>

          <div
            v-else
            v-for="notif in notifications"
            :key="notif.maThongBao"
            @click="handleSelect(notif)"
            :class="[
              'p-4 cursor-pointer transition-all relative flex flex-col justify-between hover:bg-slate-850',
              selectedNotif?.maThongBao === notif.maThongBao ? 'bg-slate-800/50 border-l-4 border-cyan-500' : '',
              notif.trangThai === 'chuaXem' ? 'bg-slate-900/30' : 'opacity-60'
            ]"
          >
            <div class="flex justify-between items-start mb-1.5 gap-2">
              <h3 :class="['text-sm font-bold line-clamp-1', notif.trangThai === 'chuaXem' ? 'text-slate-100' : 'text-slate-400']">
                {{ notif.tieuDe }}
              </h3>
              <span v-if="notif.trangThai === 'chuaXem'" class="w-2 h-2 rounded-full bg-cyan-400 shrink-0 mt-1.5 shadow-sm shadow-cyan-400/50"></span>
            </div>
            
            <p class="text-xs text-slate-400 line-clamp-2 mb-2 font-light">
              {{ notif.noiDung }}
            </p>

            <div class="flex items-center gap-1.5 text-[10px] text-slate-500">
              <Clock :size="10" />
              <span>{{ formatDate(notif.thoiGianGui) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT PANEL: Notification detail -->
      <div :class="['w-full md:w-2/3 lg:w-3/4 bg-slate-950/20 flex flex-col h-full', selectedNotif ? 'flex' : 'hidden md:flex']">
        <div v-if="selectedNotif" class="flex flex-col h-full">
          <!-- Toolbar -->
          <div class="p-4 border-b border-slate-900 bg-slate-950/40 flex items-center justify-between">
            <button
              @click="selectedNotif = null"
              class="md:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
            >
              <ChevronLeft :size="20" />
            </button>
            <div class="flex-1"></div>
            <button 
              @click="deleteNotification(selectedNotif.maThongBao)"
              class="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
              title="Xóa thông báo"
            >
              <Trash2 :size="18" />
            </button>
            <div class="w-12"></div> <!-- spacing from absolute close -->
          </div>

          <!-- Detail view -->
          <div class="p-6 md:p-10 flex-1 overflow-y-auto">
            <div v-if="isDetailLoading" class="flex flex-col items-center justify-center h-full">
              <Loader2 class="animate-spin text-cyan-400 mb-4" :size="36" />
              <p class="text-slate-400 text-sm">Đang tải chi tiết...</p>
            </div>

            <div v-else class="max-w-2xl mx-auto space-y-6">
              <div class="flex items-start gap-4">
                <div :class="[
                  'p-3.5 rounded-2xl border shrink-0',
                  selectedNotif.tieuDe.includes('thành công') || selectedNotif.tieuDe.includes('duyệt')
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : selectedNotif.tieuDe.includes('thất bại') || selectedNotif.tieuDe.includes('từ chối')
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                      : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                ]">
                  <CheckCircle2 v-if="selectedNotif.tieuDe.includes('thành công') || selectedNotif.tieuDe.includes('duyệt')" :size="28" />
                  <AlertCircle v-else-if="selectedNotif.tieuDe.includes('thất bại') || selectedNotif.tieuDe.includes('từ chối')" :size="28" />
                  <MailOpen v-else :size="28" />
                </div>

                <div>
                  <h1 class="text-xl md:text-2xl font-bold text-white mb-2 leading-tight">
                    {{ selectedNotif.tieuDe }}
                  </h1>
                  <div class="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                    <span>Gửi từ: <strong class="text-slate-400">Hệ Thống Thư Viện</strong></span>
                    <span>•</span>
                    <span>{{ formatDateTime(selectedNotif.thoiGianGui) }}</span>
                  </div>
                </div>
              </div>

              <!-- Message Body -->
              <div class="text-slate-300 font-light leading-relaxed whitespace-pre-wrap text-sm border-t border-slate-900 pt-6">
                {{ selectedNotif.noiDung }}
              </div>

              <!-- Attached Metadata / Registration profile -->
              <div v-if="parsedData" class="bg-slate-900/60 rounded-2xl border border-slate-800 overflow-hidden shadow-xl mt-8">
                <div class="bg-slate-900/80 px-4 py-3 border-b border-slate-800">
                  <h3 class="font-bold text-slate-300 text-xs uppercase tracking-wider">Thông Tin Hồ Sơ Đi kèm</h3>
                </div>

                <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <!-- Photo & Name -->
                  <div class="col-span-1 md:col-span-2 flex items-center gap-4 border-b border-slate-900 pb-4">
                    <img
                      v-if="parsedData.anh_the_url"
                      :src="parsedData.anh_the_url"
                      alt="Ảnh hồ sơ"
                      class="w-16 h-20 object-cover rounded-lg border border-slate-800 bg-slate-950"
                    />
                    <div v-else class="w-16 h-20 bg-slate-950 rounded-lg flex items-center justify-center text-slate-600 text-[10px] border border-slate-800">
                      Chưa có ảnh
                    </div>
                    <div>
                      <p class="font-extrabold text-slate-200 text-base">{{ parsedData.ho_ten || '---' }}</p>
                      <p class="text-xs text-slate-400 font-light">{{ parsedData.nghe_nghiep || 'Chưa cập nhật nghề nghiệp' }}</p>
                    </div>
                  </div>

                  <div>
                    <span class="block text-slate-500 text-[10px] uppercase tracking-wider mb-1">Ngày sinh</span>
                    <span class="font-medium text-slate-300">{{ parsedData.ngay_sinh ? new Date(parsedData.ngay_sinh).toLocaleDateString('vi-VN') : '---' }}</span>
                  </div>

                  <div>
                    <span class="block text-slate-500 text-[10px] uppercase tracking-wider mb-1">Giới tính</span>
                    <span class="font-medium text-slate-300">{{ parsedData.gioi_tinh === 'Nam' ? 'Nam' : parsedData.gioi_tinh === 'Nu' ? 'Nữ' : 'Khác' }}</span>
                  </div>

                  <div>
                    <span class="block text-slate-500 text-[10px] uppercase tracking-wider mb-1">Số CCCD</span>
                    <span class="font-medium text-slate-300">{{ parsedData.cccd || '---' }}</span>
                  </div>

                  <div>
                    <span class="block text-slate-500 text-[10px] uppercase tracking-wider mb-1">Số điện thoại</span>
                    <span class="font-medium text-slate-300">{{ parsedData.sdt || '---' }}</span>
                  </div>

                  <div class="col-span-1 md:col-span-2">
                    <span class="block text-slate-500 text-[10px] uppercase tracking-wider mb-1">Địa chỉ</span>
                    <span class="font-medium text-slate-300">{{ parsedData.dia_chi || '---' }}</span>
                  </div>

                  <!-- Collection Scheduled Time -->
                  <div v-if="parsedData.thoi_gian_du_kien" class="col-span-1 md:col-span-2 p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xl flex items-center gap-3 text-cyan-400 text-xs">
                    <Clock :size="16" />
                    <span>
                      <strong>Thời gian dự kiến nhận thẻ cứng: </strong>
                      {{ new Date(parsedData.thoi_gian_du_kien).toLocaleDateString('vi-VN') }}
                    </span>
                  </div>

                  <!-- Dynamic Payment/Verification QR Code -->
                  <div v-if="parsedData.qr_payment_content" class="col-span-1 md:col-span-2 mt-4 p-6 bg-slate-950 rounded-2xl border border-slate-850 flex flex-col items-center justify-center gap-4">
                    <h4 class="font-bold text-cyan-400 text-xs uppercase tracking-wider">Mã Hồ Sơ & Thanh Toán</h4>
                    <div class="bg-white p-3 rounded-2xl shadow-lg">
                      <img :src="`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(parsedData.qr_payment_content)}`" alt="Mã thanh toán QR" class="w-40 h-40" />
                    </div>
                    <p class="text-[10px] text-slate-500 text-center max-w-xs font-light leading-relaxed">
                      Quét mã để đóng phí hoặc đưa mã vạch này cho nhân viên thủ thư để đối chiếu nhận thẻ độc giả.
                    </p>
                    <div v-if="parsedData.tong_tien" class="text-center">
                      <span class="text-slate-500 text-[10px]">TỔNG CỘNG</span>
                      <p class="font-mono text-cyan-400 font-extrabold text-xl">
                        {{ parseInt(parsedData.tong_tien).toLocaleString('vi-VN') }} đ
                      </p>
                    </div>
                  </div>

                  <!-- Rejected reasons -->
                  <div v-if="parsedData.ly_do_tu_choi" class="col-span-1 md:col-span-2 p-4 bg-rose-950/20 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                    <strong>Lý do từ chối:</strong> {{ parsedData.ly_do_tu_choi }}
                  </div>
                </div>
              </div>

              <!-- Automated message prompt -->
              <p class="text-[10px] text-slate-600 italic border-t border-slate-900 pt-6">Đây là tin nhắn tự động. Vui lòng không phản hồi.</p>
            </div>
          </div>
        </div>
        
        <div v-else class="flex flex-col items-center justify-center h-full text-slate-500">
          <MailOpen :size="64" class="mb-4 opacity-10 text-cyan-400" />
          <p class="text-slate-400 font-light">Vui lòng chọn thông báo để xem nội dung.</p>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { X, Mail, MailOpen, Trash2, Clock, AlertCircle, CheckCircle2, ChevronLeft, Loader2 } from 'lucide-vue-next'

const router = useRouter()
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const notifications = ref([])
const selectedNotif = ref(null)
const isLoading = ref(true)
const isDetailLoading = ref(false)

const unreadCount = computed(() => {
  return notifications.value.filter(n => n.trangThai !== 'daXem').length
})

const parsedData = computed(() => {
  if (!selectedNotif.value || !selectedNotif.value.duLieuGoc) return null
  try {
    let data = selectedNotif.value.duLieuGoc
    if (typeof data === 'string') {
      data = JSON.parse(data)
    }
    return data
  } catch (e) {
    console.error('Cannot parse attached JSON data:', e)
    return null
  }
})

const goBack = () => {
  router.push('/tai_khoan')
}

const fetchNotifications = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/thong-bao/`)
    notifications.value = res.data || []
  } catch (e) {
    console.error('Lỗi tải danh sách thông báo:', e)
  } finally {
    isLoading.value = false
  }
}

const handleSelect = async (notif) => {
  selectedNotif.value = notif
  isDetailLoading.value = true
  
  if (notif.trangThai !== 'daXem') {
    // Optimistic UI update
    notif.trangThai = 'daXem'
    try {
      await axios.put(`${API_BASE_URL}/thong-bao/${notif.maThongBao}/read`)
    } catch (e) {
      console.error('Lỗi cập nhật đã đọc:', e)
    }
  }

  setTimeout(() => {
    isDetailLoading.value = false
  }, 250)
}

const deleteNotification = async (id) => {
  if (!confirm('Bạn có muốn xóa thông báo này?')) return
  try {
    await axios.delete(`${API_BASE_URL}/thong-bao/${id}`)
    notifications.value = notifications.value.filter(n => n.maThongBao !== id)
    selectedNotif.value = null
  } catch (e) {
    console.error('Lỗi xóa thông báo:', e)
    alert('Không thể xóa thông báo.')
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('vi-VN')
}

onMounted(() => {
  fetchNotifications()
})
</script>
