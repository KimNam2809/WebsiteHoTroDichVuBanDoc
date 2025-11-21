// src/app/admin/quan_ly_dat_cho/page.js
'use client'; // Cần 'use client' để tạo tab

import { useState } from 'react';
import { MapPin, Presentation } from 'lucide-react';

export default function QLDatChoPage() {
    const [view, setView] = useState('seat'); // 'seat' hoặc 'room'

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Quản lý đặt chỗ ngồi & Phòng</h1>

            {/* Thanh chuyển tab */}
            <div className="flex border-b border-gray-300 mb-6">
                <button
                    className={`py-2 px-6 ${view === 'seat' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-500'}`}
                    onClick={() => setView('seat')}
                >
                    Quản lý Chỗ Ngồi
                </button>
                <button
                    className={`py-2 px-6 ${view === 'room' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-500'}`}
                    onClick={() => setView('room')}
                >
                    Quản lý Phòng
                </button>
            </div>

            {/* Nội dung tương ứng */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                {view === 'seat' ? (
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Danh sách check-in chỗ ngồi hôm nay</h2>
                        <p>(Nơi nhân viên quét mã QR hoặc xem danh sách đặt chỗ ngồi...)</p>
                    </div>
                ) : (
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Danh sách đăng ký phòng hôm nay</h2>
                        <p>(Nơi nhân viên xem lịch đặt phòng và xác nhận...)</p>
                    </div>
                )}
            </div>
        </div>
    );
}