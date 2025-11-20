'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, BookCopy, History, Settings, CalendarCheck, LogOut } from 'lucide-react';
import { logoutAction } from '../dang_nhap/actions';

// Dữ liệu cho menu
const sidebarNav = [
    { name: 'Tổng quan', href: '/tai_khoan', icon: User },
    { name: 'Tài liệu đang mượn', href: '/tai_khoan/muon_tra', icon: BookCopy },
    { name: 'Lịch sử mượn trả', href: '/tai_khoan/lich_su_muon', icon: History },
    { name: 'Đặt chỗ', href: '/tai_khoan/dat_cho', icon: CalendarCheck },
    { name: 'Cập nhật tài khoản', href: '/tai_khoan/cap_nhat', icon: Settings },
];

export default function TaiKhoanLayout ({ children }) {
    const pathname = usePathname(); // Hooke để lấy đường dẫn hiện tại

    return (
        <div className="flex flex-col md:flex-row min-h-screen">
            {/* Sidebar Menu (bên trái) */}
            <aside className="w-full md:w-64 bg-white p-6 shadow-lg md:min-h-screen">
                <div>
                    <h2 className="text-xl font-bold mb-6 text-blue-700">Tài khoản của tôi</h2>
                    <nav className="space-y-2">
                        {sidebarNav.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors
                                    ${isActive
                                        ? 'bg-blue-100 text-blue-700 font-semibold'
                                        : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto pt-6 border-t border-gray-200">
                    <form action={logoutAction}>
                        <button
                            type="submit"
                            className="flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors
                                        w-full text-left text-gray-600 hover:bg-red-50 hover:text-red-600"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Đăng xuất</span>
                        </button>
                    </form>
                </div>
            </aside>

            {/* Nội dung chính (bên phải) */}
            <main className="flex-1 p-8 bg-gray-50">
                {/* Nội dung của từng trang con (page.js) sẽ được hiển thị ở đây */}
                {children}
            </main>
        </div>
    );
}