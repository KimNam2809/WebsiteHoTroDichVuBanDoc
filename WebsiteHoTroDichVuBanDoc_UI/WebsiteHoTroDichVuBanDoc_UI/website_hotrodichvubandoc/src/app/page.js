// src/app/page.js
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, Book, Users, Clock, Zap, MapPin, Calendar, Star, TrendingUp } from 'lucide-react';

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

      {/* 4. NEWS & EVENTS (Bento Grid Layout) */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Tin tức & Sự kiện</h2>
              <p className="text-gray-500 mt-2">Cập nhật những hoạt động mới nhất tại thư viện</p>
            </div>
            <Link href="#" className="hidden md:flex items-center text-blue-600 font-semibold hover:gap-2 transition-all">
              Xem tất cả <ArrowRight size={18} className="ml-1"/>
            </Link>
          </div>

          <div className="grid md:grid-cols-4 md:grid-rows-2 gap-6 h-auto md:h-[500px]">
            {/* Main Article - Large */}
            <div className="md:col-span-2 md:row-span-2 group relative rounded-2xl overflow-hidden shadow-lg cursor-pointer reveal opacity-0 scale-95 transition-all duration-500">
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent z-10"></div>
               {/* Thay bằng Image thật nếu có */}
              <div className="absolute inset-0 bg-blue-900 group-hover:scale-105 transition-transform duration-700"></div>
              <div className="absolute bottom-0 left-0 p-8 z-20 text-white">
                <span className="bg-red-600 text-xs font-bold px-2 py-1 rounded mb-3 inline-block">MỚI NHẤT</span>
                <h3 className="text-2xl font-bold mb-2">Khai trương không gian đọc sách thực tế ảo (VR)</h3>
                <p className="text-gray-300 line-clamp-2">Trải nghiệm đọc sách trong không gian vũ trụ với công nghệ VR mới nhất được tài trợ bởi...</p>
              </div>
            </div>

            {/* Event 1 */}
            <div className="md:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition reveal opacity-0 translate-y-4 delay-100">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-purple-100 text-purple-700 p-2 rounded-lg"><Calendar size={20}/></div>
                <span className="text-xs font-bold text-gray-400">15 THÁNG 12</span>
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Workshop: Kỹ năng tra cứu số</h4>
              <p className="text-sm text-gray-500">Hội trường A, 14:00 - 16:00</p>
            </div>

             {/* Event 2 */}
            <div className="md:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition reveal opacity-0 translate-y-4 delay-200">
              <div className="flex items-start justify-between mb-4">
                <div className="bg-green-100 text-green-700 p-2 rounded-lg"><Users size={20}/></div>
                <span className="text-xs font-bold text-gray-400">18 THÁNG 12</span>
              </div>
              <h4 className="font-bold text-gray-800 mb-2">CLB Sách: Văn học hiện đại</h4>
              <p className="text-sm text-gray-500">Phòng họp nhóm 2, 09:00</p>
            </div>

            {/* Small News */}
            <div className="md:col-span-2 bg-linear-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white flex items-center justify-between shadow-lg reveal opacity-0 translate-y-4 delay-300">
              <div>
                <h4 className="text-xl font-bold mb-1">Ứng dụng thư viện đã có mặt!</h4>
                <p className="text-blue-100 text-sm">Tải ngay trên iOS và Android để quản lý mượn trả tiện lợi.</p>
              </div>
              <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-50">Tải ngay</button>
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