<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 selection:bg-cyan-500 selection:text-slate-950">
    <!-- Hero Banner (Dark with Glowing Effects) -->
    <div class="relative py-24 overflow-hidden bg-gradient-to-b from-blue-950/40 via-slate-950 to-slate-950 border-b border-slate-900">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))]"></div>
      <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0"></div>
      <div class="relative z-10 max-w-6xl mx-auto px-4 text-center">
        <span class="inline-block py-1 px-3 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-6 uppercase tracking-wider">
          THƯ VIỆN ONLINE
        </span>
        <h1 class="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-6">
          Tin Tức & <span class="text-cyan-400">Sự Kiện</span>
        </h1>
        <p class="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-light leading-relaxed">
          Cập nhật những hoạt động mới nhất, các sự kiện phát triển văn hóa đọc và thông báo chính thức.
        </p>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="max-w-6xl mx-auto px-4 -mt-10 relative z-20">
      <!-- Toolbar: Categories Filter & Search Input -->
      <div class="bg-slate-900/60 backdrop-blur-xl p-5 rounded-3xl border border-slate-800 shadow-2xl flex flex-col lg:flex-row gap-6 justify-between items-center mb-10">
        <!-- Categories -->
        <div class="flex flex-wrap gap-2 justify-center lg:justify-start w-full lg:w-auto">
          <button
            v-for="cat in CATEGORIES"
            :key="cat.id"
            @click="handleCategoryChange(cat.id)"
            :class="[
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-300',
              currentCategorySlug === cat.id
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20 scale-[1.03]'
                : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-900'
            ]"
          >
            <component :is="cat.icon" :size="14" />
            {{ cat.label }}
          </button>
        </div>

        <!-- Search input box -->
        <div class="relative w-full lg:w-80 group">
          <input
            type="text"
            v-model="searchTerm"
            @keyup.enter="handleSearch"
            placeholder="Tìm kiếm bài viết..."
            class="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-900 rounded-2xl text-slate-200 placeholder-slate-600 focus:bg-slate-900/80 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all text-sm font-light"
          />
          <button @click="handleSearch" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400 cursor-pointer">
            <Search :size="16" />
          </button>
        </div>
      </div>

      <!-- Articles Grid -->
      <div>
        <div v-if="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div v-for="i in 6" :key="i" class="bg-slate-900/40 rounded-3xl border border-slate-900 h-96 animate-pulse">
            <div class="h-48 bg-slate-900 rounded-t-3xl w-full mb-4"></div>
            <div class="px-6 space-y-3">
              <div class="h-4 bg-slate-800 rounded w-1/3"></div>
              <div class="h-6 bg-slate-800 rounded w-3/4"></div>
              <div class="h-4 bg-slate-800 rounded w-full"></div>
            </div>
          </div>
        </div>

        <div v-else-if="posts.length === 0" class="text-center py-20 bg-slate-900/20 rounded-3xl border border-dashed border-slate-900 shadow-sm">
          <div class="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter class="text-slate-600" :size="24" />
          </div>
          <h3 class="text-lg font-bold text-slate-300 mb-2">Không tìm thấy bài viết nào</h3>
          <p class="text-xs text-slate-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
          <button
            @click="clearFilters"
            class="mt-6 px-5 py-2.5 bg-cyan-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-cyan-400 transition"
          >
            Xóa bộ lọc
          </button>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <router-link
            v-for="post in posts"
            :key="post.mabaiviet"
            :to="`/bai_viet/${post.mabaiviet}`"
            class="group bg-slate-900/40 rounded-3xl border border-slate-900 hover:border-slate-800 hover:bg-slate-900/60 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col h-full"
          >
            <!-- Image Wrap -->
            <div class="relative h-56 w-full overflow-hidden bg-slate-950">
              <img
                v-if="getThumbUrl(post)"
                :src="getThumbUrl(post)"
                :alt="post.tieude"
                class="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
              />
              <div v-else class="absolute inset-0 flex items-center justify-center bg-slate-900">
                <ImageIcon class="text-slate-700" :size="40" />
              </div>

              <!-- Badge Category tag -->
              <div class="absolute top-4 left-4">
                <span :class="['px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-sm', getBadgeColor(post.tukhoa?.[0])]">
                  {{ getDisplayLabel(post.tukhoa?.[0]) }}
                </span>
              </div>
            </div>

            <!-- Card Content -->
            <div class="p-6 flex flex-col flex-1">
              <div class="flex items-center gap-4 text-[10px] text-slate-500 mb-3 font-medium">
                <span class="flex items-center gap-1"><Calendar :size="12"/> {{ formatDate(post.ngaydang) }}</span>
                <span class="flex items-center gap-1"><Eye :size="12"/> {{ post.soluotxem || 0 }} lượt xem</span>
              </div>

              <h3 class="text-lg font-bold text-slate-200 mb-3 line-clamp-2 group-hover:text-cyan-400 transition-colors">
                {{ post.tieude }}
              </h3>

              <p class="text-slate-400 text-xs line-clamp-3 mb-6 flex-1 font-light leading-relaxed">
                {{ cleanContent(post.noidung) }}
              </p>

              <div class="flex items-center justify-between pt-4 border-t border-slate-900 mt-auto">
                <span class="text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  Đọc tiếp <ArrowRight :size="14"/>
                </span>
              </div>
            </div>
          </router-link>
        </div>
      </div>

      <!-- Pagination Controls -->
      <div v-if="!isLoading && pagination.totalPages > 1" class="mt-12 flex justify-center items-center gap-4">
        <button
          @click="handlePageChange(pagination.currentPage - 1)"
          :disabled="pagination.currentPage === 1"
          class="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-800 rounded-xl text-xs text-slate-300 font-bold transition"
        >
          Trước
        </button>

        <span class="text-xs text-slate-400">
          Trang {{ pagination.currentPage }} / {{ pagination.totalPages }}
        </span>

        <button
          @click="handlePageChange(pagination.currentPage + 1)"
          :disabled="pagination.currentPage === pagination.totalPages"
          class="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-800 rounded-xl text-xs text-slate-300 font-bold transition"
        >
          Sau
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { 
  Search, Calendar, Eye, ArrowRight, BookOpen, 
  Filter, Bell, Zap, Image as ImageIcon, Star 
} from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const CATEGORIES = [
  { id: 'all',       dbValue: null,        label: 'Tất cả',    icon: BookOpen },
  { id: 'tin-tuc',   dbValue: 'tin tức',   label: 'Tin tức',   icon: BookOpen },
  { id: 'su-kien',   dbValue: 'sự kiện',   label: 'Sự kiện',   icon: Calendar },
  { id: 'hoat-dong', dbValue: 'hoạt động', label: 'Hoạt động', icon: Zap },
  { id: 'thong-bao', dbValue: 'thông báo', label: 'Thông báo', icon: Bell },
  { id: 'noi-bat',   dbValue: 'nổi bật',   label: 'Nổi bật',   icon: Star }
]

