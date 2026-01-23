// src/app/admin/layout.js
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    FileText,
    BookMarked,
    CalendarCheck,
    Settings,
    Library,
    BellPlus, // Gửi thông báo
    ShieldAlert, // Vi phạm
    Activity, // Giám sát
    LogOut,
    ChevronRight,
    Menu // [NEW] Mobile Trigger if needed
} from 'lucide-react';
import { logoutAction } from '../dang_nhap/actions';

// Dữ liệu cho menu admin
const adminNav = [
    { name: 'Tổng quan', href: '/admin', icon: LayoutDashboard },
    { name: 'Phê duyệt thẻ', href: '/admin/phe_duyet_the', icon: Users },
    { name: 'Quản lý mượn/trả', href: '/admin/quan_ly_muon_tra', icon: BookMarked },
    { name: 'Quản lý đặt chỗ', href: '/admin/quan_ly_dat_cho', icon: CalendarCheck },
    { name: 'Quản lý bài viết', href: '/admin/quan_ly_bai_viet', icon: FileText },
    { name: 'Quản lý vi phạm', href: '/admin/vi_pham', icon: ShieldAlert },
    { name: 'Gửi thông báo', href: '/admin/gui_thong_bao', icon: BellPlus },
    // === Ngăn cách cho Admin cấp cao ===
    { type: 'divider', name: 'Quản trị viên' },
    { name: 'Quản lý tài khoản', href: '/admin/quan_ly_tai_khoan', icon: Settings },
    { name: 'Giám sát hệ thống', href: '/admin/giam_sat', icon: Activity },
    { name: 'Cấu hình', href: '/admin/cau_hinh', icon: Settings },
];

export default function AdminLayout({ children }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-gray-50 font-sans relative">

            {/* === 1. NỀN HERO CHUNG (Background Layer) === */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-linear-to-r from-blue-900 to-indigo-900 z-0 overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                {/* Hiệu ứng đốm sáng trang trí */}
                <div className="absolute top-0 left-0 w-full h-full bg-linear-to-b from-transparent to-gray-50/10"></div>
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/30 rounded-full blur-[100px]"></div>
                <div className="absolute top-1/2 left-10 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]"></div>
            </div>

            {/* === 2. CONTAINER CHÍNH (Content Layer) === */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-6 pt-28 pb-10">

                {/* === SIDEBAR (Dạng Thẻ Nổi Glassmorphism) === */}
                <aside className="w-full md:w-72 shrink-0">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 sticky top-28 overflow-hidden">

                        {/* Logo Area */}
                        <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-linear-to-r from-blue-50/50 to-transparent">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                                <Library size={20} />
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-800 text-lg">Quản Trị Viên</h2>
                                <p className="text-xs text-gray-500 font-medium">System Admin</p>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="p-4 space-y-1 max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar">
                            {adminNav.map((item) => {
                                if (item.type === 'divider') return <h3 key={item.name} className="px-4 pt-4 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">{item.name}</h3>;

                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group font-medium ${isActive
                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                                                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon size={20} className={`transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'}`} />
                                            <span className="text-sm">{item.name}</span>
                                        </div>
                                        {isActive && <ChevronRight size={16} className="text-blue-200" />}
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Footer Sidebar */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                            <form action={logoutAction}>
                                <button className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left text-red-600 hover:bg-red-50 hover:text-red-700 font-medium transition-colors">
                                    <LogOut size={20} />
                                    <span>Đăng xuất</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </aside>

                {/* === MAIN CONTENT === */}
                <main className="flex-1 min-w-0">
                    {children}
                </main>

            </div>
        </div>
    );
}