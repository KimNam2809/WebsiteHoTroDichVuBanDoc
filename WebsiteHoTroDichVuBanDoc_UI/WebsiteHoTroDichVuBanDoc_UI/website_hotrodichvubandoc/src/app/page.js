// src/app/page.js
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search, ArrowRight, Book, Users, Clock, Zap, MapPin,
  Calendar, Star, TrendingUp, ChevronLeft, ChevronRight,
  Smartphone, Download
} from 'lucide-react';

// DỮ LIỆU SLIDESHOW (CÓ THỂ THAY BẰNG API SAU NÀY)
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
];

export default function HomePage() {
  // Logic observer để tạo hiệu ứng fade-in khi cuộn
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
  }, []);

  const [searchQuery, setSearchQuery] = useState('');

  // --- LOGIC SLIDESHOW ---
  const [currentSlide, setCurrentSlide] = useState(0);

  // Tự động chuyển slide sau 5 giây
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === highlightSlides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev === highlightSlides.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? highlightSlides.length - 1 : prev - 1));

  return (
    <div className="overflow-x-hidden">

      {/* 1. HERO SECTION: Tìm kiếm trung tâm */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20 overflow-hidden">
        {/* Background Gradient & Pattern */}
        <div className="absolute inset-0 bg-linear-to-br from-blue-900 via-indigo-900 to-slate-900 z-0"></div>
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0"></div>
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px]"></div>

        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="reveal opacity-0 translate-y-8 transition-all duration-1000">
            <span className="inline-block py-1 px-3 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm font-semibold mb-6 backdrop-blur-sm">
              ✨ Trải nghiệm Thư viện Số Thông minh
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
              Khám phá Tri thức <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-blue-400">Không Giới Hạn</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100/80 mb-10 max-w-2xl mx-auto font-light">
              Hơn 50,000 đầu sách, không gian học tập hiện đại và trợ lý AI thông minh sẵn sàng hỗ trợ bạn mọi lúc.
            </p>

            {/* Search Box lớn */}
            <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-lg p-2 rounded-2xl border border-white/20 shadow-2xl transform transition-transform hover:scale-[1.01]">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-200" size={20} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm tên sách, tác giả, ISBN..."
                    className="w-full h-14 pl-12 pr-4 bg-transparent text-white placeholder-blue-200/50 outline-none text-lg rounded-xl focus:bg-white/5 transition-colors"
                  />
                </div>
                <Link
                  href={`/tim_kiem?q=${searchQuery}`}
                  className="h-14 px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-blue-500/50"
                >
                  Tìm kiếm <ArrowRight size={20} />
                </Link>
              </div>
            </div>

            {/* Quick Stats Pills */}
            <div className="mt-12 pb-16 flex flex-wrap justify-center gap-4 md:gap-8 text-blue-200/80 text-sm font-medium">
              <span className="flex items-center gap-2"><Book size={16} className="text-cyan-400"/> 50k+ Đầu sách</span>
              <span className="flex items-center gap-2"><Users size={16} className="text-cyan-400"/> 15k+ Thành viên</span>
              <span className="flex items-center gap-2"><Clock size={16} className="text-cyan-400"/> Mở cửa 24/7</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURES GRID: Tại sao chọn chúng tôi? */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 reveal opacity-0 translate-y-8 transition-all duration-700">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Tiện ích Vượt trội</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Chúng tôi không chỉ là nơi lưu trữ sách. Chúng tôi là không gian sáng tạo và kết nối tri thức.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Zap, title: "Tra cứu Siêu tốc", desc: "Hệ thống tìm kiếm ElasticSearch cho kết quả chưa đến 0.5 giây.", color: "text-yellow-500", bg: "bg-yellow-50" },
              { icon: Clock, title: "Phòng đọc hiện đại", desc: "Không gian học tập mở cửa xuyên suốt từ thứ 3 đến chủ nhật, wifi tốc độ cao miễn phí.", color: "text-purple-500", bg: "bg-purple-50" },
              { icon: MapPin, title: "Mượn trả Tự động", desc: "Đặt sách online, nhận sách tại quầy hoặc giao tận nhà.", color: "text-green-500", bg: "bg-green-50" },
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 reveal opacity-0 translate-y-8">
                <div className={`w-14 h-14 ${feature.bg} ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. AI DASHBOARD: Điểm nhấn công nghệ */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-50/50 skew-x-12 z-0"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">

            {/* Text Content */}
            <div className="lg:w-1/2 reveal opacity-0 -translate-x-5 transition-all duration-700">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase mb-6">
                <Star size={14} /> Powered by AI
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Trợ lý ảo thông minh &<br/>Gợi ý cá nhân hóa</h2>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                Không còn mất thời gian tìm kiếm. Hệ thống AI phân tích thói quen đọc của bạn để đề xuất những cuốn sách phù hợp nhất. Chatbot hỗ trợ giải đáp mọi thắc mắc 24/7.
              </p>
              <div className="flex gap-4">
                <button className="px-6 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition shadow-lg">
                  Thử Chatbot ngay
                </button>
                <Link href="/tim_kiem" className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition">
                  Xem gợi ý sách
                </Link>
              </div>
            </div>

            {/* Visual Dashboard Card */}
            <div className="lg:w-1/2 w-full reveal opacity-0 translate-x-5 transition-all duration-700 delay-200">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 relative">
                <div className="flex items-center justify-between mb-6 border-b pb-4">
                  <div>
                    <h4 className="font-bold text-gray-800">Dự báo hôm nay</h4>
                    <p className="text-xs text-gray-500">Cập nhật: Vừa xong</p>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                </div>

                <div className="space-y-4">
                  {[
                    { label: "Lượng khách dự kiến", val: "Cao (9:00 - 11:00)", icon: Users, color: "text-blue-600" },
                    { label: "Xu hướng mượn", val: "+15% sách Kinh tế", icon: TrendingUp, color: "text-green-600" },
                    { label: "Gợi ý cho bạn", val: "3 cuốn sách mới", icon: Book, color: "text-purple-600" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                      <div className={`p-2 bg-white rounded-lg shadow-sm ${item.color}`}>
                        <item.icon size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-medium">{item.label}</p>
                        <p className="text-sm font-bold text-gray-800">{item.val}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Decorative Elements */}
                <div className="absolute -z-10 -top-6 -right-6 w-24 h-24 bg-blue-500 rounded-full opacity-20 blur-xl"></div>
                <div className="absolute -z-10 -bottom-6 -left-6 w-32 h-32 bg-cyan-400 rounded-full opacity-20 blur-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. NEWS & EVENTS */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">

          {/* Header Section */}
          <div className="flex justify-between items-end mb-10 reveal opacity-0 translate-y-4">
            <div>
              <span className="text-blue-600 font-bold text-sm tracking-wider uppercase mb-2 block">Cập nhật liên tục</span>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Tin tức & Sự kiện nổi bật</h2>
            </div>
            <Link href="#" className="hidden md:flex items-center px-5 py-2 rounded-full border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 hover:text-blue-600 transition-all">
              Xem tất cả <ArrowRight size={18} className="ml-2"/>
            </Link>
          </div>

          {/* MAIN GRID LAYOUT: 3 Cột Trái (Tin tức) - 1 Cột Phải (Sự kiện) */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

            {/* --- CỘT TRÁI (Chiếm 3 phần) --- */}
            <div className="lg:col-span-3 space-y-8">

              {/* 1. SLIDESHOW (Tin lớn nhất) */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[450px] group reveal opacity-0 translate-y-4">
                {highlightSlides.map((slide, index) => (
                  <div
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                  >
                    {/* Giả lập ảnh nền bằng Gradient (Thay bằng Image thật nếu có) */}
                    <div className={`absolute inset-0 bg-linear-to-br ${slide.color}`}></div>
                    <div className="absolute inset-0 bg-black/40"></div> {/* Overlay tối */}

                    {/* Nội dung Slide */}
                    <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full md:w-3/4 text-white">
                      <span className="bg-white/20 backdrop-blur-md border border-white/30 text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block shadow-sm tracking-wider">
                        {slide.category}
                      </span>
                      <h3 className="text-2xl md:text-4xl font-bold mb-4 leading-tight drop-shadow-lg">
                        {slide.title}
                      </h3>
                      <p className="text-gray-200 line-clamp-2 mb-6 text-sm md:text-lg max-w-2xl">
                        {slide.desc}
                      </p>
                      <div className="flex items-center text-xs md:text-sm text-gray-300 gap-6">
                        <span className="flex items-center gap-2"><Calendar size={16}/> {slide.date}</span>
                        <span className="flex items-center gap-2"><Users size={16}/> {slide.views} lượt xem</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Slide Controls */}
                <div className="absolute bottom-8 right-8 z-20 flex gap-2">
                  <button onClick={prevSlide} className="p-2 rounded-full bg-white/10 hover:bg-white/30 text-white backdrop-blur-md transition">
                    <ChevronLeft size={24} />
                  </button>
                  <button onClick={nextSlide} className="p-2 rounded-full bg-white/10 hover:bg-white/30 text-white backdrop-blur-md transition">
                    <ChevronRight size={24} />
                  </button>
                </div>

                {/* Slide Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                  {highlightSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? 'bg-white w-6' : 'bg-white/40'}`}
                    />
                  ))}
                </div>
              </div>

              {/* 2. CÁC TIN VỪA (Grid 2 cột bên dưới Slide) */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Tin Vừa 1 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 reveal opacity-0 translate-y-4 cursor-pointer group">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-xs font-bold text-gray-400 uppercase">Hoạt động</span>
                  </div>
                  <h4 className="font-bold text-lg text-gray-800 mb-3 group-hover:text-blue-600 line-clamp-2">
                    Hội thảo: &quot;Ứng dụng AI trong việc tìm kiếm tài liệu học thuật&quot;
                  </h4>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                    Hướng dẫn sinh viên cách sử dụng các công cụ AI để tối ưu hóa quá trình nghiên cứu và trích dẫn tài liệu.
                  </p>
                  <div className="text-sm text-gray-400 mt-auto flex items-center justify-between border-t pt-3">
                    <p className="flex items-center gap-2"><Clock size={16} className="text-green-600"/> 18/12/2025</p>
                    <span className="text-xs font-medium text-blue-600 group-hover:underline">Chi tiết &rarr;</span>
                  </div>
                </div>

                {/* Tin Vừa 2 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 reveal opacity-0 translate-y-4 cursor-pointer group">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span className="text-xs font-bold text-gray-400 uppercase">Thông báo</span>
                  </div>
                  <h4 className="font-bold text-lg text-gray-800 mb-3 group-hover:text-blue-600 line-clamp-2">
                    Bảo trì hệ thống mượn trả tự động khu vực tầng 1
                  </h4>
                  <p className="text-gray-500 text-sm line-clamp-2 mb-4">
                    Hệ thống sẽ tạm ngưng hoạt động để nâng cấp firmware, vui lòng sử dụng quầy thủ thư trong thời gian này.
                  </p>
                  <div className="text-sm text-gray-400 mt-auto flex items-center justify-between border-t pt-3">
                    <p className="flex items-center gap-2"><Clock size={16} className="text-purple-600"/> 20:00 Hôm nay</p>
                    <span className="text-xs font-medium text-blue-600 group-hover:underline">Chi tiết &rarr;</span>
                  </div>
                </div>
              </div>

              {/* 3. BANNER QUẢNG CÁO APP (Rộng bằng Tin lớn + Tin vừa) */}
              <div className="relative rounded-2xl overflow-hidden bg-linear-to-r from-blue-700 to-indigo-800 text-white p-8 flex flex-col md:flex-row items-center justify-between shadow-2xl group cursor-pointer reveal opacity-0 translate-y-4">
                <div className="relative z-10 max-w-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-white/20 text-xs font-bold px-3 py-1 rounded-lg backdrop-blur-sm border border-white/20 flex items-center gap-1">
                      <Smartphone size={14}/> Mobile App
                    </span>
                    <span className="text-yellow-400 text-xs font-bold">★ 4.9/5.0</span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-2">Thư viện số trong tầm tay bạn</h3>
                  <p className="text-blue-100 mb-6 text-sm md:text-base">
                    Quản lý mượn trả, gia hạn sách, đọc Ebook và nhận thông báo sự kiện chỉ với 1 chạm. Tải ngay để nhận ưu đãi thành viên VIP.
                  </p>
                  <div className="flex gap-3">
                    <button className="bg-white text-blue-800 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shadow-lg flex items-center gap-2">
                      <Download size={18}/> App Store
                    </button>
                    <button className="bg-transparent border border-white/40 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors flex items-center gap-2">
                      <Download size={18}/> Google Play
                    </button>
                  </div>
                </div>

                {/* Hình minh họa điện thoại (CSS thuần) */}
                <div className="hidden md:block relative z-10 transform group-hover:translate-x--10px transition-transform duration-500">
                  <div className="w-32 h-64 bg-gray-900 rounded-2rem border-4 border-gray-700 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-gray-800 rounded-b-xl"></div>
                    <div className="w-full h-full bg-white flex flex-col items-center justify-center space-y-2 pt-8">
                      <div className="w-16 h-16 bg-blue-100 rounded-full"></div>
                      <div className="w-20 h-2 bg-gray-100 rounded"></div>
                      <div className="w-16 h-2 bg-gray-100 rounded"></div>
                    </div>
                  </div>
                </div>

                {/* Decorative BG */}
                <div className="absolute -right-20 -bottom-40 w-96 h-96 bg-blue-500 rounded-full opacity-30 blur-3xl"></div>
                <div className="absolute -left-20 -top-40 w-80 h-80 bg-purple-500 rounded-full opacity-30 blur-3xl"></div>
              </div>

            </div>

            {/* --- CỘT PHẢI (Sự kiện - Vertical List) --- */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm sticky top-24 reveal opacity-0 translate-x-4 h-full flex flex-col">
                <h4 className="font-bold text-gray-800 mb-6 flex items-center gap-2 pb-4 border-b">
                  <Calendar size={20} className="text-blue-600"/> Sự kiện sắp tới
                </h4>

                <div className="space-y-6 flex-1">
                  {/* Event Item 1 */}
                  <div className="flex gap-4 items-start group cursor-pointer hover:bg-gray-50 p-2 rounded-lg -mx-2 transition-colors">
                    <div className="bg-blue-50 text-blue-700 w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                      <span className="text-[10px] font-bold uppercase">Tháng 12</span>
                      <span className="text-xl font-extrabold leading-none">20</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-800 text-sm group-hover:text-blue-600 transition-colors leading-tight mb-1">
                        CLB Sách: Văn học trinh thám hiện đại
                      </h5>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12}/> 14:00 • Phòng họp 3
                      </p>
                    </div>
                  </div>

                  {/* Event Item 2 */}
                  <div className="flex gap-4 items-start group cursor-pointer hover:bg-gray-50 p-2 rounded-lg -mx-2 transition-colors">
                    <div className="bg-orange-50 text-orange-700 w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 border border-orange-100 group-hover:bg-orange-600 group-hover:text-white transition-colors shadow-sm">
                      <span className="text-[10px] font-bold uppercase">Tháng 12</span>
                      <span className="text-xl font-extrabold leading-none">24</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-800 text-sm group-hover:text-orange-600 transition-colors leading-tight mb-1">
                        Giao lưu tác giả Nguyễn Nhật Ánh
                      </h5>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12}/> 08:00 • Sảnh chính
                      </p>
                    </div>
                  </div>

                  {/* Event Item 3 */}
                  <div className="flex gap-4 items-start group cursor-pointer hover:bg-gray-50 p-2 rounded-lg -mx-2 transition-colors">
                    <div className="bg-indigo-50 text-indigo-700 w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                      <span className="text-[10px] font-bold uppercase">Tháng 12</span>
                      <span className="text-xl font-extrabold leading-none">28</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-800 text-sm group-hover:text-indigo-600 transition-colors leading-tight mb-1">
                        Workshop: Kỹ năng viết CV ấn tượng
                      </h5>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12}/> 15:30 • Phòng Studio
                      </p>
                    </div>
                  </div>

                  {/* Event Item 4 */}
                  <div className="flex gap-4 items-start group cursor-pointer hover:bg-gray-50 p-2 rounded-lg -mx-2 transition-colors">
                    <div className="bg-pink-50 text-pink-700 w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 border border-pink-100 group-hover:bg-pink-600 group-hover:text-white transition-colors shadow-sm">
                      <span className="text-[10px] font-bold uppercase">Tháng 1</span>
                      <span className="text-xl font-extrabold leading-none">05</span>
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-800 text-sm group-hover:text-pink-600 transition-colors leading-tight mb-1">
                        Triển lãm tranh: &quot;Sắc màu Đà Nẵng&quot;
                      </h5>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12}/> 09:00 • Tầng 3
                      </p>
                    </div>
                  </div>
                </div>

                <button className="w-full mt-6 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                  Xem lịch đầy đủ
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. CTA: Đăng ký thẻ */}
      <section className="py-20 bg-gray-900 text-white text-center">
        <div className="container mx-auto px-4 reveal opacity-0 scale-95 transition-all duration-700">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Sẵn sàng gia nhập cộng đồng tri thức?</h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-10 text-lg">Đăng ký thẻ thành viên ngay hôm nay để truy cập kho tài liệu khổng lồ và sử dụng các dịch vụ tiện ích.</p>
          <div className="flex justify-center gap-4">
            <Link href="/dang_ky_the" className="px-8 py-4 bg-linear-to-r from-blue-500 to-cyan-500 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-cyan-500/30 transition-all transform hover:-translate-y-1">
              Đăng ký Thẻ Online
            </Link>
            <Link href="/dich_vu" className="px-8 py-4 border border-gray-700 bg-gray-800 rounded-xl font-bold text-lg hover:bg-gray-700 transition-all">
              Tìm hiểu thêm
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}