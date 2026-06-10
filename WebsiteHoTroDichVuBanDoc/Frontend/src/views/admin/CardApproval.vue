<template>
  <div class="relative min-h-screen">
    <h1 class="text-3xl font-bold mb-6 text-gray-800">Phê duyệt hồ sơ đăng ký thẻ</h1>

    <!-- --- DANH SÁCH (List View) --- -->
    <div class="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-semibold text-gray-700">
          Hồ sơ đang chờ ({{ applications.length }})
        </h2>
        <button
          @click="loadList"
          class="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center"
        >
          Làm mới danh sách
        </button>
      </div>

      <div v-if="isLoading" class="flex justify-center py-8">
        <Loader2 class="animate-spin text-blue-600 w-8 h-8" />
      </div>
      
      <div v-else-if="applications.length === 0" class="text-center py-8 text-gray-500 italic">
        Hiện không có hồ sơ nào đang chờ duyệt.
      </div>
      
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mã HS</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Thông tin người đăng ký</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Loại thẻ</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày đăng ký</th>
              <th class="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="app in applications" :key="app.ma_ho_so" class="hover:bg-blue-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                #{{ app.ma_ho_so }}
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center">
                  <div class="h-10 w-10 shrink-0 relative mr-3 border rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                    <img v-if="app.anh_the_url" :src="app.anh_the_url" alt="" class="object-cover w-full h-full" />
                    <span v-else class="text-xs text-gray-400">N/A</span>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900">{{ app.ho_ten }}</div>
                    <div class="text-sm text-gray-500">{{ app.email }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                  {{ app.loai_the }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(app.ngay_dang_ky) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <button
                  @click="openDetailModal(app.ma_ho_so)"
                  class="inline-flex items-center px-3 py-1.5 border border-blue-600 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Eye class="w-4 h-4 mr-1.5" /> Xem & Duyệt
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- --- MODAL CHI TIẾT (Detail View) --- -->
    <div v-if="isModalOpen" class="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fade-in">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden relative">

        <!-- Modal Header -->
        <div class="flex justify-between items-center p-5 border-b bg-gray-50">
          <div>
            <h3 class="text-xl font-bold text-gray-800">
              Chi tiết hồ sơ #{{ selectedRequest ? selectedRequest.mayeucauthe : '...' }}
            </h3>
            <p class="text-sm text-gray-500">Kiểm tra thông tin kỹ trước khi phê duyệt</p>
          </div>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600 transition-colors">
            <X class="w-6 h-6" />
          </button>
        </div>

        <!-- Modal Body -->
        <div class="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          <div v-if="!selectedRequest" class="flex flex-col items-center justify-center h-64 space-y-3">
            <Loader2 class="w-10 h-10 animate-spin text-blue-600" />
            <p class="text-gray-500">Đang tải thông tin chi tiết...</p>
          </div>
          <div v-else class="space-y-6">

            <!-- === KHỐI HIỂN THỊ ĐÁNH GIÁ RỦI RO TỪ AI === -->
            <div v-if="selectedRequest.thongtinbosung?.ket_qua_xac_thuc" :class="[
              'p-4 rounded-lg border-l-4 shadow-sm',
              selectedRequest.thongtinbosung.ket_qua_xac_thuc.risk_level === 'HIGH' ? 'bg-red-50 border-red-500 text-red-900' :
              selectedRequest.thongtinbosung.ket_qua_xac_thuc.risk_level === 'MEDIUM' ? 'bg-yellow-50 border-yellow-500 text-yellow-900' :
              'bg-green-50 border-green-500 text-green-900'
            ]">
              <div class="flex items-start gap-3">
                <div class="mt-1">
                  <AlertTriangle v-if="selectedRequest.thongtinbosung.ket_qua_xac_thuc.risk_level === 'HIGH'" :size="24" class="text-red-600" />
                  <AlertTriangle v-else-if="selectedRequest.thongtinbosung.ket_qua_xac_thuc.risk_level === 'MEDIUM'" :size="24" class="text-yellow-600" />
                  <Check v-else :size="24" class="text-green-600" />
                </div>
                <div class="flex-1">
                  <h4 class="font-bold text-lg flex items-center gap-2">
                    Đánh giá rủi ro AI:
                    <span>
                      {{ selectedRequest.thongtinbosung.ket_qua_xac_thuc.risk_level === 'HIGH' ? 'CAO (Nguy hiểm)' :
                         selectedRequest.thongtinbosung.ket_qua_xac_thuc.risk_level === 'MEDIUM' ? 'TRUNG BÌNH (Cần xem xét)' : 'THẤP (An toàn)' }}
                    </span>
                  </h4>

                  <div class="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span class="font-semibold">Độ khớp khuôn mặt:</span>
                      <span class="ml-2 px-2 py-0.5 bg-white rounded border text-gray-700">
                        {{ (selectedRequest.thongtinbosung.ket_qua_xac_thuc.face_match_score * 100).toFixed(1) }}%
                      </span>
                    </div>
                  </div>

                  <!-- Danh sách các lỗi cụ thể -->
                  <div v-if="selectedRequest.thongtinbosung.ket_qua_xac_thuc.details && selectedRequest.thongtinbosung.ket_qua_xac_thuc.details.length > 0" class="mt-3 bg-white/60 p-3 rounded border border-black/5">
                    <p class="text-xs font-bold uppercase mb-1 opacity-70">Các vấn đề phát hiện:</p>
                    <ul class="list-disc list-inside space-y-1">
                      <li v-for="(detail, idx) in selectedRequest.thongtinbosung.ket_qua_xac_thuc.details" :key="idx" class="text-sm font-medium text-red-700">
                        {{ detail }}
                      </li>
                    </ul>
                  </div>
                  <p v-else class="text-sm mt-2 italic opacity-80">✓ Thông tin văn bản và hình ảnh hoàn toàn trùng khớp với CSDL.</p>
                </div>
              </div>
            </div>

            <div class="grid md:grid-cols-12 gap-6">
              <!-- Cột Trái: Ảnh thẻ -->
              <div class="md:col-span-4 flex flex-col gap-4">
                <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                  <p class="text-xs font-bold text-gray-400 uppercase mb-2 text-center">Ảnh thẻ đăng ký</p>
                  <div class="relative w-full aspect-[3/4] bg-gray-200 rounded overflow-hidden border">
                    <img
                      v-if="selectedRequest.thongtinbosung?.anh_the_url"
                      :src="selectedRequest.thongtinbosung.anh_the_url"
                      alt="Ảnh thẻ"
                      class="object-cover w-full h-full"
                    />
                    <div v-else class="flex items-center justify-center h-full text-gray-400">Không có ảnh</div>
                  </div>
                  <div class="mt-4 text-center">
                    <span class="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                      {{ selectedRequest.tenloaithe }}
                    </span>
                    <p class="text-xs text-gray-500 mt-2">Phí: {{ selectedRequest.lephi?.toLocaleString() }} VNĐ</p>
                  </div>
                </div>
              </div>

              <!-- Cột Phải: Thông tin chi tiết -->
              <div class="md:col-span-8 space-y-6">
                <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
                  <h4 class="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
                    <UserIcon :size="20" class="text-blue-600" /> Thông tin cá nhân
                  </h4>
                  <div class="grid grid-cols-2 gap-6">
                    <div>
                      <p class="text-xs text-gray-500 uppercase">Họ và tên</p>
                      <p class="font-medium text-lg text-gray-900">{{ selectedRequest.thongtinbosung?.ho_ten }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500 uppercase">Ngày sinh</p>
                      <p class="font-medium text-gray-900 flex items-center gap-2">
                        <Calendar :size="16" class="text-gray-400" /> {{ selectedRequest.thongtinbosung?.ngay_sinh }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500 uppercase">CCCD/CMND</p>
                      <p class="font-medium text-gray-900 tracking-wide font-mono">{{ selectedRequest.thongtinbosung?.cccd }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500 uppercase">Giới tính</p>
                      <p class="font-medium text-gray-900">{{ selectedRequest.thongtinbosung?.gioi_tinh }}</p>
                    </div>
                  </div>
                </div>

                <div class="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
                  <h4 class="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
                    <MapPin :size="20" class="text-green-600" /> Liên hệ
                  </h4>
                  <div class="grid grid-cols-2 gap-6">
                    <div class="col-span-2">
                      <p class="text-xs text-gray-500 uppercase">Địa chỉ đầy đủ</p>
                      <p class="font-medium text-gray-900">
                        {{ selectedRequest.thongtinbosung?.dia_chi_hien_thi || selectedRequest.thongtinbosung?.dia_chi }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500 uppercase">Số điện thoại</p>
                      <p class="font-medium text-gray-900 flex items-center gap-2">
                        <Phone :size="16" class="text-gray-400" /> {{ selectedRequest.thongtinbosung?.sdt }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-500 uppercase">Email</p>
                      <p class="font-medium text-gray-900 flex items-center gap-2">
                        <Mail :size="16" class="text-gray-400" /> {{ selectedRequest.thongtinbosung?.email }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Form Từ chối -->
                <div class="bg-red-50 p-4 rounded-lg border border-red-100">
                  <label class="block text-sm font-bold text-red-800 mb-2">Lý do từ chối (nếu có)</label>
                  <textarea
                    class="w-full p-3 border border-red-200 rounded bg-white text-sm focus:ring-2 focus:ring-red-500 outline-none"
                    rows="2"
                    placeholder="Nhập lý do nếu bạn muốn từ chối hồ sơ này..."
                    v-model="rejectReason"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer Actions -->
        <div v-if="selectedRequest" class="p-5 border-t bg-gray-50 flex justify-end gap-3 sticky bottom-0">
          <button
            @click="closeModal"
            class="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 font-medium transition-colors"
            :disabled="isProcessing"
          >
            Đóng
          </button>
          <button
            @click="handleReviewClick('tuChoi')"
            class="px-5 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 flex items-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isProcessing"
          >
            <Loader2 v-if="isProcessing" class="animate-spin w-4 h-4" />
            <X v-else class="w-5 h-5" />
            Từ chối hồ sơ
          </button>
          <button
            @click="handleReviewClick('daDuyet')"
            class="px-6 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 flex items-center gap-2 font-bold shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isProcessing"
          >
            <Loader2 v-if="isProcessing" class="animate-spin w-4 h-4" />
            <Check v-else class="w-5 h-5" />
            PHÊ DUYỆT & CẤP THẺ
          </button>
        </div>

        <!-- CONFIRMATION MODAL OVERLAY -->
        <div v-if="confirmAction" class="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center transform scale-100">
            <div :class="[
              'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
              confirmAction === 'daDuyet' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            ]">
              <Check v-if="confirmAction === 'daDuyet'" :size="32" />
              <AlertTriangle v-else :size="32" />
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2">
              {{ confirmAction === 'daDuyet' ? 'Xác nhận phê duyệt?' : 'Xác nhận từ chối?' }}
            </h3>
            <p class="text-gray-500 mb-6">
              {{ confirmAction === 'daDuyet'
                ? 'Bạn có chắc chắn muốn phê duyệt hồ sơ và cấp thẻ mới cho người dùng này không?'
                : 'Bạn có chắc chắn muốn từ chối hồ sơ này không? Hành động này không thể hoàn tác.' }}
            </p>
            <div class="flex gap-3">
              <button
                @click="confirmAction = null"
                class="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                :disabled="isProcessing"
              >
                Hủy bỏ
              </button>
              <button
                @click="executeReview"
                :disabled="isProcessing"
                :class="[
                  'flex-1 py-2.5 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2',
                  confirmAction === 'daDuyet' ? 'bg-green-600 hover:bg-green-700 shadow-green-500/30' : 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
                ]"
              >
                <Loader2 v-if="isProcessing" class="animate-spin w-5 h-5" />
                <span v-else>Đồng ý</span>
              </button>
            </div>
          </div>
        </div>

        <!-- SUCCESS MODAL OVERLAY -->
        <div v-if="showSuccessModal" class="absolute inset-0 z-50 flex items-center justify-center bg-white p-4">
          <div class="text-center max-w-md">
            <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 class="w-10 h-10 text-green-600" />
            </div>
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Thao tác thành công!</h2>
            <p class="text-gray-500 mb-8">Hệ thống đã cập nhật trạng thái hồ sơ và gửi thông báo đến người dùng.</p>
            <button
              @click="closeModal"
              class="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-transform hover:scale-105 active:scale-95"
            >
              Đóng & Quay lại
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { 
  Check, X, Eye, Loader2, MapPin, 
  User as UserIcon, Calendar, Phone, Mail, AlertTriangle, CheckCircle2 
} from 'lucide-vue-next'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const applications = ref([])
const isLoading = ref(true)

const selectedRequest = ref(null)
const isModalOpen = ref(false)
const rejectReason = ref('')
const isProcessing = ref(false)

const confirmAction = ref(null)
const showSuccessModal = ref(false)

const loadList = async () => {
  isLoading.value = true
  try {
    const res = await axios.get(`${API_BASE_URL}/yeu-cau-the/danh-sach-cho-duyet`)
    applications.value = res.data || []
  } catch (error) {
    console.error('Lỗi tải danh sách chờ duyệt:', error)
    applications.value = []
  } finally {
    isLoading.value = false
  }
}

const openDetailModal = async (id) => {
  isModalOpen.value = true
  selectedRequest.value = null
  rejectReason.value = ''
  
  try {
    const res = await axios.get(`${API_BASE_URL}/yeu-cau-the/${id}`)
    selectedRequest.value = res.data
  } catch (error) {
    console.error(`Lỗi tải chi tiết hồ sơ ${id}:`, error)
    alert('Không thể tải thông tin chi tiết hồ sơ này.')
    isModalOpen.value = false
  }
}

const closeModal = () => {
  isModalOpen.value = false
  rejectReason.value = ''
  confirmAction.value = null
  showSuccessModal.value = false
}

const handleReviewClick = (status) => {
  if (status === 'tuChoi' && !rejectReason.value.trim()) {
    alert('Vui lòng nhập lý do từ chối để lưu vào lịch sử.')
    return
  }
  confirmAction.value = status
}

const executeReview = async () => {
  if (!confirmAction.value) return
  isProcessing.value = true
  try {
    await axios.put(`${API_BASE_URL}/yeu-cau-the/phe-duyet/${selectedRequest.value.mayeucauthe}`, {
      trang_thai: confirmAction.value,
      ly_do: rejectReason.value
    })
    confirmAction.value = null
    showSuccessModal.value = true
    loadList()
  } catch (error) {
    console.error('Lỗi xử lý hồ sơ:', error)
    alert(error.response?.data?.detail || 'Có lỗi xảy ra trong quá trình xử lý.')
    confirmAction.value = null
  } finally {
    isProcessing.value = false
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

onMounted(() => {
  loadList()
})
</script>
