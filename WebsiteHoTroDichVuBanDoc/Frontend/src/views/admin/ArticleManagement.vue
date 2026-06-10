<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold mb-2 text-gray-800">Quản lý bài viết</h1>
        <p class="text-sm text-gray-500">Xem danh sách bài viết và xóa nội dung không còn phù hợp.</p>
      </div>
      <button
        @click="loadPosts"
        class="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Làm mới
      </button>
    </div>

    <div class="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
      <div v-if="isLoading" class="p-10 text-center text-gray-500">
        Đang tải danh sách bài viết...
      </div>

      <div v-else-if="posts.length === 0" class="p-10 text-center text-gray-500">
        Không có bài viết nào để hiển thị.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mã</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tiêu đề</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
              <th class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Lượt xem</th>
              <th class="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="post in posts" :key="post.mabaiviet" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                #{{ post.mabaiviet }}
              </td>
              <td class="px-6 py-4">
                <div class="max-w-xl">
                  <div class="text-sm font-semibold text-gray-900 line-clamp-1">{{ post.tieude }}</div>
                  <div class="text-xs text-gray-500 line-clamp-2 mt-1">
                    {{ cleanContent(post.noidung) }}
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="[
                  'inline-flex px-2.5 py-1 rounded-full text-xs font-semibold',
                  post.trangthai ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                ]">
                  {{ post.trangthai ? 'Đã duyệt' : 'Chờ duyệt' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {{ post.soluotxem || 0 }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-center">
                <button
                  @click="deletePost(post)"
                  :disabled="isDeleting && deletingId === post.mabaiviet"
                  class="inline-flex items-center px-3 py-1.5 rounded-md border border-red-200 text-red-700 text-sm font-medium hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {{ isDeleting && deletingId === post.mabaiviet ? 'Đang xóa...' : 'Xóa' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const posts = ref([])
const isLoading = ref(true)
const isDeleting = ref(false)
const deletingId = ref(null)

const cleanContent = (content) => {
  if (!content) return ''
  return String(content)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const loadPosts = async () => {
  isLoading.value = true
  try {
    const response = await axios.get(`${API_BASE_URL}/bai-viet/`, {
      params: { page: 1, limit: 100 }
    })
    posts.value = response.data?.data || []
  } catch (error) {
    console.error('Lỗi tải danh sách bài viết:', error)
    posts.value = []
  } finally {
    isLoading.value = false
  }
}

const deletePost = async (post) => {
  if (!window.confirm(`Xóa bài viết "${post.tieude}"?`)) return

  isDeleting.value = true
  deletingId.value = post.mabaiviet
  try {
    await axios.delete(`${API_BASE_URL}/bai-viet/${post.mabaiviet}`)
    posts.value = posts.value.filter(item => item.mabaiviet !== post.mabaiviet)
  } catch (error) {
    console.error('Lỗi xóa bài viết:', error)
    window.alert(error.response?.data?.detail || 'Không thể xóa bài viết.')
  } finally {
    isDeleting.value = false
    deletingId.value = null
  }
}

onMounted(loadPosts)
</script>