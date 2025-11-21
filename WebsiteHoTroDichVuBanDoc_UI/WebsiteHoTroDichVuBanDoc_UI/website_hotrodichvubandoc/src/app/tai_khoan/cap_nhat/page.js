// src/app/tai_khoan/cap_nhat/page.js
'use client';

// (Sau này chúng ta sẽ dùng useState, v.v. để điền dữ liệu thật)

export default function CapNhatPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Cập nhật tài khoản</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Form thông tin cá nhân */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Thông tin cá nhân</h2>
                    <form className="space-y-4">
                        <div>
                            <label htmlFor="ho_ten" className="block text-sm font-medium">Họ và tên</label>
                            <input type="text" id="ho_ten" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" defaultValue="Nguyễn Văn A" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium">Email</label>
                            <input type="email" id="email" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" defaultValue="nguyenvana@gmail.com" />
                        </div>
                        <div>
                            <label htmlFor="sdt" className="block text-sm font-medium">Số điện thoại</label>
                            <input type="tel" id="sdt" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" defaultValue="0905123456" />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
                            >
                            Lưu thay đổi
                        </button>
                    </form>
                </div>

                {/* Form đổi mật khẩu */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-semibold mb-4">Đổi mật khẩu</h2>
                    <form className="space-y-4">
                        <div>
                            <label htmlFor="pass_old" className="block text-sm font-medium">Mật khẩu cũ</label>
                            <input type="password" id="pass_old" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="pass_new" className="block text-sm font-medium">Mật khẩu mới</label>
                            <input type="password" id="pass_new" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                        </div>
                        <div>
                            <label htmlFor="pass_confirm" className="block text-sm font-medium">Xác nhận mật khẩu mới</label>
                            <input type="password" id="pass_confirm" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-2 px-4 bg-gray-700 text-white rounded-md hover:bg-gray-800 font-semibold"
                            >
                            Đổi mật khẩu
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}