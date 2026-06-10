<template>
  <form @submit.prevent="handleSearch" class="flex w-full max-w-2xl mx-auto">
    <input
      type="text"
      v-model="searchTerm"
      placeholder="Tìm kiếm sách, tài liệu, bài báo..."
      class="grow p-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <button
      type="submit"
      class="px-6 py-3 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
    >
      Tìm
    </button>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  initialQuery: {
    type: String,
    default: ''
  }
})

const searchTerm = ref(props.initialQuery)
const router = useRouter()

const handleSearch = () => {
  router.push({ path: '/tim_kiem', query: { q: searchTerm.value } })
}
</script>
