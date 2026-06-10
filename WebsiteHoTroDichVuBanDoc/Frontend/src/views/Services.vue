<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 selection:bg-cyan-500 selection:text-slate-950">
    <!-- Hero Header with Sleek Background Gradients -->
    <div class="relative py-24 overflow-hidden bg-gradient-to-b from-blue-950/40 via-slate-950 to-slate-950 border-b border-slate-900">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.15),rgba(255,255,255,0))]"></div>
      <div class="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0"></div>
      <div class="relative z-10 max-w-6xl mx-auto px-4 text-center">
        <span class="inline-block py-1 px-3 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold mb-6 uppercase tracking-wider">
          Hệ Sinh Thái Dịch Vụ
        </span>
        <h1 class="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-6">
          Tiện Ích Số <span class="text-cyan-400">Thông Minh</span>
        </h1>
        <p class="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed">
          Chúng tôi mang đến môi trường nghiên cứu hiện đại, trang bị đầy đủ công nghệ số và không gian sáng tạo hỗ trợ tối đa nhu cầu của độc giả.
        </p>
      </div>
    </div>

    <!-- Main Content Overlapping Hero -->
    <div class="max-w-6xl mx-auto px-4 -mt-10 relative z-20">
      <!-- Grid of Services -->
      <div class="grid md:grid-cols-2 gap-8 mb-16">
        <div v-for="(group, gIdx) in serviceGroups" :key="gIdx" 
             class="bg-slate-900/40 rounded-3xl p-8 border border-slate-900 hover:border-slate-800 hover:bg-slate-900/60 transition-all duration-300 group">
          <div class="flex items-center gap-4 mb-8">
            <div :class="['w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300', group.iconBg, group.iconColor]">
              <component :is="group.icon" :size="28" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-slate-200">{{ group.title }}</h2>
              <p class="text-xs text-slate-500">{{ group.subtitle }}</p>
            </div>
          </div>

          <div class="space-y-6">
            <div v-for="(item, iIdx) in group.items" :key="iIdx" class="flex gap-4 items-start group/item">
              <div class="mt-1 p-2 rounded-lg bg-slate-950 text-slate-500 group-hover/item:text-cyan-400 group-hover/item:bg-cyan-500/10 transition-colors">
                <component :is="item.icon" :size="18" />
              </div>
              <div>
                <h3 class="font-bold text-slate-300 text-sm mb-1 group-hover/item:text-cyan-400 transition-colors">
                  {{ item.title }}
                </h3>
                <p class="text-xs text-slate-400 leading-relaxed font-light">
                  {{ item.desc }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Booking CTA Banner -->
      <div class="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-10 md:p-16 text-center border border-slate-800 shadow-2xl">
        <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div class="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
        <div class="relative z-10 max-w-3xl mx-auto space-y-6">
          <h2 class="text-2xl md:text-3xl font-bold">Bạn cần không gian học tập riêng?</h2>
          <p class="text-slate-300 text-base font-light">
            Đặt trước phòng học nhóm cách âm, vị trí ngồi học yên tĩnh hoặc đăng ký máy tính nghiên cứu ngay hôm nay.
          </p>
          <router-link
            to="/dich_vu/dat_lich"
            class="bg-cyan-500 text-slate-950 px-8 py-3.5 rounded-xl font-bold text-base hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20 hover:-translate-y-0.5 transition-all inline-flex items-center gap-2"
          >
            <Calendar :size="18" /> Đặt lịch dịch vụ ngay
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { 
  BookOpen, Monitor, Printer, Wifi, 
  BookMarked, Headphones, Database, Smartphone, 
  Users, VolumeX, Coffee, Mic, 
  Calendar, Star, Award, HeartHandshake
} from 'lucide-vue-next'

const serviceGroups = [
  {
    title: "Dịch Vụ Cơ Bản",
    subtitle: "Nền tảng của thư viện truyền thống",
    icon: BookOpen,
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    items: [
      { icon: BookMarked, title: "Mượn sách & Tài liệu", desc: "Mượn về nhà hoặc nghiên cứu tại chỗ với hệ thống tự động hóa nhanh gọn." },
      { icon: Monitor, title: "Máy tính công cộng", desc: "Truy cập internet, tra cứu OPAC miễn phí hỗ trợ làm bài tập lớn." },
      { icon: Printer, title: "In ấn & Photocopy", desc: "Trạm in tự phục vụ dễ dàng, hỗ trợ thanh toán online tiện lợi." },
      { icon: Wifi, title: "Wifi phủ sóng rộng", desc: "Mạng internet không dây tốc độ cao và ổn định toàn bộ khuôn viên." }
    ]
  },
  {
    title: "Dịch Vụ Số & Công Nghệ",
    subtitle: "Trải nghiệm học tập 4.0 tiên tiến",
    icon: Database,
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-400",
    items: [
      { icon: BookOpen, title: "Thư viện số (E-Library)", desc: "Kho giáo trình số, tạp chí và luận văn khoa học điện tử mọi lúc mọi nơi." },
      { icon: Headphones, title: "Kho sách nói & Podcast", desc: "Bộ sưu tập sách nói phong phú, nội dung đa dạng phát triển bản thân." },
      { icon: Database, title: "Cơ sở dữ liệu học thuật", desc: "Kết nối trực tiếp đến các trang uy tín: ScienceDirect, IEEE, Springer." },
      { icon: Smartphone, title: "Trợ lý ảo AI & Mobile App", desc: "Đặt sách, gia hạn, hỏi đáp chatbot AI thông minh và cập nhật thông tin." }
    ]
  },
  {
    title: "Không Gian Sáng Tạo",
    subtitle: "Môi trường học tập lý tưởng",
    icon: Users,
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-400",
    items: [
      { icon: Users, title: "Phòng thảo luận nhóm", desc: "Không gian riêng cách âm tốt, trang bị màn hình chiếu và bảng viết." },
      { icon: VolumeX, title: "Khu tự học yên tĩnh", desc: "Không gian tĩnh lặng tuyệt đối phù hợp cho các nghiên cứu chuyên sâu." },
      { icon: Coffee, title: "Library Café & Giải trí", desc: "Khu vực thư giãn nhẹ nhàng, nạp năng lượng sau các giờ học tập căng thẳng." },
      { icon: Mic, title: "Studio sản xuất nội dung", desc: "Hỗ trợ thiết bị ghi âm podcast, quay dựng video clip chuyên nghiệp." }
    ]
  },
  {
    title: "Sự Kiện & Cộng Đồng",
    subtitle: "Giao lưu văn hóa và chia sẻ tri thức",
    icon: Calendar,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
    items: [
      { icon: Star, title: "Workshop & Khóa học ngắn", desc: "Các chương trình huấn luyện kỹ năng tin học văn phòng, nghiên cứu khoa học." },
      { icon: Award, title: "Câu lạc bộ sách & Tác giả", desc: "Nơi chia sẻ cảm nhận sách hay, gặp gỡ giao lưu tác giả lớn hàng tháng." },
      { icon: HeartHandshake, title: "Dịch vụ hỗ trợ tốt nghiệp", desc: "Tư vấn cấu trúc đề tài luận văn, định dạng trích dẫn tài liệu chuẩn." },
      { icon: Calendar, title: "Triển lãm văn hóa", desc: "Các buổi trưng bày sách quý hiếm, nghệ thuật giới thiệu đến cộng đồng." }
    ]
  }
]
</script>
