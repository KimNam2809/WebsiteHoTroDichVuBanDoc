'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import QRCode from 'react-qr-code'; // Cài từ: npm install react-qr-code

// Lệ phí thực tế (dựa trên thông tin của Thư viện KHTH Đà Nẵng)
const FEES = {
    'Thẻ Mượn (Cá nhân > 16 tuổi)': 40000,
    'Thẻ Đọc (Cá nhân > 16 tuổi)': 20000,
    'Thẻ Mượn (Thiếu nhi 7-15 tuổi)': 20000,
    'Thẻ Đọc (Thiếu nhi 7-15 tuổi)': 10000,
};
const SHIPPING_FEE = 30000; // Phí giao hàng (giả lập)

export default function FormDangKyPage() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loaiThe, setLoaiThe] = useState('Thẻ Mượn (Cá nhân > 16 tuổi)');
    const [ship, setShip] = useState(true);
    const [totalCost, setTotalCost] = useState(FEES[loaiThe] + SHIPPING_FEE);

    // Tự động tính lại tổng tiền khi lựa chọn thay đổi
    useEffect(() => {
        const baseFee = FEES[loaiThe] || 0;
        const shipping = ship ? SHIPPING_FEE : 0;
        setTotalCost(baseFee + shipping);
    }, [loaiThe, ship]);

    const handleSubmit = (e) => {
        e.preventDefault(); // Ngăn form tải lại trang
        // Logic gửi form thật sẽ ở đây (gọi API, lưu vào Supabase...)
        // Giả lập thành công, chuyển sang màn hình QR
        setIsSubmitted(true);
    };

    // === Màn hình QR khi thành công ===
    if (isSubmitted) {
        return (
            <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-lg shadow-lg text-center">
                <h1 className="text-2xl font-bold text-green-600 mb-4">Đăng ký thành công!</h1>
                <p className="text-gray-700 mb-6">Hồ sơ của bạn đã được gửi. Vui lòng thanh toán phí làm thẻ để hoàn tất.</p>
                <div className="p-4 bg-white inline-block rounded-lg border">
                    <QRCode
                        value={`https://thuvien.danang.gov.vn/thanh-toan?amount=${totalCost}`} // Giả lập link thanh toán
                        size={200}
                    />
                </div>
                <p className="font-bold text-xl mt-4">Tổng tiền: {totalCost.toLocaleString('vi-VN')} VNĐ</p>
                <p className="text-sm text-gray-500 mt-2">Quét mã để thanh toán (Nội dung: Mã hồ sơ)</p>
                <Link href="/" className="mt-8 inline-block text-blue-600 hover:underline">
                    Quay về trang chủ
                </Link>
            </div>
        );
    }

    // === Form đăng ký ===
    return (
        <div className="max-w-4xl mx-auto mt-10 bg-white p-8 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Đăng ký thẻ bạn đọc</h1>
                <Link href="/dang_ky_the" className="text-blue-600 hover:underline">&larr; Quay lại</Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Hàng 1: Loại thẻ */}
                <div>
                    <label htmlFor="loai_the" className="block text-sm font-medium">Loại thẻ *</label>
                    <select
                        id="loai_the"
                        onChange={(e) => setLoaiThe(e.target.value)}
                        value={loaiThe}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    >
                        {/* Cá nhân > 16 tuổi */}
                        <option>Thẻ Mượn (Cá nhân &gt; 16 tuổi)</option>
                        <option>Thẻ Đọc (Cá nhân &gt; 16 tuổi)</option>
                        <option>Thẻ Mượn (Thiếu nhi 7-15 tuổi)</option>
                        <option>Thẻ Đọc (Thiếu nhi 7-15 tuổi)</option>
                    </select>
                </div>

                {/* === BẮT ĐẦU CÁC TRƯỜNG MỚI === */}
                
                {/* Hàng 2: Họ tên, Giới tính */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="ho_ten" className="block text-sm font-medium">Họ và tên *</label>
                        <input type="text" id="ho_ten" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
                    </div>
                    <div>
                        <label htmlFor="gioi_tinh" className="block text-sm font-medium">Giới tính *</label>
                        <select id="gioi_tinh" className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
                            <option>Nam</option>
                            <option>Nữ</option>
                            <option>Khác</option>
                        </select>
                    </div>
                </div>

                {/* Hàng 3: Ngày sinh, CCCD */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="ngay_sinh" className="block text-sm font-medium">Ngày sinh *</label>
                        <input type="date" id="ngay_sinh" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
                    </div>
                    <div>
                        <label htmlFor="cccd" className="block text-sm font-medium">Số CMND/CCCD *</label>
                        <input type="text" id="cccd" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
                    </div>
                </div>

                {/* Hàng 4: Email, SĐT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium">Email *</label>
                        <input type="email" id="email" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
                    </div>
                    <div>
                        <label htmlFor="sdt" className="block text-sm font-medium">Số điện thoại *</label>
                        <input type="tel" id="sdt" className="mt-1 block w-full p-2 border border-gray-300 rounded-md" required />
                    </div>
                </div>

                {/* Hàng 5: Địa chỉ */}
                <div>
                    <label htmlFor="dia_chi" className="block text-sm font-medium">Địa chỉ *</label>
                    <input
                        type="text"
                        id="dia_chi"
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                        placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                        required
                    />
                </div>

                {/* Hàng 6: Tải ảnh (giữ nguyên) */}
                <div>
                    <label className="block text-sm font-medium">Ảnh chân dung (3x4 hoặc 2x3) *</label>
                    <div className="mt-1 p-4 bg-gray-50 border border-gray-200 rounded-md text-center">
                        <Image
                            src="https://via.placeholder.com/150x200"
                            alt="Ảnh thẻ mẫu"
                            width={150}
                            height={200}
                            className="rounded-md border mx-auto mb-4"
                        />
                        <button type="button" className="px-3 py-1 bg-blue-500 text-white text-sm rounded mr-2">Cập nhật ảnh</button>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium">Ảnh CMND/CCCD/Thẻ HSSV (2 mặt) *</label>
                    <div className="mt-1 p-4 bg-gray-50 border border-gray-200 rounded-md text-center">
                        <button type="button" className="px-3 py-1 bg-blue-500 text-white text-sm rounded">Tải lên ảnh 2 mặt</button>
                    </div>
                </div>

                {/* Hàng 7: Nội dung thanh toán (giữ nguyên) */}
                <div className="p-4 bg-gray-50 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-4">Nội dung thanh toán</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span>Phí làm thẻ ({loaiThe})</span>
                            <span>{FEES[loaiThe].toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="ship" className="flex items-center cursor-pointer">
                                <input type="checkbox" id="ship" checked={ship} onChange={(e) => setShip(e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                                <span className="ml-2">Giao hàng tận nơi (Nếu có)</span>
                            </label>
                            <span>{ship ? SHIPPING_FEE.toLocaleString('vi-VN') : '0'} VNĐ</span>
                        </div>
                    </div>
                    <hr className="my-4" />
                    <div className="flex justify-between text-xl font-bold">
                        <span>Tổng tiền:</span>
                        <span>{totalCost.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                </div>

                {/* Nút Submit */}
                <button
                    type="submit"
                    className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold text-lg"
                >
                    Đăng ký thẻ bạn đọc
                </button>
            </form>
        </div>
    );
}