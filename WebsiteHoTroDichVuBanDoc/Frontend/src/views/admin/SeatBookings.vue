<template>
  <div class="space-y-6 animate-fade-in pb-20">
    
    <!-- Header with Toggle Tabs -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-white pt-4">
      <div>
        <h1 class="text-2xl font-bold">Quản lý Đặt Chỗ & Phòng</h1>
        <p class="text-xs text-blue-200 mt-1">Theo dõi, duyệt yêu cầu phòng họp và xác nhận check-in chỗ ngồi cho bạn đọc.</p>
      </div>

      <div class="flex bg-slate-900/60 p-1 rounded-xl border border-slate-800">
        <button
          @click="activeTab = 'seats'"
          :class="[
            'px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2',
            activeTab === 'seats' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
          ]"
        >
          <LayoutGrid :size="14" /> Đặt Chỗ Ngồi
        </button>
        <button
          @click="activeTab = 'rooms'"
          :class="[
            'px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2',
            activeTab === 'rooms' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
          ]"
        >
          <Users :size="14" /> Đặt Phòng Họp
        </button>
      </div>
    </div>

    <!-- Data Table Container -->
    <div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <!-- Toolbar -->
      <div class="p-4 border-b border-gray-100 flex gap-4">
        <div class="relative flex-1 max-w-md">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="16" />
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Tìm kiếm theo mã đặt lịch hoặc số điện thoại..."
            class="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          />
        </div>
        <button class="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100 flex items-center gap-2">
          <Filter :size="16" /> Lọc trạng thái
        </button>
      </div>

      <!-- Table Loader -->
      <div v-if="isLoading" class="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
        <Loader2 class="animate-spin text-blue-600" :size="28" />
        <span class="text-xs">Đang tải dữ liệu đặt lịch...</span>
      </div>

      <!-- Table Content -->
      <div v-else class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50/50 text-gray-400 text-[10px] font-extrabold uppercase tracking-wider">
              <th class="p-4">Mã Đặt</th>
              <th class="p-4">Thông tin Bạn đọc / Người đặt</th>
              <th class="p-4">{{ activeTab === 'seats' ? 'Mã Chỗ' : 'Mã Phòng' }}</th>
              <th class="p-4">Thời gian</th>
              <th v-if="activeTab === 'rooms'" class="p-4">Mục đích</th>
              <th class="p-4">Trạng thái</th>
              <th class="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 text-xs text-gray-700">
            <tr v-for="item in filteredItems" :key="item.maDatCho || item.maDatPhong" class="hover:bg-blue-50/30 transition-colors group">
              <td class="p-4 font-bold text-blue-600">
                #{{ activeTab === 'seats' ? (item.maDatCho || item.madatcho) : (item.maDatPhong || item.madatphong) }}
              </td>

              <td class="p-4">
                <div class="font-extrabold text-gray-800">
                  {{ activeTab === 'seats' ? `Bạn đọc #${item.maBanDoc || item.mabandoc}` : (item.nguoiToChuc || item.nguoitochuc || 'Khách đăng ký') }}
                </div>
                <div class="text-[10px] text-gray-400 mt-0.5">
                  {{ item.soDienThoai || item.sodienthoai || 'Không có số điện thoại' }}
                </div>
              </td>

              <td class="p-4 font-mono text-[10px]">
                <span class="bg-gray-150 text-gray-700 px-2.5 py-1 rounded-md font-bold">
                  {{ activeTab === 'seats' ? `SEAT-${item.maChoNgoi || item.machongoi}` : `ROOM-${item.maPhong || item.maphong}` }}
                </span>
              </td>

              <td class="p-4">
                <div class="flex items-center gap-1.5 text-gray-600 font-semibold">
                  <Calendar :size="12" /> {{ formatDate(item.thoiGianBatDau || item.thoigianbatdau) }}
                </div>
                <div class="flex items-center gap-1.5 text-gray-400 text-[10px] mt-1">
                  <Clock :size="10" />
                  {{ formatTime(item.thoiGianBatDau || item.thoigianbatdau) }} - {{ formatTime(item.thoiGianKetThuc || item.thoigianketthuc) }}
                </div>
              </td>

              <td v-if="activeTab === 'rooms'" class="p-4 text-gray-600 truncate max-w-[200px]" :title="item.mucDichSuDung || item.mucdichsudung">
                {{ item.mucDichSuDung || item.mucdichsudung || '---' }}
              </td>

              <td class="p-4">
                <span :class="['px-2.5 py-1 rounded-full text-[10px] font-bold', getStatusClass(item.trangThaiDatCho || item.trangThai || item.trangthaimuon)]">
                  {{ getStatusLabel(item.trangThaiDatCho || item.trangThai || item.trangthaimuon) }}
                </span>
              </td>

              <td class="p-4 text-right">
                <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <template v-if="activeTab === 'seats'">
                    <button
                      v-if="(item.trangThaiDatCho || item.trangthaimuon) === 'kichHoat'"
                      @click="handleSeatAction('checkin', item.maDatCho || item.madatcho)"
                      class="p-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg"
                      title="Xác nhận Check-in"
                    >
                      <CheckCircle :size="16" />
                    </button>
                    <button
                      v-if="(item.trangThaiDatCho || item.trangthaimuon) === 'kichHoat'"
                      @click="handleSeatAction('cancel', item.maDatCho || item.madatcho)"
                      class="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg"
                      title="Hủy đặt chỗ"
                    >
                      <XCircle :size="16" />
                    </button>
                  </template>

                  <template v-else>
                    <button
                      v-if="(item.trangThai || item.trangthaidatphong) === 'dangChoDuyet'"
                      @click="handleRoomAction('approve', item.maDatPhong || item.madatphong)"
                      class="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg"
                      title="Phê duyệt phòng"
                    >
                      <CheckCircle :size="16" />
                    </button>
                    <button
                      v-if="['dangChoDuyet', 'daDuyet', 'kichHoat'].includes(item.trangThai || item.trangthaidatphong)"
                      @click="handleRoomAction('cancel', item.maDatPhong || item.madatphong)"
                      class="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg"
                      title="Hủy / Từ chối phòng"
                    >
                      <XCircle :size="16" />
                    </button>
                  </template>
                </div>
              </td>
            </tr>

            <tr v-if="filteredItems.length === 0">
              <td :colspan="activeTab === 'rooms' ? 7 : 6" class="p-10 text-center text-gray-400 italic">
                Không tìm thấy dữ liệu đặt lịch phù hợp.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../../stores/auth'
