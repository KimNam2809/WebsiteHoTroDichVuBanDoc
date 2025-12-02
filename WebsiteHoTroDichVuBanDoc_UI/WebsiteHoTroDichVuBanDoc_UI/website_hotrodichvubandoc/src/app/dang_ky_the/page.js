// src/app/dang_ky_the/page.js
import Link from 'next/link';
import { BookOpen, User, Gift, Shield, CheckCircle } from 'lucide-react';
import { getCardTypesAction } from './actions'; // Import action lấy thẻ

// Hàm helper để chọn icon dựa trên tên thẻ (để giao diện đẹp hơn)
const getIconForCard = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('thiếu nhi')) return Gift;
    if (lowerName.includes('shub') || lowerName.includes('nghiên cứu')) return Shield;
    if (lowerName.includes('đọc')) return BookOpen;
    return User; // Mặc định
};

export default async function DangKyTheLandingPage() {
    // 1. Lấy dữ liệu thật từ Database
    const cardTypes = await getCardTypesAction();

    const steps = [
        { number: 1, title: 'Điền thông tin', description: 'Hoàn thành form đăng ký với đầy đủ thông tin cá nhân' },
        { number: 2, title: 'Upload ảnh', description: 'Tải lên ảnh chân dung theo đúng quy cách' },
        { number: 3, title: 'Thanh toán', description: 'Thanh toán phí làm thẻ qua QR code hoặc khi nhận thẻ' },
        { number: 4, title: 'Nhận thẻ', description: 'Nhận thẻ tại thư viện hoặc giao hàng tận nơi' },
    ];

    return (
        <div className="max-w-5xl mx-auto mt-10 bg-white p-8 rounded-lg shadow-lg mb-10">
            {/* 1. Header */}
            <div className="text-center p-10 bg-linear-to-r from-blue-600 to-indigo-700 rounded-lg shadow-inner mb-12">
                <h1 className="text-4xl font-bold text-white">Đăng ký thẻ bạn đọc</h1>
                <p className="text-lg text-blue-100 mt-2">Thư viện Thành phố Đà Nẵng</p>
            </div>

            {/* 2. Quy trình */}
            <h2 className="text-2xl font-semibold text-center mb-8 text-gray-800">Quy trình đăng ký thẻ bạn đọc</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                {steps.map((step) => (
                    <div key={step.number} className="flex flex-col items-center text-center group">
                        <div className="flex items-center justify-center w-14 h-14 bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors rounded-full font-bold text-xl mb-3 shadow-sm">
                            {step.number}
                        </div>
                        <h3 className="font-bold text-gray-800 mb-1">{step.title}</h3>
                        <p className="text-sm text-gray-500 px-2">{step.description}</p>
                    </div>
                ))}
            </div>

            {/* 3. Các loại thẻ (DỮ LIỆU THẬT TỪ DB) */}
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-100 mb-10">
                <h2 className="text-2xl font-semibold text-center mb-8 text-gray-800">Các loại thẻ bạn đọc</h2>

                {cardTypes && cardTypes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {cardTypes.map((card) => {
                            const Icon = getIconForCard(card.tenthe);
                            const isFree = card.lephi === 0;

                            return (
                                <div key={card.maloaithe} className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex items-start space-x-4">
                                    <div className={`p-3 rounded-lg ${isFree ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-lg font-bold text-gray-800">{card.tenthe}</h3>
                                            {isFree ? (
                                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Miễn phí</span>
                                            ) : (
                                                <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
                                                    {card.lephi.toLocaleString('vi-VN')} đ
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1 mb-2">{card.mota}</p>

                                        {/* Thông tin bổ sung */}
                                        <div className="flex gap-3 text-xs text-gray-400">
                                            <span className="flex items-center gap-1"><BookOpen size={12}/> Max: {card.tailieumuontoida} tài liệu</span>
                                            <span className="flex items-center gap-1"><CheckCircle size={12}/> {card.songaymuonmacdinh} ngày</span>
                                        </div>
                                    </div>
                                </div>
                        );
                        })}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-10">Đang cập nhật danh sách thẻ...</div>
                )}
            </div>

            {/* 4. Nút hành động */}
            <div className="text-center">
                <Link
                    href="/dang_ky_the/form"
                    className="inline-block py-4 px-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
                >
                    Bắt đầu đăng ký ngay
                </Link>
                <div className="mt-8 flex justify-center gap-8 text-sm font-medium">
                    <Link href="/dang_ky_the/tra_cuu" className="text-gray-600 hover:text-blue-600 flex items-center gap-2">
                        <span>🔍</span> Tra cứu thông tin thẻ
                    </Link>
                    <Link href="/dang_ky_the/noi_quy" className="text-gray-600 hover:text-blue-600 flex items-center gap-2">
                        <span>📜</span> Xem nội quy làm thẻ
                    </Link>
                </div>
            </div>
        </div>
    );
}