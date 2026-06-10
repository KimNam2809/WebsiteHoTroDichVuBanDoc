<template>
  <div class="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 font-sans">
    
    <!-- Tooltip -->
    <transition name="tooltip-fade">
      <div
        v-if="isHovered && !isOpen"
        class="bg-white px-4 py-3 rounded-xl shadow-xl border border-gray-100 text-sm text-gray-700 font-medium mb-2 mr-2 max-w-[220px] text-right relative"
      >
        Bạn có thể hỏi đáp nhanh chóng với Chatbot AI 🤖
        <div class="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-b border-r border-gray-100 transform rotate-45"></div>
      </div>
    </transition>

    <!-- Cửa sổ Chat -->
    <transition name="chat-slide">
      <div
        v-if="isOpen"
        class="w-[350px] sm:w-[380px] h-[550px] bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col origin-bottom-right"
      >
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 to-cyan-500 p-4 flex items-center justify-between shrink-0 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white relative shadow-inner border border-white/10">
              <Sparkles :size="20" />
              <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-blue-600 animate-pulse"></span>
            </div>
            <div>
              <h3 class="font-bold text-white text-lg leading-tight">Smart Assistant</h3>
              <p class="text-blue-100 text-xs font-medium">Trợ lý ảo thông minh</p>
            </div>
          </div>
          <button @click="isOpen = false" class="text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors">
            <X :size="20" />
          </button>
        </div>

        <!-- Body Chat -->
        <div ref="scrollRef" class="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 custom-scrollbar">
          <div v-for="msg in messages" :key="msg.id" :class="['flex w-full flex-col', msg.type === 'user' ? 'items-end' : 'items-start']">
            <div :class="['flex max-w-[85%]', msg.type === 'user' ? 'justify-end' : 'justify-start']">
              <div v-if="msg.type === 'bot'" class="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white shrink-0 mr-2 mt-1 shadow-sm">
                <Sparkles :size="14" />
              </div>
              <div :class="[
                'p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm',
                msg.type === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'
              ]">
                <span v-for="(line, i) in renderMessageLines(msg.text)" :key="i">
                  {{ line }}
                  <br v-if="i < renderMessageLines(msg.text).length - 1" />
                </span>
              </div>
            </div>

            <!-- --- XỬ LÝ ACTION HIỂN THỊ SÁCH --- -->
            <div v-if="msg.type === 'bot' && msg.action && msg.action.type === 'show_books'" class="ml-10 mt-2 flex flex-col gap-2 w-full pr-4 animate-fade-in">
              <div
                v-for="(book, index) in msg.action.payload"
                :key="book.matacpham || index"
                @click="goToBookDetail(book.matacpham || book.id)"
                class="flex items-start gap-3 p-3 mt-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group max-w-[280px]"
              >
                <!-- Ảnh bìa -->
                <div class="relative w-12 h-16 shrink-0 rounded-md overflow-hidden bg-gray-100 border border-gray-100">
                  <img
                    v-if="book.anhbia || book.cover"
                    :src="book.anhbia || book.cover"
                    :alt="book.tentacpham || book.title"
                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                    <Book :size="20" />
                  </div>
                </div>

                <!-- Thông tin -->
                <div class="flex-1 min-w-0">
                  <h4 class="text-sm font-bold text-gray-800 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                    {{ book.tentacpham || book.title }}
                  </h4>
                  <p class="text-xs text-gray-500 mt-1 truncate">{{ book.tacgia || book.author }}</p>
                  <div class="flex items-center gap-1 mt-2 text-[10px] font-bold text-blue-600 bg-blue-50 w-fit px-2 py-0.5 rounded-full">
                    Xem chi tiết <ChevronRight :size="10" />
                  </div>
                </div>
              </div>
            </div>

            <!-- RENDER ACTION BUTTON (Nếu có) -->
            <div v-if="msg.type === 'bot' && msg.action && msg.action.type === 'navigate'" class="mt-2 ml-10 animate-fade-in">
              <button
                @click="handleActionClick(msg.action)"
                class="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold border border-blue-100 hover:bg-blue-100 hover:border-blue-300 transition-all shadow-sm group"
              >
                {{ msg.action.payload.label || "Xem chi tiết" }}
                <ExternalLink :size="12" class="group-hover:translate-x-0.5 transition-transform"/>
              </button>
            </div>
          </div>

          <!-- Loading Indicator -->
          <div v-if="isLoading" class="flex justify-start w-full">
            <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white shrink-0 mr-2 shadow-sm">
              <Sparkles :size="14" />
            </div>
            <div class="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2">
              <Loader2 class="animate-spin text-blue-600" :size="16" />
              <span class="text-xs text-gray-500 font-medium">Đang xử lý...</span>
            </div>
          </div>

          <!-- Gợi ý chức năng -->
          <div v-if="messages.length === 1 && !isLoading" class="mt-6 animate-fade-in">
            <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">Gợi ý cho bạn</p>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="(item, idx) in suggestions"
                :key="idx"
                @click="handleSuggestionClick(item.action)"
                class="flex flex-col items-center justify-center p-3 bg-white border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all gap-2 shadow-sm group active:scale-95"
              >
                <div class="p-2 bg-gray-50 rounded-full text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                  <component :is="item.icon" :size="18" />
                </div>
                <span class="text-xs font-medium text-center line-clamp-1">{{ item.label }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="p-3 bg-white border-t border-gray-100">
          <form
            @submit.prevent="handleSend()"
            class="flex items-center gap-2 bg-gray-50 p-1.5 rounded-full border border-gray-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all shadow-inner"
          >
            <input
              type="text"
              v-model="input"
              placeholder="Nhập câu hỏi của bạn..."
              class="flex-1 bg-transparent px-4 py-2 outline-none text-sm text-gray-700 placeholder-gray-400"
            />
            <button
              type="submit"
              :disabled="!input.trim() || isLoading"
              class="p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md active:scale-95"
            >
              <Send :size="16" :class="{ 'ml-0.5': input.trim() }" />
            </button>
          </form>
          <p class="text-[10px] text-center text-gray-400 mt-2">
            Powered by Gemini AI. Thông tin chỉ mang tính tham khảo.
          </p>
        </div>
      </div>
    </transition>

    <!-- Trigger Button -->
    <button
      @click="toggleChat"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
      :class="[
        'w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 z-50',
        isOpen
          ? 'bg-gray-100 text-gray-600 rotate-90 border border-gray-200'
          : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-blue-500/50'
      ]"
    >
      <X v-if="isOpen" :size="28" />
      <MessageCircle v-else :size="32" fill="currentColor" class="opacity-90" />
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import axios from 'axios'
import { 
  MessageCircle, X, Send, Sparkles, User, Book, Calendar, HelpCircle, Loader2, ExternalLink, ChevronRight 
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

const isOpen = ref(false)
const isHovered = ref(false)
const input = ref('')
const messages = ref([])
const isLoading = ref(false)
const sessionId = ref(null)
const scrollRef = ref(null)

const getGreeting = (userName) => {
  const hour = new Date().getHours()
  let timeGreeting = "Chào buổi sáng"
  if (hour >= 12 && hour < 18) timeGreeting = "Chào buổi chiều"
  if (hour >= 18) timeGreeting = "Chào buổi tối"
  return `${timeGreeting}, ${userName || 'bạn'}!`
}

const suggestions = computed(() => {
  const role = authStore.role
  const common = [
    { label: "Tìm sách", action: "Tìm sách", icon: Book },
    { label: "Giờ mở cửa", action: "Thư viện mở cửa lúc nào?", icon: HelpCircle }
  ]

  if (!authStore.isAuthenticated || role === 'guest') {
    return [
      { label: "Hướng dẫn làm thẻ", action: "Làm thẻ thư viện cần những gì?", icon: User },
      ...common
    ]
  }

  if (role === 'ban_doc' || role === 'nguoiDung') {
    return [
      { label: "Sách đang mượn", action: "Tôi đang mượn sách gì?", icon: Book },
      { label: "Gia hạn sách", action: "Tôi muốn gia hạn sách", icon: Calendar },
      ...common
    ]
  }

  // Nhân viên / Admin
  return [
    { label: "Tra cứu hồ sơ", action: "Tra cứu hồ sơ bạn đọc", icon: User },
    { label: "Thống kê hôm nay", action: "Thống kê hoạt động hôm nay", icon: Sparkles }
  ]
})

const scrollToBottom = () => {
  nextTick(() => {
    if (scrollRef.value) {
      scrollRef.value.scrollTop = scrollRef.value.scrollHeight
    }
  })
}

watch(messages, () => {
  scrollToBottom()
}, { deep: true })

watch(isOpen, (newVal) => {
  if (newVal) {
    scrollToBottom()
    if (messages.value.length === 0) {
      const greeting = getGreeting(authStore.user?.hoten || authStore.user?.username)
      messages.value.push({
        id: 1,
        type: 'bot',
        text: `${greeting} Tôi là trợ lý AI của thư viện. Bạn cần tôi giúp gì hôm nay?`,
        isGreeting: true
      })
    }
  }
})

const toggleChat = () => {
  isOpen.value = !isOpen.value
}

const handleSend = async (text = input.value) => {
  if (!text.trim()) return

  const userMsg = { id: Date.now() + Math.random(), type: 'user', text: text }
  messages.value.push(userMsg)
  input.value = ''
  isLoading.value = true

  try {
    const payload = {
      user_id: authStore.user?.id || authStore.user?.manguoidung || null,
      session_id: sessionId.value,
      message: text
    }

    const response = await axios.post(`${API_BASE_URL}/chatbot/chat`, payload)
    const result = response.data
    
    if (result.session_id) sessionId.value = result.session_id

    const botMsg = {
      id: Date.now() + Math.random(),
      type: 'bot',
      text: result.reply,
      action: result.action
    }
    messages.value.push(botMsg)
  } catch (error) {
    console.error("Chatbot transmission error:", error)
    messages.value.push({
      id: Date.now() + Math.random(),
      type: 'bot',
      text: error.response?.data?.detail || "Xin lỗi, tôi gặp sự cố kết nối."
    })
  } finally {
    isLoading.value = false
  }
}

const handleSuggestionClick = (actionText) => {
  handleSend(actionText)
}

const handleActionClick = (action) => {
  if (action.type === 'navigate' && action.payload?.url) {
    isOpen.value = false
    router.push(action.payload.url)
  }
}

const goToBookDetail = (bookId) => {
  isOpen.value = false
  router.push(`/tai_lieu/${bookId}`)
}

const renderMessageLines = (text) => {
  if (!text) return []
  return text.split('\n')
}
</script>

<style scoped>
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: scale(0.9) translateX(10px);
}

.chat-slide-enter-active,
.chat-slide-leave-active {
  transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.chat-slide-enter-from,
.chat-slide-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(40px);
}
</style>
