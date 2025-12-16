// src/components/Header.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, BookOpen, LogIn, LogOut, User, Loader2 } from 'lucide-react';
import { getSessionAction, logoutAction } from '@/app/dang_nhap/actions';

const navItems = [
    { name: 'Trang chủ', href: '/' },
    { name: 'Danh mục sách', href: '/tim_kiem' },
    { name: 'Dịch vụ', href: '/dich_vu' },
    { name: 'Đăng ký thẻ', href: '/dang_ky_the' },
];

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // State quản lý User
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const pathname = usePathname();

    // 1. Kiểm tra Session mỗi khi chuyển trang
    useEffect(() => {
        async function fetchSession() {
            const userData = await getSessionAction();
            setUser(userData);
            setIsLoading(false);
        }
        fetchSession();
    }, [pathname]);

    // 2. Hiệu ứng cuộn
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed w-full z-50 transition-all duration-300 ${
            scrolled ? 'bg-white/90 backdrop-blur-md shadow-lg py-2' : 'bg-transparent py-4'
        }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* LOGO */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className={`p-2.5 rounded-xl transition-all duration-300 shadow-sm ${scrolled ? 'bg-linear-to-br from-blue-600 to-cyan-500 text-white' : 'bg-white text-blue-600'}`}>
                            <BookOpen size={24} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-xl font-extrabold tracking-tight transition-colors ${scrolled ? 'text-gray-900' : 'text-white'}`}>
                                SMART LIB <span className="text-cyan-400">DN</span>
                            </span>
                            <span className={`text-[10px] font-bold tracking-widest uppercase ${scrolled ? 'text-gray-500' : 'text-blue-200'}`}>
                                Thư viện Số Đà Nẵng
                            </span>
                        </div>
                    </Link>

                    {/* DESKTOP MENU */}
                    <div className="hidden md:flex items-center space-x-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                                    pathname === item.href
                                        ? (scrolled ? 'bg-blue-50 text-blue-600 font-bold' : 'bg-white/20 text-white font-bold backdrop-blur-sm')
                                        : (scrolled ? 'text-gray-600 hover:bg-gray-100' : 'text-blue-100 hover:bg-white/10 hover:text-white')
                                }`}
                            >
                                {item.name}
                            </Link>
                        ))}

                        {/* Nút Thành Viên (Luôn trỏ về /tai_khoan) */}
                        <Link
                            href="/tai_khoan"
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                                pathname.startsWith('/tai_khoan')
                                    ? (scrolled ? 'bg-blue-50 text-blue-600 font-bold' : 'bg-white/20 text-white font-bold backdrop-blur-sm')
                                    : (scrolled ? 'text-gray-600 hover:bg-gray-100' : 'text-blue-100 hover:bg-white/10 hover:text-white')
                            }`}
                        >
                            <User size={16} /> Thành viên
                        </Link>

                        {/* Nút Hành động (Login/Logout) */}
                        <div className="ml-4 pl-4 border-l border-gray-200/20">
                            {isLoading ? (
                                <Loader2 className={`animate-spin ${scrolled ? 'text-blue-600' : 'text-white'}`} size={20} />
                            ) : user ? (
                                <button
                                    onClick={() => logoutAction()} // Gọi trực tiếp Server Action
                                    className={`px-5 py-2.5 rounded-full text-sm font-bold shadow-lg transition-all hover:-translate-y-0.5 flex items-center gap-2 ${
                                        scrolled
                                        ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                                        : 'bg-white/10 text-white hover:bg-red-500/80 border border-white/20 backdrop-blur-md'
                                    }`}
                                >
                                    <LogOut size={16} /> Đăng xuất
                                </button>
                            ) : (
                                <Link
                                    href="/dang_nhap"
                                    className={`px-6 py-2.5 rounded-full text-sm font-bold shadow-lg transition-all hover:-translate-y-0.5 flex items-center gap-2 ${
                                        scrolled
                                        ? 'bg-linear-to-r from-blue-600 to-cyan-500 text-white hover:shadow-blue-500/30'
                                        : 'bg-white text-blue-900 hover:bg-blue-50'
                                    }`}
                                >
                                    <LogIn size={16} /> Đăng nhập
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* MOBILE TOGGLE */}
                    <div className="md:hidden">
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`p-2 rounded-lg transition-colors ${scrolled ? 'text-gray-900 hover:bg-gray-100' : 'text-white hover:bg-white/10'}`}>
                            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* MOBILE MENU */}
            <div className={`md:hidden absolute w-full bg-white shadow-xl border-t transition-all duration-300 overflow-hidden ${isMobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-4 pt-4 pb-6 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block px-4 py-3 rounded-xl text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-blue-600"
                        >
                            {item.name}
                        </Link>
                    ))}

                    <Link
                        href="/tai_khoan"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block px-4 py-3 rounded-xl text-base font-medium text-gray-600 hover:bg-gray-50 border-t border-gray-100 mt-2"
                    >
                        <div className="flex items-center gap-3">
                            <User size={18}/> Khu vực Thành viên
                        </div>
                    </Link>

                    <div className="pt-2">
                        {user ? (
                            <button
                                onClick={() => { logoutAction(); setIsMobileMenuOpen(false); }}
                                className="w-full text-left px-4 py-3 rounded-xl text-base font-bold text-red-600 bg-red-50 hover:bg-red-100 flex items-center gap-3"
                            >
                                <LogOut size={18} /> Đăng xuất
                            </button>
                        ) : (
                            <Link
                                href="/dang_nhap"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="px-4 py-3 rounded-xl text-base font-bold text-white bg-linear-to-r from-blue-600 to-cyan-500 flex items-center gap-3 justify-center shadow-md"
                            >
                                <LogIn size={18} /> Đăng nhập / Đăng ký
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}