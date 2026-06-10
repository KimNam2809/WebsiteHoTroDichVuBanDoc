<template>
  <div class="min-h-screen bg-gray-50 pb-20 font-sans">
    
    <!-- 1. HERO HEADER -->
    <div class="relative bg-gradient-to-r from-blue-900 to-indigo-900 h-[300px] flex items-center justify-center overflow-hidden pb-10">
      <div class="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      <div class="relative z-10 text-center px-4 max-w-4xl mx-auto pt-8">
        <h1 class="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight drop-shadow-lg">
          Form đăng ký thẻ bạn đọc
        </h1>
        <p class="text-blue-100 text-lg font-light max-w-2xl mx-auto">
          Nơi bạn có thể điền thông tin để đăng ký thẻ bạn đọc tại thư viện của chúng tôi.
        </p>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
      
      <!-- Header Form -->
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-extrabold text-white">Điền thông tin hồ sơ</h1>
          <p class="text-white/80 mt-1">Vui lòng nhập chính xác thông tin để in thẻ.</p>
        </div>
        <router-link to="/dang_ky_the" class="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors shadow-sm">
          <ArrowLeft :size="20" />
        </router-link>
      </div>

      <!-- Success Screen -->
      <div v-if="submitSuccess" class="min-h-[50vh] bg-white p-8 rounded-3xl shadow-xl text-center flex flex-col justify-center items-center animate-fade-in relative overflow-hidden">
        <div class="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-blue-500"></div>
        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle class="w-10 h-10 text-green-600" :stroke-width="3" />
        </div>
        <h1 class="text-2xl font-extrabold text-gray-900 mb-2">Đăng ký thành công!</h1>
        <p class="text-gray-500 mb-6">Hồ sơ của bạn đã được ghi nhận. Vui lòng thanh toán để hoàn tất.</p>

        <div class="bg-gray-50 p-6 rounded-2xl border border-gray-200 mb-6 inline-block">
          <img :src="qrCodeUrl" alt="QR Code Payment" class="w-[180px] h-[180px] mx-auto rounded-lg shadow-inner bg-white p-2 border border-gray-100" />
          <p class="text-xs text-gray-400 mt-3 font-mono">MDH: {{ requestId }}</p>
        </div>

        <div class="space-y-2 mb-8 w-full max-w-xs">
          <div class="flex justify-between text-sm">
            <span class="text-gray-500">Phí làm thẻ</span>
            <span class="font-medium text-gray-900">{{ cardPrice.toLocaleString() }} đ</span>
          </div>
          <div class="flex justify-between text-lg font-bold border-t pt-2 text-blue-600">
            <span>Tổng cộng</span>
            <span>{{ cardPrice.toLocaleString() }} đ</span>
          </div>
        </div>

        <div class="flex gap-3 w-full max-w-sm">
          <router-link to="/" class="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors text-center">
            Trang chủ
          </router-link>
          <router-link to="/dang_ky_the/tra_cuu" class="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30 text-center">
            Theo dõi hồ sơ
          </router-link>
        </div>
      </div>

      <!-- Main Form Screen -->
      <div v-else class="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <!-- Error Box -->
        <div v-if="errorMessage" class="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start gap-3">
          <span class="text-xl">⚠️</span>
          <span class="font-medium">{{ errorMessage }}</span>
        </div>

        <form @submit.prevent="handleSubmit" class="p-8 md:p-10 space-y-8">
          
          <!-- Section 1: Loại thẻ -->
          <section>
            <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">1</span>
              Chọn loại thẻ
            </h3>
            <div class="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div v-if="isDataLoading" class="animate-pulse h-12 bg-gray-200 rounded-lg"></div>
              <div v-else class="relative">
                <select
                  id="ma_loai_the"
                  v-model="selectedCardType"
                  class="block w-full pl-12 pr-10 py-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none outline-none font-medium"
                >
                  <option v-for="card in cardTypes" :key="card.maloaithe" :value="card.maloaithe">
                    {{ card.tenthe }} — {{ (PRICE_MAP[card.maloaithe] || 0).toLocaleString('vi-VN') }} đ
                  </option>
                </select>
                <CreditCard class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" :size="20" />
              </div>
              <p v-if="!isDataLoading && selectedCardInfo" class="text-sm text-blue-600 mt-2 pl-1 flex items-center gap-1">
                <span class="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                {{ selectedCardInfo.mota }}
              </p>
            </div>
          </section>

          <!-- Section 2: Thông tin cá nhân -->
          <section>
            <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">2</span>
              Thông tin cá nhân
            </h3>
            <div class="grid md:grid-cols-2 gap-6">
              
              <div class="col-span-2 md:col-span-1">
                <label class="block text-sm font-semibold text-gray-700 mb-1 ml-1">Họ và tên <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input v-model="formData.hoTen" type="text" placeholder="Nguyễn Văn A" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
                  <User class="absolute left-3.5 top-3.5 text-gray-400" :size="18" />
                </div>
              </div>

              <div class="col-span-2 md:col-span-1">
                <label class="block text-sm font-semibold text-gray-700 mb-1 ml-1">Ngày sinh <span class="text-red-500">*</span></label>
                <div class="grid grid-cols-3 gap-2">
                  <!-- Day Select -->
                  <div class="relative">
                    <select v-model="birthDay" class="w-full pl-3 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-sm appearance-none" required>
                      <option value="">Ngày</option>
                      <option v-for="d in days" :key="d" :value="d">{{ d }}</option>
                    </select>
                    <div class="absolute top-1/2 right-2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                  </div>

                  <!-- Month Select -->
                  <div class="relative">
                    <select v-model="birthMonth" class="w-full pl-3 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-sm appearance-none" required>
                      <option value="">Tháng</option>
                      <option v-for="m in months" :key="m" :value="m">{{ m }}</option>
                    </select>
                    <div class="absolute top-1/2 right-2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                  </div>

                  <!-- Year Select -->
                  <div class="relative">
                    <select v-model="birthYear" class="w-full pl-3 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white text-sm appearance-none" required>
                      <option value="">Năm</option>
                      <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
                    </select>
                    <div class="absolute top-1/2 right-2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-span-2 md:col-span-1">
                <label class="block text-sm font-semibold text-gray-700 mb-1 ml-1">Số điện thoại <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input v-model="formData.sdt" type="tel" maxlength="11" placeholder="0905..." class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
                  <Phone class="absolute left-3.5 top-3.5 text-gray-400" :size="18" />
                </div>
              </div>

              <div class="col-span-2 md:col-span-1">
                <label class="block text-sm font-semibold text-gray-700 mb-1 ml-1">CCCD / CMND <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input v-model="formData.cccd" type="text" maxlength="12" placeholder="12 chữ số" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
                  <CreditCard class="absolute left-3.5 top-3.5 text-gray-400" :size="18" />
                </div>
              </div>

              <div class="col-span-2 md:col-span-1">
                <label class="block text-sm font-semibold text-gray-700 mb-1 ml-1">Giới tính <span class="text-red-500">*</span></label>
                <div class="relative">
                  <select v-model="formData.gioiTinh" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white" required>
                    <option value="">Chọn giới tính</option>
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                  <User class="absolute left-3.5 top-3.5 text-gray-400" :size="18" />
                </div>
              </div>

              <div class="col-span-2 md:col-span-1">
                <label class="block text-sm font-semibold text-gray-700 mb-1 ml-1">Nghề nghiệp <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input v-model="formData.ngheNghiep" type="text" placeholder="Sinh viên / Giáo viên..." class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
                  <Briefcase class="absolute left-3.5 top-3.5 text-gray-400" :size="18" />
                </div>
              </div>

              <div class="col-span-2">
                <label class="block text-sm font-semibold text-gray-700 mb-1 ml-1">Email <span class="text-red-500">*</span></label>
                <div class="relative">
                  <input v-model="formData.email" type="email" placeholder="example@email.com" class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all" required />
                  <Mail class="absolute left-3.5 top-3.5 text-gray-400" :size="18" />
                </div>
              </div>

            </div>
          </section>

          <!-- Section 3: Địa chỉ & Ảnh -->
          <section>
            <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">3</span>
              Địa chỉ & Ảnh thẻ
            </h3>
            <div class="grid md:grid-cols-2 gap-6">
              
              <div class="col-span-2 space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <select @change="handleProvinceChange" v-model="selectedProvince" class="p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none" required>
                    <option value="">Chọn Tỉnh/Thành</option>
                    <option v-for="p in provinces" :key="p.matinhthanhpho" :value="p.matinhthanhpho">{{ p.tentinhthanhpho }}</option>
                  </select>
                  <select v-model="formData.maPhuongXa" :disabled="!selectedProvince" class="p-3 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100" required>
                    <option value="">Chọn Phường/Xã</option>
                    <option v-for="w in wards" :key="w.maphuongxa" :value="w.maphuongxa">{{ w.tenphuongxa }}</option>
                  </select>
                </div>
                <div class="relative">
                  <input v-model="formData.diaChi" type="text" placeholder="Số nhà, tên đường..." class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required />
                  <MapPin class="absolute left-3.5 top-3.5 text-gray-400" :size="18" />
                </div>
              </div>

              <div class="col-span-2">
                <label class="block text-sm font-semibold text-gray-700 mb-2 ml-1">Ảnh thẻ (3x4) <span class="text-red-500">*</span></label>
                <label :class="['flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-colors', previewUrl ? 'border-blue-500 bg-blue-50/30' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50']">
                  <div v-if="previewUrl" class="flex flex-col items-center">
                    <img :src="previewUrl" alt="Preview" class="w-[100px] h-[130px] object-cover rounded-lg shadow-sm border border-gray-200" />
                    <span class="text-xs text-blue-600 mt-2 font-bold">Nhấp để chọn ảnh khác</span>
                  </div>
                  <div v-else class="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400">
                    <Upload class="w-10 h-10 mb-3" :stroke-width="1.5" />
                    <p class="text-sm"><span class="font-bold text-blue-600">Nhấn để tải lên</span> hoặc kéo thả</p>
                    <p class="text-xs text-gray-400 mt-1">PNG, JPG (Max 50MB)</p>
                  </div>
                  <input type="file" ref="fileInput" accept="image/png, image/jpeg, image/webp" @change="handleImageChange" class="hidden" required />
                </label>
              </div>

            </div>
          </section>

          <!-- Thanh toán -->
          <div class="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div class="flex justify-between items-center">
              <span class="text-gray-700 font-medium">Tổng thanh toán</span>
              <span class="text-2xl font-extrabold text-blue-700">{{ cardPrice.toLocaleString('vi-VN') }} đ</span>
            </div>
          </div>

          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] font-bold text-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            <Loader2 v-if="isSubmitting" class="animate-spin" />
            <span v-else>Gửi hồ sơ đăng ký</span>
          </button>
        </form>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import axios from 'axios'
