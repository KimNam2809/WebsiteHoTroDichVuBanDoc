<template>
  <div class="animate-fade-in">
    <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
      <div class="p-2 bg-purple-100 rounded-lg"><BookOpen class="text-purple-600" :size="20" /></div>
      Danh sách bản sao vật lý
    </h3>

    <div class="overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-100">
          <thead class="bg-gray-50/50">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mã bản sao</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Vị trí lưu trữ</th>
              <th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
              <th class="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 bg-white">
            <tr v-if="copies.length === 0">
              <td colSpan="4" class="px-6 py-12 text-center text-gray-500">
                <div class="flex flex-col items-center gap-2">
                  <Info :size="32" class="text-gray-300" />
                  <p>Chưa có bản sao nào được cập nhật.</p>
                </div>
              </td>
            </tr>
            <tr v-else v-for="copy in copies" :key="copy.mabansao" class="hover:bg-gray-50/80 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg text-sm border border-blue-100">
                  {{ copy.mabansaonoibo }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                <div class="flex items-center gap-2 font-medium">
                  <MapPin :size="16" class="text-gray-400" /> {{ copy.vitri }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span v-if="isBorrowedByMe(copy.mabansao)" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                  <UserCheck :size="14" class="mr-1.5" /> Bạn đang giữ
                </span>
                <span v-else-if="copy.trangthaichomuon" class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                  <Check :size="14" class="mr-1.5" /> Có sẵn
                </span>
                <span v-else class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                  <Lock :size="14" class="mr-1.5" /> Đã mượn
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right">
                <button v-if="isBorrowedByMe(copy.mabansao)" disabled class="text-sm font-semibold text-blue-600/50 cursor-not-allowed flex items-center gap-1 ml-auto">
                  <UserCheck :size="16" /> Đang sở hữu
                </button>
                <button
                  v-else-if="isReservedByMe(copy.mabansao) === 'hoanThanh'"
                  @click="openBorrowModal(copy)"
                  class="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all ml-auto animate-pulse"
                >
                  Mượn ngay
                </button>
                <button v-else-if="isReservedByMe(copy.mabansao) === 'kichHoat'" disabled class="px-4 py-2 bg-yellow-50 text-yellow-700 text-sm font-bold rounded-xl border border-yellow-200 cursor-not-allowed flex items-center gap-2 ml-auto opacity-80">
                  <BookmarkCheck :size="16" /> Bạn đã đặt trước
                </button>
                <button
                  v-else-if="copy.trangthaichomuon"
                  @click="openBorrowModal(copy)"
                  class="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all ml-auto"
                >
                  Mượn ngay
                </button>
                <button
                  v-else
                  @click="openReserveModal(copy)"
                  class="px-4 py-2 bg-orange-100 text-orange-700 text-sm font-bold rounded-xl border border-orange-200 hover:bg-orange-200 transition-all flex items-center gap-2 ml-auto"
                >
                  <CalendarClock :size="16" /> Đặt trước
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Borrow Modal Overlay -->
    <Teleport to="body">
      <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" @click="isModalOpen = false"></div>
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-fade-in">
          <button @click="isModalOpen = false" class="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X :size="20" />
          </button>
          <div class="p-6 sm:p-8">
            <div class="text-center mb-6">
              <div class="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-100">
                <BookOpen class="text-purple-600" :size="28" />
              </div>
              <h3 class="text-2xl font-bold text-gray-900">Xác nhận mượn sách</h3>
              <p class="text-sm text-gray-500 mt-2">Vui lòng kiểm tra kỹ thông tin trước khi xác nhận.</p>
            </div>

            <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6">
              <div class="flex justify-between items-center mb-3 pb-3 border-b border-gray-200 border-dashed">
                <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Mã bản sao</span>
                <span class="font-mono font-bold text-lg text-gray-900">{{ selectedCopy?.mabansaonoibo }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs font-bold text-gray-500 uppercase tracking-wider">Vị trí</span>
                <div class="flex items-center gap-1 text-sm font-medium text-gray-700 bg-white px-2 py-1 rounded border border-gray-200">
                  <MapPin :size="14" class="text-purple-500" />{{ selectedCopy?.vitri }}
                </div>
              </div>
            </div>

            <div class="mb-8">
              <label class="block text-sm font-bold text-gray-700 mb-2">Hạn trả sách dự kiến <span class="text-red-500">*</span></label>
              <div class="relative group">
                <input type="date" v-model="returnDate" :min="todayDateStr" class="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none pl-12 font-medium text-gray-700 bg-white transition-all group-hover:border-purple-300" />
                <Calendar class="absolute left-4 top-3.5 text-gray-400 group-hover:text-purple-500 transition-colors" :size="20" />
              </div>
              <p class="text-xs text-gray-500 mt-2 flex items-center gap-1"><Info :size="12" /> Quá hạn trả sách sẽ bị tính phí phạt theo quy định.</p>
            </div>

            <div class="flex gap-3">
              <button @click="isModalOpen = false" :disabled="isSubmitting" class="flex-1 px-5 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 hover:text-gray-900 transition-colors">Hủy bỏ</button>
              <button @click="handleBorrow" :disabled="isSubmitting" class="flex-1 px-5 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                <Loader2 v-if="isSubmitting" class="animate-spin w-5 h-5" />
                <span v-else>Xác nhận</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Reserve Modal Overlay -->
    <Teleport to="body">
      <div v-if="isReserveModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" @click="isReserveModalOpen = false"></div>
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative z-10 animate-fade-in">
          <div class="p-6 text-center">
            <div class="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-100">
              <CalendarClock class="text-orange-600" :size="28" />
            </div>
            <h3 class="text-xl font-bold text-gray-900">Đặt trước tài liệu</h3>
            <p class="text-sm text-gray-500 mt-2">
              Bản sao <strong>{{ selectedCopy?.mabansaonoibo }}</strong> đang được mượn. Bạn có muốn đặt hàng chờ không?
            </p>
            <div class="mt-6 flex gap-3">
              <button @click="isReserveModalOpen = false" class="flex-1 px-4 py-3 rounded-xl border font-bold text-gray-600 hover:bg-gray-50">Hủy</button>
              <button
                @click="handleReserve"
                :disabled="isSubmitting"
                class="flex-1 px-4 py-3 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 flex justify-center items-center gap-2"
              >
                <Loader2 v-if="isSubmitting" class="animate-spin w-5 h-5" />
                <span v-else>Xác nhận</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Success Modals -->
    <Teleport to="body">
      <div v-if="showSuccessModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" @click="showSuccessModal = false"></div>
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm text-center overflow-hidden relative z-10 animate-fade-in">
          <div class="h-2 w-full bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500"></div>
          <div class="p-8 pb-6">
            <div class="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-100">
              <Check class="w-10 h-10 text-green-600" :stroke-width="3" />
            </div>
            <h2 class="text-2xl font-extrabold text-gray-900 mb-2">Đăng ký thành công!</h2>
            <p class="text-gray-600 leading-relaxed">Bạn đã đăng ký mượn cuốn sách <br /><span class="inline-block mt-1 font-mono font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">{{ selectedCopy?.mabansaonoibo }}</span></p>
          </div>
          <div class="px-8 pb-8">
            <div class="bg-blue-50 text-blue-800 text-sm p-4 rounded-xl mb-6 text-left border border-blue-100 flex gap-3 items-start">
              <Info class="shrink-0 text-blue-600 mt-0.5" :size="18" />
              <div><strong>Bước tiếp theo:</strong> Vui lòng đến quầy thủ thư để nhận sách. Mang theo thẻ thành viên hoặc mã QR trên ứng dụng.</div>
            </div>
            <button @click="showSuccessModal = false" class="w-full py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95">Đã hiểu, cảm ơn!</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showSuccessModalReserve" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" @click="showSuccessModalReserve = false"></div>
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm text-center overflow-hidden relative z-10 animate-fade-in">
          <div class="h-2 w-full bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500"></div>
          <div class="p-8 pb-6">
            <div class="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-100">
              <Check class="w-10 h-10 text-green-600" :stroke-width="3" />
            </div>
            <h2 class="text-2xl font-extrabold text-gray-900 mb-2">Đặt trước thành công!</h2>
            <p class="text-gray-600 leading-relaxed">Bạn đã đặt trước cuốn sách <br /><span class="inline-block mt-1 font-mono font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">{{ selectedCopy?.mabansaonoibo }}</span></p>
          </div>
          <div class="px-8 pb-8">
            <div class="bg-blue-50 text-blue-800 text-sm p-4 rounded-xl mb-6 text-left border border-blue-100 flex gap-3 items-start">
              <Info class="shrink-0 text-blue-600 mt-0.5" :size="18" />
              <div><strong>Bước tiếp theo:</strong> Bạn sẽ nhận được thông báo khi sách được trả lại và sẵn sàng để nhận tại quầy.</div>
            </div>
            <button @click="showSuccessModalReserve = false" class="w-full py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95">Đã hiểu, cảm ơn!</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import { Calendar, Check, Loader2, BookOpen, UserCheck, Lock, MapPin, X, Info, CalendarClock, BookmarkCheck } from 'lucide-vue-next'

const props = defineProps({
  copies: {
    type: Array,
    required: true
  },
  initialOwnedIds: {
    type: Array,
    default: () => []
  },
  initialReservedIds: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['refresh'])

const authStore = useAuthStore()
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const selectedCopy = ref(null)
const returnDate = ref('')
const isModalOpen = ref(false)
const isReserveModalOpen = ref(false)
const isSubmitting = ref(false)
const showSuccessModal = ref(false)
const showSuccessModalReserve = ref(false)

const myBorrowedCopyIds = ref(new Set(props.initialOwnedIds.map(id => String(id))))
const myReservedCopyIds = ref(new Map(props.initialReservedIds.map(item => [String(item.id), item.status])))

const todayDateStr = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const defaultReturnDate = () => {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return d.toISOString().split('T')[0]
}

const openBorrowModal = (copy) => {
  selectedCopy.value = copy
  returnDate.value = defaultReturnDate()
  isModalOpen.value = true
}

const openReserveModal = (copy) => {
  selectedCopy.value = copy
  isReserveModalOpen.value = true
}

const isBorrowedByMe = (copyId) => {
  return myBorrowedCopyIds.value.has(String(copyId))
}

const isReservedByMe = (copyId) => {
  return myReservedCopyIds.value.get(String(copyId))
}

const handleBorrow = async () => {
  if (!returnDate.value) return alert('Vui lòng chọn ngày trả.')
  isSubmitting.value = true

  try {
    if (!authStore.user?.mabandoc) {
      await authStore.fetchProfile()
    }
    const maBanDoc = authStore.user?.mabandoc
    if (!maBanDoc) {
      alert('Bạn chưa có thẻ bạn đọc hợp lệ hoặc hồ sơ chưa được duyệt.')
      isSubmitting.value = false
      return
    }

    const payload = {
      maBanSao: selectedCopy.value.mabansao,
      maBanDoc: maBanDoc,
      maNhanVien: null,
      ngayTra: returnDate.value
    }

    await axios.post(`${API_BASE_URL}/muon-tra/`, payload)
    
    isModalOpen.value = false
    showSuccessModal.value = true
    myBorrowedCopyIds.value.add(String(selectedCopy.value.mabansao))
    myReservedCopyIds.value.delete(String(selectedCopy.value.mabansao))
    emit('refresh')
  } catch (error) {
    console.error('Lỗi mượn sách:', error)
    alert(error.response?.data?.detail || 'Lỗi khi mượn sách. Vui lòng thử lại.')
  } finally {
    isSubmitting.value = false
  }
}

const handleReserve = async () => {
  isSubmitting.value = true
  try {
    if (!authStore.user?.mabandoc) {
      await authStore.fetchProfile()
    }
    const maBanDoc = authStore.user?.mabandoc
    if (!maBanDoc) {
      alert('Tài khoản chưa có hồ sơ bạn đọc.')
      isSubmitting.value = false
      return
    }

    const payload = {
      maBanSao: selectedCopy.value.mabansao,
      maBanDoc: maBanDoc
    }

    await axios.post(`${API_BASE_URL}/dat-truoc/?maBanDoc=${maBanDoc}`, payload)
    
    isReserveModalOpen.value = false
    myReservedCopyIds.value.set(String(selectedCopy.value.mabansao), 'kichHoat')
    showSuccessModalReserve.value = true
    emit('refresh')
  } catch (error) {
    console.error('Lỗi đặt trước:', error)
    alert(error.response?.data?.detail || 'Lỗi khi đặt trước.')
  } finally {
    isSubmitting.value = false
  }
}
</script>
