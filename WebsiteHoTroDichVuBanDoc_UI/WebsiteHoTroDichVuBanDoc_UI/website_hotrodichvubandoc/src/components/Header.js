// src/components/Header.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, BookOpen, LogIn, LogOut, User, Loader2, Bell } from 'lucide-react';
// Import Server Actions từ đúng đường dẫn bạn đã cung cấp
import { getSessionAction, logoutAction } from '@/app/dang_nhap/actions';
import { getUnreadCountAction } from '@/app/actions/notification';

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
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const pathname = usePathname();
    const router = useRouter();

    // 1. Kiểm tra Phiên đăng nhập (Session) mỗi khi chuyển trang
    useEffect(() => {
        async function fetchSession() {
            try {
                const userData = await getSessionAction();
                setUser(userData);
            } catch (error) {
                console.error("Lỗi kiểm tra phiên:", error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchSession();
    }, [pathname]);

    // 1.1 Polling thông báo (30s/lần)
    useEffect(() => {
        let interval;
        if (user) {
            const fetchUnread = async () => {
                const count = await getUnreadCountAction();
                setUnreadCount(count);
            };
            fetchUnread(); // Gọi ngay lần đầu
            interval = setInterval(fetchUnread, 30000);
        } else {
            setUnreadCount(0);
        }
        return () => clearInterval(interval);
    }, [user, pathname]); // Re-run khi user đổi hoặc chuyển trang (để cập nhật lại nếu vừa đọc xong)

    // 2. Hiệu ứng cuộn: Đổi màu nền header khi cuộn xuống
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 3. Xử lý Đăng xuất
    const handleLogout = async () => {
        await logoutAction(); // Gọi Server Action xóa cookie
        setUser(null); // Xóa state client
        setUnreadCount(0);
        router.push('/dang_nhap'); // Chuyển hướng về đăng nhập
        router.refresh(); // Làm mới trang để cập nhật middleware
    };

    // Hàm tiện ích để style các link điều hướng
    const getNavLinkClass = (href) => {
        const isActive = pathname === href;
        if (scrolled) {
            return isActive
                ? 'bg-blue-50 text-blue-600 font-bold'
                : 'text-gray-600 hover:bg-gray-100 hover:text-blue-600';
        } else {
            return isActive
                ? 'bg-white/20 text-white font-bold backdrop-blur-sm'
                : 'text-blue-100 hover:bg-white/10 hover:text-white';
        }
    };

    return (
        <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-lg py-2' : 'bg-transparent py-4'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">

                    {/* --- LOGO --- */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className={`p-2.5 rounded-xl transition-all duration-300 shadow-sm ${scrolled ? 'bg-linear-to-br from-blue-600 to-cyan-500 text-white' : 'bg-white text-blue-600'
                            }`}>
                            <BookOpen size={24} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col">
                            <span className={`text-xl font-extrabold tracking-tight transition-colors ${scrolled ? 'text-gray-900' : 'text-white'
                                }`}>
                                SMART LIB <span className="text-cyan-400">DN</span>
                            </span>
                            <span className={`text-[10px] font-bold tracking-widest uppercase ${scrolled ? 'text-gray-500' : 'text-blue-200'
                                }`}>
                                Thư viện Số Đà Nẵng
                            </span>
                        </div>
                    </Link>

                    {/* --- DESKTOP MENU --- */}
                    <div className="hidden md:flex items-center space-x-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${getNavLinkClass(item.href)}`}
                            >
                                {item.name}
                            </Link>
                        ))}

                        {/* Nút Thành Viên (Luôn hiển thị, Middleware sẽ chặn nếu chưa login) */}
                        <Link
                            href="/tai_khoan"
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${pathname.startsWith('/tai_khoan')
                                ? (scrolled ? 'bg-blue-50 text-blue-600 font-bold' : 'bg-white/20 text-white font-bold backdrop-blur-sm')
                                : (scrolled ? 'text-gray-600 hover:bg-gray-100' : 'text-blue-100 hover:bg-white/10 hover:text-white')
                                }`}
                        >
                            <User size={16} /> Thành viên
                        </Link>

                        {/* Nút Hành động (Đăng nhập / Đăng xuất) */}
                        <div className="ml-4 pl-4 border-l border-gray-200/20 flex items-center gap-3">
                            {isLoading ? (
                                <div className="px-6 py-2.5">
                                    <Loader2 className={`animate-spin ${scrolled ? 'text-blue-600' : 'text-white'}`} size={20} />
                                </div>
                            ) : user ? (
                                <>
                                    {/* [NEW] Bell Icon for Users (Not Staff) */}
                                    {user.vaitro !== 'nhanVien' && user.vaitro !== 'admin' && (
                                        <Link
                                            href="/thong_bao"
                                            className={`p-2.5 rounded-full transition-all relative group/bell ${scrolled
                                                ? 'text-gray-600 hover:bg-gray-100 hover:text-blue-600'
                                                : 'text-blue-100 hover:bg-white/10 hover:text-white'
                                                }`}
                                        >
                                            <Bell size={20} />

                                            {/* Badge thông báo */}
                                            {unreadCount > 0 && (
                                                <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-white"></span>
                                                </span>
                                            )}

                                            {/* Hiệu ứng pulse nhẹ khi hover */}
                                            <span className="absolute inset-0 rounded-full bg-current opacity-0 group-hover/bell:opacity-10 transition-opacity"></span>
                                        </Link>
                                    )}

                                    <button
                                        onClick={handleLogout}
                                        className={`px-5 py-2.5 rounded-full text-sm font-bold shadow-lg transition-all hover:-translate-y-0.5 flex items-center gap-2 ${scrolled
                                            ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
                                            : 'bg-white/10 text-white hover:bg-red-500/80 border border-white/20 backdrop-blur-md'
                                            }`}
                                    >
                                        <LogOut size={16} /> Đăng xuất
                                    </button>
                                </>
                            ) : (
                                <Link
                                    href="/dang_nhap"
                                    className={`px-6 py-2.5 rounded-full text-sm font-bold shadow-lg transition-all hover:-translate-y-0.5 flex items-center gap-2 ${scrolled
                                        ? 'bg-linear-to-r from-blue-600 to-cyan-500 text-white hover:shadow-blue-500/30'
                                        : 'bg-white text-blue-900 hover:bg-blue-50'
                                        }`}
                                >
                                    <LogIn size={16} /> Đăng nhập
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* --- MOBILE TOGGLE --- */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className={`p-2 rounded-lg transition-colors ${scrolled ? 'text-gray-900 hover:bg-gray-100' : 'text-white hover:bg-white/10'
                                }`}
                        >
                            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MOBILE MENU (Slide Down) --- */}
            <div className={`md:hidden absolute w-full bg-white shadow-xl border-t transition-all duration-300 overflow-hidden ${isMobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                }`}>
                <div className="px-4 pt-4 pb-6 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors ${pathname === item.href ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600 hover:bg-gray-50'
                                }`}
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
                            <User size={18} /> Khu vực Thành viên
                        </div>
                    </Link>

                    <div className="pt-2">
                        {user ? (
                            <button
                                onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }}
                                className="w-full text-left px-4 py-3 rounded-xl text-base font-bold text-red-600 bg-red-50 hover:bg-red-100 flex items-center gap-3"
                            >
                                <LogOut size={18} /> Đăng xuất
                            </button>
                        ) : (
                            <Link
                                href="/dang_nhap"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="px-4 py-3 rounded-xl text-base font-bold text-white bg-linear-to-r from-blue-600 to-cyan-500 flex items-center gap-3 justify-center shadow-md hover:opacity-90 transition-opacity"
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