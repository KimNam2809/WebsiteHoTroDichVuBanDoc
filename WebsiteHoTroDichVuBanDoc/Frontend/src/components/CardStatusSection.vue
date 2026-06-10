<template>
  <div>
    <!-- --- CASE 1: NHÂN VIÊN --- -->
    <div v-if="isStaff" class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
      <div class="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
      <div class="relative z-10">
        <div class="flex items-center gap-2 mb-2">
          <div class="p-2 bg-blue-100 text-blue-600 rounded-lg"><UserCheck :size="20"/></div>
          <h3 class="font-bold text-gray-700">Thông tin nhân viên</h3>
        </div>
        <div class="mt-4">
          <p class="text-3xl font-extrabold text-blue-700">{{ profile.manhanviennoibo || 'NV---' }}</p>
          <p class="text-sm text-gray-500 font-medium mt-1">{{ profile.phongban }}</p>
        </div>
      </div>
    </div>

    <!-- --- CASE 2: DUYỆT NHƯNG CHƯA CÓ THÈ --- -->
    <div v-else-if="isApprovedButNoCardYet" class="bg-green-50 p-6 rounded-3xl border border-green-200 relative overflow-hidden">
      <div class="flex items-center gap-2 mb-2">
        <CheckCircle class="text-green-600" :size="20"/>
        <h3 class="font-bold text-green-800">Thẻ thư viện</h3>
      </div>
      <div class="mt-2">
        <p class="text-xl font-bold text-green-700">Đã được duyệt!</p>
        <p class="text-sm text-green-600 mt-1">Hệ thống đang khởi tạo...</p>
        <button @click="reloadPage" class="text-xs text-green-800 underline mt-2 font-medium">Tải lại trang</button>
      </div>
    </div>

    <!-- --- CASE 3: CHỜ DUYỆT --- -->
    <div v-else-if="!hasCard && isPending" class="bg-yellow-50 p-6 rounded-3xl border border-yellow-200 relative overflow-hidden">
      <div class="flex items-center gap-2 mb-2">
        <Clock class="text-yellow-600" :size="20"/>
        <h3 class="font-bold text-yellow-800">Thẻ thư viện</h3>
      </div>
      <div class="mt-2">
        <p class="text-xl font-bold text-yellow-700">Đang chờ duyệt</p>
        <p class="text-sm text-yellow-600 mt-1">Hồ sơ đang được xử lý.</p>
      </div>
    </div>

    <!-- --- CASE 4: CHƯA CÓ THẺ --- -->
    <div v-else-if="!hasCard" class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <div class="flex items-center gap-2 mb-2">
          <div class="p-2 bg-gray-100 text-gray-500 rounded-lg"><CreditCard :size="20"/></div>
          <h3 class="font-bold text-gray-700">Thẻ thư viện</h3>
        </div>
        <p class="text-gray-500 text-sm mt-2">Bạn chưa có thẻ thành viên.</p>
      </div>
      <router-link to="/dang_ky_the" class="mt-4 w-full py-2 bg-blue-600 text-white text-center rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
        Đăng ký ngay
      </router-link>
    </div>

    <!-- --- CASE 5: ĐÃ CÓ THẺ --- -->
    <div v-else class="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
      <div class="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

      <div class="relative z-10">
        <div class="flex items-center gap-2 mb-2">
          <div class="p-2 bg-blue-100 text-blue-600 rounded-lg"><CreditCard :size="20"/></div>
          <h3 class="font-bold text-gray-700">Thẻ thư viện</h3>
        </div>

        <div class="mt-4">
          <p class="text-3xl font-extrabold text-blue-700 tracking-tight">{{ profile.sothe }}</p>
          <p class="text-sm text-gray-500 font-medium mt-1">{{ profile.tenthe }}</p>

          <div class="mt-4 flex items-center gap-2">
            <span class="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-md uppercase">
              {{ profile.trangthaithe }}
            </span>
          </div>

          <button v-if="isRequestPending" @click="showPopup = true" class="text-orange-600 text-xs font-bold mt-3 flex items-center gap-1 hover:underline">
            <Info :size="12"/> Đang có yêu cầu mới...
          </button>
        </div>
      </div>

      <!-- Popup Thông báo -->
      <Teleport to="body">
        <div v-if="showPopup" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
          <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
            <button @click="showPopup = false" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <XCircle :size="20"/>
            </button>
            <h3 class="text-lg font-bold text-gray-800 mb-4">Trạng thái hồ sơ</h3>
            <div class="bg-yellow-50 p-4 rounded-xl border border-yellow-100 mb-4">
              <p class="font-bold text-yellow-800">Đang chờ duyệt</p>
              <p class="text-sm text-yellow-700 mt-1">Yêu cầu cấp thẻ mới đang được xử lý.</p>
            </div>
            <div class="text-sm text-gray-600 space-y-1">
              <p><strong>Loại thẻ:</strong> {{ latestReq.loai_the_dang_ky || latestReq.loaithe || '' }}</p>
              <p><strong>Mã hồ sơ:</strong> #{{ latestReq.ma_yeu_cau || latestReq.mayeucau || '' }}</p>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { CreditCard, CheckCircle, Clock, Info, UserCheck, XCircle } from 'lucide-vue-next'

const props = defineProps({
  profile: {
    type: Object,
    required: true
  },
  isStaff: {
    type: Boolean,
    default: false
  }
})

const showPopup = ref(false)

const hasCard = computed(() => {
  return props.profile.sothe && props.profile.sothe !== 'Chưa cấp'
})

const latestReq = computed(() => {
  return props.profile.yeu_cau_moi_nhat || props.profile.yeucau_moinhat || {}
})

const isPending = computed(() => {
  return latestReq.value.trang_thai === 'choDuyet' || latestReq.value.trangthai === 'choDuyet'
})

const isApprovedButNoCardYet = computed(() => {
  const status = latestReq.value.trang_thai || latestReq.value.trangthai
  return status === 'daDuyet' && !hasCard.value
})

const isRequestPending = computed(() => {
  return isPending.value
})

const reloadPage = () => {
  window.location.reload()
}
</script>
