// src/app/tim_kiem/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Filter, BookOpen, ChevronLeft, ChevronRight, Book, Calendar, User } from 'lucide-react';
import { searchBooksAction, getAllDanhMucAction } from './actions';

export default function CatalogPage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Params & State
    const currentQ = searchParams.get('q') || '';
    const currentCat = searchParams.get('category') || '';
    const currentPage = Number(searchParams.get('page')) || 1;
    const pageSize = 8;

    const [categories, setCategories] = useState([]);
    const [books, setBooks] = useState([]);
    const [totalBooks, setTotalBooks] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

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

    const totalPages = Math.ceil(totalBooks / pageSize);

    // Render Pagination
    const renderPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={`w-10 h-10 rounded-lg text-sm font-bold transition-all ${
                        currentPage === i
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    {i}
                </button>
            );
        }
        return pages;
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* 1. HERO HEADER */}
            <div className="relative bg-linear-to-r from-blue-900 to-indigo-900 h-64 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="relative z-10 text-center px-4">
                    <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">Kho Tàng Tri Thức</h1>
                    <p className="text-blue-200 text-lg max-w-2xl mx-auto">Tra cứu hàng ngàn đầu sách, tài liệu nghiên cứu và tạp chí khoa học.</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20">

                {/* 2. SEARCH BAR (Glassmorphism) */}
                <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 flex flex-col md:flex-row gap-4 items-center animate-in">
                    <div className="flex-1 w-full relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                        <input
                            type="text"
                            value={inputSearch}
                            onChange={(e) => setInputSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            placeholder="Nhập tên sách, tác giả, ISBN..."
                            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div className="w-full md:w-64 relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <select
                            value={inputCat}
                            onChange={(e) => setInputCat(e.target.value)}
                            className="w-full pl-12 pr-10 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                        >
                            <option value="">Tất cả danh mục</option>
                            {categories.map((cat) => (
                                <option key={cat.madanhmuc} value={cat.madanhmuc}>{cat.tendanhmuc}</option>
                            ))}
                        </select>
                        {/* Custom Arrow */}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ChevronLeft className="-rotate-90 text-gray-400 w-4 h-4" />
                        </div>
                    </div>

                    <button
                        onClick={handleSearch}
                        className="w-full md:w-auto px-8 py-3.5 bg-linear-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <Search size={20} /> Tìm kiếm
                    </button>
                </div>

                {/* 3. BOOK GRID */}
                <div className="mt-12">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <BookOpen className="text-blue-600"/> Kết quả tìm kiếm
                        </h2>
                        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            {totalBooks} tài liệu
                        </span>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-pulse">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-80 bg-gray-200 rounded-2xl"></div>
                            ))}
                        </div>
                    ) : books.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                            <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4 text-gray-400">
                                <Search size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-700">Không tìm thấy kết quả</h3>
                            <p className="text-gray-500 mt-2">Hãy thử từ khóa khác hoặc chọn danh mục rộng hơn.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {books.map((work) => (
                                <Link
                                    key={work.matacpham}
                                    href={`/tai_lieu/${work.matacpham}`}
                                    className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 transition-all duration-300 hover:-translate-y-2 flex flex-col h-full"
                                >
                                    {/* Image Wrapper */}
                                    <div className="relative aspect-3/4 overflow-hidden bg-gray-100">
                                        {work.anhbia ? (
                                            <Image
                                                src={work.anhbia}
                                                alt={work.tentacpham}
                                                fill
                                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                                                <Book size={48} strokeWidth={1} />
                                                <span className="text-xs mt-2 font-medium uppercase tracking-wider">No Cover</span>
                                            </div>
                                        )}
                                        {/* Overlay Gradient on Hover */}
                                        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="mb-2">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                                                {work.namxuatban || 'N/A'}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 leading-tight mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors" title={work.tentacpham}>
                                            {work.tentacpham}
                                        </h3>
                                        <p className="text-sm text-gray-500 font-medium mb-4 flex items-center gap-1">
                                            <User size={14}/> {work.tacgia}
                                        </p>

                                        <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                                            <span className="text-xs font-semibold text-gray-400">Xem chi tiết</span>
                                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <ChevronRight size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* 4. PAGINATION */}
                    {!isLoading && totalPages > 1 && (
                        <div className="flex justify-center items-center mt-16 gap-3">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage <= 1}
                                className="w-10 h-10 flex items-center justify-center rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>

                            {renderPageNumbers()}

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage >= totalPages}
                                className="w-10 h-10 flex items-center justify-center rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}