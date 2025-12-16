// src/app/dich_vu/page.js
'use client';

import {
    BookOpen, Monitor, Printer, Wifi,
    Tablet, Headphones, Database, Smartphone,
    Coffee, Users, VolumeX, Mic, Calendar, ArrowRight
} from 'lucide-react';
import Link from 'next/link';

// Logic mở modal (Giữ nguyên từ code cũ)
const showBookingForm = () => {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } else {
        alert("Tính năng đặt lịch đang được cập nhật!");
    }
};

export default function ServicesPage() {
    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">

            {/* 1. HERO HEADER (Đồng bộ với trang Danh mục & Chi tiết) */}
            <div className="relative bg-linear-to-r from-blue-900 to-indigo-900 h-[400px] flex items-center justify-center overflow-hidden pb-20">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                {/* Decorative Blobs */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"></div>

                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-10">
                    <span className="inline-block py-1 px-3 rounded-full bg-blue-500/20 border border-blue-400/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-sm">
                        Tiện ích & Hỗ trợ
                    </span>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight drop-shadow-lg">
                        Hệ Sinh Thái <span className="text-transparent bg-clip-text bg-linear-to-r from-cyan-400 to-blue-400">Dịch Vụ Số</span>
                    </h1>
                    <p className="text-blue-100 text-lg md:text-xl font-light max-w-2xl mx-auto">
                        Không chỉ là nơi đọc sách, chúng tôi cung cấp không gian sáng tạo, thiết bị công nghệ và các dịch vụ hỗ trợ nghiên cứu hàng đầu.
                    </p>
                </div>
            </div>

            {/* 2. MAIN CONTENT (Overlap Hero) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-20">

                {/* GRID DỊCH VỤ */}
                <div className="grid md:grid-cols-2 gap-8 mb-12">

                    {/* Card 1: Dịch vụ Cơ bản */}
                    <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 group">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform duration-300">
                                <BookOpen size={32} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Dịch vụ Cơ bản</h2>
                                <p className="text-sm text-gray-500">Nền tảng của thư viện truyền thống</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <ServiceItem icon={BookOpen} title="Mượn sách & Tài liệu" desc="Mượn về nhà hoặc đọc tại chỗ với quy trình tự động hóa." />
                            <ServiceItem icon={Monitor} title="Máy tính công cộng" desc="Truy cập internet, tra cứu OPAC và soạn thảo văn bản miễn phí." />
                            <ServiceItem icon={Printer} title="In ấn & Photocopy" desc="Dịch vụ in ấn tự phục vụ, hỗ trợ thanh toán qua ví điện tử." />
                            <ServiceItem icon={Wifi} title="Wifi tốc độ cao" desc="Phủ sóng toàn bộ khuôn viên, băng thông rộng cho mọi thiết bị." />
                        </div>
                    </div>

                    {/* Card 2: Dịch vụ Số */}
                    <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 group">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform duration-300">
                                <Database size={32} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Dịch vụ Số & Công nghệ</h2>
                                <p className="text-sm text-gray-500">Trải nghiệm thư viện thông minh 4.0</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <ServiceItem icon={Tablet} title="Thư viện điện tử (E-Library)" desc="Truy cập hàng triệu tài liệu số, tạp chí và luận văn từ xa." />
                            <ServiceItem icon={Headphones} title="Multimedia & Podcast" desc="Kho sách nói, tài liệu nghe nhìn phục vụ giải trí và học tập." />
                            <ServiceItem icon={Database} title="Cơ sở dữ liệu học thuật" desc="Kết nối với ScienceDirect, Springer, IEEE Xplore..." />
                            <ServiceItem icon={Smartphone} title="Mobile App tiện lợi" desc="Quản lý tài khoản, gia hạn sách và nhận thông báo trên điện thoại." />
                        </div>
                    </div>

                    {/* Card 3: Không gian học tập (Thêm mới cho đầy đủ) */}
                    <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 group">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform duration-300">
                                <Users size={32} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Không gian Sáng tạo</h2>
                                <p className="text-sm text-gray-500">Môi trường lý tưởng cho học tập và làm việc</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <ServiceItem icon={Users} title="Phòng học nhóm" desc="Không gian cách âm, trang bị bảng viết và màn hình trình chiếu." />
                            <ServiceItem icon={VolumeX} title="Khu vực yên tĩnh" desc="Dành cho những ai cần sự tập trung tuyệt đối để nghiên cứu." />
                            <ServiceItem icon={Coffee} title="Library Café" desc="Thư giãn với cà phê và sách tại khu vực sảnh chờ." />
                            <ServiceItem icon={Mic} title="Phòng Studio/Media" desc="Hỗ trợ quay dựng, thu âm podcast với thiết bị chuyên nghiệp." />
                        </div>
                    </div>

                    {/* Card 4: Hoạt động & Sự kiện */}
                    <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 group">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform duration-300">
                                <Calendar size={32} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Sự kiện & Cộng đồng</h2>
                                <p className="text-sm text-gray-500">Kết nối tri thức và con người</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <ServiceItem icon={Calendar} title="Workshop kỹ năng" desc="Các lớp học kỹ năng mềm, tin học văn phòng và tra cứu thông tin." />
                            <ServiceItem icon={Users} title="Câu lạc bộ sách" desc="Giao lưu, chia sẻ niềm đam mê đọc sách định kỳ hàng tháng." />
                            <ServiceItem icon={BookOpen} title="Ngày hội sách" desc="Triển lãm, trao đổi sách và giao lưu với các tác giả nổi tiếng." />
                            <ServiceItem icon={Monitor} title="Hỗ trợ nghiên cứu" desc="Tư vấn trích dẫn tài liệu, hỗ trợ làm khóa luận tốt nghiệp." />
                        </div>
                    </div>

                </div>

                {/* 3. BOOKING CTA BANNER */}
                <div className="relative rounded-3xl overflow-hidden bg-linear-to-r from-purple-600 to-blue-600 text-white p-10 md:p-16 text-center shadow-2xl animate-in">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                    {/* Glow effect */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>

                    <div className="relative z-10 max-w-3xl mx-auto">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Bạn cần không gian học tập riêng?</h2>
                        <p className="text-blue-100 text-lg mb-8">
                            Đặt trước phòng học nhóm, máy tính hoặc đăng ký tham gia các sự kiện thú vị ngay hôm nay để được ưu tiên phục vụ.
                        </p>
                        <button
                            onClick={showBookingForm}
                            className="bg-white text-purple-700 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all flex items-center gap-2 mx-auto"
                        >
                            <Calendar size={20} /> Đặt lịch ngay
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

// Component con để render từng dòng dịch vụ
function ServiceItem({ icon: Icon, title, desc }) {
    return (
        <div className="flex gap-4 items-start group/item">
            <div className="mt-1 p-2 rounded-lg bg-gray-50 text-gray-400 group-hover/item:bg-blue-50 group-hover/item:text-blue-600 transition-colors">
                <Icon size={20} />
            </div>
            <div>
                <h3 className="font-bold text-gray-800 text-base mb-1 group-hover/item:text-blue-600 transition-colors">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}