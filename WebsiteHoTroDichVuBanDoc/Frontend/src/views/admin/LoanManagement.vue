<template>
  <div class="min-h-screen p-6 animate-fade-in">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-gray-800">Quản lý Mượn Trả</h1>
      <button @click="loadData" class="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-3 py-2 rounded transition">
        <RefreshCw :size="18" :class="{ 'animate-spin': isLoading }" /> Làm mới
      </button>
    </div>

    <!-- TABS -->
    <div class="flex gap-4 mb-6 border-b border-gray-200">
      <button
        @click="activeTab = 'active'"
        :class="[
          'pb-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2',
          activeTab === 'active' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
        ]"
      >
        <BookOpen :size="18" /> Đang Mượn
        <span class="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{{ filteredLoans.length }}</span>
      </button>
      <button
        @click="activeTab = 'pending'"
        :class="[
          'pb-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2',
          activeTab === 'pending' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
        ]"
      >
        <Clock :size="18" /> Chờ Xác Nhận
        <span v-if="pendingLoans.length > 0" class="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs animate-pulse">{{ pendingLoans.length }}</span>
      </button>
    </div>

    <!-- Search Bar -->
    <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
      <div class="flex flex-col md:flex-row gap-4 items-end">
        <div class="flex-1 w-full">
          <label class="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm phiếu</label>
          <div class="relative">
            <input
              type="text"
              v-model="searchTerm"
              placeholder="Nhập mã phiếu, mã sách, tên sách hoặc tên bạn đọc..."
              class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <Search class="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
          </div>
        </div>
      </div>
    </div>

    <!-- Table Content -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
      <div v-if="isLoading" class="p-20 flex flex-col items-center justify-center text-gray-500 gap-4">
        <Loader2 class="animate-spin text-blue-500" :size="32" />
        <span>Đang tải dữ liệu...</span>
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
            <tr>
              <th class="px-6 py-3 text-left">Mã Phiếu</th>
              <th class="px-6 py-3 text-left">Thông tin Sách</th>
              <th class="px-6 py-3 text-left">Bạn đọc</th>
              <th class="px-6 py-3 text-left">Thời gian</th>
              <th class="px-6 py-3 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 bg-white">
            <tr v-for="loan in (activeTab === 'active' ? filteredLoans : filteredPending)" :key="loan.maMuonTra" class="hover:bg-blue-50 transition-colors">
              <td class="px-6 py-4 whitespace-nowrap font-mono font-bold text-gray-700">#{{ loan.maMuonTra }}</td>
              <td class="px-6 py-4">
                <div class="text-sm font-bold text-gray-900">{{ loan.tenTacPham }}</div>
                <div class="text-xs text-gray-500 font-mono bg-gray-100 px-1 py-0.5 rounded w-fit mt-1">{{ loan.maBanSaoNoiBo }}</div>
              </td>
              <td class="px-6 py-4 text-sm font-medium text-gray-900">
                <div>{{ loan.nguoiMuon }}</div>
                <div class="text-xs text-gray-400">{{ loan.soThe || 'N/A' }}</div>
              </td>
              <td class="px-6 py-4">
                <div v-if="activeTab === 'active'">
                  <div :class="['text-xs font-bold', isLate(loan) ? 'text-red-600' : 'text-green-600']">
                    Hạn: {{ formatDate(loan.ngayTraDuKien) }}
                    <div v-if="isLate(loan)" class="flex items-center gap-1 mt-1 text-red-600 animate-pulse">
                      <AlertTriangle :size="12" />
                      <span>Quá hạn {{ getLateDays(loan) }} ngày</span>
                    </div>
                  </div>
                </div>
                <div v-else class="text-xs text-orange-600 font-medium">
                  Đặt lúc: {{ formatDate(loan.ngayMuon) }}
                </div>
              </td>
              <td class="px-6 py-4 text-center">
                <button
                  v-if="activeTab === 'active'"
                  @click="openReturnModal(loan)"
                  class="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-bold text-green-700 bg-green-100 hover:bg-green-200 transition-colors border border-green-200"
                >
                  <CheckCircle :size="14" class="mr-1" /> Trả sách
                </button>
                <button
                  v-else
                  @click="openConfirmModal(loan)"
                  class="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all active:scale-95"
                >
                  <CheckCircle :size="14" class="mr-1" /> Duyệt Mượn
                </button>
              </td>
            </tr>
            <tr v-if="(activeTab === 'active' ? filteredLoans : filteredPending).length === 0">
              <td colSpan="5" class="py-10 text-center text-gray-400 italic">
                Không có dữ liệu nào.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- === MODAL CONFIRMATION === -->
    <div v-if="selectedLoan" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[90vh]">
        <!-- Header -->
        <div :class="['flex justify-between items-center p-5 border-b', modalMode === 'confirm_borrow' ? 'bg-blue-50' : 'bg-green-50']">
          <h3 :class="['text-xl font-bold flex items-center gap-2', modalMode === 'confirm_borrow' ? 'text-blue-800' : 'text-green-800']">
            <CheckCircle :class="modalMode === 'confirm_borrow' ? 'text-blue-600' : 'text-green-600'" />
            {{ modalMode === 'confirm_borrow' ? 'Xác nhận Cho Mượn' : 'Xác nhận Trả Sách' }}
          </h3>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600"><X :size="24" /></button>
        </div>

        <!-- Body -->
        <div class="flex-1 p-6 bg-gray-50/50 overflow-y-auto">
          <div class="grid md:grid-cols-2 gap-8">
            <!-- Cột 1: Thông tin Sách -->
            <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h4 class="text-sm font-bold text-gray-500 uppercase mb-4 border-b pb-2 flex items-center gap-2">
                <BookOpen :size="18" /> Tài liệu
              </h4>
              <div class="flex flex-col items-center text-center">
                <div class="relative w-32 h-48 bg-gray-200 rounded-md shadow-md overflow-hidden mb-4 flex items-center justify-center">
                  <img v-if="selectedLoan.anhBia" :src="selectedLoan.anhBia" alt="" class="object-cover w-full h-full" />
                  <span v-else class="text-xs text-gray-400">No Cover</span>
                </div>
                <h3 class="text-lg font-bold text-gray-900">{{ selectedLoan.tenTacPham }}</h3>
                <p class="text-sm text-gray-500 mt-1">Mã bản sao: <span class="font-mono font-bold text-black bg-yellow-100 px-1 rounded">{{ selectedLoan.maBanSaoNoiBo }}</span></p>
              </div>
            </div>

            <!-- Cột 2: Thông tin Bạn đọc -->
            <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <h4 class="text-sm font-bold text-gray-500 uppercase mb-4 border-b pb-2 flex items-center gap-2">
                <User :size="18" /> Người mượn
              </h4>
              <div class="flex flex-col items-center text-center">
                <div class="relative w-32 h-40 bg-gray-200 rounded-md shadow-md overflow-hidden mb-4 border-2 border-white flex items-center justify-center">
                  <img v-if="selectedLoan.anhDocGia" :src="selectedLoan.anhDocGia" alt="" class="object-cover w-full h-full" />
                  <span v-else class="text-xs text-gray-400">No Photo</span>
                </div>
                <h3 class="text-lg font-bold text-blue-800">{{ selectedLoan.nguoiMuon }}</h3>
                <p class="text-sm text-gray-500 mt-1">Số thẻ: {{ selectedLoan.soThe || '---' }}</p>

                <div class="mt-4 w-full bg-gray-50 p-3 rounded border text-left text-sm">
                  <div class="flex justify-between mb-1">
                    <span class="text-gray-500">Ngày tạo:</span>
                    <span class="font-medium">{{ formatDate(selectedLoan.ngayMuon) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">Hạn trả:</span>
                    <span class="font-bold text-blue-600">{{ formatDate(selectedLoan.ngayTraDuKien) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Alert Context -->
          <div v-if="modalMode === 'confirm_borrow'" class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
            <strong><CheckCircle :size="16" class="inline mr-1" /> Xác nhận cho mượn:</strong> Hành động này sẽ phê duyệt yêu cầu mượn, cập nhật trạng thái phiếu thành "Đã mượn" và liên kết tài khoản thủ thư quản lý.
          </div>

          <div v-if="modalMode === 'return_book' && isLate(selectedLoan)" class="mt-6 p-3 bg-red-100 border border-red-200 rounded-lg flex items-center gap-3 text-red-800">
            <AlertTriangle :size="24" />
            <div>
              <p class="font-bold">Cảnh báo quá hạn!</p>
              <p class="text-sm">Bạn đọc này trả sách muộn. Vui lòng kiểm tra và thu phí phạt (nếu có) trước khi xác nhận.</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-5 border-t bg-white flex justify-end gap-3">
          <button
            @click="closeModal"
            class="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            :disabled="isProcessing"
          >
            Hủy bỏ
          </button>
          <button
            v-if="modalMode === 'confirm_borrow'"
            @click="handleConfirmBorrow"
            :disabled="isProcessing"
            class="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95"
          >
            <Loader2 v-if="isProcessing" class="animate-spin" />
            <span v-else>XÁC NHẬN CHO MƯỢN</span>
          </button>
          <button
            v-else
            @click="handleReturnBook"
            :disabled="isProcessing"
            class="px-8 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95"
          >
            <Loader2 v-if="isProcessing" class="animate-spin" />
            <span v-else>XÁC NHẬN TRẢ SÁCH</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../../stores/auth'
import { Search, RefreshCw, CheckCircle, BookOpen, Clock, AlertTriangle, Loader2, X, User } from 'lucide-vue-next'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
const authStore = useAuthStore()

const loans = ref([])
const pendingLoans = ref([])
const filteredLoans = ref([])
const filteredPending = ref([])

const searchTerm = ref('')
const isLoading = ref(true)
const activeTab = ref('active')

const selectedLoan = ref(null)
const modalMode = ref('')
const isProcessing = ref(false)

const loadData = async () => {
  isLoading.value = true
  try {
    const [activeRes, pendingRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/muon-tra/danh-sach-chi-tiet-muon-tra?phan_loai=dangMuon`),
      axios.get(`${API_BASE_URL}/muon-tra/danh-sach-chi-tiet-muon-tra?phan_loai=choXacNhan`)
    ])
    loans.value = activeRes.data || []
    pendingLoans.value = pendingRes.data || []
    filterData()
  } catch (error) {
    console.error('Lỗi tải dữ liệu mượn trả:', error)
  } finally {
    isLoading.value = false
  }
}

const filterData = () => {
  const term = searchTerm.value.toLowerCase().trim()
  
  const filterFn = (list) => {
    if (!term) return list
    return list.filter(loan =>
      loan.maBanSaoNoiBo?.toLowerCase().includes(term) ||
      loan.nguoiMuon?.toLowerCase().includes(term) ||
      loan.tenTacPham?.toLowerCase().includes(term) ||
      String(loan.maMuonTra).includes(term)
    )
  }

  filteredLoans.value = filterFn(loans.value)
  filteredPending.value = filterFn(pendingLoans.value)
}

watch([searchTerm, loans, pendingLoans], filterData)

const openConfirmModal = (loan) => {
  selectedLoan.value = loan
  modalMode.value = 'confirm_borrow'
}

const openReturnModal = (loan) => {
  selectedLoan.value = loan
  modalMode.value = 'return_book'
}

const closeModal = () => {
  selectedLoan.value = null
  modalMode.value = ''
}

const handleConfirmBorrow = async () => {
  if (!selectedLoan.value) return
  isProcessing.value = true
  try {
    // Gọi PUT update với ID và body
    const staffId = authStore.user?.maNhanVien || 1 // Fallback to 1 if not set
    await axios.put(`${API_BASE_URL}/muon-tra/${selectedLoan.value.maMuonTra}`, {
      trangThaiMuon: 'daMuon',
      maNhanVien: staffId
    })
    alert('Duyệt cho mượn thành công!')
    closeModal()
    loadData()
  } catch (error) {
    console.error('Lỗi xác nhận cho mượn:', error)
    alert(error.response?.data?.detail || 'Có lỗi xảy ra.')
  } finally {
    isProcessing.value = false
  }
}

const handleReturnBook = async () => {
  if (!selectedLoan.value) return
  isProcessing.value = true
  try {
    const staffId = authStore.user?.maNhanVien || 1
    await axios.post(`${API_BASE_URL}/muon-tra/${selectedLoan.value.maMuonTra}/tra-sach`, {
      maNhanVien: staffId,
      ghiChu: 'Trả tại quầy (Admin)'
    })
    alert('Xác nhận trả sách thành công!')
    closeModal()
    loadData()
  } catch (error) {
    console.error('Lỗi trả sách:', error)
    alert(error.response?.data?.detail || 'Có lỗi xảy ra.')
  } finally {
    isProcessing.value = false
  }
}

const isLate = (loan) => {
  if (!loan.ngayTraDuKien) return false
  const dueDate = new Date(loan.ngayTraDuKien)
  const now = new Date()
  return now > dueDate && loan.trangThai !== 'daTra'
}

const getLateDays = (loan) => {
  if (!loan.ngayTraDuKien) return 0
  const dueDate = new Date(loan.ngayTraDuKien)
  const now = new Date()
  const diffTime = now - dueDate
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

onMounted(() => {
  loadData()
})
</script>
