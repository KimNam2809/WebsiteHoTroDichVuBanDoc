<template>
  <div class="overflow-x-hidden font-sans">
    
    <!-- 1. HERO SECTION: Tìm kiếm trung tâm -->
    <section class="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden">
      <!-- Background Gradient & Pattern -->
      <div class="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 z-0"></div>
      <div class="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0"></div>
      <!-- Glow Effects -->
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-[100px]"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px]"></div>

      <div class="relative z-10 container mx-auto px-4 text-center">
        <div class="reveal animate-fade-in">
          <span class="inline-block py-1 px-3 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm font-semibold mb-6 backdrop-blur-sm">
            ✨ Trải nghiệm Thư viện Số Thông minh
          </span>
          <h1 class="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Khám phá Tri thức <br />
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Không Giới Hạn</span>
          </h1>
          <p class="text-lg md:text-xl text-blue-100/80 mb-10 max-w-2xl mx-auto font-light">
            Hơn 50,000 đầu sách, không gian học tập hiện đại và trợ lý AI thông minh sẵn sàng hỗ trợ bạn mọi lúc.
          </p>

          <!-- Search Box lớn -->
          <div class="max-w-3xl mx-auto bg-white/10 backdrop-blur-lg p-2 rounded-2xl border border-white/20 shadow-2xl transform transition-transform hover:scale-[1.01]">
            <div class="flex flex-col md:flex-row gap-2">
              <div class="relative flex-1">
                <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-blue-200" :size="20" />
                <input
                  type="text"
                  v-model="searchQuery"
                  @keyup.enter="goToSearch"
                  placeholder="Tìm tên sách, tác giả, ISBN..."
                  class="w-full h-14 pl-12 pr-4 bg-transparent text-white placeholder-blue-200/50 outline-none text-lg rounded-xl focus:bg-white/5 transition-colors"
                />
              </div>
              <button
                @click="goToSearch"
                class="h-14 px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-500/50"
              >
                Tìm kiếm <ArrowRight :size="20" />
              </button>
            </div>
          </div>

          <!-- Quick Stats Pills -->
          <div class="mt-12 pb-16 flex flex-wrap justify-center gap-4 md:gap-8 text-blue-200/80 text-sm font-medium">
            <span class="flex items-center gap-2"><Book :size="16" class="text-cyan-400"/> 50k+ Đầu sách</span>
            <span class="flex items-center gap-2"><Users :size="16" class="text-cyan-400"/> 15k+ Thành viên</span>
            <span class="flex items-center gap-2"><Clock :size="16" class="text-cyan-400"/> Mở cửa 24/7</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. FEATURES GRID: Tại sao chọn chúng tôi? -->
    <section class="py-20 bg-slate-50">
      <div class="container mx-auto px-4">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">Tiện ích Vượt trội</h2>
          <p class="text-gray-600 max-w-2xl mx-auto">Chúng tôi không chỉ là nơi lưu trữ sách. Chúng tôi là không gian sáng tạo và kết nối tri thức.</p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <div 
            v-for="(feature, idx) in features" 
            :key="idx" 
            class="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 card-hover"
          >
            <div :class="['w-14 h-14 rounded-2xl flex items-center justify-center mb-6', feature.bg, feature.color]">
              <component :is="feature.icon" :size="28" />
            </div>
            <h3 class="text-xl font-bold text-gray-800 mb-3">{{ feature.title }}</h3>
            <p class="text-gray-600 leading-relaxed">{{ feature.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. AI DASHBOARD: Điểm nhấn công nghệ -->
    <section class="py-20 bg-white relative overflow-hidden">
      <div class="absolute top-0 right-0 w-1/2 h-full bg-blue-50/50 skew-x-12 z-0"></div>
      <div class="container mx-auto px-4 relative z-10">
        <div class="flex flex-col lg:flex-row items-center gap-12">
          
          <!-- Text Content -->
          <div class="lg:w-1/2">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase mb-6">
              <Star :size="14" /> Powered by AI
            </div>
            <h2 class="text-4xl font-bold text-gray-900 mb-6">Trợ lý ảo thông minh &<br/>Gợi ý cá nhân hóa</h2>
            <p class="text-gray-600 text-lg mb-8 leading-relaxed">
              Không còn mất thời gian tìm kiếm. Hệ thống AI phân tích thói quen đọc của bạn để đề xuất những cuốn sách phù hợp nhất. Chatbot hỗ trợ giải đáp mọi thắc mắc 24/7.
            </p>
            <div class="flex gap-4">
              <button @click="openAI" class="px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition shadow-lg">
                Thử Chatbot ngay
              </button>
              <router-link to="/tim_kiem" class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition">
                Xem gợi ý sách
              </router-link>
            </div>
          </div>

          <!-- Visual Dashboard Card -->
          <div class="lg:w-1/2 w-full">
            <div class="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 relative">
              <div class="flex items-center justify-between mb-6 border-b pb-4">
                <div>
                  <h4 class="font-bold text-gray-800">Dự báo hôm nay</h4>
                  <p class="text-xs text-gray-500">Cập nhật: Vừa xong</p>
                </div>
                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>

              <div class="space-y-4">
                <div v-for="(item, i) in aiStats" :key="i" class="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                  <div :class="['p-2 bg-white rounded-lg shadow-sm', item.color]">
                    <component :is="item.icon" :size="20" />
                  </div>
                  <div>
                    <p class="text-xs text-gray-500 font-medium">{{ item.label }}</p>
                    <p class="text-sm font-bold text-gray-800">{{ item.val }}</p>
                  </div>
                </div>
              </div>

              <!-- Decorative Elements -->
              <div class="absolute -z-10 -top-6 -right-6 w-24 h-24 bg-blue-500 rounded-full opacity-20 blur-xl"></div>
              <div class="absolute -z-10 -bottom-6 -left-6 w-32 h-32 bg-cyan-400 rounded-full opacity-20 blur-xl"></div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- 4. NEWS & EVENTS -->
    <section class="py-20 bg-slate-50">
      <div class="container mx-auto px-4">
        
        <!-- Header Section -->
        <div class="flex justify-between items-end mb-10">
          <div>
            <span class="text-blue-600 font-bold text-sm tracking-wider uppercase mb-2 block">Cập nhật liên tục</span>
            <h2 class="text-3xl md:text-4xl font-bold text-gray-900">Tin tức & Sự kiện nổi bật</h2>
          </div>
          <router-link to="/bai_viet" class="hidden md:flex items-center px-5 py-2 rounded-full border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 hover:text-blue-600 transition-all">
            Xem tất cả <ArrowRight :size="18" class="ml-2"/>
          </router-link>
        </div>

        <!-- MAIN GRID LAYOUT -->
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          <!-- CỘT TRÁI (Tin tức) -->
          <div class="lg:col-span-3 space-y-8">
            
            <!-- Slideshow -->
            <div class="relative rounded-2xl overflow-hidden shadow-2xl h-[450px] group">
              <div
                v-for="(slide, index) in highlightSlides"
                :key="slide.id"
                :class="[
                  'absolute inset-0 transition-opacity duration-700 ease-in-out',
                  index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                ]"
              >
                <div :class="['absolute inset-0 bg-gradient-to-br', slide.color]"></div>
                <div class="absolute inset-0 bg-black/40"></div>

                <!-- Nội dung Slide -->
                <div class="absolute bottom-0 left-0 p-8 md:p-12 w-full md:w-3/4 text-white">
                  <span class="bg-white/20 backdrop-blur-md border border-white/30 text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block shadow-sm tracking-wider">
                    {{ slide.category }}
                  </span>
                  <h3 class="text-2xl md:text-4xl font-bold mb-4 leading-tight drop-shadow-lg">
                    {{ slide.title }}
                  </h3>
                  <p class="text-gray-200 line-clamp-2 mb-6 text-sm md:text-lg max-w-2xl">
                    {{ slide.desc }}
                  </p>
                  <div class="flex items-center text-xs md:text-sm text-gray-300 gap-6">
                    <span class="flex items-center gap-2"><Calendar :size="16"/> {{ slide.date }}</span>
                    <span class="flex items-center gap-2"><Users :size="16"/> {{ slide.views }} lượt xem</span>
                  </div>
                </div>
              </div>

              <!-- Slide Controls -->
              <div class="absolute bottom-8 right-8 z-20 flex gap-2">
                <button @click="prevSlide" class="p-2 rounded-full bg-white/10 hover:bg-white/30 text-white backdrop-blur-md transition">
                  <ChevronLeft :size="24" />
                </button>
                <button @click="nextSlide" class="p-2 rounded-full bg-white/10 hover:bg-white/30 text-white backdrop-blur-md transition">
                  <ChevronRight :size="24" />
                </button>
              </div>

              <!-- Slide Indicators -->
              <div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                <button
                  v-for="(_, idx) in highlightSlides"
                  :key="idx"
                  @click="currentSlide = idx"
                  :class="['w-2 h-2 rounded-full transition-all duration-300', idx === currentSlide ? 'bg-white w-6' : 'bg-white/40']"
                ></button>
              </div>
            </div>

            <!-- CÁC TIN VỪA -->
            <div class="grid md:grid-cols-2 gap-6">
              <div 
                v-for="(news, nIdx) in newsGrid" 
                :key="nIdx" 
                @click="goToArticles"
                class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div class="flex items-center gap-2 mb-3">
                    <span :class="['w-2 h-2 rounded-full', news.dotColor]"></span>
                    <span class="text-xs font-bold text-gray-400 uppercase">{{ news.category }}</span>
                  </div>
                  <h4 class="font-bold text-lg text-gray-800 mb-3 group-hover:text-blue-600 line-clamp-2">
                    {{ news.title }}
                  </h4>
                  <p class="text-gray-500 text-sm line-clamp-2 mb-4">
                    {{ news.desc }}
                  </p>
                </div>
                <div class="text-sm text-gray-400 mt-auto flex items-center justify-between border-t pt-3">
                  <p class="flex items-center gap-2"><Clock :size="16" :class="news.textColor"/> {{ news.time }}</p>
                  <span class="text-xs font-medium text-blue-600 group-hover:underline">Chi tiết &rarr;</span>
                </div>
              </div>
            </div>

            <!-- APP BANNER -->
            <div class="relative rounded-2xl overflow-hidden bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-8 flex flex-col md:flex-row items-center justify-between shadow-2xl group cursor-pointer">
              <div class="relative z-10 max-w-xl">
                <div class="flex items-center gap-2 mb-3">
                  <span class="bg-white/20 text-xs font-bold px-3 py-1 rounded-lg backdrop-blur-sm border border-white/20 flex items-center gap-1">
                    <Smartphone :size="14"/> Mobile App
                  </span>
                  <span class="text-yellow-400 text-xs font-bold">★ 4.9/5.0</span>
                </div>
                <h3 class="text-2xl md:text-3xl font-bold mb-2">Thư viện số trong tầm tay bạn</h3>
                <p class="text-blue-100 mb-6 text-sm md:text-base">
                  Quản lý mượn trả, gia hạn sách, đọc Ebook và nhận thông báo sự kiện chỉ với 1 chạm. Tải ngay để nhận ưu đãi thành viên VIP.
                </p>
                <div class="flex gap-3">
                  <button class="bg-white text-blue-800 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-lg flex items-center gap-2">
                    <Download :size="18"/> App Store
                  </button>
                  <button class="bg-transparent border border-white/40 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors flex items-center gap-2">
                    <Download :size="18"/> Google Play
                  </button>
                </div>
              </div>

              <!-- CSS Phone Illustration -->
              <div class="hidden md:block relative z-10 transform group-hover:translate-x-[-10px] transition-transform duration-500">
                <div class="w-32 h-64 bg-gray-900 rounded-[2rem] border-4 border-gray-700 shadow-2xl relative overflow-hidden">
                  <div class="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-800 rounded-b-xl"></div>
                  <div class="w-full h-full bg-white flex flex-col items-center justify-center space-y-2 pt-8">
                    <div class="w-16 h-16 bg-blue-100 rounded-full"></div>
                    <div class="w-20 h-2 bg-gray-100 rounded"></div>
                    <div class="w-16 h-2 bg-gray-100 rounded"></div>
                  </div>
                </div>
              </div>

              <!-- Decorative BG -->
              <div class="absolute -right-20 -bottom-40 w-96 h-96 bg-blue-500 rounded-full opacity-30 blur-3xl"></div>
              <div class="absolute -left-20 -top-40 w-80 h-80 bg-purple-500 rounded-full opacity-30 blur-3xl"></div>
            </div>

          </div>

          <!-- CỘT PHẢI (Sự kiện) -->
          <div class="lg:col-span-1">
            <div class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm sticky top-24 h-full flex flex-col justify-between">
              <div>
                <h4 class="font-bold text-gray-800 mb-6 flex items-center gap-2 pb-4 border-b">
                  <Calendar :size="20" class="text-blue-600"/> Sự kiện sắp tới
                </h4>

                <div class="space-y-6">
                  <div 
                    v-for="(event, eIdx) in upcomingEvents" 
                    :key="eIdx" 
                    class="flex gap-4 items-start group cursor-pointer hover:bg-gray-50 p-2 rounded-lg -mx-2 transition-colors"
                  >
                    <div :class="['w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 border transition-colors shadow-sm', event.bgClass]">
                      <span class="text-[10px] font-bold uppercase">{{ event.month }}</span>
                      <span class="text-xl font-extrabold leading-none">{{ event.day }}</span>
                    </div>
                    <div>
                      <h5 class="font-bold text-gray-800 text-sm group-hover:text-blue-600 transition-colors leading-tight mb-1">
                        {{ event.title }}
                      </h5>
                      <p class="text-xs text-gray-500 flex items-center gap-1">
                        <Clock :size="12"/> {{ event.time }} • {{ event.room }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button class="w-full mt-8 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                Xem lịch đầy đủ
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- 5. CTA: Đăng ký thẻ -->
    <section class="py-20 bg-gray-900 text-white text-center">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl md:text-4xl font-bold mb-6">Sẵn sàng gia nhập cộng đồng tri thức?</h2>
        <p class="text-gray-400 max-w-xl mx-auto mb-10 text-lg">Đăng ký thẻ thành viên ngay hôm nay để truy cập kho tài liệu khổng lồ và sử dụng các dịch vụ tiện ích.</p>
        <div class="flex justify-center gap-4">
          <router-link to="/dang_ky_the" class="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-cyan-500/30 transition-all transform hover:-translate-y-1">
            Đăng ký Thẻ Online
          </router-link>
          <router-link to="/dich_vu" class="px-8 py-4 border border-gray-700 bg-gray-800 rounded-xl font-bold text-lg hover:bg-gray-700 transition-all">
            Tìm hiểu thêm
          </router-link>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Search, ArrowRight, Book, Users, Clock, Zap, MapPin, 
  Calendar, Star, TrendingUp, ChevronLeft, ChevronRight, 
  Smartphone, Download 
} from 'lucide-vue-next'

const router = useRouter()
const searchQuery = ref('')
const currentSlide = ref(0)
let slideInterval = null

const goToSearch = () => {
  router.push({ path: '/tim_kiem', query: { q: searchQuery.value } })
}

const openAI = () => {
  // Simulate clicking on chatbot button by triggering dynamic messaging or opening state in window
  const chatTrigger = document.querySelector('.fixed.bottom-6.right-6 button')
  if (chatTrigger) chatTrigger.click()
}

const goToArticles = () => {
  router.push('/bai_viet')
}

// Features
const features = [
  { icon: Zap, title: "Tra cứu Siêu tốc", desc: "Hệ thống tìm kiếm thông minh đem lại kết quả tối ưu chưa đến 0.5 giây.", color: "text-yellow-500", bg: "bg-yellow-50" },
  { icon: Clock, title: "Phòng đọc hiện đại", desc: "Không gian học tập mở cửa xuyên suốt từ thứ 3 đến chủ nhật, wifi tốc độ cao miễn phí.", color: "text-purple-500", bg: "bg-purple-50" },
  { icon: MapPin, title: "Mượn trả Tự động", desc: "Đặt sách online, nhận sách tại quầy hoặc giao tận nhà nhanh chóng.", color: "text-green-500", bg: "bg-green-50" }
]

// AI Statistics Highlights
const aiStats = [
  { label: "Lượng khách dự kiến", val: "Cao (9:00 - 11:00)", icon: Users, color: "text-blue-600" },
  { label: "Xu hướng mượn", val: "+15% sách Kinh tế", icon: TrendingUp, color: "text-green-600" },
  { label: "Gợi ý cho bạn", val: "3 cuốn sách mới", icon: Book, color: "text-purple-600" }
]

// Highlight slides
const highlightSlides = [
  {
    id: 1,
    category: "MỚI NHẤT",
    title: "Khai trương không gian đọc sách Thực tế ảo (VR/AR)",
    desc: "Trải nghiệm đọc sách trong không gian vũ trụ, khám phá giải phẫu học 3D với công nghệ VR mới nhất được tài trợ bởi Tập đoàn công nghệ.",
    date: "16/12/2025",
    views: "1.2k",
    color: "from-blue-900 via-blue-800 to-black"
  },
  {
    id: 2,
    category: "SỰ KIỆN",
    title: "Giao lưu trực tuyến: Văn hóa đọc trong kỷ nguyên số",
    desc: "Trò chuyện cùng nhà văn Nguyễn Nhật Ánh và các chuyên gia về tương lai của sách giấy trước sự bùng nổ của AI.",
    date: "15/12/2025",
    views: "980",
    color: "from-purple-900 via-indigo-900 to-black"
  },
  {
    id: 3,
    category: "THÔNG BÁO",
    title: "Triển khai hệ thống mượn trả sách Drive-thru",
    desc: "Giờ đây bạn có thể nhận sách đã đặt ngay tại cổng thư viện mà không cần gửi xe. Tiện lợi, nhanh chóng, an toàn.",
    date: "14/12/2025",
    views: "2.5k",
    color: "from-emerald-900 via-teal-900 to-black"
  },
  {
    id: 4,
    category: "HOẠT ĐỘNG",
    title: "Ngày hội trao đổi sách cũ 2025",
    desc: "Mang những cuốn sách bạn đã đọc xong đến để đổi lấy những hành trình mới. Hơn 5000 đầu sách đang chờ đón.",
    date: "12/12/2025",
    views: "1.5k",
    color: "from-orange-900 via-red-900 to-black"
  },
  {
    id: 5,
    category: "CÔNG NGHỆ",
    title: "Nâng cấp Wifi 6 miễn phí toàn bộ khuôn viên",
    desc: "Tốc độ truy cập tăng gấp 5 lần, hỗ trợ kết nối đồng thời 2000 thiết bị phục vụ nhu cầu học tập và tra cứu.",
    date: "10/12/2025",
    views: "3.1k",
    color: "from-cyan-900 via-blue-900 to-black"
  }
]

// News Grid below slides
const newsGrid = [
  {
    category: "Hoạt động",
    title: "Hội thảo: \"Ứng dụng AI trong việc tìm kiếm tài liệu học thuật\"",
    desc: "Hướng dẫn sinh viên cách sử dụng các công cụ AI để tối ưu hóa quá trình nghiên cứu và trích dẫn tài liệu.",
    time: "18/12/2025",
    dotColor: "bg-green-500",
    textColor: "text-green-600"
  },
  {
    category: "Thông báo",
    title: "Bảo trì hệ thống mượn trả tự động khu vực tầng 1",
    desc: "Hệ thống sẽ tạm ngưng hoạt động để nâng cấp firmware, vui lòng sử dụng quầy thủ thư trong thời gian này.",
    time: "20:00 Hôm nay",
    dotColor: "bg-purple-500",
    textColor: "text-purple-600"
  }
]

// Upcoming Events calendar
const upcomingEvents = [
  {
    month: "Tháng 12",
    day: "20",
    title: "CLB Sách: Văn học trinh thám hiện đại",
    time: "14:00",
    room: "Phòng họp 3",
    bgClass: "bg-blue-50 border-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white"
  },
  {
    month: "Tháng 12",
    day: "24",
    title: "Giao lưu tác giả Nguyễn Nhật Ánh",
    time: "08:00",
    room: "Sảnh chính",
    bgClass: "bg-orange-50 border-orange-100 text-orange-700 group-hover:bg-orange-600 group-hover:text-white"
  },
  {
    month: "Tháng 12",
    day: "28",
    title: "Workshop: Kỹ năng viết CV ấn tượng",
    time: "15:30",
    room: "Phòng Studio",
    bgClass: "bg-indigo-50 border-indigo-100 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white"
  },
  {
    month: "Tháng 1",
    day: "05",
    title: "Triển lãm tranh: \"Sắc màu Đà Nẵng\"",
    time: "09:00",
    room: "Tầng 3",
    bgClass: "bg-pink-50 border-pink-100 text-pink-700 group-hover:bg-pink-600 group-hover:text-white"
  }
]

// Slideshow triggers
const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % highlightSlides.length
}

const prevSlide = () => {
  currentSlide.value = currentSlide.value === 0 ? highlightSlides.length - 1 : currentSlide.value - 1
}

onMounted(() => {
  slideInterval = setInterval(nextSlide, 5000)
})

onUnmounted(() => {
  if (slideInterval) clearInterval(slideInterval)
})
</script>
