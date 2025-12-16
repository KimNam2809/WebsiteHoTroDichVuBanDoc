// src/app/admin/layout.js
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
// Import các icon (hãy chắc chắn bạn đã cài: npm install lucide-react)
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
    ChevronRight
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
        <div className="min-h-screen bg-gray-50 font-sans">

            {/* === 1. NỀN HERO CHUNG (Tương tự User Dashboard) === */}
            <div className="fixed top-0 left-0 w-full h-[72px] bg-gray-900 z-40 shadow-sm"></div>

            <div className="flex pt-[72px] h-screen overflow-hidden">

                {/* === 2. SIDEBAR CỐ ĐỊNH === */}
                <aside className="w-64 bg-gray-900 text-gray-300 flex-col hidden md:flex border-r border-gray-800">
                    <div className="p-6 border-b border-gray-800 flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white">
                            <Library size={18} />
                        </div>
                        <span className="font-bold text-white text-lg">Quản Trị Viên</span>
                    </div>

                    <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                        {adminNav.map((item) => {
                            if (item.type === 'divider') return <h3 key={item.name} className="px-3 pt-4 pb-2 text-xs font-bold text-gray-500 uppercase">{item.name}</h3>;

                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                                        isActive
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                        : 'hover:bg-gray-800 hover:text-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon size={18} />
                                        <span className="text-sm font-medium">{item.name}</span>
                                    </div>
                                    {isActive && <ChevronRight size={14}/>}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-gray-800 bg-gray-900">
                        <form action={logoutAction}>
                            <button className="flex items-center gap-3 w-full px-3 py-2 text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition-colors text-sm font-bold">
                                <LogOut size={18}/> Đăng xuất
                            </button>
                        </form>
                    </div>
                </aside>

                {/* === 3. MAIN CONTENT (Scrollable) === */}
                <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}