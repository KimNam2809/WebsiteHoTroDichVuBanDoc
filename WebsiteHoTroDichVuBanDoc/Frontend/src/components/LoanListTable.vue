<template>
  <div class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
    <!-- Header của bảng -->
    <div class="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
      <h2 class="text-lg font-bold text-gray-800">{{ title }}</h2>
      <span class="text-sm text-gray-500">{{ loans.length }} bản ghi</span>
    </div>

    <div v-if="loans.length === 0" class="p-12 text-center text-gray-500 italic">
      {{ emptyMessage }}
    </div>
    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tài liệu</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày mượn</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hạn trả / Ngày trả</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Chi tiết</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="loan in loans" :key="loan.mamuontra" class="hover:bg-blue-50 transition-colors">
            <td class="px-6 py-4">
              <div class="text-sm font-bold text-gray-900">{{ loan.tentacpham }}</div>
              <div class="text-xs text-gray-500 font-mono flex items-center gap-1">
                <Hash :size="10"/> {{ loan.mabansaonoibo }}
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
              {{ formatDate(loan.ngaymuon) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
              {{ loan.trangthai === 'daTra' ? formatDate(loan.ngaytrathucte) : formatDate(loan.ngaytradukien) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span v-html="getStatusBadge(loan.trangthai)"></span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
              <button
                @click="openDetails(loan)"
                class="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-100 transition-colors"
                title="Xem chi tiết"
              >
                <Eye :size="18" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- === MODAL CHI TIẾT === -->
    <Teleport to="body">
      <div v-if="selectedLoan" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
          <!-- Modal Header -->
          <div class="flex justify-between items-center p-5 border-b bg-gray-50">
            <h3 class="text-xl font-bold text-gray-800">Phiếu mượn #{{ selectedLoan.mamuontra }}</h3>
            <button @click="closeDetails" class="text-gray-400 hover:text-gray-600">
              <X :size="24" />
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6 space-y-6 overflow-y-auto custom-scrollbar">
            <!-- Thông tin sách -->
            <div class="flex items-start gap-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div class="p-3 bg-white rounded-full shadow-sm">
                <Book class="text-blue-600 w-6 h-6" />
              </div>
              <div>
                <p class="text-xs text-blue-600 font-bold uppercase mb-1">Tài liệu</p>
                <p class="font-bold text-lg text-gray-800 leading-tight">{{ selectedLoan.tentacpham }}</p>
                <p class="text-sm text-gray-600 mt-1 font-mono">Mã bản sao: {{ selectedLoan.mabansaonoibo }}</p>
              </div>
            </div>

            <!-- Lưới thông tin thời gian -->
            <div class="grid grid-cols-2 gap-6">
              <div>
                <p class="text-gray-500 text-xs uppercase font-semibold mb-1">Ngày mượn</p>
                <p class="font-medium text-gray-900 flex items-center gap-2">
                  <Calendar :size="16" class="text-gray-400"/> {{ formatDate(selectedLoan.ngaymuon) }}
                </p>
              </div>
              <div>
                <p class="text-gray-500 text-xs uppercase font-semibold mb-1">Hạn trả</p>
                <p class="font-medium text-gray-900 flex items-center gap-2">
                  <Clock :size="16" class="text-gray-400"/> {{ formatDate(selectedLoan.ngaytradukien) }}
                </p>
              </div>

              <div v-if="selectedLoan.trangthai === 'daTra'" class="col-span-2 border-t pt-4">
                <p class="text-gray-500 text-xs uppercase font-semibold mb-1">Ngày trả thực tế</p>
                <p class="font-medium flex items-center gap-2 text-green-700 text-lg">
                  <CheckCircle :size="20"/> {{ formatDate(selectedLoan.ngaytrathucte) }}
                </p>
              </div>

              <div v-if="selectedLoan.tienphat > 0" class="col-span-2 bg-red-50 p-4 rounded-lg border border-red-100 flex items-center justify-between mt-2">
                <div class="flex items-center gap-2 text-red-700">
                  <AlertCircle :size="20" />
                  <span class="font-bold">Tiền phạt vi phạm</span>
                </div>
                <span class="font-bold text-red-700 text-xl">{{ formatCurrency(selectedLoan.tienphat) }}</span>
              </div>
            </div>

            <!-- KHU VỰC GIA HẠN -->
            <div v-if="selectedLoan.trangthai === 'daMuon'" class="mt-4 border-t border-gray-100 pt-6">
              <button
                v-if="!isRenewing"
                @click="isRenewing = true"
                class="w-full py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-all"
              >
                <RefreshCw :size="18" /> Đăng ký Gia hạn
              </button>

              <form v-else @submit.prevent="handleRenewSubmit" class="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div class="flex justify-between items-center">
                  <h4 class="font-bold text-gray-800 flex items-center gap-2">
                    <RefreshCw :size="18" class="text-blue-600"/> Gia hạn tài liệu
                  </h4>
                  <button type="button" @click="isRenewing = false" class="text-gray-400 hover:text-red-500">
                    <X :size="18" />
                  </button>
                </div>

                <!-- Chọn ngày -->
                <div class="space-y-1">
                  <label class="text-sm font-semibold text-gray-700">Gia hạn đến ngày:</label>
                  <input
                    type="date"
                    required
                    v-model="renewDate"
                    :min="todayDateStr"
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  />
                </div>

                <!-- Lý do -->
                <div class="space-y-1">
                  <label class="text-sm font-semibold text-gray-700">Lý do (Tùy chọn):</label>
                  <textarea
                    v-model="renewReason"
                    placeholder="Ví dụ: Chưa đọc xong..."
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white h-20 resize-none"
                  />
                </div>

                <!-- Thông báo lỗi/thành công -->
                <div v-if="message" :class="[
                  'p-3 rounded-lg text-sm font-medium flex items-center gap-2',
                  message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                ]">
                  <CheckCircle v-if="message.type === 'success'" :size="16"/>
                  <AlertCircle v-else :size="16"/>
                  {{ message.text }}
                </div>

                <!-- Buttons Action -->
                <div class="flex gap-3 pt-2">
                  <button
                    type="button"
                    @click="isRenewing = false"
                    class="flex-1 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    :disabled="loading"
                    class="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    <span v-if="loading">Đang xử lý...</span>
                    <span v-else class="flex items-center gap-1"><Save :size="18"/> Xác nhận</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="p-5 border-t bg-gray-50 flex justify-end">
            <button
              @click="closeDetails"
              class="px-6 py-2.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium shadow-sm transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import axios from 'axios'
import { Eye, X, Calendar, Book, AlertCircle, CheckCircle, Clock, Hash, RefreshCw, Save } from 'lucide-vue-next'

const props = defineProps({
  loans: {
    type: Array,
    default: () => []
  },
  title: {
    type: String,
    default: ''
  },
  emptyMessage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['renew-success'])

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const selectedLoan = ref(null)
const isRenewing = ref(false)
const renewDate = ref('')
const renewReason = ref('')
const loading = ref(false)
const message = ref(null)

const todayDateStr = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const formatCurrency = (amount) => {
  if (!amount) return '0 VNĐ'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

const formatDate = (dateString) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('vi-VN')
}

const formatDateForInput = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

const openDetails = (loan) => {
  selectedLoan.value = loan
}

const closeDetails = () => {
  selectedLoan.value = null
}

watch(selectedLoan, (newVal) => {
  if (newVal) {
    isRenewing.value = false
    message.value = null
    renewReason.value = ''
    
    if (newVal.ngaytradukien) {
      const nextWeek = new Date(newVal.ngaytradukien)
      nextWeek.setDate(nextWeek.getDate() + 7)
      renewDate.value = formatDateForInput(nextWeek)
    }
  }
})

const handleRenewSubmit = async () => {
  loading.value = true
  message.value = null

  try {
    const payload = {
      maMuonTra: selectedLoan.value.mamuontra,
      maNhanVien: null,
      ngayTraMoi: renewDate.value,
      lyDoGiaHan: renewReason.value || "Gia hạn trực tuyến"
    }

    const response = await axios.post(`${API_BASE_URL}/gia-han/`, payload)
    
    if (response.status === 200 || response.status === 201) {
      message.value = { type: 'success', text: 'Gia hạn thành công!' }
      emit('renew-success')
      setTimeout(() => {
        isRenewing.value = false
        closeDetails()
        window.location.reload()
      }, 1500)
    }
  } catch (error) {
    console.error("Lỗi gia hạn:", error)
    message.value = { type: 'error', text: error.response?.data?.detail || "Gia hạn thất bại. Vui lòng thử lại." }
  } finally {
    loading.value = false
  }
}

const getStatusBadge = (status) => {
  switch (status) {
    case 'daMuon': 
      return '<span class="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Đang mượn</span>'
    case 'quaHan': 
      return '<span class="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">Quá hạn</span>'
    case 'daTra': 
      return '<span class="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">Đã trả</span>'
    default: 
      return `<span class="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">${status}</span>`
  }
}
</script>
