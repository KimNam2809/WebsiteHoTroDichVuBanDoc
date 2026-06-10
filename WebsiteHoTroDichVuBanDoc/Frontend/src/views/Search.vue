<template>
  <div class="min-h-screen bg-gray-50 pb-20">
    <!-- 1. HERO HEADER -->
    <div class="relative bg-gradient-to-r from-blue-900 to-indigo-900 h-64 flex items-center justify-center overflow-hidden">
      <div class="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
      <div class="relative z-10 text-center px-4">
        <h1 class="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">Kho Tàng Tri Thức</h1>
        <p class="text-blue-200 text-lg max-w-2xl mx-auto">Tra cứu hàng ngàn đầu sách, tài liệu nghiên cứu và tạp chí khoa học.</p>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">
      <!-- 2. SEARCH BAR -->
      <div class="bg-white rounded-2xl shadow-xl p-4 md:p-6 flex flex-col md:flex-row gap-4 items-center animate-fade-in">
        <div class="flex-1 w-full relative group">
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" :size="20" />
          <input
            type="text"
            v-model="inputSearch"
            @keydown.enter="handleSearch"
            placeholder="Nhập tên sách, tác giả, ISBN..."
            class="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>

        <div class="w-full md:w-64 relative">
          <Filter class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" :size="20" />
          <select
            v-model="inputCat"
            class="w-full pl-12 pr-10 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
          >
            <option value="">Tất cả danh mục</option>
            <option v-for="cat in categories" :key="cat.madanhmuc" :value="cat.madanhmuc">
              {{ cat.tendanhmuc }}
            </option>
          </select>
          <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <ChevronLeft class="-rotate-90 text-gray-400 w-4 h-4" />
          </div>
        </div>

        <button
          @click="handleSearch"
          class="w-full md:w-auto px-8 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <Search :size="20" /> Tìm kiếm
        </button>
      </div>

      <!-- 3. BOOK GRID -->
      <div class="mt-12">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BookOpen class="text-blue-600" /> Kết quả tìm kiếm
          </h2>
          <span class="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {{ totalBooks }} tài liệu
          </span>
        </div>

        <div v-if="isLoading" class="grid grid-cols-2 md:grid-cols-4 gap-6 animate-pulse">
          <div v-for="i in 4" :key="i" class="h-80 bg-gray-200 rounded-2xl"></div>
        </div>

        <div v-else-if="books.length === 0" class="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
          <div class="inline-flex p-4 bg-gray-100 rounded-full mb-4 text-gray-400">
            <Search :size="40" />
          </div>
          <h3 class="text-xl font-bold text-gray-700">Không tìm thấy kết quả</h3>
          <p class="text-gray-500 mt-2">Hãy thử từ khóa khác hoặc chọn danh mục rộng hơn.</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <router-link
            v-for="work in books"
            :key="work.matacpham"
            :to="`/tai_lieu/${work.matacpham}`"
            class="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 hover:-translate-y-2 flex flex-col h-full"
          >
            <!-- Image Wrapper -->
            <div class="relative aspect-[3/4] overflow-hidden bg-gray-100">
              <img
                v-if="work.anhbia"
                :src="work.anhbia"
                :alt="work.tentacpham"
                class="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
              />
              <div v-else class="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                <Book :size="48" :stroke-width="1" />
                <span class="text-xs mt-2 font-medium uppercase tracking-wider">No Cover</span>
              </div>
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>

            <!-- Content -->
            <div class="p-5 flex-1 flex flex-col">
              <div class="mb-2">
                <span class="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                  {{ work.namxuatban || 'N/A' }}
                </span>
              </div>
              <h3 class="text-base font-bold text-gray-900 leading-tight mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors" :title="work.tentacpham">
                {{ work.tentacpham }}
              </h3>
              <p class="text-sm text-gray-500 font-medium mb-4 flex items-center gap-1">
                <User :size="14" /> {{ work.tacgia }}
              </p>

              <div class="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                <span class="text-xs font-semibold text-gray-400">Xem chi tiết</span>
                <div class="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <ChevronRight :size="16" />
                </div>
              </div>
            </div>
          </router-link>
        </div>

        <!-- 4. PAGINATION -->
        <div v-if="!isLoading && totalPages > 1" class="flex justify-center items-center mt-16 gap-3">
          <button
            @click="handlePageChange(currentPage - 1)"
            :disabled="currentPage <= 1"
            class="w-10 h-10 flex items-center justify-center rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft :size="20" />
          </button>

          <button
            v-for="p in totalPages"
            :key="p"
            @click="handlePageChange(p)"
            :class="[
              'w-10 h-10 rounded-lg text-sm font-bold transition-all',
              currentPage === p
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            ]"
          >
            {{ p }}
          </button>

          <button
            @click="handlePageChange(currentPage + 1)"
            :disabled="currentPage >= totalPages"
            class="w-10 h-10 flex items-center justify-center rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight :size="20" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { Search, Filter, BookOpen, ChevronLeft, ChevronRight, Book, User } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const categories = ref([])
const books = ref([])
const totalBooks = ref(0)
const isLoading = ref(true)

const inputSearch = ref(route.query.q || '')
const inputCat = ref(route.query.category || '')
const currentPage = ref(Number(route.query.page) || 1)
const pageSize = 8
const totalPages = ref(0)

const fetchCats = async () => {
  try {
    const res = await axios.get(`${API_BASE_URL}/danh-muc/`)
    categories.value = res.data || []
  } catch (error) {
    console.error('Lỗi tải danh mục:', error)
  }
}

const fetchData = async () => {
  isLoading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize
    }
    if (route.query.q) params.q = route.query.q
    if (route.query.category) params.danh_muc_id = route.query.category

    const res = await axios.get(`${API_BASE_URL}/tac-pham/tim-kiem-nang-cao`, { params })
    books.value = res.data.data || []
    totalBooks.value = res.data.total || 0
    totalPages.value = res.data.total_pages || 0
  } catch (error) {
    console.error('Lỗi tìm sách:', error)
    books.value = []
    totalBooks.value = 0
    totalPages.value = 0
  } finally {
    isLoading.value = false
  }
}

const handleSearch = () => {
  const query = {}
  if (inputSearch.value) query.q = inputSearch.value
  if (inputCat.value) query.category = inputCat.value
  query.page = 1
  router.push({ path: '/tim_kiem', query })
}

const handlePageChange = (newPage) => {
  const query = { ...route.query }
  query.page = newPage
  router.push({ path: '/tim_kiem', query })
}

watch(() => route.query, () => {
  inputSearch.value = route.query.q || ''
  inputCat.value = route.query.category || ''
  currentPage.value = Number(route.query.page) || 1
  fetchData()
}, { deep: true })

onMounted(() => {
  fetchCats()
  fetchData()
})
</script>