import { useAuthStore } from '../stores/auth'
import { ArrowLeft, Upload, Loader2, CheckCircle, CreditCard, User, Phone, Mail, MapPin, Briefcase } from 'lucide-vue-next'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
const authStore = useAuthStore()

// Constant card price maps
const PRICE_MAP = {
  1: 50000,   // Thẻ Sinh viên
  2: 100000,  // Thẻ Phổ thông
  3: 50000,   // Thẻ Nghiên cứu
  4: 0,       // Thẻ Thiếu nhi
  5: 0,       // Thẻ Đọc
  6: 100000   // Thẻ mượn
}

// Data Lists
const cardTypes = ref([])
const provinces = ref([])
const wards = ref([])

// Form Selection variables
const selectedCardType = ref(1)
const selectedProvince = ref('')
const birthDay = ref('')
const birthMonth = ref('')
const birthYear = ref('')
const previewUrl = ref(null)
const fileInput = ref(null)
const imageFile = ref(null)

// UI States
const isDataLoading = ref(true)
const isSubmitting = ref(false)
const submitSuccess = ref(false)
const errorMessage = ref('')

// Response states
const requestId = ref('')

// Form model
const formData = reactive({
  hoTen: '',
  cccd: '',
  sdt: '',
  email: '',
  gioiTinh: '',
  ngheNghiep: '',
  diaChi: '',
  maPhuongXa: ''
})

