// src/app/dang_nhap/page.js
'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Link from 'next/link';
import { BookOpen, ArrowLeft, User, Lock, Phone, UserPlus, LogIn, Loader2, Mail } from 'lucide-react';
import { loginAction } from './actions';

// === Nút Submit có trạng thái loading ===
function LoginButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full py-3.5 px-4 bg-linear-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
            {pending ? (
                <><Loader2 className="animate-spin" /> Đang xử lý...</>
            ) : (
                <><LogIn size={20} /> Đăng nhập</>
            )}
        </button>
    );
}

// === Form Đăng nhập ===
const LoginForm = () => {
    // Kết nối với Server Action
    const [formState, formAction] = useActionState(loginAction, null);

    return (
        <form action={formAction} className="space-y-5 animate-in">
            <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 ml-1">Tài khoản</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <User size={20} />
                    </div>
                    <input
                        type="text"
                        name="username"
                        placeholder="Tên đăng nhập / Email"
                        className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        required
                    />
                </div>
            </div>

            <div className="space-y-1">
                <div className="flex justify-between ml-1">
                    <label className="text-sm font-semibold text-gray-700">Mật khẩu</label>
                    <a href="#" className="text-xs font-medium text-blue-600 hover:underline">Quên mật khẩu?</a>
                </div>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <Lock size={20} />
                    </div>
                    <input
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        required
                    />
                </div>
            </div>

            {/* Hiển thị lỗi từ Server Action */}
            {formState?.error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-2 animate-pulse">
                    ⚠️ {formState.error}
                </div>
            )}

            <div className="pt-2">
                <LoginButton />
            </div>

            <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-200"></span></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-500">Hoặc tiếp tục với</span></div>
            </div>

            {/* Nút Google (Giả lập UI) */}
            <button type="button" className="w-full py-3 px-4 border border-gray-200 bg-white text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Google
            </button>
        </form>
    );
};

// === Form Đăng ký (UI Mới) ===
const RegisterForm = () => (
    <form className="space-y-5 animate-in">
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 ml-1">Họ tên</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <User size={18} />
                    </div>
                    <input type="text" className="block w-full pl-10 pr-3 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm" placeholder="Nguyễn Văn A" />
                </div>
            </div>
            <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-700 ml-1">SĐT</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <Phone size={18} />
                    </div>
                    <input type="tel" className="block w-full pl-10 pr-3 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm" placeholder="0905..." />
                </div>
            </div>
        </div>

        <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 ml-1">Email</label>
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                    <Mail size={20} />
                </div>
                <input type="email" className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all" placeholder="email@example.com" />
            </div>
        </div>

        <button disabled className="w-full py-3.5 px-4 bg-green-600/80 text-white rounded-xl font-bold text-lg cursor-not-allowed flex items-center justify-center gap-2 opacity-70">
            <UserPlus size={20} /> Đăng ký (Sắp ra mắt)
        </button>
    </form>
);

// === COMPONENT CHÍNH ===
export default function DangNhapPage() {
    const [view, setView] = useState('login');

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 pt-24 relative overflow-hidden font-sans">

            {/* Background giống Trang chủ */}
            <div className="absolute inset-0 bg-linear-to-br from-blue-900 via-indigo-900 to-slate-900 z-0"></div>
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-size-[16px_16px] z-0"></div>

            {/* Các đốm sáng trang trí */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/30 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2"></div>

            {/* Container */}
            <div className="relative z-10 w-full max-w-[480px]">
                {/* Nút quay lại */}
                <Link href="/" className="inline-flex items-center gap-2 text-blue-200 hover:text-white mb-8 transition-colors group">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> Quay về Trang chủ
                </Link>

                {/* Card chính */}
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">

                    {/* Header Card */}
                    <div className="p-8 pb-0 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-blue-600 to-cyan-500 text-white shadow-lg mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                            <BookOpen size={32} />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                            {view === 'login' ? 'Đăng nhập hệ thống' : 'Đăng ký thành viên'}
                        </h2>
                        <p className="text-gray-500 text-sm">
                            {view === 'login' ? 'Truy cập thư viện số & quản lý mượn trả' : 'Trải nghiệm không gian tri thức không giới hạn'}
                        </p>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex p-1.5 mx-8 mt-6 bg-gray-100/80 rounded-xl">
                        <button
                            onClick={() => setView('login')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
                                view === 'login'
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Đăng nhập
                        </button>
                        <button
                            onClick={() => setView('register')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${
                                view === 'register'
                                ? 'bg-white text-green-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            Đăng ký
                        </button>
                    </div>

                    {/* Form Area */}
                    <div className="p-8">
                        {view === 'login' ? <LoginForm /> : <RegisterForm />}
                    </div>
                </div>

                {/* Footer Link */}
                <p className="text-center text-blue-200/60 text-xs mt-8">
                    © 2024 Smart Lib DN. Hệ thống được bảo mật tuyệt đối.
                </p>
            </div>
        </div>
    );
}