import { LayoutGrid, Users, CheckCircle, XCircle, Clock, Search, Filter, Calendar, Loader2 } from 'lucide-vue-next'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
const authStore = useAuthStore()

const activeTab = ref('seats')
const seatBookings = ref([])
const roomBookings = ref([])
const isLoading = ref(true)
const searchQuery = ref('')

// Load staff profile to verify ID
const staffId = computed(() => {
  return authStore.user?.maNhanVien || authStore.user?.ma_nhan_vien || authStore.user?.manhanvien || 1
})

const loadBookings = async () => {
  isLoading.value = true
  try {
    const [seatsRes, roomsRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/dat-cho-ngoi/`),
      axios.get(`${API_BASE_URL}/dat-phong/`)
    ])
    seatBookings.value = seatsRes.data || []
    roomBookings.value = roomsRes.data || []
  } catch (e) {
    console.error('Lỗi lấy danh sách đặt lịch quản trị:', e)
  } finally {
    isLoading.value = false
  }
}

const filteredItems = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const list = activeTab.value === 'seats' ? seatBookings.value : roomBookings.value
  
  if (!query) return list

  return list.filter(item => {
    const id = String(item.maDatCho || item.madatcho || item.maDatPhong || item.madatphong || '')
    const phone = String(item.soDienThoai || item.sodienthoai || '').toLowerCase()
    const name = String(item.nguoiToChuc || item.nguoitochuc || '').toLowerCase()
    
    return id.includes(query) || phone.includes(query) || name.includes(query)
  })
})

const handleSeatAction = async (action, id) => {
  if (!confirm(`Bạn chắc chắn muốn thực hiện hành động này?`)) return
  try {
    if (action === 'checkin') {
      const payload = { maNhanVien: staffId.value }
      await axios.post(`${API_BASE_URL}/dat-cho-ngoi/${id}/check-in`, payload)
    } else if (action === 'cancel') {
      const payload = { trangThaiDatCho: 'daHuy' }
      await axios.put(`${API_BASE_URL}/dat-cho-ngoi/${id}`, payload)
    }
    alert('Thành công!')
    loadBookings()
  } catch (e) {
    console.error('Seat action error:', e)
    alert('Thao tác thất bại: ' + (e.response?.data?.detail || e.message))
  }
}

const handleRoomAction = async (action, id) => {
  if (!confirm(`Bạn chắc chắn muốn thực hiện hành động này?`)) return
  try {
    if (action === 'approve') {
      const payload = { maNhanVien: staffId.value }
      await axios.post(`${API_BASE_URL}/dat-phong/${id}/duyet`, payload)
    } else if (action === 'cancel') {
      const payload = { trangThai: 'daHuy' }
      await axios.put(`${API_BASE_URL}/dat-phong/${id}`, payload)
    }
    alert('Thành công!')
    loadBookings()
  } catch (e) {
    console.error('Room action error:', e)
    alert('Thao tác thất bại: ' + (e.response?.data?.detail || e.message))
  }
}

const getStatusClass = (status) => {
  const styles = {
    'kichHoat': 'bg-green-50 border border-green-200 text-green-700',
    'daHuy': 'bg-red-50 border border-red-200 text-red-600',
    'dangChoDuyet': 'bg-amber-50 border border-amber-200 text-amber-600',
    'daDuyet': 'bg-blue-50 border border-blue-200 text-blue-700',
    'hoanThanh': 'bg-slate-50 border border-slate-200 text-slate-500',
  }
  return styles[status] || 'bg-slate-50 border border-slate-200 text-slate-500'
}

const getStatusLabel = (status) => {
  const labels = {
    'kichHoat': 'Đã đặt',
    'daHuy': 'Đã hủy',
    'dangChoDuyet': 'Chờ duyệt',
    'daDuyet': 'Đã duyệt',
    'hoanThanh': 'Đã dùng xong'
  }
  return labels[status] || status
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

const formatTime = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

watch(activeTab, () => {
  searchQuery.value = ''
})

onMounted(() => {
  loadBookings()
})
</script>
