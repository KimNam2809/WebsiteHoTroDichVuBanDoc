<template>
  <div class="space-y-6 animate-fade-in pb-20">
    <!-- Header -->
    <div class="flex justify-between items-center text-white pt-4">
      <div>
        <h1 class="text-3xl font-extrabold flex items-center gap-3">
          <Settings class="text-cyan-400" :size="32" />
          Cấu hình hệ thống
        </h1>
        <p class="text-blue-100 text-sm mt-1">Thiết lập các tham số vận hành cho toàn bộ thư viện.</p>
      </div>

      <button
        @click="handleSave"
        :disabled="isSaving || isLoading"
        class="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl shadow-lg hover:shadow-cyan-500/10 transition-all disabled:opacity-50"
      >
        <Loader2 v-if="isSaving" class="animate-spin" :size="20" />
        <Save v-else :size="20" />
        <span>{{ isSaving ? 'Đang lưu...' : 'Lưu thay đổi' }}</span>
      </button>
    </div>

    <!-- Tabs Menu -->
    <div class="flex gap-2 border-b border-slate-200/10">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          'flex items-center gap-2 px-6 py-3 font-bold text-sm transition-all border-b-2',
          activeTab === tab.id
            ? 'border-cyan-500 text-cyan-400 bg-white/5 rounded-t-lg'
            : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5 rounded-t-lg'
        ]"
      >
        <component :is="tab.icon" :size="16" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl flex flex-col items-center justify-center min-h-[300px]">
      <Loader2 class="animate-spin text-blue-600 mb-2" :size="32" />
      <span class="text-sm text-gray-500">Đang tải cấu hình hệ thống...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="errorMsg" class="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl text-center text-red-500">
      {{ errorMsg }}
    </div>

    <!-- Form Content -->
    <div v-else class="bg-white p-8 rounded-b-2xl rounded-tr-2xl shadow-xl shadow-blue-900/5 border border-gray-100">
      <!-- 1. GENERAL TAB -->
      <div v-if="activeTab === 'general'" class="space-y-6 max-w-2xl">
        <div>
          <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Tên thư viện</label>
          <input
            type="text"
            v-model="config.general.libraryName"
            class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium text-gray-800 transition-all"
          />
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Email liên hệ</label>
          <input
            type="email"
            v-model="config.general.emailContact"
            class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium text-gray-800 transition-all"
          />
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Giờ hoạt động</label>
          <input
            type="text"
            v-model="config.general.workingHours"
            class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-medium text-gray-800 transition-all"
          />
        </div>
      </div>

      <!-- 2. LOANS TAB -->
      <div v-if="activeTab === 'loans'" class="space-y-8 max-w-3xl">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Số sách tối đa được mượn</label>
            <div class="relative">
              <input
                type="number"
                v-model.number="config.loans.maxBooksPerUser"
                class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-bold font-mono text-gray-800"
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">cuốn / lần</span>
            </div>
            <p class="text-[10px] text-gray-400 mt-2">Giới hạn số lượng tài liệu mượn cùng lúc cho mỗi bạn đọc.</p>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Thời hạn mượn mặc định</label>
            <div class="relative">
              <input
                type="number"
                v-model.number="config.loans.loanDurationDays"
                class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-bold font-mono text-gray-800"
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">ngày</span>
            </div>
            <p class="text-[10px] text-gray-400 mt-2">Số ngày mượn tối đa cho một cuốn sách giấy.</p>
          </div>
        </div>

        <div class="p-6 bg-blue-50/50 border border-blue-100 rounded-2xl">
          <h3 class="font-bold text-blue-800 text-sm mb-4 flex items-center gap-2">
            <Clock :size="16" /> Chính sách gia hạn tự động
          </h3>
          <div class="flex items-center gap-6 flex-wrap">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                v-model="config.loans.allowRenewal"
                class="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <span class="font-semibold text-xs text-gray-700 uppercase tracking-wider">Cho phép gia hạn</span>
            </label>

            <div v-if="config.loans.allowRenewal" class="flex items-center gap-2 animate-fade-in">
              <span class="text-xs font-medium text-gray-600">Thêm tối đa:</span>
              <input
                type="number"
                v-model.number="config.loans.renewalDays"
                class="w-20 px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-center font-bold text-gray-800 focus:ring-2 focus:ring-blue-500"
              />
              <span class="text-xs font-medium text-gray-600">ngày</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. FINES TAB -->
      <div v-if="activeTab === 'fines'" class="space-y-6 max-w-2xl">
        <div class="p-6 bg-red-50/40 border border-red-100 rounded-2xl">
          <h3 class="font-bold text-red-800 text-sm mb-4 flex items-center gap-2">
            <DollarSign :size="16" /> Phí phạt quá hạn
          </h3>
          <div>
            <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Số tiền phạt / ngày quá hạn / sách</label>
            <div class="relative">
              <input
                type="number"
                v-model.number="config.fines.overdueFinePerDay"
                class="w-full px-4 py-3 bg-white border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none font-bold font-mono text-red-600"
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 text-red-400 text-xs font-medium">VNĐ</span>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Hệ số phạt mất / hỏng tài liệu</label>
          <div class="flex items-center gap-3">
            <input
              type="number"
              step="0.1"
              v-model.number="config.fines.lostBookMultiplier"
              class="w-24 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-center text-gray-800"
            />
            <span class="text-sm font-semibold text-gray-600">x (Giá bìa sách)</span>
          </div>
          <p class="text-[10px] text-gray-400 mt-2">Ví dụ: Hệ số 2.0 yêu cầu đền bù gấp đôi giá trị sách.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { Settings, Save, Loader2, Info, BookOpen, DollarSign, Clock } from 'lucide-vue-next'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const config = ref(null)
const isLoading = ref(true)
const isSaving = ref(false)
const errorMsg = ref(null)
const activeTab = ref('general')

const tabs = [
  { id: 'general', label: 'Thông tin chung', icon: Info },
  { id: 'loans', label: 'Luật mượn trả', icon: BookOpen },
  { id: 'fines', label: 'Quy định phạt', icon: DollarSign }
]

const loadConfig = async () => {
  isLoading.value = true
  errorMsg.value = null
  try {
    const res = await axios.get(`${API_BASE_URL}/config/`)
    config.value = res.data
  } catch (e) {
    console.error('Lỗi tải cấu hình:', e)
    errorMsg.value = 'Không thể kết nối đến máy chủ để lấy cấu hình.'
  } finally {
    isLoading.value = false
  }
}

const handleSave = async () => {
  if (!config.value) return
  isSaving.value = true
  try {
    await axios.put(`${API_BASE_URL}/config/`, config.value)
    alert('Đã lưu cấu hình hệ thống thành công!')
  } catch (e) {
    console.error('Lỗi lưu cấu hình:', e)
    alert('Không thể lưu cấu hình. Vui lòng kiểm tra lại kết nối.')
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  loadConfig()
})
</script>
