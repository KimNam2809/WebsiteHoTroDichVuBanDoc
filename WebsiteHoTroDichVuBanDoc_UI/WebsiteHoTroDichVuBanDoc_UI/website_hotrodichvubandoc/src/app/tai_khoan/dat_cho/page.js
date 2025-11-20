// src/app/tai_khoan/dat_cho/page.js
'use client';

import { useState } from 'react';
import { MapPin, Presentation } from 'lucide-react';

// === Component hiển thị logic Đặt Chỗ Ngồi ===
const DatChoNgoi = () => {
    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4">Sơ đồ chỗ ngồi</h2>
            <p className="text-gray-600 mb-4">Chọn một chỗ ngồi còn trống trên sơ đồ để đặt.</p>
            {/* Ghi chú: Đây là nơi bạn sẽ tích hợp một thư viện
                hoặc component sơ đồ thư viện (map) trong tương lai.
            */}
            <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">[Sơ đồ chỗ ngồi thư viện sẽ được hiển thị ở đây]</p>
            </div>
        </div>
    );
};

// === Component hiển thị logic Đặt Phòng ===
const DatPhong = () => {
    // Dữ liệu giả lập
    const phongHop = [
        { id: 'P01', ten: 'Phòng họp nhóm 1', sucChua: 6, trangThai: 'Còn trống' },
        { id: 'P02', ten: 'Phòng họp nhóm 2', sucChua: 8, trangThai: 'Đã đặt' },
        { id: 'P03', ten: 'Phòng hội thảo mini', sucChua: 20, trangThai: 'Còn trống' },
    ];

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4">Danh sách phòng chức năng</h2>
            <div className="space-y-4">
                {phongHop.map((phong) => (
                    <div key={phong.id} className="p-4 bg-white rounded-lg shadow-sm border flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold">{phong.ten}</h3>
                            <p className="text-sm text-gray-600">Sức chứa: {phong.sucChua} người</p>
                        </div>
                        <button
                            disabled={phong.trangThai !== 'Còn trống'}
                            className={`px-4 py-2 rounded-md font-semibold
                                ${phong.trangThai === 'Còn trống'
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {phong.trangThai === 'Còn trống' ? 'Đặt phòng' : 'Đã đặt'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// === Component chính của trang ===
export default function DatChoPage() {
    const [view, setView] = useState('seat'); // 'seat' hoặc 'room'

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Đặt chỗ ngồi & Phòng</h1>
            {/* Thanh chuyển tab */}
            <div className="flex border-b border-gray-300 mb-6">
                <button
                    className={`flex items-center space-x-2 py-3 px-6 text-lg
                        ${view === 'seat'
                        ? 'border-b-2 border-blue-600 font-semibold text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setView('seat')}
                >
                    <MapPin className="w-5 h-5" />
                    <span>Đặt Chỗ Ngồi</span>
                </button>
                <button
                    className={`flex items-center space-x-2 py-3 px-6 text-lg
                        ${view === 'room'
                        ? 'border-b-2 border-blue-600 font-semibold text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                    onClick={() => setView('room')}
                >
                    <Presentation className="w-5 h-5" />
                    <span>Đặt Phòng</span>
                </button>
            </div>

            {/* Nội dung tương ứng */}
            <div>
                {view === 'seat' ? <DatChoNgoi /> : <DatPhong />}
            </div>
        </div>
    );
}