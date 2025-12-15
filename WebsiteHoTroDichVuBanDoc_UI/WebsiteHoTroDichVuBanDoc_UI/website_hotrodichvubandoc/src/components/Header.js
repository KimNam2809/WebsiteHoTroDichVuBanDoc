// src/components/Header.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, BookOpen } from 'lucide-react';

const navItems = [
    { name: 'Trang chủ', href: '/' },
    { name: 'Danh mục sách', href: '/tim_kiem' },
    { name: 'Dịch vụ', href: '/dich_vu' },
    { name: 'Đăng ký thẻ', href: '/dang_ky_the' },
    { name: 'Thành viên', href: '/tai_khoan' },
];

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();

    // Hiệu ứng đổi màu header khi cuộn
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed w-full z-50 transition-all duration-300 ${
            scrolled ? 'bg-white/90 backdrop-blur-md shadow-md py-2' : 'bg-transparent py-4'
        }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className={`p-2 rounded-lg transition-colors ${scrolled ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}>
                            <BookOpen size={24} strokeWidth={3} />
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-xl font-extrabold tracking-tight transition-colors ${scrolled ? 'text-gray-900' : 'text-white'}`}>
                                SMART LIB <span className="text-cyan-400">DN</span>
                            </span>
                            <span className={`text-xs font-medium tracking-widest uppercase ${scrolled ? 'text-gray-500' : 'text-blue-100'}`}>
                                Thư viện KHTH Đà Nẵng
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                                        ${isActive
                                            ? (scrolled ? 'bg-blue-50 text-blue-600 font-bold' : 'bg-white/20 text-white font-bold')
                                            : (scrolled ? 'text-gray-600 hover:bg-gray-100' : 'text-white/90 hover:bg-white/10')
                                        }`}
                                >
                                    {item.name}
                                </Link>
                            );
                        })}
                        {/* Nút Admin riêng biệt */}
                        <Link href="/admin" className={`ml-4 px-5 py-2 rounded-full text-sm font-bold shadow-lg transition-transform hover:-translate-y-0.5 ${
                            scrolled ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-white text-blue-900 hover:bg-blue-50'
                        }`}>
                            Quản trị
                        </Link>
                    </div>

                    {/* Mobile Toggle */}
                    <div className="md:hidden">
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={scrolled ? 'text-gray-900' : 'text-white'}>
                            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white absolute w-full shadow-xl border-t">
                    <div className="px-4 pt-2 pb-6 space-y-2">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`block px-4 py-3 rounded-lg text-base font-medium ${
                                    pathname === item.href ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {item.name}
                            </Link>
                        ))}
                        <Link
                            href="/admin"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block px-4 py-3 rounded-lg text-base font-bold text-gray-800 hover:bg-gray-100 border-t mt-2"
                        >
                            Dành cho Quản lý
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
}