// src/app/page.js
'use client'; // Bắt buộc

import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBook, faTicketAlt, faTools, faUser
} from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import { useEffect } from 'react'; // 👈 BƯỚC 1: Import useEffect

// (Các hàm và dữ liệu giả lập giữ nguyên)
const showArticle = (id) => alert(`Đang mở bài viết: ${id}`);
const showEvent = (id) => alert(`Đang mở sự kiện: ${id}`);
const showBookDetails = (id) => alert(`Đang mở sách: ${id}`);
const openBorrowModal = () => alert(`Mở modal mượn sách`);

const aiRecommendations = [
  { id: 1, title: 'Đắc Nhân Tâm', author: 'Dale Carnegie', category: 'kỹ năng', available: true },
  { id: 3, title: 'Atomic Habits', author: 'James Clear', category: 'kỹ năng', available: true },
  { id: 5, title: 'Clean Code', author: 'Robert C. Martin', category: 'công nghệ', available: true },
];
const aiForecast = [
    { icon:'💺', text:`Nhu cầu chỗ ngồi dự kiến: 70% (cao vào khung 9–11h, 14–16h)` },
    { icon:'📚', text:`Mượn sách trong ngày: ~160 lượt` },
    { icon:'↩️', text:`Trả sách trong ngày: ~110 lượt` },
];

