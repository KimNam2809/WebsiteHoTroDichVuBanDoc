<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
    <!-- Hero Banner with Sleek Gradient -->
    <div class="relative py-24 overflow-hidden bg-gradient-to-b from-indigo-950 via-slate-950 to-slate-950 border-b border-slate-900">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.25),rgba(255,255,255,0))]"></div>
      <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0"></div>
      <div class="relative z-10 max-w-6xl mx-auto px-4 text-center">
        <span class="inline-block py-1 px-3 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-6 uppercase tracking-wider">
          Về Chúng Tôi
        </span>
        <h1 class="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-6">
          Thư Viện Số <span class="text-cyan-400">Kim Nam</span>
        </h1>
        <p class="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
          Nơi kết nối tri thức nhân loại với công nghệ tương lai. Không chỉ là một kho sách, chúng tôi là môi trường sáng tạo đột phá dành cho bạn đọc.
        </p>
      </div>
    </div>

    <!-- Main Content Section -->
    <div class="max-w-6xl mx-auto px-4 py-16 space-y-24">
      
      <!-- Core Vision & Mission -->
      <section class="grid md:grid-cols-2 gap-12 items-center">
        <div class="space-y-6">
          <h2 class="text-3xl font-bold text-white flex items-center gap-3">
            <span class="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Compass :size="24" />
            </span>
            Tầm Nhìn & Sứ Mệnh
          </h2>
          <p class="text-slate-400 leading-relaxed font-light">
            Được thành lập với mục tiêu cách mạng hóa trải nghiệm đọc sách, chúng tôi tiên phong ứng dụng công nghệ trí tuệ nhân tạo (AI), hệ thống eKYC hiện đại và tự động hóa toàn diện quy trình mượn trả tài liệu.
          </p>
          <div class="space-y-4">
            <div class="flex items-start gap-4">
              <div class="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-1">✔</div>
              <div>
                <h4 class="font-bold text-slate-200">Đơn giản và Tốc độ</h4>
                <p class="text-slate-400 text-sm">Tra cứu tài liệu siêu tốc bằng AI, làm thẻ trực tuyến nhanh chóng trong 3 phút.</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 mt-1">✔</div>
              <div>
                <h4 class="font-bold text-slate-200">Không gian Sáng tạo</h4>
                <p class="text-slate-400 text-sm">Phòng học nhóm, ghế ngồi cá nhân hiện đại hỗ trợ đặt lịch trực tuyến tiện lợi.</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Decorative Vision Box -->
        <div class="relative bg-gradient-to-br from-slate-900 to-slate-950 p-8 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden group">
          <div class="absolute -right-16 -top-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl transition-all group-hover:scale-110"></div>
          <div class="relative z-10 space-y-6">
            <div class="text-cyan-400 font-extrabold text-5xl">50,000+</div>
            <h3 class="text-xl font-bold text-slate-100">Đầu sách đa dạng & chất lượng cao</h3>
            <p class="text-slate-400 text-sm font-light leading-relaxed">
              Từ các tác phẩm văn học kinh điển, giáo trình học thuật chuyên sâu đến các báo cáo nghiên cứu khoa học mới nhất luôn sẵn sàng phục vụ độc giả.
            </p>
            <div class="pt-4 border-t border-slate-800/80 flex justify-between text-slate-400 text-xs">
              <span>📚 Sách giấy & Ebooks</span>
              <span>⚡ Đề xuất cá nhân hóa</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Floor / Layout Map -->
      <section class="space-y-8">
        <div class="text-center max-w-2xl mx-auto space-y-3">
          <h2 class="text-3xl font-bold text-white">Sơ đồ Không gian Thư viện</h2>
          <p class="text-slate-400 text-sm font-light">Không gian 3 tầng rộng mở được phân vùng khoa học giúp tối ưu trải nghiệm học tập và nghiên cứu của bạn.</p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <div v-for="(floor, idx) in floors" :key="idx" class="bg-slate-900/50 p-6 rounded-2xl border border-slate-900 hover:border-slate-800 hover:bg-slate-900 transition-all group">
            <div class="w-12 h-12 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-lg mb-6 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
              {{ floor.num }}
            </div>
            <h3 class="text-lg font-bold text-slate-200 mb-2">{{ floor.title }}</h3>
            <p class="text-slate-400 text-sm font-light mb-4">{{ floor.desc }}</p>
            <div class="flex flex-wrap gap-2">
              <span v-for="tag in floor.tags" :key="tag" class="text-xs bg-slate-950 text-slate-400 px-2 py-1 rounded border border-slate-800/50">{{ tag }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Operating Hours & Contact Info -->
      <section class="bg-slate-900/40 rounded-3xl border border-slate-900 p-8 md:p-12 grid md:grid-cols-2 gap-12">
        <div class="space-y-6">
          <h3 class="text-2xl font-bold text-white flex items-center gap-3">
            <Clock class="text-cyan-400" :size="22" />
            Giờ Hoạt Động
          </h3>
          <div class="space-y-3 divide-y divide-slate-800/60">
            <div class="flex justify-between py-2 text-sm">
              <span class="text-slate-400">Thứ 3 - Thứ 6</span>
              <span class="text-cyan-400 font-medium">08:00 - 21:00</span>
            </div>
            <div class="flex justify-between py-3 text-sm">
              <span class="text-slate-400">Thứ 7 - Chủ Nhật</span>
              <span class="text-cyan-400 font-medium">09:00 - 22:00</span>
            </div>
            <div class="flex justify-between py-3 text-sm">
              <span class="text-slate-400">Thứ 2 & Ngày Lễ</span>
              <span class="text-rose-400 font-medium">Đóng cửa nghỉ định kỳ</span>
            </div>
          </div>
          <p class="text-xs text-slate-500 italic">
            * Hệ thống thư viện số trực tuyến (Ebook, Tra cứu AI, Đặt lịch) hoạt động 24/7.
          </p>
        </div>

        <div class="space-y-6">
          <h3 class="text-2xl font-bold text-white flex items-center gap-3">
            <MapPin class="text-cyan-400" :size="22" />
            Liên Hệ
          </h3>
          <div class="space-y-4 text-sm text-slate-400">
            <p class="flex items-center gap-3">
              <span class="w-5 text-center">📍</span>
              Số 123 Đường Nguyễn Văn Linh, Quận Hải Châu, Đà Nẵng
            </p>
            <p class="flex items-center gap-3">
              <span class="w-5 text-center">✉</span>
              support@kimnamlibrary.vn
            </p>
            <p class="flex items-center gap-3">
              <span class="w-5 text-center">📞</span>
              +84 (236) 3888-999
            </p>
          </div>
          <div class="pt-4 border-t border-slate-800">
            <router-link to="/dang_ky_the" class="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-bold transition-colors">
              Đăng ký thẻ độc giả trực tuyến ngay &rarr;
            </router-link>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup>
import { Compass, Clock, MapPin } from 'lucide-vue-next'

const floors = [
  {
    num: "T1",
    title: "Sảnh Chính & Không Gian Đọc Mở",
    desc: "Nơi đón tiếp độc giả, quầy làm thẻ, tủ sách văn học - nghệ thuật mới nhất cùng trạm mượn trả tự động.",
    tags: ["Quầy hỗ trợ", "Sách mới", "Máy mượn trả"]
  },
  {
    num: "T2",
    title: "Khu Vực Tra Cứu & Nghiên Cứu",
    desc: "Kho sách khoa học kỹ thuật, kinh tế, công nghệ thông tin cùng hàng trăm máy tính cấu hình cao kết nối Internet.",
    tags: ["Máy tra cứu", "Tài liệu khoa học", "Yên tĩnh"]
  },
  {
    num: "T3",
    title: "Phòng Học Nhóm & Studio Sáng Tạo",
    desc: "Không gian làm việc chung với đầy đủ trang bị bảng viết, máy chiếu, bảng vẽ thông minh và khu vực thảo luận.",
    tags: ["Phòng thảo luận", "Studio", "Đặt lịch trước"]
  }
]
</script>
