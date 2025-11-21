'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { searchBooksAction, getAllDanhMucAction } from './actions';

export default function CatalogPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // === State ===
    const [categories, setCategories] = useState([]);
    const [books, setBooks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Lấy giá trị từ URL hoặc mặc định
    const currentQ = searchParams.get('q') || '';
    const currentCat = searchParams.get('category') || '';
    const currentPage = Number(searchParams.get('page')) || 1;
    const pageSize = 8;

    // State tạm cho input (để người dùng gõ thoải mái trước khi nhấn Enter)
    const [inputSearch, setInputSearch] = useState(currentQ);
    const [inputCat, setInputCat] = useState(currentCat);

    // === 1. Tải danh mục (Chạy 1 lần) ===
    useEffect(() => {
        async function fetchCats() {
            const res = await getAllDanhMucAction();
            if (res.data) setCategories(res.data);
        }
        fetchCats();
    }, []);

    // === 2. Gọi API Tìm kiếm (Chạy mỗi khi URL thay đổi) ===
    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            // Gọi Server Action mới
            const res = await searchBooksAction({
                q: currentQ,
                danh_muc_id: currentCat, // API của bạn cần ID
                page: currentPage,
                limit: pageSize
            });

            if (res.data) {
                setBooks(res.data);
            } else {
                setBooks([]);
            }
            setIsLoading(false);
        }

        fetchData();
    }, [currentQ, currentCat, currentPage]); // Dependency array: chạy lại khi các biến này đổi

    // === 3. Xử lý thay đổi URL (Điều hướng) ===
    const handleSearch = () => {
        const params = new URLSearchParams();
        if (inputSearch) params.set('q', inputSearch);
        if (inputCat) params.set('category', inputCat);
        params.set('page', '1'); // Reset về trang 1 khi tìm mới
        router.push(`/tim_kiem?${params.toString()}`);
    };

    const handlePageChange = (newPage) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', newPage);
        router.push(`/tim_kiem?${params.toString()}`);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-white shadow-lg grow w-full">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Danh mục sách</h1>

            {/* Bộ lọc */}
            <div className="bg-white p-6 rounded-lg shadow-lg mb-8 border border-gray-200">
                <div className="grid md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                        <input
                            type="text"
                            value={inputSearch}
                            onChange={(e) => setInputSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Tìm kiếm theo tên tác phẩm, tác giả..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                    <select
                        value={inputCat}
                        onChange={(e) => setInputCat(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="">Tất cả danh mục</option>
                        {categories.map((cat) => (
                            <option key={cat.madanhmuc} value={cat.madanhmuc}>
                                {cat.tendanhmuc}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleSearch}
                        className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center"
                    >
                        <FontAwesomeIcon icon={faSearch} className="mr-2" />
                        Tìm kiếm
                    </button>
                </div>
            </div>

            {/* Kết quả */}
            <div id="bookGrid" className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

                {isLoading && <p className="col-span-full text-center text-gray-500">Đang tải dữ liệu...</p>}

                {!isLoading && books.length === 0 && (
                    <p className="col-span-full text-center text-gray-500 py-10">
                        Không tìm thấy tài liệu nào phù hợp.
                    </p>
                )}

                {!isLoading && books.map((work) => (
                <div key={work.matacpham} className="bg-white p-4 rounded-lg shadow-md border border-gray-100 card-hover flex flex-col">
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-800 line-clamp-2" title={work.tentacpham}>
                            {work.tentacpham}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{work.tacgia}</p>
                        <div className="mt-2 text-xs text-gray-500 flex flex-col gap-1">
                            <span>Năm XB: {work.namxuatban}</span>
                            <span>ISBN: {work.isbn}</span>
                        </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100">
                        <Link
                            href={`/tai_lieu/${work.matacpham}`}
                            className="block w-full text-center px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 font-medium transition-colors"
                        >
                            Xem chi tiết
                        </Link>
                    </div>
                </div>
                ))}
            </div>

            {/* Phân trang đơn giản */}
            <div className="flex justify-center mt-10 gap-4">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                    <FontAwesomeIcon icon={faArrowLeft} className="mr-2" /> Trước
                </button>
                <span className="px-4 py-2 bg-gray-100 rounded-lg font-medium">
                    Trang {currentPage}
                </span>
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    // Logic disable: Nếu số lượng sách trả về ít hơn pageSize, tức là hết trang
                    disabled={books.length < pageSize}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                    Sau <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                </button>
            </div>
        </div>
    );
}