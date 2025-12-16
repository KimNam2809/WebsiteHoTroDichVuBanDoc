// src/app/admin/page.js
import Link from 'next/link';
import {
    Activity, Users, BookOpen, AlertTriangle,
    TrendingUp, Calendar, ArrowRight, BarChart3
} from 'lucide-react';

export default function AdminDashboardPage() {
    // Dữ liệu thống kê (Giả lập)
    const stats = [
        {
            title: 'Hồ sơ chờ duyệt',
            value: 12,
            label: 'Cần xử lý ngay',
            icon: Users,
            color: 'text-yellow-600',
            bg: 'bg-yellow-100',
            trend: '+2 hôm nay'
        },
        {
            title: 'Sách đang mượn',
            value: 450,
            label: 'Tài liệu lưu thông',
            icon: BookOpen,
            color: 'text-blue-600',
            bg: 'bg-blue-100',
            trend: '+15% tuần này'
        },
        {
            title: 'Sách quá hạn',
            value: 31,
            label: 'Cần thu hồi',
            icon: AlertTriangle,
            color: 'text-red-600',
            bg: 'bg-red-100',
            trend: '-5% so với tháng trước'
        },
        {
            title: 'Lượt truy cập',
            value: '1.2k',
            label: 'Thống kê hôm nay',
            icon: Activity,
            color: 'text-green-600',
            bg: 'bg-green-100',
            trend: 'Cao điểm lúc 9:00'
        },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">

            {/* 1. HERO BANNER (Chào mừng Admin) */}
            <div className="relative rounded-3xl overflow-hidden bg-linear-to-r from-gray-900 to-blue-900 text-white shadow-xl">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/2"></div>

                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-blue-200 mb-3 border border-white/10">
                            <Calendar size={12} />
                            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold mb-2 leading-tight">
                            Tổng quan hệ thống
                        </h1>
                        <p className="text-gray-300 max-w-xl text-lg">
                            Chào mừng quản trị viên. Dưới đây là báo cáo nhanh về tình hình hoạt động của thư viện hôm nay.
                        </p>
                    </div>

                    {/* Quick Action Button */}
                    <Link
                        href="/admin/gui_thong_bao"
                        className="group flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-500/30"
                    >
                        <TrendingUp size={20} />
                        Xem báo cáo chi tiết
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
                    </Link>
                </div>
            </div>

            {/* 2. STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                                <stat.icon size={24} />
                            </div>
                            {/* Trend Indicator */}
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                                {stat.trend}
                            </span>
                        </div>

                        <div>
                            <h3 className="text-4xl font-extrabold text-gray-900 mb-1 tracking-tight">
                                {stat.value}
                            </h3>
                            <p className="font-bold text-gray-700 text-sm">{stat.title}</p>
                            <p className="text-xs text-gray-400 mt-1">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* 3. CHARTS & RECENT ACTIVITY (Placeholder đẹp mắt) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Chart Area (Chiếm 2 phần) */}
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                        <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                            <BarChart3 className="text-blue-600"/> Biểu đồ mượn trả
                        </h2>
                        <select className="bg-gray-50 border border-gray-200 text-xs font-bold text-gray-600 rounded-lg px-3 py-1 outline-none">
                            <option>7 ngày qua</option>
                            <option>Tháng này</option>
                        </select>
                    </div>

                    {/* Placeholder Chart Graphic */}
                    <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center bg-linear-to-b from-white to-gray-50 p-8 relative">
                        <div className="absolute inset-0 flex items-end justify-between px-10 pb-10 opacity-20 gap-4">
                            {[40, 70, 45, 90, 60, 80, 50].map((h, i) => (
                                <div key={i} className="w-full bg-blue-600 rounded-t-lg" style={{ height: `${h}%` }}></div>
                            ))}
                        </div>
                        <div className="z-10 text-center">
                            <Activity size={48} className="text-blue-200 mx-auto mb-3" />
                            <p className="text-gray-400 font-medium">Biểu đồ thống kê đang được tích hợp AI...</p>
                        </div>
                    </div>
                </div>

                {/* Recent Activity / Notifications (Chiếm 1 phần) */}
                <div className="bg-white rounded-3xl shadow-md border border-gray-100 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-50">
                        <h2 className="font-bold text-gray-800 text-lg">Hoạt động mới</h2>
                    </div>
                    <div className="flex-1 p-6 space-y-6">
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} className="flex gap-4 items-start">
                                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0"></div>
                                <div>
                                    <p className="text-sm text-gray-800 font-medium leading-snug">
                                        Nguyễn Văn A vừa đăng ký thẻ thành viên mới.
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">15 phút trước</p>
                                </div>
                            </div>
                        ))}
                        <div className="pt-4 border-t border-gray-50">
                            <button className="w-full py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
                                Xem tất cả
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}