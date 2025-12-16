// src/app/tai_khoan/layout.js
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, BookCopy, History, Settings, CalendarCheck, LogOut, LayoutDashboard } from 'lucide-react';
import { logoutAction } from '../dang_nhap/actions';

const sidebarNav = [
    { name: 'Tổng quan', href: '/tai_khoan', icon: LayoutDashboard },
    { name: 'Tài liệu đang mượn', href: '/tai_khoan/muon_tra', icon: BookCopy },
    { name: 'Lịch sử mượn trả', href: '/tai_khoan/lich_su_muon', icon: History },
    { name: 'Đặt chỗ & Sự kiện', href: '/tai_khoan/dat_cho', icon: CalendarCheck },
    { name: 'Cài đặt tài khoản', href: '/tai_khoan/cap_nhat', icon: Settings },
];

export default function TaiKhoanLayout({ children }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-gray-50 font-sans relative">

            {/* === 1. NỀN HERO CHUNG (Background Layer) === */}
            {/* Lớp này nằm dưới cùng, tạo nền xanh cho toàn bộ khu vực phía trên */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-linear-to-r from-blue-900 to-indigo-900 z-0 overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                {/* Hiệu ứng đốm sáng trang trí */}
                <div className="absolute top-0 left-0 w-full h-full bg-linear-to-b from-transparent to-gray-50/10"></div>
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/30 rounded-full blur-[100px]"></div>
                <div className="absolute top-1/2 left-10 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]"></div>
            </div>

            {/* === 2. CONTAINER CHÍNH (Content Layer) === */}
            {/* z-10 để nội dung nổi lên trên nền xanh */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-6 pt-28 pb-10">

                {/* --- SIDEBAR (Dạng Thẻ Nổi) --- */}
                <aside className="w-full md:w-72 shrink-0">
                    <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-white/20 sticky top-28 overflow-hidden">

                        {/* Logo Area */}
                        <div className="p-6 border-b border-gray-100 flex items-center gap-3 bg-linear-to-r from-blue-50/50 to-transparent">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                                <User size={20} />
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-800 text-lg">Khu vực cá nhân</h2>
                                <p className="text-xs text-gray-500 font-medium">Member Dashboard</p>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav className="p-4 space-y-1">
                            {sidebarNav.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group font-medium ${
                                            isActive
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                                            : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                                        }`}
                                    >
                                        <item.icon size={20} className={`transition-colors ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-600'}`} />
                                        <span>{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Footer Sidebar */}
                        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                            <form action={logoutAction}>
                                <button
                                    type="submit"
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-left text-red-600 hover:bg-red-50 hover:text-red-700 font-medium transition-colors"
                                >
                                    <LogOut size={20} />
                                    <span>Đăng xuất</span>
                                </button>
                            </form>
                        </div>
                    </div>
                </aside>

                {/* --- MAIN CONTENT --- */}
                {/* Phần này sẽ chứa Hero Text và các Stats Card */}
                <main className="flex-1 min-w-0">
                    {children}
                </main>
            </div>
        </div>
    );
}