// src/components/Header.js
'use client'; // Cần 'use client' để xử lý bật/tắt menu mobile

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes } from '@fortawesome/free-solid-svg-icons';

// Dữ liệu Nav, dịch từ HTML
const navItems = [
    { name: 'Trang chủ', href: '/' },
    { name: 'Danh mục sách', href: '/tim_kiem' }, // Dịch data-nav="catalog"
    { name: 'Dịch vụ', href: '/dich_vu' }, // Dịch data-nav="services"
    { name: 'Đăng ký thẻ', href: '/dang_ky_the' }, // Dịch data-nav="cardRegistration"
    { name: 'Thành viên', href: '/tai_khoan' }, // Dịch data-nav="member"
    { name: 'Quản lý', href: '/admin' }, // Dịch data-nav="admin"
];

export default function Header() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname(); // Hook để biết trang nào đang active

    // Dịch logic từ navigation.js
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // Hàm đóng menu khi nhấp vào link trên mobile
    const handleMobileLinkClick = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        // Toàn bộ HTML/Class được lấy từ <nav> trong index.html
        <nav className="gradient-bg text-white shadow-lg sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                            {/* SVG Logo  */}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-8 h-8 text-white" fill="currentColor" aria-hidden="true">
                                <path d="M3 6.75A2.25 2.25 0 0 1 5.25 4.5h4.5a2.25 2.25 0 0 1 2.25 2.25v12a.75.75 0 0 1-1.177.624L7.5 17.25l-3.323 2.124A.75.75 0 0 1 3 18.75v-12Z"/>
                                <path d="M12 6.75A2.25 2.25 0 0 1 14.25 4.5h4.5A2.25 2.25 0 0 1 21 6.75v12a.75.75 0 0 1-1.177.624L16.5 17.25l-3.323 2.124A.75.75 0 0 1 12 18.75v-12Z"/>
                            </svg>
                            <span className="text-lg md:text-xl font-bold tracking-tight">Thư viện KHTH Đà Nẵng</span>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center space-x-6">
                        {/* Dịch các <button data-nav> thành <Link> */}
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`nav-btn hover:text-blue-200 transition-colors ${isActive ? 'active' : ''}`}
                                    >
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                    <div className="md:hidden">
                        {/* Dịch data-action="toggle-mobile"  */}
                        <button onClick={toggleMobileMenu} className="text-white">
                            <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} className="text-xl" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu  */}
            {/* Dịch logic ẩn/hiện bằng state 'isMobileMenuOpen' */}
            <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden bg-indigo-700`}>
                <div className="px-2 pt-2 pb-3 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={handleMobileLinkClick} // Thêm hàm đóng menu
                            className="block px-3 py-2 text-white hover:bg-indigo-600 rounded"
                        >
                            {item.name}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
}