<template>
  <!-- Headless component -->
</template>

<script setup>
import { onMounted } from 'vue'
import axios from 'axios'

const props = defineProps({
  id: {
    type: [Number, String],
    required: true
  }
})

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const increaseView = async () => {
  try {
    await axios.post(`${API_BASE_URL}/bai-viet/${props.id}/tang-luot-xem`)
    console.log(`Đã tăng view cho bài viết #${props.id}`)
  } catch (error) {
    console.error("Lỗi tăng view:", error)
  }
}

onMounted(() => {
  increaseView()
})
</script>
