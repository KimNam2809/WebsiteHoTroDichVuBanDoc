// src/components/CardStatusSection.js
// Xử lý logic hiển thị phức tạp (Popup, Link)
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faIdCard, faInfoCircle, faTimes } from '@fortawesome/free-solid-svg-icons';

export default function CardStatusSection({ profile }) {
    const [showPopup, setShowPopup] = useState(false);

    // Logic kiểm tra trạng thái
    const hasCard = profile.sothe && profile.sothe !== 'Chưa cấp';
    const latestReq = profile.yeu_cau_moi_nhat || {};

    // Trạng thái đang chờ duyệt
    const isPending = latestReq.trang_thai === 'choDuyet';

    // Trạng thái vừa được duyệt nhưng dữ liệu thẻ chưa kịp đồng bộ (Edge case)
    const isApprovedButNoCardYet = latestReq.trang_thai === 'daDuyet' && !hasCard;

    // === CASE 1: Đã duyệt nhưng dữ liệu thẻ chưa kịp cập nhật (Edge case) ===
    if (isApprovedButNoCardYet) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500 relative overflow-hidden">
                <h3 className="font-semibold text-gray-600">Thẻ thư viện</h3>
                <div className="mt-2">
                    <p className="text-green-600 font-bold text-lg">Đã được duyệt!</p>
                    <p className="text-sm text-gray-500">Hệ thống đang khởi tạo thẻ...</p>
                    <button onClick={() => window.location.reload()} className="text-xs text-blue-600 underline mt-1">
                        Tải lại trang
                    </button>
                </div>
                <FontAwesomeIcon icon={faIdCard} className="text-green-100 text-6xl absolute -bottom-4 -right-4" />
            </div>
        );
    }

    // === CASE 2: Chưa có thẻ nào & Đang chờ duyệt ===
    if (!hasCard && isPending) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500 relative overflow-hidden">
                <h3 className="font-semibold text-gray-600">Thẻ thư viện</h3>
                <div className="mt-2">
                    <p className="text-yellow-600 font-bold">Đang chờ duyệt</p>
                    <p className="text-xs text-gray-500 mt-1">Hồ sơ đăng ký {latestReq.loai_the_dang_ky} đang được xử lý.</p>
                </div>
                <FontAwesomeIcon icon={faIdCard} className="text-yellow-100 text-6xl absolute -bottom-4 -right-4" />
            </div>
        );
    }

    // === CASE 3: Chưa có thẻ & Chưa đăng ký ===
    if (!hasCard) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500 relative overflow-hidden">
                <h3 className="font-semibold text-gray-600">Thẻ thư viện</h3>
                <div className="mt-2">
                    <p className="text-gray-500 italic mb-2">Chưa có thẻ thành viên</p>
                    <Link href="/dang_ky_the" className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                        Đăng ký ngay
                    </Link>
                </div>
                <FontAwesomeIcon icon={faIdCard} className="text-blue-100 text-6xl absolute -bottom-4 -right-4" />
            </div>
        );
    }

    // === CASE 4: Đã có thẻ (Có thể đang có yêu cầu mới chờ duyệt) ===
    return (
        <>
            <p className="text-2xl font-bold text-blue-700">{profile.sothe}</p>
            <p className="text-sm text-gray-600 font-medium">{profile.tenthe}</p>

            <div className="mt-3 text-xs text-gray-500 space-y-1">
                <p>Trạng thái: <span className="text-green-600 font-semibold">{profile.trangthaithe}</span></p>

                {/* Link Popup nếu đang có yêu cầu mới */}
                {isPending && (
                    <button
                        onClick={() => setShowPopup(true)}
                        className="text-orange-600 hover:underline font-medium flex items-center gap-1 mt-2"
                    >
                        <FontAwesomeIcon icon={faInfoCircle} />
                        Đang có yêu cầu cấp mới...
                    </button>
                )}
            </div>

            {/* Popup Modal cho Case 4 */}
            {showPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-lg font-bold text-gray-800">Trạng thái yêu cầu</h3>
                            <button onClick={() => setShowPopup(false)} className="text-gray-400 hover:text-gray-600">
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                                <p className="font-semibold text-yellow-800">Đang chờ duyệt</p>
                                <p className="text-sm text-gray-600">Bạn đã gửi yêu cầu cấp thẻ mới.</p>
                            </div>
                            <p><strong>Loại thẻ đăng ký:</strong> {latestReq.loai_the_dang_ky}</p>
                            <p><strong>Mã hồ sơ:</strong> #{latestReq.ma_yeu_cau}</p>
                            <p className="text-sm text-gray-500 mt-4">
                                Vui lòng chờ nhân viên xét duyệt. Trong thời gian này, bạn vẫn có thể sử dụng thẻ cũ (nếu còn hạn).
                            </p>
                        </div>
                        <div className="mt-6 text-right">
                            <button onClick={() => setShowPopup(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded text-sm font-medium">
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}