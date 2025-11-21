'use client'; // Dùng 'use client' vì người dùng sẽ gõ vào input nên nó sẽ là Client Component

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Chấp nhận 1 prop tên là initialQuery để có thể đặt giá trị ban đầu cho thanh tìm kiếm nếu cần
// Mặc định là chuỗi rỗng
export default function SearchBar({ initialQuery = '' }) {
    // Dùng prop initialQuery làm giá trị ban đầu cho state
    const [searchTerm, setSearchTerm] = useState(initialQuery);
    const router = useRouter(); // Sử dụng hook useRouter để điều hướng

    const handleSearch = (e) => {
        e.preventDefault(); // Ngăn trang web tải lại khi nhấn nút
        // Điều hướng người dùng đến trang kết quả tìm kiếm với từ khóa
        router.push(`tim_kiem?q=${searchTerm}`);
    };

    return (
        <form onSubmit={handleSearch} className="flex w-full max-w-2xl mx-auto">
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm sách, tài liệu, bài báo..."
                className="grow p-3 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
            >
                Tìm
            </button>
        </form>
    );
}