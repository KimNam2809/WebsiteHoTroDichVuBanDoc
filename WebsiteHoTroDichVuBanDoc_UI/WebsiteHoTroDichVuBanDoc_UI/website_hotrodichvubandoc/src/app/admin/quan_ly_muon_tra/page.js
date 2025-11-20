// src/app/admin/quan_ly_muon_tra/page.js
'use client'; // Cần 'use client' để tạo tab

import { useState } from 'react';
import { QrCode, BookUp, BookDown } from 'lucide-react';

// === Component giả lập "Camera quét mã QR" ===
const QRScannerPlaceholder = ({ actionText }) => (
    <div className="w-full max-w-sm mx-auto">
        {/* Hộp video giả lập */}
        <div className="w-full aspect-square bg-gray-900 rounded-lg flex items-center justify-center">
            <QrCode className="w-24 h-24 text-gray-600" />
        </div>
        <p className="text-center text-gray-600 mt-4">
            Hướng camera vào mã QR của bạn đọc để {actionText}.
        </p>
        {/* Sau này, đây sẽ là nơi tích hợp thư viện quét mã QR như 'react-qr-reader' */}
        <input
            type="text"
            placeholder="Hoặc nhập mã thủ công..."
            className="mt-4 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
        />
    </div>
);

// === Component chính của trang ===
export default function QLMuonTraPage() {
    const [view, setView] = useState('muon'); // 'muon' hoặc 'tra'

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Quản lý Mượn/Trả sách</h1>

            {/* Thanh chuyển tab */}
            <div className="flex border-b border-gray-300 mb-6">
                <button
                    className={`flex items-center space-x-2 py-3 px-6 text-lg
                        ${view === 'muon'
                            ? 'border-b-2 border-blue-600 font-semibold text-blue-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setView('muon')}
                >
                    <BookDown className="w-5 h-5" />
                    <span>Xác nhận MƯỢN sách</span>
                </button>
                <button
                    className={`flex items-center space-x-2 py-3 px-6 text-lg
                        ${view === 'tra'
                            ? 'border-b-2 border-green-600 font-semibold text-green-600'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setView('tra')}
                >
                    <BookUp className="w-5 h-5" />
                    <span>Xác nhận TRẢ sách</span>
                </button>
            </div>

            {/* Nội dung tương ứng */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                {view === 'muon' ? (
                    <QRScannerPlaceholder actionText="xác nhận MƯỢN" />
                ) : (
                    <QRScannerPlaceholder actionText="xác nhận TRẢ" />
                )}
            </div>
        </div>
    );
}