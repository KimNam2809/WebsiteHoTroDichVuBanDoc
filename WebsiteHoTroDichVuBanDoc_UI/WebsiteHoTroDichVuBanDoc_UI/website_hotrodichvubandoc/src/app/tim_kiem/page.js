// src/app/tim_kiem/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faArrowLeft, faArrowRight, faBook } from '@fortawesome/free-solid-svg-icons';
import { searchBooksAction, getAllDanhMucAction } from './actions';

export default function CatalogPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Lấy params từ URL
    const currentQ = searchParams.get('q') || '';
    const currentCat = searchParams.get('category') || '';
    const currentPage = Number(searchParams.get('page')) || 1;
    const pageSize = 8; // Khớp với limit của API

    // State
    const [categories, setCategories] = useState([]);
    const [books, setBooks] = useState([]);
    const [totalBooks, setTotalBooks] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // State input tạm
    const [inputSearch, setInputSearch] = useState(currentQ);
    const [inputCat, setInputCat] = useState(currentCat);

    // 1. Load danh mục
    useEffect(() => {
        async function fetchCats() {
            const res = await getAllDanhMucAction();
            if (res.data) setCategories(res.data);
        }
        fetchCats();
    }, []);

    // 2. Gọi API Tìm kiếm
    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            const res = await searchBooksAction({
                q: currentQ,
                danh_muc_id: currentCat,
                page: currentPage,
                limit: pageSize
            });

            if (res.data) {
                setBooks(res.data);
                setTotalBooks(res.total || 0);
            } else {
                setBooks([]);
                setTotalBooks(0);
            }

            setIsLoading(false);
        }
        fetchData();
    }, [currentQ, currentCat, currentPage]);

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (inputSearch) params.set('q', inputSearch);
        if (inputCat) params.set('category', inputCat);
        params.set('page', '1');
        router.push(`/tim_kiem?${params.toString()}`);
    };

    const handlePageChange = (newPage) => {
        const params = new URLSearchParams(searchParams);
        if (currentQ) params.set('q', currentQ);
        if (currentCat) params.set('category', currentCat);
        params.set('page', newPage);
        router.push(`/tim_kiem?${params.toString()}`);
    };

    // Tính toán số trang dựa trên total trả về từ API
    const totalPages = Math.ceil(totalBooks / pageSize);

    // Render dãy số trang (1, 2, 3...)
    const renderPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            pages.push(<button key={1} onClick={() => handlePageChange(1)} className="px-3 py-2 border rounded hover:bg-gray-50">1</button>);
            if (startPage > 2) pages.push(<span key="dots1" className="px-2">...</span>);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`px-3 py-2 border rounded transition-colors ${
                        currentPage === i ? 'bg-purple-600 text-white border-purple-600' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                >
                    {i}
                </button>
            );
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) pages.push(<span key="dots2" className="px-2">...</span>);
            pages.push(<button key={totalPages} onClick={() => handlePageChange(totalPages)} className="px-3 py-2 border rounded hover:bg-gray-50">{totalPages}</button>);
        }
        return pages;
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
                            placeholder="Nhập tên sách, tác giả..."
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
                        <option key={cat.madanhmuc} value={cat.madanhmuc}>{cat.tendanhmuc}</option>
                    ))}
                </select>
                <button
                    onClick={handleSearch}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 flex items-center justify-center"
                >
                    <FontAwesomeIcon icon={faSearch} className="mr-2" /> Tìm kiếm
                </button>
                </div>
            </div>

            {/* Kết quả Tìm kiếm */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isLoading && <p className="col-span-full text-center py-10 text-gray-500">Đang tải dữ liệu...</p>}

                {!isLoading && books.length === 0 && (
                    <p className="col-span-full text-center py-10 text-gray-500">Không tìm thấy tài liệu nào.</p>
                )}

                {!isLoading && books.map((work) => (
                    <div key={work.matacpham} className="bg-white p-4 rounded-lg shadow-md border border-gray-100 card-hover flex flex-col h-full">
                        {/* Vì API tìm kiếm chưa trả về ảnh bìa, ta dùng ảnh placeholder hoặc icon sách */}
                        <div className="relative w-full aspect-2/3 bg-gray-100 rounded-md mb-4 overflow-hidden shadow-sm">
                            {work.anhbia ? (
                                // Dùng Next.js Image để tối ưu
                                <Image
                                    src={work.anhbia}
                                    alt={work.tentacpham}
                                    fill
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                    className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                                />
                            ) : (
                                // Fallback nếu không có ảnh: Hiện icon sách
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                    <FontAwesomeIcon icon={faBook} className="text-5xl" />
                                </div>
                            )}
                        </div>

                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-800 line-clamp-2 mb-1" title={work.tentacpham}>
                                {work.tentacpham}
                            </h3>
                            <p className="text-sm text-purple-600 font-medium mb-2">{work.tacgia}</p>

                            <div className="text-xs text-gray-500 space-y-1">
                                <p>Năm XB: {work.namxuatban}</p>
                                <p>ISBN: {work.isbn}</p>
                            </div>

                            <p className="text-xs text-gray-500 mt-2 line-clamp-2 italic">
                                {work.mota}
                            </p>
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

            {/* Phân trang */}
            {!isLoading && totalPages > 1 && (
                <div className="flex justify-center items-center mt-10 gap-2">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                    </button>

                    {renderPageNumbers()}

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="px-3 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600"
                    >
                        <FontAwesomeIcon icon={faArrowRight} />
                    </button>
                </div>
            )}
        </div>
    );
}