<template>
  <footer class="bg-slate-900 text-slate-300 border-t border-slate-800 font-sans">
    <!-- Phần chính -->
    <div class="container mx-auto px-4 py-16">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

        <!-- Cột 1: Thông tin chung -->
        <div class="space-y-4">
          <div class="flex items-center gap-2 mb-4">
            <div class="bg-blue-600 p-1.5 rounded-lg text-white">
              <BookOpen :size="20" :stroke-width="3" />
            </div>
            <span class="text-xl font-bold text-white tracking-tight">
              SMART LIB <span class="text-cyan-400">DN</span>
            </span>
          </div>
          <p class="text-sm leading-relaxed text-slate-400">
            Thư viện Khoa học Tổng hợp Đà Nẵng là trung tâm tri thức, văn hóa và công nghệ, cung cấp nguồn tài liệu phong phú và không gian học tập hiện đại cho cộng đồng.
          </p>
          <div class="pt-4 flex gap-4">
            <a href="#" class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all">
              <Facebook :size="18" />
            </a>
            <a href="#" class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all">
              <Youtube :size="18" />
            </a>
            <a href="#" class="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-pink-600 hover:text-white transition-all">
              <Instagram :size="18" />
            </a>
          </div>
        </div>

        <!-- Cột 2: Liên kết nhanh -->
        <div>
          <h3 class="text-white font-bold text-lg mb-6 flex items-center gap-2">
            <span class="w-1 h-6 bg-blue-500 rounded-full"></span> Khám phá
          </h3>
          <ul class="space-y-3">
            <li v-for="(link, idx) in exploreLinks" :key="idx">
              <router-link :to="link.href" class="hover:text-cyan-400 transition-colors flex items-center gap-2 text-sm">
                <ExternalLink :size="14" class="opacity-50"/> {{ link.name }}
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Cột 3: Liên hệ -->
        <div>
          <h3 class="text-white font-bold text-lg mb-6 flex items-center gap-2">
            <span class="w-1 h-6 bg-cyan-500 rounded-full"></span> Liên hệ
          </h3>
          <ul class="space-y-4 text-sm">
            <li class="flex items-start gap-3">
              <MapPin class="shrink-0 text-cyan-400 mt-0.5" :size="18" />
              <span>46 Bạch Đằng, Quận Hải Châu,<br/>Thành phố Đà Nẵng</span>
            </li>
            <li class="flex items-center gap-3">
              <Phone class="shrink-0 text-cyan-400" :size="18" />
              <span>(0236) 3.123.456 - Hotline 24/7</span>
            </li>
            <li class="flex items-center gap-3">
              <Mail class="shrink-0 text-cyan-400" :size="18" />
              <a href="mailto:contact@thuvien.danang.gov.vn" class="hover:text-white">contact@thuvien.danang.gov.vn</a>
            </li>
          </ul>
        </div>

        <!-- Cột 4: Giờ mở cửa -->
        <div>
          <h3 class="text-white font-bold text-lg mb-6 flex items-center gap-2">
            <span class="w-1 h-6 bg-purple-500 rounded-full"></span> Giờ mở cửa
          </h3>
          <div class="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-3 text-sm">
            <div class="flex justify-between items-center border-b border-slate-700 pb-2">
              <span class="text-slate-400">Thứ 2 - Thứ 6</span>
              <span class="font-bold text-white">7:30 - 20:00</span>
            </div>
            <div class="flex justify-between items-center border-b border-slate-700 pb-2">
              <span class="text-slate-400">Thứ 7 - CN</span>
              <span class="font-bold text-white">8:00 - 17:00</span>
            </div>
            <div class="flex items-start gap-2 text-xs text-yellow-500 pt-1">
              <Clock :size="14" class="mt-0.5"/>
              <span>Phòng đọc số 24/7 mở cửa xuyên suốt tất cả các ngày (Dành cho thẻ VIP).</span>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Bản quyền -->
    <div class="bg-slate-950 py-6 border-t border-slate-800">
      <div class="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
        <p>© 2024 Thư viện KHTH Đà Nẵng. Bản quyền thuộc về sinh viên thực hiện đồ án.</p>
        <div class="flex gap-6">
          <a href="#" class="hover:text-white">Chính sách bảo mật</a>
          <a href="#" class="hover:text-white">Điều khoản sử dụng</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { 
  MapPin, Phone, Mail, Facebook, Youtube, Instagram, Clock, ExternalLink, BookOpen 
} from 'lucide-vue-next'

const exploreLinks = [
  { name: 'Tra cứu tài liệu', href: '/tim_kiem' },
  { name: 'Đăng ký thẻ thành viên', href: '/dang_ky_the' },
  { name: 'Gia hạn sách online', href: '/tai_khoan' },
  { name: 'Đề xuất mua sách', href: '#' },
  { name: 'Quy định thư viện', href: '#' },
  { name: 'Câu hỏi thường gặp', href: '#' }
]
</script>
