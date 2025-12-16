// src/app/dang_ky_the/page.js
import Link from 'next/link';
import { BookOpen, User, Gift, Shield, CheckCircle, ArrowRight, Search, FileText } from 'lucide-react';
import { getCardTypesAction } from './actions';

const getIconForCard = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('thiếu nhi')) return Gift;
    if (lowerName.includes('nghiên cứu')) return Shield;
    if (lowerName.includes('đọc')) return BookOpen;
    return User;
};

export default async function DangKyTheLandingPage() {
    const cardTypes = await getCardTypesAction();

    const steps = [
        { number: 1, title: 'Điền thông tin', description: 'Khai báo thông tin cá nhân trực tuyến' },
        { number: 2, title: 'Tải ảnh thẻ', description: 'Upload ảnh chân dung 3x4 rõ nét' },
        { number: 3, title: 'Thanh toán', description: 'Quét mã QR để đóng lệ phí làm thẻ' },
        { number: 4, title: 'Nhận thẻ', description: 'Nhận thẻ cứng tại thư viện hoặc qua bưu điện' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">

            {/* 1. HERO HEADER */}
            <div className="relative bg-linear-to-r from-blue-900 to-indigo-900 h-[350px] flex items-center justify-center overflow-hidden pb-10">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-10">
                    <span className="inline-block py-1 px-3 rounded-full bg-blue-500/20 border border-blue-400/30 text-cyan-300 text-xs font-bold uppercase tracking-wider mb-4 backdrop-blur-sm">
                        Thành viên Thư viện
                    </span>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight drop-shadow-lg">
                        Đăng Ký Thẻ Bạn Đọc
                    </h1>
                    <p className="text-blue-100 text-lg font-light max-w-2xl mx-auto">
                        Mở khóa kho tàng tri thức với hàng ngàn đầu sách và tiện ích số. Đăng ký nhanh chóng chỉ trong 5 phút.
                    </p>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">

                {/* 2. QUY TRÌNH (STEPS) */}
                <div className="bg-white rounded-3xl shadow-xl p-8 mb-12 border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-8 text-center uppercase tracking-wider">Quy trình thực hiện</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                        {/* Line connecting steps (Desktop only) */}
                        <div className="hidden md:block absolute top-7 left-0 w-full h-0.5 bg-gray-200 -z-10 transform scale-x-75"></div>

                        {steps.map((step) => (
                            <div key={step.number} className="flex flex-col items-center text-center group">
                                <div className="flex items-center justify-center w-14 h-14 bg-white border-2 border-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all rounded-full font-bold text-xl mb-4 shadow-sm z-10">
                                    {step.number}
                                </div>
                                <h3 className="font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">{step.title}</h3>
                                <p className="text-sm text-gray-500 px-2 leading-relaxed">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. DANH SÁCH THẺ */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">Lựa chọn loại thẻ phù hợp</h2>
                    {cardTypes && cardTypes.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {cardTypes.map((card) => {
                                const Icon = getIconForCard(card.tenthe);
                                const isFree = card.lephi === 0;

                                return (
                                    <div key={card.maloaithe} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative overflow-hidden group">
                                        <div className={`absolute top-0 right-0 w-24 h-24 rounded-bl-full opacity-10 transition-transform group-hover:scale-150 ${isFree ? 'bg-green-500' : 'bg-blue-500'}`}></div>

                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div className={`p-3 rounded-xl ${isFree ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                                <Icon size={24} />
                                            </div>
                                            {isFree ? (
                                                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase">Miễn phí</span>
                                            ) : (
                                                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                                                    {card.lephi.toLocaleString('vi-VN')} đ
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="text-lg font-bold text-gray-800 mb-2 relative z-10">{card.tenthe}</h3>
                                        <p className="text-sm text-gray-500 mb-6 flex-1 relative z-10 line-clamp-2">{card.mota}</p>

                                        <div className="flex items-center gap-4 text-xs text-gray-400 border-t border-gray-100 pt-4 relative z-10">
                                            <span className="flex items-center gap-1"><BookOpen size={14}/> Mượn tối đa: {card.tailieumuontoida} cuốn</span>
                                            <span className="flex items-center gap-1"><CheckCircle size={14}/> Hạn mượn: {card.songaymuonmacdinh} ngày</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500 bg-white rounded-2xl shadow-sm border border-dashed">Đang cập nhật danh sách thẻ...</div>
                    )}
                </div>

                {/* 4. CTA BUTTONS */}
                <div className="flex flex-col items-center gap-6">
                    <Link
                        href="/dang_ky_the/form"
                        className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-blue-600 font-lg rounded-full hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
                    >
                        <span className="mr-2 text-lg">Bắt đầu Đăng ký Ngay</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    <div className="flex gap-6 text-sm font-medium">
                        <Link href="/dang_ky_the/tra_cuu" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 hover:border-blue-200">
                            <Search size={16} /> Tra cứu hồ sơ
                        </Link>
                        <Link href="/dang_ky_the/noi_quy" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 hover:border-blue-200">
                            <FileText size={16} /> Xem quy định
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}