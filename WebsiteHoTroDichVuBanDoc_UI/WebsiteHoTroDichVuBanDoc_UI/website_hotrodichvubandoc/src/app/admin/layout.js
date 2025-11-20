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
} from 'lucide-react';

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
        <div className="flex min-h-screen bg-gray-100">
            {/* Sidebar Menu (bên trái) */}
            <aside className="w-64 bg-gray-900 text-gray-200 flex-col hidden md:flex">
                <div className="p-6 text-2xl font-bold text-white flex items-center space-x-2">
                    <Library />
                    <span>Trang Quản Trị</span>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {adminNav.map((item) => {
                        // Xử lý ngăn cách
                        if (item.type === 'divider') {
                            return (
                                <h3 key={item.name} className="px-3 pt-4 pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    {item.name}
                                </h3>
                            );
                        }
                        // Xử lý menu bình thường
                        const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors
                                        ${isActive
                                            ? 'bg-blue-600 text-white'
                                            : 'hover:bg-gray-700'
                                        }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span>{item.name}</span>
                                </Link>
                            );
                    })}
                </nav>
            </aside>

            {/* Nội dung chính (bên phải) */}
            <div className="flex-1 flex flex-col">
                <header className="bg-white shadow-md p-4 md:hidden">
                    {/* Header cho mobile (sẽ làm sau) */}
                    <h1 className="text-xl font-bold">Admin Menu</h1>
                </header>
                <main className="flex-1 p-6 md:p-10">
                    {children}
                </main>
            </div>
        </div>
    );
}