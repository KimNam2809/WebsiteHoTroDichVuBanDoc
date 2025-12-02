// src/app/dang_ky_the/tra_cuu/page.js
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
// import { useActionState } from 'react'; // (Nếu dùng Next 15 hook)
import { lookupCardRequestAction } from '../actions';
import { Loader2, Search, ArrowLeft, CreditCard, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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

    const renderStatusBadge = (status) => {
        switch (status) {
            case 'THE_DANG_HOAT_DONG':
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1"><CheckCircle size={12}/> ĐANG HOẠT ĐỘNG</span>;
            case 'daDuyet':
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200 flex items-center gap-1"><CheckCircle size={12}/> Đã duyệt</span>;
            case 'choDuyet':
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 border border-yellow-200 flex items-center gap-1"><Clock size={12}/> Đang chờ duyệt</span>;
            case 'tuChoi':
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 flex items-center gap-1"><XCircle size={12}/> Bị từ chối</span>;
            default:
                return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{status}</span>;
        }
    };

    return (
        <div className="max-w-3xl mx-auto mt-10 bg-white p-8 rounded-lg shadow-lg mb-10">

            <div className="flex justify-between items-center mb-8 border-b pb-4">
                <h1 className="text-2xl font-bold text-gray-800">Tra cứu thông tin thẻ</h1>
                <Link href="/dang_ky_the" className="text-gray-500 hover:text-blue-600 flex items-center text-sm font-medium">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại
                </Link>
            </div>

            <form action={handleSubmit} className="space-y-6 p-8 bg-blue-50 rounded-xl border border-blue-100">
                <div className="text-center mb-4">
                    <p className="text-gray-600">Nhập số <strong>CCCD</strong> hoặc <strong>Số điện thoại</strong> đã đăng ký để kiểm tra tình trạng hồ sơ.</p>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        name="keyword"
                        className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg shadow-sm" 
                        placeholder="Ví dụ: 048203001234 hoặc 0905123456"
                        required
                        minLength={6}
                    />
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <Search size={24} />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold flex items-center justify-center transition-colors disabled:bg-blue-400 text-lg shadow-md"
                >
                    {isLoading ? <Loader2 className="animate-spin mr-2"/> : null}
                    {isLoading ? 'Đang tìm kiếm...' : 'Tra cứu ngay'}
                </button>
            </form>

            {/* Hiển thị kết quả */}
            <div className="mt-8 space-y-6">
                {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 text-center flex items-center justify-center gap-2 animate-fade-in">
                        <AlertCircle size={20}/> {error}
                    </div>
                )}

                {results && results.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                        Không tìm thấy dữ liệu nào phù hợp.
                    </div>
                )}

                {results && results.length > 0 && (
                    <>
                        <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Kết quả tìm thấy ({results.length})</h2>

                        <div className="space-y-4">
                            {results.map((item, index) => {
                                const isOfficialCard = item.trang_thai === 'THE_DANG_HOAT_DONG';

                                return (
                                    <div
                                        key={index}
                                        className={`flex flex-col sm:flex-row gap-4 p-5 border rounded-xl shadow-sm transition-shadow hover:shadow-md relative overflow-hidden animate-fade-in
                                            ${isOfficialCard ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}
                                        `}
                                    >
                                        {isOfficialCard && <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>}

                                        <div className="w-24 h-24 relative shrink-0 bg-white rounded-lg overflow-hidden border mx-auto sm:mx-0 flex items-center justify-center">
                                            {item.anh_the_url ? (
                                                <Image src={item.anh_the_url} alt="Ảnh thẻ" fill className="object-cover" unoptimized />
                                            ) : (
                                                isOfficialCard
                                                    ? <CreditCard className="w-10 h-10 text-blue-400" />
                                                    : <div className="text-xs text-gray-400 text-center p-2">Hồ sơ<br/>đăng ký</div>
                                            )}
                                        </div>

                                        <div className="flex-1 space-y-2 text-center sm:text-left">
                                            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                                                <div>
                                                    <h3 className={`text-lg font-bold ${isOfficialCard ? 'text-blue-800' : 'text-gray-800'}`}>
                                                        {item.ho_ten}
                                                    </h3>
                                                    <p className="text-sm text-gray-500">CCCD: {item.cccd || '---'}</p>
                                                </div>
                                                {renderStatusBadge(item.trang_thai)}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm mt-2">
                                                {isOfficialCard ? (
                                                    <div className="col-span-2 bg-white p-2 rounded border border-blue-100 mt-2">
                                                        <p className="text-xs text-gray-500 uppercase">Số thẻ thư viện</p>
                                                        <p className="text-xl font-mono font-bold text-blue-600 tracking-wide">{item.sothe}</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <p className="text-gray-600">Mã hồ sơ: <span className="font-mono font-semibold">#{item.ma_yeu_cau}</span></p>
                                                        <p className="text-gray-600">Ngày nộp: {item.ngay_dang_ky ? new Date(item.ngay_dang_ky).toLocaleDateString('vi-VN') : '---'}</p>
                                                    </>
                                                )}

                                                <div className="col-span-2 pt-1">
                                                    <p className="text-gray-600">Loại thẻ: <span className="font-medium text-purple-700">{item.ten_loai_the}</span></p>
                                                </div>
                                            </div>

                                            {item.trang_thai === 'tuChoi' && (
                                                <div className="mt-2 p-2 bg-red-50 text-red-600 text-sm rounded border border-red-100 flex items-start gap-2">
                                                    <AlertCircle size={16} className="mt-0.5 shrink-0"/>
                                                    <span><strong>Lý do từ chối:</strong> {item.ly_do_tu_choi || "Thông tin chưa hợp lệ."}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}