// DOB helper dropdown lists
const days = Array.from({ length: 31 }, (_, i) => i + 1)
const months = Array.from({ length: 12 }, (_, i) => i + 1)
const currentYear = new Date().getFullYear()
const years = Array.from({ length: 100 }, (_, i) => currentYear - i)

const cardPrice = computed(() => {
  return PRICE_MAP[selectedCardType.value] || 0
})

const selectedCardInfo = computed(() => {
  return cardTypes.value.find(c => Number(c.maloaithe) === Number(selectedCardType.value))
})

const qrCodeUrl = computed(() => {
  const qrContent = `PAYMENT|${requestId.value}|${cardPrice.value}`
  return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrContent)}`
})

onMounted(async () => {
  try {
    const [cardTypesRes, provincesRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/loai-the/`),
      axios.get(`${API_BASE_URL}/tinh-thanh-pho/`)
    ])
    
    cardTypes.value = (cardTypesRes.data || []).map((card) => ({
      ...card,
      maloaithe: card.maloaithe ?? card.maLoaiThe,
      tenthe: card.tenthe ?? card.tenThe,
      mota: card.mota ?? card.moTa,
      tailieumuontoida: card.tailieumuontoida ?? card.taiLieuMuonToiDa,
      songaymuonmacdinh: card.songaymuonmacdinh ?? card.soNgayMuonMacDinh,
      lephi: card.lephi ?? card.lePhi,
    }))
    provinces.value = provincesRes.data || []
    
    if (cardTypes.value.length > 0) {
      selectedCardType.value = cardTypes.value[0].maloaithe
    }
  } catch (err) {
    console.error("Lỗi tải thông tin cơ bản:", err)
    errorMessage.value = "Lỗi tải danh mục Tỉnh/Thành phố hoặc Loại thẻ."
  } finally {
    isDataLoading.value = false
  }
})