const posts = ref([])
const isLoading = ref(true)
const searchTerm = ref(route.query.search || '')
const currentCategorySlug = ref(route.query.category || 'all')

const pagination = ref({
  currentPage: 1,
  totalPages: 1,
  totalItems: 0
})

const fetchPosts = async (page = 1) => {
  isLoading.value = true
  try {
    const params = {
      page: page,
      limit: 12
    }

    if (currentCategorySlug.value !== 'all') {
      const catObj = CATEGORIES.find(c => c.id === currentCategorySlug.value)
      if (catObj && catObj.dbValue) {
        params.category = catObj.dbValue
      }
    }

    if (searchTerm.value.trim()) {
      params.search = searchTerm.value.trim()
    }

    const res = await axios.get(`${API_BASE_URL}/bai-viet/`, { params })
    if (res.data) {
      posts.value = res.data.data || []
      if (res.data.meta) {
        pagination.value = {
          currentPage: res.data.meta.current_page || 1,
          totalPages: res.data.meta.total_pages || 1,
          totalItems: res.data.meta.total_items || 0
        }
      }
    }
  } catch (e) {
    console.error('Lỗi tải danh sách bài viết:', e)
    posts.value = []
  } finally {
    isLoading.value = false
  }
}

const handleCategoryChange = (catId) => {
  currentCategorySlug.value = catId
  const query = { ...route.query }
  if (catId === 'all') delete query.category
  else query.category = catId
  query.page = 1
  router.push({ path: '/bai_viet', query })
}

const handleSearch = () => {
  const query = { ...route.query }
  if (searchTerm.value.trim()) {
    query.search = searchTerm.value.trim()
  } else {
    delete query.search
  }
  query.page = 1
  router.push({ path: '/bai_viet', query })
}

const handlePageChange = (newPage) => {
  const query = { ...route.query }
  query.page = newPage
  router.push({ path: '/bai_viet', query })
}

const clearFilters = () => {
  searchTerm.value = ''
  currentCategorySlug.value = 'all'
  router.push({ path: '/bai_viet' })
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

const cleanContent = (htmlContent) => {
  if (!htmlContent) return ''
  return htmlContent.replace(/<[^>]*>?/gm, '').substring(0, 120) + '...'
}

const getThumbUrl = (post) => {
  if (!post.anhdaidien) return null
  if (typeof post.anhdaidien === 'object') {
    return Object.values(post.anhdaidien)[0]
  }
  return post.anhdaidien
}

const getDisplayLabel = (tag) => {
  const matched = CATEGORIES.find(c => c.dbValue === tag)
  return matched ? matched.label : 'Tin tức'
}

const getBadgeColor = (tag) => {
  if (tag === 'sự kiện') return 'bg-orange-500/10 border border-orange-500/20 text-orange-400'
  if (tag === 'thông báo') return 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
  if (tag === 'hoạt động') return 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
  if (tag === 'nổi bật') return 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
  return 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
}

watch(() => route.query, () => {
  searchTerm.value = route.query.search || ''
  currentCategorySlug.value = route.query.category || 'all'
  fetchPosts(Number(route.query.page) || 1)
}, { deep: true })

onMounted(() => {
  fetchPosts(Number(route.query.page) || 1)
})
</script>
