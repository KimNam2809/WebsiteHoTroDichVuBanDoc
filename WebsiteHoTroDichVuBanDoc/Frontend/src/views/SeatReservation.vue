<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 selection:bg-cyan-500 selection:text-slate-950">
    
    <!-- STICKY HEADER -->
    <div class="bg-slate-900/80 border-b border-slate-900 sticky top-0 z-30 backdrop-blur-md">
      <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <router-link to="/dich_vu" class="flex items-center gap-1 text-slate-400 hover:text-white transition group text-sm font-bold">
            <ChevronLeft :size="16" class="group-hover:-translate-x-0.5 transition-transform"/> Quay lại
          </router-link>
          <div class="h-5 w-px bg-slate-800"></div>
          <h1 class="text-base font-extrabold text-slate-200 flex items-center gap-2">
            <LayoutGrid class="text-cyan-400" :size="18"/>
            Đặt Chỗ & Đặt Phòng Học Nhóm
          </h1>
        </div>
      </div>
    </div>

    <!-- MAIN GRID CONTAINER -->
    <div class="max-w-7xl mx-auto px-4 mt-8 grid lg:grid-cols-12 gap-8">
      
      <!-- LEFT PANEL: MAP & TABS (8/12 Columns) -->
      <div class="lg:col-span-8 space-y-6">
        
        <!-- 1. ROOM SELECTION TABS -->
        <div class="bg-slate-900/40 p-3 rounded-2xl border border-slate-900">
          <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
            <button
              v-for="room in rooms"
              :key="room.maPhong"
              @click="selectRoom(room)"
              :class="[
                'flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all text-xs font-bold border',
                selectedRoom?.maPhong === room.maPhong
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-sm'
                  : 'bg-slate-950 border-transparent text-slate-400 hover:bg-slate-900 hover:border-slate-850'
              ]"
            >
              <Users v-if="room.loaiphong === 'phongHocNhom'" :size="14" />
              <Monitor v-else-if="room.loaiphong === 'MayTinh'" :size="14"/>
              <BookOpen v-else :size="14" />
              {{ room.tenphong }}
            </button>
          </div>
        </div>

        <!-- 2. LAYOUT MAP DISPLAY -->
        <div class="bg-slate-900/40 p-6 rounded-3xl border border-slate-900 min-h-[500px] flex flex-col">
          <div v-if="isLoading" class="flex-1 flex flex-col items-center justify-center">
            <Loader2 class="animate-spin text-cyan-400 mb-3" :size="32" />
            <p class="text-xs text-slate-500 font-light">Đang tải sơ đồ phòng...</p>
          </div>

          <div v-else-if="selectedRoom" class="flex flex-col flex-1">
            <!-- Room Header details -->
            <div class="flex justify-between items-start mb-8 pb-4 border-b border-slate-900">
              <div>
                <h2 class="text-xl font-bold text-white">{{ selectedRoom.tenphong }}</h2>
                <div class="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-wider">
                  <span class="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-850"><Users :size="12" /> {{ selectedRoom.succhua }} Chỗ ngồi</span>
                  <span class="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-850"><Wifi :size="12" /> Wifi 6E</span>
                  <span class="flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-850"><Zap :size="12" /> Có nguồn điện</span>
                </div>
              </div>
              <div v-if="selectedRoom.loaiphong !== 'phongHocNhom'" class="text-right">
                <div class="text-[10px] text-slate-500 mb-1.5 uppercase font-bold tracking-wider">Ký hiệu ghế</div>
                <div class="flex gap-3 text-[10px] font-medium">
                  <div class="flex items-center gap-1"><div class="w-3 h-3 rounded bg-slate-950 border border-slate-800"></div> Trống</div>
                  <div class="flex items-center gap-1"><div class="w-3 h-3 rounded bg-cyan-500"></div> Đang chọn</div>
                  <div class="flex items-center gap-1"><div class="w-3 h-3 rounded bg-slate-800"></div> Đã đặt</div>
                </div>
              </div>
            </div>

            <!-- Map Area -->
            <!-- Group 2a: Study Group Room Reservation -->
            <div v-if="selectedRoom.loaiphong === 'phongHocNhom'" class="flex-1 flex flex-col items-center justify-center text-center p-10 bg-blue-950/10 rounded-2xl border border-dashed border-blue-500/20">
              <div class="w-20 h-20 bg-cyan-500/10 text-cyan-400 rounded-3xl flex items-center justify-center mb-6 border border-cyan-500/20 shadow-xl">
                <Users :size="32" />
              </div>
              <h3 class="text-lg font-bold text-slate-200 mb-2">Đăng Ký Đặt Nguyên Phòng</h3>
              <p class="text-xs text-slate-400 max-w-sm mb-6 font-light leading-relaxed">
                Không gian phòng họp nhóm biệt lập, cách âm. Thích hợp cho thảo luận, thuyết trình, làm việc nhóm từ 3 đến {{ selectedRoom.succhua }} người.
              </p>
            </div>

            <!-- Group 2b: Seat Reservation Grid -->
            <div v-else class="flex-1 overflow-x-auto pb-4">
              <div class="min-w-[600px] flex flex-col gap-6 items-center">
                <!-- Board screen sign -->
                <div class="w-1/2 h-1 bg-slate-800 rounded-full mb-8 relative">
                  <span class="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-slate-500 font-extrabold tracking-[0.2em] uppercase">Bảng Viết / Màn Hình</span>
                </div>

                <!-- Seats rows by group -->
                <div v-for="groupKey in sortedGroups" :key="groupKey" class="flex items-center gap-4 w-full justify-center">
                  <div class="w-8 text-right font-extrabold text-slate-700 text-xs uppercase">{{ groupKey }}</div>
                  <div class="flex gap-3">
                    <button
                      v-for="seat in groupedSeats[groupKey]"
                      :key="seat.maChoNgoi"
                      :disabled="isSeatDisabled(seat)"
                      @click="selectSeat(seat)"
                      :class="[
                        'relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 border text-xs font-bold',
                        getSeatClass(seat),
                        !isSeatDisabled(seat) ? 'hover:-translate-y-0.5 hover:shadow-md hover:shadow-cyan-500/5 active:scale-95' : 'cursor-not-allowed'
                      ]"
                      :title="seat.tenchongoi"
                    >
                      <component :is="getSeatIconComponent(seat.tenchongoi)" :size="14" />
                      <span v-if="isSeatDisabled(seat)" class="absolute -top-1 -right-1 w-2.5 h-2.5 bg-slate-700 rounded-full border-2 border-slate-900"></span>
                    </button>
                  </div>
                  <div class="w-8 text-left font-extrabold text-slate-700 text-xs uppercase">{{ groupKey }}</div>
                </div>

                <div v-if="currentSeats.length === 0" class="text-slate-500 italic py-10 text-sm">Chưa có dữ liệu sơ đồ ghế cho phòng này.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT PANEL: REGISTRATION FORM (4/12 Columns) -->
      <div class="lg:col-span-4">
        <div class="sticky top-24 space-y-6">
          
          <!-- 1. DETAIL PREVIEW CARD -->
          <div v-if="selectedRoom" :class="['p-5 rounded-3xl border shadow-xl transition-all duration-300', selectedSeat ? 'bg-cyan-500/5 border-cyan-500/20' : 'bg-slate-900/40 border-slate-900']">
            <!-- Room description info -->
            <div v-if="selectedRoom.loaiphong === 'phongHocNhom'" class="flex items-start gap-4">
              <div class="p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl shrink-0">
                <Users :size="20" />
              </div>
              <div>
                <h3 class="font-extrabold text-slate-200 text-sm">Phòng Học Nhóm</h3>
                <p class="text-xs text-slate-400 mt-1 leading-relaxed font-light">
                  Phòng cách âm, tích hợp tivi trình chiếu và bảng vẽ thảo luận.
                </p>
                <div class="flex gap-2 mt-2 flex-wrap">
                  <span class="px-2 py-0.5 bg-slate-950 text-slate-400 text-[9px] font-bold rounded uppercase">Tivi HD</span>
                  <span class="px-2 py-0.5 bg-slate-950 text-slate-400 text-[9px] font-bold rounded uppercase">Bảng viết</span>
                </div>
              </div>
            </div>

            <!-- Seat description info -->
            <div v-else-if="selectedSeat && seatInfo" class="flex items-start gap-4 animate-fade-in">
              <div :class="['p-3 rounded-2xl shrink-0', seatInfo.bg, seatInfo.color]">
                <component :is="seatInfo.icon" :size="20" />
              </div>
              <div>
                <h3 class="font-extrabold text-slate-200 text-sm flex items-center gap-2">
                  {{ seatInfo.label }}
                  <span class="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-850 font-mono">
                    {{ selectedSeat.tenchongoi }}
                  </span>
                </h3>
                <p class="text-xs text-slate-400 mt-1 leading-relaxed font-light">
                  {{ seatInfo.desc }}
                </p>
                <div class="flex gap-2 mt-2 flex-wrap">
                  <span v-for="(feat, idx) in seatInfo.features" :key="idx" class="px-2 py-0.5 bg-slate-950 text-slate-400 text-[9px] font-bold rounded uppercase">
                    {{ feat }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Waiting selection info -->
            <div v-else class="flex flex-col items-center text-center py-2 text-slate-500">
              <Info :size="28" class="mb-2 opacity-30 text-cyan-400" />
              <p class="text-xs font-semibold text-slate-400">Vui lòng chọn một ghế trên sơ đồ</p>
              <p class="text-[10px] mt-1 font-light text-slate-500">Tiện ích vị trí sẽ được hiển thị chi tiết tại đây</p>
            </div>
          </div>

          <!-- 2. REGISTRATION FORM BOX -->
          <div class="bg-slate-900/40 p-6 rounded-3xl border border-slate-900 shadow-2xl">
            <div class="mb-6 pb-4 border-b border-slate-900">
              <h3 class="text-base font-bold text-slate-200">Xác Nhận Đăng Ký</h3>
              <p class="text-[10px] text-slate-500 mt-1">Vui lòng kiểm tra kỹ thời gian đăng ký trước khi xác nhận.</p>
            </div>

            <form @submit.prevent="handleFormSubmit" class="space-y-5">
              <!-- Date picker -->
              <div>
                <label class="block text-[10px] font-extrabold text-slate-500 uppercase mb-1.5 ml-1 tracking-wider">Ngày Đặt Lịch</label>
                <div class="relative">
                  <CalendarIcon class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" :size="16" />
                  <input
                    type="date"
                    required
                    :min="minDateStr"
                    v-model="formData.bookingDate"
                    class="w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-900 rounded-xl focus:bg-slate-900/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-xs font-medium text-slate-300 transition-all"
                  />
                </div>
              </div>

              <!-- Time picker grid -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[10px] font-extrabold text-slate-500 uppercase mb-1.5 ml-1 tracking-wider">Bắt Đầu</label>
                  <input
                    type="time"
                    required
                    v-model="formData.startTime"
                    class="w-full px-3 py-2.5 bg-slate-950 border border-slate-900 rounded-xl focus:bg-slate-900/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-xs font-medium text-center text-slate-300 transition-all"
                  />
                </div>
                <div>
                  <label class="block text-[10px] font-extrabold text-slate-500 uppercase mb-1.5 ml-1 tracking-wider">Kết Thúc</label>
                  <input
                    type="time"
                    required
                    v-model="formData.endTime"
                    class="w-full px-3 py-2.5 bg-slate-950 border border-slate-900 rounded-xl focus:bg-slate-900/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-xs font-medium text-center text-slate-300 transition-all"
                  />
                </div>
              </div>

              <!-- Room specific options -->
              <div v-if="selectedRoom?.loaiphong === 'phongHocNhom'" class="space-y-4 pt-4 border-t border-dashed border-slate-900">
                <div>
                  <label class="block text-[10px] font-extrabold text-slate-500 uppercase mb-1.5 ml-1 tracking-wider">Số Người Tham Gia</label>
                  <input
                    type="number"
                    min="1"
                    :max="selectedRoom.succhua"
                    v-model="formData.attendees"
                    class="w-full px-3 py-2.5 bg-slate-950 border border-slate-900 rounded-xl focus:bg-slate-900/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-xs font-medium text-slate-300 transition-all"
                  />
                </div>
                <div>
                  <label class="block text-[10px] font-extrabold text-slate-500 uppercase mb-1.5 ml-1 tracking-wider">Mục Đích Sử Dụng</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Họp dự án công nghệ..."
                    v-model="formData.reason"
                    class="w-full px-3 py-2.5 bg-slate-950 border border-slate-900 rounded-xl focus:bg-slate-900/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-xs font-medium text-slate-300 transition-all"
                  />
                </div>
              </div>

              <!-- Notification Alert box -->
              <div v-if="statusMsg" :class="['p-3 rounded-xl text-xs flex items-start gap-2 border', statusType === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400']">
                <AlertCircle v-if="statusType === 'error'" :size="14" class="mt-0.5 shrink-0" />
                <CheckCircle v-else :size="14" class="mt-0.5 shrink-0" />
                <span class="font-medium leading-normal">{{ statusMsg }}</span>
              </div>

              <!-- Submit Button -->
              <button
                type="submit"
                :disabled="isSubmitDisabled"
                class="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-0.5 disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
              >
                <Loader2 v-if="statusType === 'loading'" class="animate-spin" :size="14" />
                <span v-else>Xác Nhận Đăng Ký</span>
              </button>
            </form>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import { 
  ChevronLeft, LayoutGrid, Users, Monitor, BookOpen, 
  Wifi, Zap, Armchair, Sun, Coffee, Info, 
  Calendar as CalendarIcon, Clock, MapPin, CheckCircle, AlertCircle, Loader2
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

// Visual configs
const SEAT_TYPES_CONFIG = {
  'S': { label: 'Sofa Thư Giãn', desc: 'Ghế đệm êm ái, không gian thoải mái phù hợp đọc sách giải trí.', icon: Armchair, color: 'text-orange-400', bg: 'bg-orange-500/10', features: ['Đệm êm', 'Đèn vàng'] },
  'L': { label: 'Lounge Sofa', desc: 'Ghế bành sang trọng khu vực sảnh, thích hợp nghỉ ngơi ngắn.', icon: Armchair, color: 'text-orange-400', bg: 'bg-orange-500/10', features: ['Cao cấp', 'Thư giãn'] },
  'MT': { label: 'Máy Tính Tra Cứu', desc: 'Trang bị PC cấu hình cao, màn hình rộng phục vụ học tập & tra cứu.', icon: Monitor, color: 'text-cyan-400', bg: 'bg-cyan-500/10', features: ['PC i5/i7', 'Mạng LAN'] },
  'PC': { label: 'Workstation', desc: 'Cụm máy tính làm việc nhóm hoặc đồ họa.', icon: Monitor, color: 'text-cyan-400', bg: 'bg-cyan-500/10', features: ['Đồ họa', 'Màn hình lớn'] },
  'V': { label: 'Ghế View Cửa Sổ', desc: 'Bàn dài hướng ra cửa sổ, ánh sáng tự nhiên, khơi nguồn sáng tạo.', icon: Sun, color: 'text-emerald-400', bg: 'bg-emerald-500/10', features: ['View đẹp', 'Ánh sáng'] },
  'K': { label: 'Bàn Nhóm Nhỏ', desc: 'Bàn thấp thiết kế an toàn, phù hợp cho trẻ em hoặc nhóm nhỏ.', icon: Users, color: 'text-pink-400', bg: 'bg-pink-500/10', features: ['Nhóm 2-4', 'Thân thiện'] },
  'B': { label: 'Ghế Lười (Beanbag)', desc: 'Ngồi bệt thoải mái trên sàn gỗ, tự do sáng tạo.', icon: Coffee, color: 'text-purple-400', bg: 'bg-purple-500/10', features: ['Tự do', 'Sàn gỗ'] },
  'R': { label: 'Bàn Tròn Cafe', desc: 'Không gian mở kiểu Cafe, thích hợp thảo luận nhẹ.', icon: Coffee, color: 'text-amber-400', bg: 'bg-amber-500/10', features: ['Thảo luận', 'Thoáng'] },
  'Q': { label: 'Tra Cứu Nhanh', desc: 'Bàn đứng hoặc ghế cao, dành cho việc sử dụng nhanh < 30p.', icon: Zap, color: 'text-slate-400', bg: 'bg-slate-500/10', features: ['Nhanh chóng', 'Tiện lợi'] },
  'DEFAULT': { label: 'Bàn Học Tiêu Chuẩn', desc: 'Bàn gỗ cá nhân, có vách ngăn thấp đảm bảo sự riêng tư.', icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10', features: ['Ổ cắm', 'Đèn riêng'] }
}

const getSeatInfo = (seatName) => {
  if (!seatName) return null
  const prefix = seatName.match(/^([A-Z]+)/)?.[0] || 'DEFAULT'
  return SEAT_TYPES_CONFIG[prefix] || SEAT_TYPES_CONFIG['DEFAULT']
}

const getSeatIconComponent = (seatName) => {
  const info = getSeatInfo(seatName)
  return info?.icon || BookOpen
}

// State
const rooms = ref([])
const seats = ref([])
const isLoading = ref(true)
const selectedRoom = ref(null)
const selectedSeat = ref(null)

const formData = ref({
  bookingDate: new Date().toISOString().split('T')[0],
  startTime: '08:00',
  endTime: '10:00',
  reason: '',
  attendees: 1
})

const statusMsg = ref('')
const statusType = ref('') // 'loading', 'error', 'success'

const minDateStr = computed(() => {
  return new Date().toISOString().split('T')[0]
})

// Filtered items
const currentSeats = computed(() => {
  if (!selectedRoom.value) return []
  return seats.value.filter(s => s.phong?.maPhong === selectedRoom.value.maPhong || s.maphong === selectedRoom.value.maPhong)
})

const groupedSeats = computed(() => {
  return currentSeats.value.reduce((acc, seat) => {
    const match = seat.tenchongoi.match(/^([A-Z]+(\d)?)/)
    const groupKey = match ? match[1] : 'Khác'
    if (!acc[groupKey]) acc[groupKey] = []
    acc[groupKey].push(seat)
    return acc
  }, {})
})

const sortedGroups = computed(() => {
  return Object.keys(groupedSeats.value).sort()
})

const isSubmitDisabled = computed(() => {
  const isGroupRoom = selectedRoom.value?.loaiphong === 'phongHocNhom'
  if (isGroupRoom) {
    return statusType.value === 'loading'
  }
  return !selectedSeat.value || statusType.value === 'loading'
})

const seatInfo = computed(() => {
  return selectedSeat.value ? getSeatInfo(selectedSeat.value.tenchongoi) : null
})

// Methods
const selectRoom = (room) => {
  selectedRoom.value = room
  selectedSeat.value = null
  statusMsg.value = ''
  statusType.value = ''
}

const selectSeat = (seat) => {
  selectedSeat.value = seat
  statusMsg.value = ''
  statusType.value = ''
}

const isSeatDisabled = (seat) => {
  return seat.chongoitructiep || seat.trangthai === 'daDuocDat' || seat.trangthai === 'dangSuDung'
}

const getSeatClass = (seat) => {
  const isWalkIn = seat.chongoitructiep
  const isBooked = seat.trangthai === 'daDuocDat'
  const isInUse = seat.trangthai === 'dangSuDung'
  const isSelected = selectedSeat.value?.maChoNgoi === seat.maChoNgoi

  if (isWalkIn) return 'bg-slate-900 border-slate-900 text-slate-700 cursor-not-allowed border-dashed'
  if (isBooked) return 'bg-slate-800 border-slate-850 text-slate-600'
  if (isInUse) return 'bg-rose-950/20 border-rose-950/30 text-rose-500/80'

  if (isSelected) return 'bg-cyan-500 border-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 transform scale-[1.08] z-10'

  const name = seat.tenchongoi
  if (name.startsWith('S') || name.startsWith('L')) return 'bg-orange-950/20 border-orange-900/40 text-orange-400/80 hover:border-orange-500/50'
  if (name.startsWith('MT') || name.startsWith('PC')) return 'bg-cyan-950/20 border-cyan-900/40 text-cyan-400/80 hover:border-cyan-500/50'
  if (name.startsWith('V')) return 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400/80 hover:border-emerald-500/50'

  return 'bg-slate-950 border-slate-900 text-slate-400 hover:border-cyan-500/40 hover:text-cyan-400'
}

const handleFormSubmit = async () => {
  statusType.value = 'loading'
  statusMsg.value = 'Đang xử lý...'

  try {
    const start = new Date(`${formData.value.bookingDate}T${formData.value.startTime}:00`)
    const end = new Date(`${formData.value.bookingDate}T${formData.value.endTime}:00`)
    const now = new Date()

    if (start < now) {
      statusType.value = 'error'
      statusMsg.value = 'Thời gian bắt đầu phải từ thời điểm hiện tại trở đi.'
      return
    }
    if (end <= start) {
      statusType.value = 'error'
      statusMsg.value = 'Thời gian kết thúc phải sau thời gian bắt đầu.'
      return
    }

    // Load profile to find maBanDoc
    if (!authStore.user) {
      await authStore.fetchProfile()
    }
    const maBanDoc = authStore.user?.mabandoc || authStore.user?.maBanDoc
    
    if (!maBanDoc && selectedRoom.value?.loaiphong !== 'phongHocNhom') {
      statusType.value = 'error'
      statusMsg.value = 'Bạn chưa có hồ sơ bạn đọc hợp lệ. Vui lòng liên hệ thủ thư.'
      return
    }

    if (selectedSeat.value) {
      // Seat Booking
      const payload = {
        maChoNgoi: selectedSeat.value.maChoNgoi,
        maBanDoc: maBanDoc,
        thoiGianBatDau: start.toISOString(),
        thoiGianKetThuc: end.toISOString()
      }
      await axios.post(`${API_BASE_URL}/dat-cho-ngoi/`, payload)
    } else {
      // Room Booking
      const payload = {
        maPhong: selectedRoom.value.maPhong,
        nguoiToChuc: authStore.user?.hoten || authStore.user?.hoTen || 'Độc giả Web',
        soDienThoai: authStore.user?.sodienthoai || authStore.user?.soDienThoai || '0123456789',
        thoiGianBatDau: start.toISOString(),
        thoiGianKetThuc: end.toISOString(),
        mucDichSuDung: formData.value.reason || 'Họp học tập nhóm',
        soNguoiThamDuDuKien: formData.value.attendees
      }
      await axios.post(`${API_BASE_URL}/dat-phong/`, payload)
    }

    statusType.value = 'success'
    statusMsg.value = 'Đặt chỗ thành công! Đang chuyển hướng về Hộp thư...'
    setTimeout(() => {
      router.push('/thong_bao')
    }, 1500)

  } catch (err) {
    console.error('Lỗi khi đặt chỗ/phòng:', err)
    statusType.value = 'error'
    statusMsg.value = err.response?.data?.detail || 'Lỗi hệ thống: ' + err.message
  }
}

const loadData = async () => {
  try {
    const [roomsRes, seatsRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/phong/`),
      axios.get(`${API_BASE_URL}/cho-ngoi/`)
    ])

    rooms.value = roomsRes.data || []
    seats.value = seatsRes.data || []

    if (rooms.value.length > 0) {
      selectedRoom.value = rooms.value[0]
    }
  } catch (error) {
    console.error('Lỗi tải dữ liệu phòng & ghế:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
