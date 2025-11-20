// src/app/dang_nhap/page.js
'use client';

// 1. Import các hook mới và Server Action
import { useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { loginAction } from './actions'; // Import Server Action

// 2. Tạo một component con cho Nút Đăng nhập
// Nút này tự "biết" form đang bận hay không
function LoginButton() {
    const { pending } = useFormStatus(); // Hook đọc trạng thái của form

    return (
        <button
            type="submit"
            disabled={pending} // Vô hiệu hóa nút khi đang gửi
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md font-semibold
                        hover:bg-blue-700
                        disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
            {pending ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
    );
}

// === Component Form Đăng nhập (Đã nâng cấp) ===
const LoginForm = () => {
    // 3. Khởi tạo useActionState
    // Nó nhận vào 'loginAction' và trạng thái ban đầu (là null)
    const [formState, formAction] = useActionState(loginAction, null);

    return (
        // 4. Gắn 'formAction' vào thẻ <form>
        <form action={formAction} className="space-y-4">
            <div>
                <label
                    htmlFor="login-username"
                    className="block text-sm font-medium text-gray-700"
                >
                    Tên đăng nhập (hoặc Email)
                </label>
                <input
                    type="text"
                    id="login-username"
                    name="username"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                />
            </div>
            <div>
                <label
                    htmlFor="login-password"
                    className="block text-sm font-medium text-gray-700"
                >
                    Mật khẩu
                </label>
                <input
                    type="password"
                    id="login-password"
                    name="password"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                />
            </div>
            {/* Hiển thị thông báo lỗi (nếu có) */}
            {formState?.error && (
                <p className="text-sm font-medium text-red-600">
                    {formState.error}
                </p>
            )}

            {/* 8. Sử dụng Nút Đăng nhập thông minh */}
            <LoginButton />
        </form>
    );
};

// === Component Form Đăng ký (Giữ nguyên, không thay đổi) ===
const RegisterForm = () => (
    <form className="space-y-4">
        {/* (Giữ nguyên các <input> họ tên, sđt, email,...) */}
        <div>
            <label htmlFor="reg-name" className="block text-sm font-medium text-gray-700">Họ và tên</label>
            <input type="text" id="reg-name" name="name" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
        </div>
        <div>
            <label htmlFor="reg-phone" className="block text-sm font-medium text-gray-700">Số điện thoại</label>
            <input type="tel" id="reg-phone" name="phone" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" required />
        </div>
        {/* ... (Các trường khác) ... */}
        <button
            type="submit"
            className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold"
            disabled // Tạm thời vô hiệu hóa nút Đăng ký
        >
            Tạo tài khoản (Đang bảo trì)
        </button>
        <p className="text-sm text-gray-500">Chức năng đăng ký sẽ sớm được cập nhật.</p>
    </form>
);


// === Component chính render (Giữ nguyên) ===
export default function DangNhapPage() {
    const [view, setView] = useState('login');

    return (
        <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-lg shadow-lg">
            <div className="flex border-b border-gray-300 mb-6">
                <button
                    className={`py-2 px-4 w-1/2 ${view === 'login' ? 'border-b-2 border-blue-600 font-semibold text-blue-600' : 'text-gray-500'}`}
                    onClick={() => setView('login')}
                >
                    Đăng nhập
                </button>
                <button
                    className={`py-2 px-4 w-1/2 ${view === 'register' ? 'border-b-2 border-green-600 font-semibold text-green-600' : 'text-gray-500'}`}
                    onClick={() => setView('register')}
                >
                    Đăng ký
                </button>
            </div>

            <div>
                {view === 'login' ? <LoginForm /> : <RegisterForm />}
            </div>
        </div>
    );
}