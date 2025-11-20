'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Dùng Image của Next.js

// Dữ liệu giả lập
const mockCardData = [
    { id: 1, hoTen: 'Lê Kim Nam', cccd: '048203004295', sdt: '0367814254', loaiThe: 'Thẻ mượn', ngayDangKy: '15/05/2025', trangThai: 'Đã duyệt' },
];

export default function TraCuuPage() {
    const [results, setResults] = useState([]);
    const [searched, setSearched] = useState(false);

    const handleSearch = (e) => {
        e.preventDefault();
        setSearched(true);
        // Logic tìm kiếm thật sẽ ở đây
        // Giả lập tìm thấy kết quả:
        setResults(mockCardData);
    };

    return (
        <div className="max-w-4xl mx-auto mt-10 bg-white p-8 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Tra cứu thông tin thẻ</h1>
                <Link href="/dang_ky_the" className="text-blue-600 hover:underline">&larr; Quay lại</Link>
            </div>

            <form onSubmit={handleSearch} className="space-y-4 p-6 bg-gray-50 rounded-lg border mb-8">
                <div>
                    <label htmlFor="cccd" className="block text-sm font-medium text-gray-700">Số CCCD/Hộ chiếu</label>
                    <input type="text" id="cccd" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Số điện thoại</label>
                    <input type="tel" id="phone" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" required />
                </div>
                <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold">
                    Tra cứu thông tin
                </button>
            </form>

            {/* Hiển thị kết quả */}
            {searched && results.length === 0 && (
                <p className="text-center text-red-600">Không tìm thấy thông tin đăng ký phù hợp.</p>
            )}

            {results.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-semibold">Kết quả tra cứu</h2>
                    {results.map((card) => (
                        <div key={card.id} className="flex p-4 border rounded-lg shadow-sm bg-white">
                            <Image
                                src="https://via.placeholder.com/100x133" // Ảnh thẻ 3x4 giả
                                alt="Ảnh thẻ"
                                width={100}
                                height={133}
                                className="rounded-md border"
                            />
                            <div className="ml-4">
                                <h3 className="text-xl font-bold text-blue-700">{card.hoTen}</h3>
                                <p><strong>Mã đồng bộ:</strong> {card.cccd}</p>
                                <p><strong>Loại thẻ:</strong> {card.loaiThe}</p>
                                <p><strong>Ngày đăng ký:</strong> {card.ngayDangKy}</p>
                                <span className="mt-2 inline-block px-3 py-1 text-sm font-semibold bg-green-100 text-green-800 rounded-full">
                                    {card.trangThai}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}