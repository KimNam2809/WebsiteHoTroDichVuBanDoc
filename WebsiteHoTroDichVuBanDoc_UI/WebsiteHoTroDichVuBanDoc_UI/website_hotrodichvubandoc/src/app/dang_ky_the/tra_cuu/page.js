// src/app/dang_ky_the/tra_cuu/page.js
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { lookupCardRequestAction } from '../actions';
import { Loader2, Search, ArrowLeft, CreditCard, Clock, CheckCircle, XCircle, AlertCircle, User } from 'lucide-react';

export default function TraCuuPage() {
    const [results, setResults] = useState(null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(formData) {
        setIsLoading(true);
        setResults(null);
        setError('');

        const res = await lookupCardRequestAction(formData);

        if (res.success) {
            setResults(res.data);
        } else {
            setError(res.error);
        }
        setIsLoading(false);
    }

    // Hàm render badge (như cũ)
    const renderStatusBadge = (status) => {
        switch (status) {
            case 'THE_DANG_HOAT_DONG':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200"><CheckCircle size={14} /> ĐANG HOẠT ĐỘNG</span>;
            case 'daDuyet':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200"><CheckCircle size={14} /> Đã duyệt</span>;
            case 'choDuyet':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200"><Clock size={14} /> Đang chờ duyệt</span>;
            case 'tuChoi':
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200"><XCircle size={14} /> Bị từ chối</span>;
            default:
                return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{status}</span>;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">

            {/* 1. HERO HEADER */}
            <div className="relative bg-linear-to-r from-blue-900 to-indigo-900 h-[300px] flex items-center justify-center overflow-hidden pb-10">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-8">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight drop-shadow-lg">
                        Tra Cứu Hồ Sơ
                    </h1>
                    <p className="text-blue-100 text-lg font-light max-w-2xl mx-auto">
                        Kiểm tra trạng thái thẻ và tiến độ xử lý hồ sơ của bạn.
                    </p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">

                {/* Nút Quay lại (Nổi bên trên Card) */}
                <div className="mb-4">
                    <Link href="/dang_ky_the" className="inline-flex items-center gap-2 text-white/80 hover:text-white font-medium transition-colors">
                        <ArrowLeft size={18}/> Quay lại đăng ký
                    </Link>
                </div>

                {/* 2. CARD TRA CỨU */}
                <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-8">
                    <form action={handleSubmit} className="relative space-y-6">
                        <div className="text-center">
                            <p className="text-gray-600">Nhập số <strong>CCCD</strong> hoặc <strong>Số điện thoại</strong> đã đăng ký.</p>
                        </div>

                        <div className="relative flex items-center">
                            <Search className="absolute left-4 text-gray-400 pointer-events-none" size={22} />
                            <input
                                type="text"
                                name="keyword"
                                className="w-full pl-12 pr-36 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg font-medium text-gray-800 placeholder-gray-400"
                                placeholder="Ví dụ: 0905123..."
                                required
                                minLength={6}
                            />
                            <div className="absolute right-2 top-2 bottom-2">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="h-full px-6 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-70 transition-all shadow-md flex items-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="animate-spin w-5 h-5"/> : 'Tìm kiếm'}
                                </button>
                            </div>
                        </div>
                    </form>

                    {/* 3. KẾT QUẢ */}
                    <div className="mt-8 space-y-4">
                        {error && (
                            <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center gap-3 animate-in fade-in">
                                <AlertCircle size={20} className="shrink-0"/> {error}
                            </div>
                        )}

                        {results && results.length === 0 && (
                            <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                Không tìm thấy dữ liệu nào phù hợp.
                            </div>
                        )}

                        {results && results.length > 0 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider ml-1 mb-2">Kết quả tìm thấy ({results.length})</h2>

                                {results.map((item, index) => {
                                    const isOfficial = item.trang_thai === 'THE_DANG_HOAT_DONG';

                                    return (
                                        <div key={index} className={`relative bg-white border rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all flex flex-col sm:flex-row gap-6 overflow-hidden ${isOfficial ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-200'}`}>

                                            {/* Dải màu trạng thái */}
                                            <div className={`absolute top-0 left-0 w-1.5 h-full ${isOfficial ? 'bg-blue-500' : (item.trang_thai === 'tuChoi' ? 'bg-red-500' : 'bg-yellow-400')}`}></div>

                                            {/* Ảnh thẻ */}
                                            <div className="w-24 h-32 bg-gray-100 rounded-xl overflow-hidden shrink-0 relative border border-gray-200 mx-auto sm:mx-0 shadow-inner">
                                                {item.anh_the_url ? (
                                                    <Image src={item.anh_the_url} alt="Ảnh thẻ" fill className="object-cover" unoptimized/>
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                                        <User size={32}/>
                                                        <span className="text-[10px] mt-1">No Img</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Thông tin chi tiết */}
                                            <div className="flex-1 space-y-3 text-center sm:text-left">
                                                <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-gray-900">{item.ho_ten}</h3>
                                                        <p className="text-sm text-gray-500 font-mono flex items-center gap-1 sm:justify-start justify-center">
                                                            <CreditCard size={14}/> CCCD: {item.cccd || '---'}
                                                        </p>
                                                    </div>
                                                    <div className="mx-auto sm:mx-0">{renderStatusBadge(item.trang_thai)}</div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm bg-gray-50 p-3 rounded-xl border border-gray-100 mt-2">
                                                    {isOfficial ? (
                                                        <div className="col-span-2 flex justify-between items-center">
                                                            <span className="text-gray-500">Số thẻ thư viện:</span>
                                                            <span className="text-lg font-mono font-bold text-blue-600 tracking-wide">{item.sothe}</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex justify-between sm:justify-start sm:gap-2">
                                                                <span className="text-gray-500">Mã hồ sơ:</span>
                                                                <span className="font-mono font-semibold text-gray-800">#{item.ma_yeu_cau}</span>
                                                            </div>
                                                            <div className="flex justify-between sm:justify-start sm:gap-2">
                                                                <span className="text-gray-500">Ngày nộp:</span>
                                                                <span className="font-medium text-gray-800">{item.ngay_dang_ky ? new Date(item.ngay_dang_ky).toLocaleDateString('vi-VN') : '---'}</span>
                                                            </div>
                                                        </>
                                                    )}
                                                    <div className="col-span-2 pt-2 border-t border-gray-200 mt-1 flex justify-between sm:justify-start sm:gap-2">
                                                        <span className="text-gray-500">Loại thẻ:</span>
                                                        <span className="font-bold text-purple-700">{item.ten_loai_the}</span>
                                                    </div>
                                                </div>

                                                {item.trang_thai === 'tuChoi' && (
                                                    <div className="mt-3 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100 flex items-start gap-2 text-left">
                                                        <AlertCircle size={18} className="mt-0.5 shrink-0"/>
                                                        <span><strong>Lý do từ chối:</strong> {item.ly_do_tu_choi || "Hồ sơ không đạt yêu cầu."}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}