const handleProvinceChange = async () => {
  wards.value = []
  formData.maPhuongXa = ''
  
  if (!selectedProvince.value) return
  
  try {
    const response = await axios.get(`${API_BASE_URL}/phuong-xa/tinh-thanh-pho/${selectedProvince.value}`)
    wards.value = response.data || []
  } catch (err) {
    console.error("Lỗi tải Phường/Xã:", err)
  }
}

const handleImageChange = (e) => {
  const file = e.target.files[0]
  errorMessage.value = ''
  previewUrl.value = null
  imageFile.value = null

  if (file) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      errorMessage.value = 'Chỉ chấp nhận ảnh định dạng .jpg, .png hoặc .webp'
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      errorMessage.value = 'Dung lượng ảnh quá lớn. Vui lòng chọn ảnh dưới 50MB.'
      return
    }
    imageFile.value = file
    previewUrl.value = URL.createObjectURL(file)
  }
}

const validate = () => {
  if (!birthDay.value || !birthMonth.value || !birthYear.value) {
    return 'Vui lòng chọn đầy đủ ngày, tháng, năm sinh.'
  }

  const dayStr = String(birthDay.value).padStart(2, '0')
  const monthStr = String(birthMonth.value).padStart(2, '0')
  const formattedDob = `${birthYear.value}-${monthStr}-${dayStr}`
  
  const dobDate = new Date(formattedDob)
  if (dobDate >= new Date()) {
    return 'Ngày sinh không hợp lệ (phải nhỏ hơn ngày hiện tại).'
  }

  const phoneRegex = /^0\d{9,10}$/
  if (!phoneRegex.test(formData.sdt)) {
    return 'Số điện thoại không hợp lệ. Phải có 10 hoặc 11 chữ số và bắt đầu bằng số 0.'
  }

  const cccdRegex = /^\d{9,12}$/
  if (!cccdRegex.test(formData.cccd)) {
    return 'Số CCCD không hợp lệ. Phải bao gồm đúng 9 hoặc 12 chữ số.'
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(formData.email)) {
    return 'Địa chỉ Email không hợp lệ.'
  }

  if (!imageFile.value) {
    return 'Vui lòng tải lên ảnh thẻ 3x4.'
  }

  return null
}

const handleSubmit = async () => {
  errorMessage.value = ''
  const errorMsg = validate()
  
  if (errorMsg) {
    errorMessage.value = errorMsg
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  isSubmitting.value = true
  
  try {
    const dayStr = String(birthDay.value).padStart(2, '0')
    const monthStr = String(birthMonth.value).padStart(2, '0')
    const dob = `${birthYear.value}-${monthStr}-${dayStr}`

    // Prepare Multipart FormData
    const submitData = new FormData()
    submitData.append('ho_ten', formData.hoTen)
    submitData.append('ngay_sinh', dob)
    submitData.append('gioi_tinh', formData.gioiTinh)
    submitData.append('cccd', formData.cccd)
    submitData.append('sdt', formData.sdt)
    submitData.append('email', formData.email)
    submitData.append('nghe_nghiep', formData.ngheNghiep)
    submitData.append('dia_chi', formData.diaChi)
    submitData.append('ma_phuong_xa', Number(formData.maPhuongXa))
    submitData.append('ma_loai_the', Number(selectedCardType.value))
    submitData.append('anh_the', imageFile.value)

    const response = await axios.post(`${API_BASE_URL}/yeu-cau-the/dang-ky`, submitData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (response.data && response.data.data) {
      requestId.value = response.data.data.mayeucauthe
      submitSuccess.value = true
    } else {
      errorMessage.value = "Không nhận được phản hồi hợp lệ từ server."
    }

  } catch (err) {
    console.error("Yêu cầu cấp thẻ thất bại:", err)
    errorMessage.value = err.response?.data?.detail || "Gửi hồ sơ thất bại. Hãy kiểm tra lại kết nối."
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } finally {
    isSubmitting.value = false
  }
}
</script>
