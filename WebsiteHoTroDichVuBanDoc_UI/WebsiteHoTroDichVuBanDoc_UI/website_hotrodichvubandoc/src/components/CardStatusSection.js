// src/components/CardStatusSection.js
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CreditCard, CheckCircle, Clock, Info, UserCheck, XCircle } from 'lucide-react';

export default function CardStatusSection({ profile, isStaff }) {
    const [showPopup, setShowPopup] = useState(false);

    // Xử lý dữ liệu
    const hasCard = profile.sothe && profile.sothe !== 'Chưa cấp';
    const latestReq = profile.yeu_cau_moi_nhat || {};
    const isPending = latestReq.trang_thai === 'choDuyet';
    const isApprovedButNoCardYet = latestReq.trang_thai === 'daDuyet' && !hasCard;

    // --- CASE 1: NHÂN VIÊN ---
    if (isStaff) {
        return (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><UserCheck size={20}/></div>
                        <h3 className="font-bold text-gray-700">Thông tin nhân viên</h3>
                    </div>
                    <div className="mt-4">
                        <p className="text-3xl font-extrabold text-blue-700">{profile.manhanviennoibo || 'NV---'}</p>
                        <p className="text-sm text-gray-500 font-medium mt-1">{profile.phongban}</p>
                    </div>
                </div>
            </div>
        );
    }

    // --- CASE 2: ĐÃ DUYỆT NHƯNG CHƯA CÓ THẺ ---
    if (isApprovedButNoCardYet) {
        return (
            <div className="bg-green-50 p-6 rounded-3xl border border-green-200 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="text-green-600" size={20}/>
                    <h3 className="font-bold text-green-800">Thẻ thư viện</h3>
                </div>
                <div className="mt-2">
                    <p className="text-xl font-bold text-green-700">Đã được duyệt!</p>
                    <p className="text-sm text-green-600 mt-1">Hệ thống đang khởi tạo...</p>
                    <button onClick={() => window.location.reload()} className="text-xs text-green-800 underline mt-2 font-medium">Tải lại trang</button>
                </div>
            </div>
        );
    }

    // --- CASE 3: CHƯA CÓ THẺ (ĐANG CHỜ DUYỆT) ---
    if (!hasCard && isPending) {
        return (
            <div className="bg-yellow-50 p-6 rounded-3xl border border-yellow-200 relative overflow-hidden">
                <div className="flex items-center gap-2 mb-2">
                    <Clock className="text-yellow-600" size={20}/>
                    <h3 className="font-bold text-yellow-800">Thẻ thư viện</h3>
                </div>
                <div className="mt-2">
                    <p className="text-xl font-bold text-yellow-700">Đang chờ duyệt</p>
                    <p className="text-sm text-yellow-600 mt-1">Hồ sơ đang được xử lý.</p>
                </div>
            </div>
        );
    }

    // --- CASE 4: CHƯA CÓ THẺ (CHƯA ĐĂNG KÝ) ---
    if (!hasCard) {
        return (
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-gray-100 text-gray-500 rounded-lg"><CreditCard size={20}/></div>
                        <h3 className="font-bold text-gray-700">Thẻ thư viện</h3>
                    </div>
                    <p className="text-gray-500 text-sm mt-2">Bạn chưa có thẻ thành viên.</p>
                </div>
                <Link href="/dang_ky_the" className="mt-4 w-full py-2 bg-blue-600 text-white text-center rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
                    Đăng ký ngay
                </Link>
            </div>
        );
    }

    // --- CASE 5: ĐÃ CÓ THẺ (NORMAL) ---
    return (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>

            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><CreditCard size={20}/></div>
                    <h3 className="font-bold text-gray-700">Thẻ thư viện</h3>
                </div>

                <div className="mt-4">
                    <p className="text-3xl font-extrabold text-blue-700 tracking-tight">{profile.sothe}</p>
                    <p className="text-sm text-gray-500 font-medium mt-1">{profile.tenthe}</p>

                    <div className="mt-4 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-md uppercase">
                            {profile.trangthaithe}
                        </span>
                    </div>

                    {isPending && (
                        <button onClick={() => setShowPopup(true)} className="text-orange-600 text-xs font-bold mt-3 flex items-center gap-1 hover:underline">
                            <Info size={12}/> Đang có yêu cầu mới...
                        </button>
                    )}
                </div>
            </div>

            {/* Popup Thông báo */}
            {showPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
                        <button onClick={() => setShowPopup(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><XCircle size={20}/></button>
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Trạng thái hồ sơ</h3>
                        <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 mb-4">
                            <p className="font-bold text-yellow-800">Đang chờ duyệt</p>
                            <p className="text-sm text-yellow-700 mt-1">Yêu cầu cấp thẻ mới đang được xử lý.</p>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Loại thẻ:</strong> {latestReq.loai_the_dang_ky}</p>
                            <p><strong>Mã hồ sơ:</strong> #{latestReq.ma_yeu_cau}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}