export default function HomePage() {

  // 👈 BƯỚC 2: "Dịch" logic initAnimations từ navigation.js [cite: 1-477, 119-122]
  useEffect(() => {
    // Chỉ chạy ở client
    if (typeof window === 'undefined') return;

    const els = document.querySelectorAll('.fade-in');
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('fade-in--visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    els.forEach(el => io.observe(el));

    // Cleanup observer khi component bị hủy
    return () => {
      els.forEach(el => io.unobserve(el));
    };
  }, []); // Mảng rỗng [] nghĩa là chỉ chạy 1 lần sau khi component tải xong

  return (
    <>
      {/* Hero Section */}
      <section className="relative text-white py-12 md:py-16 lg:py-20 overflow-hidden">
        {/* 🚨 SỬA LỖI 1: "bg-linear-to-br" -> "bg-gradient-to-br" */}
        <div className="absolute inset-0 bg-linear-to-br from-indigo-700 via-purple-700 to-cyan-600"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            {/* Class 'fade-in' bây giờ sẽ được xử lý bởi useEffect */}
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-4 fade-in tracking-tight">
              THƯ VIỆN KHOA HỌC<br/>TỔNG HỢP ĐÀ NẴNG
            </h1>
            <p className="text-base md:text-lg lg:text-xl mb-8 fade-in opacity-90">
              Không gian tri thức mở cho mọi bạn đọc.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center fade-in">
              <Link href="/tim_kiem" className="bg-white text-purple-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg">📚 Tìm kiếm sách</Link>
              <Link href="/dang_ky_the" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-700 transition-colors">🎫 Đăng ký thẻ bạn đọc</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Breaking News Ticker */}
      <section className="bg-red-600 text-white py-2 overflow-hidden">
        {/* ... (Nội dung không đổi) ... */}
        <div className="flex items-center">
          <div className="bg-red-800 px-4 py-1 font-bold text-sm whitespace-nowrap">
            🔥 TIN NỔI BẬT
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="animate-marquee whitespace-nowrap py-1 text-sm">
              📢 Khai trương phòng đọc 24/7 từ ngày 15/12 • 🎉 Triển lám &quot;Đà Nẵng - 25 năm thành lập&quot; • 📚 Ra mắt ứng dụng di động mới • 🎓 Khóa học kỹ năng số miễn phí
            </div>
          </div>
        </div>
      </section>

      {/* Main News Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">

            {/* Featured News */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8 cursor-pointer" onClick={() => showArticle('main')}>
                {/* ... (Nội dung không đổi) ... */}
                <div className="relative">
                  <div className="h-64 bg-linear-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="text-6xl mb-4">🏛️</div>
                      <h3 className="text-xl font-bold">Khai trương phòng đọc 24/7</h3>
                    </div>
                  </div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">TIN HOT</span>
                  </div>
                </div>
                <div className="p-6">
                  <h2 className="text-2xl font-bold mb-3 text-gray-800">Thư viện chính thức khai trương phòng đọc 24/7</h2>
                  <p className="text-gray-600 mb-4">Từ ngày 15/12/2024, Thư viện Khoa học Tổng hợp Đà Nẵng chính thức khai trương phòng đọc hoạt động 24/7...</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>📅 10/12/2024</span>
                    <span>👁️ 1,247 lượt xem</span>
                    <span className="text-purple-600 hover:text-purple-800 font-semibold">Đọc tiếp →</span>
                  </div>
                </div>
              </div>

              {/* News Grid */}
              <div className="grid md:grid-cols-2 gap-6">
                <article className="bg-white rounded-lg shadow-lg overflow-hidden card-hover cursor-pointer" onClick={() => showArticle('exhibition')}>
                  {/* ... (Nội dung không đổi) ... */}
                  <div className="h-48 bg-linear-to-r from-green-400 to-blue-500 flex items-center justify-center">
                    <div className="text-center text-white"><div className="text-4xl mb-2">🎨</div><h4 className="font-bold">Triển lãm &quot;Đà Nẵng - 25 năm&quot;</h4></div>
                  </div>
                  <div className="p-4"><h3 className="font-semibold mb-2">Triển lãm &quot;Đà Nẵng - 25 năm thành lập...&quot;</h3><div className="flex justify-between items-center text-xs text-gray-500"><span>📅 08/12/2024</span><span>👁️ 892 lượt xem</span></div></div>
                </article>
                <article className="bg-white rounded-lg shadow-lg overflow-hidden card-hover cursor-pointer" onClick={() => showArticle('app')}>
                  {/* ... (Nội dung không đổi) ... */}
                  <div className="h-48 bg-linear-to-r from-purple-400 to-pink-500 flex items-center justify-center">
                    <div className="text-center text-white"><div className="text-4xl mb-2">📱</div><h4 className="font-bold">Ứng dụng di động mới</h4></div>
                  </div>
                  <div className="p-4"><h3 className="font-semibold mb-2">Ra mắt ứng dụng thư viện thông minh</h3><div className="flex justify-between items-center text-xs text-gray-500"><span>📅 05/12/2024</span><span>👁️ 1,156 lượt xem</span></div></div>
                </article>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                {/* ... (Nội dung không đổi) ... */}
                <h3 className="text-lg font-bold mb-4 text-gray-800">📊 Thống kê nhanh</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center"><span className="text-gray-600">📚 Tổng sách:</span><span id="totalBooksCount" className="font-bold text-blue-600">50,247</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-600">👥 Thành viên:</span><span id="totalMembersCount" className="font-bold text-green-600">15,432</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-600">📖 Đang mượn:</span><span id="loansActiveCount" className="font-bold text-orange-600">3,247</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-600">🌐 Truy cập hôm nay:</span><span id="visitsTodayCount" className="font-bold text-purple-600">1,204</span></div>
                </div>
              </div>

              {/* Upcoming Events */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                {/* ... (Nội dung không đổi) ... */}
                <h3 className="text-lg font-bold mb-4 text-gray-800">📅 Sự kiện sắp tới</h3>
                <div className="space-y-4">
                  <button className="w-full text-left border-l-4 border-purple-500 pl-4 hover:bg-gray-50 rounded" onClick={() => showEvent('ai')}>
                    <h4 className="font-semibold text-sm">Hội thảo &quot;AI trong thư viện&quot;</h4><p className="text-xs text-gray-600">📅 15/12/2024 - 14:00</p>
                  </button>
                  <button className="w-full text-left border-l-4 border-blue-500 pl-4 hover:bg-gray-50 rounded" onClick={() => showEvent('club')}>
                    <h4 className="font-semibold text-sm">Câu lạc bộ đọc sách</h4><p className="text-xs text-gray-600">📅 18/12/2024 - 19:00</p>
                  </button>
                  <button className="w-full text-left border-l-4 border-green-500 pl-4 hover:bg-gray-50 rounded" onClick={() => showEvent('cv')}>
                    <h4 className="font-semibold text-sm">Workshop viết CV</h4><p className="text-xs text-gray-600">📅 20/12/2024 - 15:30</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">🚀 Truy cập nhanh</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Link href="/tim_kiem" className="bg-purple-50 hover:bg-purple-100 p-6 rounded-lg text-center transition-colors card-hover">
              <div className="text-3xl mb-2">📚</div><h3 className="font-semibold text-purple-800">Tìm sách</h3>
            </Link>
            <Link href="/dang_ky_the" className="bg-blue-50 hover:bg-blue-100 p-6 rounded-lg text-center transition-colors card-hover">
              <div className="text-3xl mb-2">🎫</div><h3 className="font-semibold text-blue-800">Làm thẻ</h3>
            </Link>
            {/* 🚨 SỬA LỖI 2: Thẻ <Linh> -> <Link> */}
            <Link href="/dich_vu" className="bg-green-50 hover:bg-green-100 p-6 rounded-lg text-center transition-colors card-hover">
              <div className="text-3xl mb-2">🛠️</div><h3 className="font-semibold text-green-800">Dịch vụ</h3>
            </Link>
            <Link href="/tai_khoan" className="bg-orange-50 hover:bg-orange-100 p-6 rounded-lg text-center transition-colors card-hover">
              <div className="text-3xl mb-2">👤</div><h3 className="font-semibold text-orange-800">Thành viên</h3>
            </Link>
          </div>
        </div>
      </section>

      {/* AI Assistant Section */}
      <section className="py-12 bg-linear-to-b from-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Personalized Recommendations */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
              {/* ... (Nội dung không đổi) ... */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">🤖 Gợi ý tài liệu cho bạn</h3>
                <button className="text-sm text-blue-600 hover:text-blue-800">Làm mới</button>
              </div>
              <p className="text-sm text-gray-600 mb-4">Dựa trên hành vi tra cứu và lịch sử mượn, AI đề xuất tài liệu phù hợp.</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiRecommendations.map((b) => (
                  <div key={b.id} className="border rounded-lg p-3 hover:shadow transition">
                    <div className="text-sm font-semibold mb-1">{b.title}</div>
                    <div className="text-xs text-gray-600">{b.author}</div>
                    <div className="mt-2 text-xs">Chủ đề: <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700">{b.category}</span></div>
                    <div className={`mt-2 text-xs ${b.available ? 'text-green-600' : 'text-red-600'}`}>{b.available ? 'Có sẵn' : 'Đang bận'}</div>
                    <div className="mt-2">
                      <button className="text-sm text-blue-600 hover:text-blue-800" onClick={() => { showBookDetails(b.id); openBorrowModal(); }}>
                        Mượn
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Demand Forecast */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              {/* ... (Nội dung không đổi) ... */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">📈 Dự báo nhu cầu</h3>
                <button className="text-sm text-blue-600 hover:text-blue-800">Làm mới</button>
              </div>
              <p className="text-sm text-gray-600 mb-4">AI dự báo nhu cầu sử dụng dịch vụ để tối ưu vận hành.</p>
              <div className="space-y-3">
                {aiForecast.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded border">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-sm text-gray-700">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}