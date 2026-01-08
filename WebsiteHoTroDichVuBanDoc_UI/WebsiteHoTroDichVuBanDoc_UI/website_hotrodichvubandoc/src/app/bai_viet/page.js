'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
    Search, Calendar, Eye, ArrowRight, BookOpen,
    Filter, Bell, Zap, Image as ImageIcon, Star
} from 'lucide-react';

const API_ROOT = 'http://127.0.0.1:8000';

const CATEGORIES = [
    { id: 'all',       dbValue: null,        label: 'Tất cả',    icon: <BookOpen size={18}/> },
    { id: 'tin-tuc',   dbValue: 'tin tức',   label: 'Tin tức',   icon: <BookOpen size={18}/> },
    { id: 'su-kien',   dbValue: 'sự kiện',   label: 'Sự kiện',   icon: <Calendar size={18}/> },
    { id: 'hoat-dong', dbValue: 'hoạt động', label: 'Hoạt động', icon: <Zap size={18}/> },
    { id: 'thong-bao', dbValue: 'thông báo', label: 'Thông báo', icon: <Bell size={18}/> },
    { id: 'noi-bat',   dbValue: 'nổi bật',   label: 'Nổi bật',   icon: <Star size={18}/> }
];

function NewsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname(); // Lấy đường dẫn hiện tại (/bai-viet)

    // --- STATE ---
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0
    });

    // Lấy params từ URL
    const currentCategorySlug = searchParams.get('category') || 'all';
    const currentSearch = searchParams.get('search') || '';

    // State local cho ô input tìm kiếm
    const [searchTerm, setSearchTerm] = useState(currentSearch);

    // --- FETCH DATA ---
    const fetchPosts = async (page = 1) => {
        setLoading(true);
        try {
            // Xây dựng URL gọi sang FastAPI
            const url = new URL(`${API_ROOT}/api/v1/bai-viet/`);

            url.searchParams.append('page', page);
            url.searchParams.append('limit', '15'); // 15 bài theo yêu cầu

            // LOGIC MAPPING: Chuyển 'tin-tuc' -> 'tin tức'
            if (currentCategorySlug !== 'all') {
                const selectedCat = CATEGORIES.find(c => c.id === currentCategorySlug);
                // Nếu tìm thấy mapping thì gửi tiếng Việt có dấu, không thì gửi nguyên gốc
                const valToSend = selectedCat ? selectedCat.dbValue : currentCategorySlug;

                if (valToSend) {
                    url.searchParams.append('category', valToSend);
                }
            }

            if (currentSearch) {
                url.searchParams.append('search', currentSearch);
            }

            console.log("Calling API:", url.toString()); // Debug xem URL đúng chưa

            const res = await fetch(url.toString());
            if (res.ok) {
                const json = await res.json();

                setPosts(json.data || []);

                if (json.meta) {
                    setPagination({
                        currentPage: json.meta.current_page,
                        totalPages: json.meta.total_pages,
                        totalItems: json.meta.total_items
                    });
                }
            } else {
                console.error("API Error:", res.status);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- EFFECT ---
    useEffect(() => {
        fetchPosts(1);
    }, [currentCategorySlug, currentSearch]);

    // --- HANDLERS ---

    const handleCategoryChange = (catId) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', '1');

        if (catId === 'all') params.delete('category');
        else params.set('category', catId);

        router.push(`${pathname}?${params.toString()}`);
    };

    // 🔴 FIX LỖI 3: Chặn reload trang khi submit form (POST 404)
    const handleSearchSubmit = (e) => {
        if (e) e.preventDefault(); // <--- Dòng này quan trọng nhất

        const params = new URLSearchParams(searchParams);
        params.set('page', '1');

        if (!searchTerm.trim()) params.delete('search');
        else params.set('search', searchTerm.trim());

        router.push(`${pathname}?${params.toString()}`);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchPosts(newPage);
            const gridElement = document.getElementById('news-grid');
            if (gridElement) gridElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="container mx-auto px-4 pb-20 -mt-10 relative z-10">

            {/* --- TOOLBAR --- */}
            <div className="bg-white p-4 md:p-6 rounded-3xl shadow-xl border border-gray-100 mb-10 flex flex-col md:flex-row gap-6 justify-between items-center">

                {/* Categories */}
                <div className="flex flex-wrap gap-2 justify-center md:justify-start w-full md:w-auto">
                    {CATEGORIES.map((cat) => {
                        const isActive = currentCategorySlug === cat.id;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => handleCategoryChange(cat.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all
                                    ${isActive
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105'
                                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-blue-600'
                                    }`}
                            >
                                {cat.icon}
                                {cat.label}
                            </button>
                        );
                    })}
                </div>

                {/* Search Bar (Có form chặn reload) */}
                <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80 group">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm kiếm..."
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all font-medium"
                    />
                    <button type="submit" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 hover:text-blue-600 cursor-pointer">
                        <Search size={20} />
                    </button>
                </form>
            </div>

            {/* --- NEWS GRID --- */}
            <div id="news-grid">
                {loading ? (
                    // LOADING SKELETON
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white rounded-3xl h-96 animate-pulse border border-gray-100 shadow-sm">
                                <div className="h-48 bg-gray-200 rounded-t-3xl w-full mb-4"></div>
                                <div className="px-6 space-y-3">
                                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : posts.length > 0 ? (
                    // DATA LIST
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => {
                            const date = new Date(post.ngaydang).toLocaleDateString('vi-VN');

                            // Tìm nhãn hiển thị khớp với DB value
                            const firstTag = post.tukhoa?.[0] || '';
                            const matchedCat = CATEGORIES.find(c => c.dbValue === firstTag);
                            const displayLabel = matchedCat ? matchedCat.label : 'Tin tức';

                            // Màu sắc badge
                            let badgeColor = "bg-blue-100 text-blue-700";
                            if (firstTag === 'sự kiện') badgeColor = "bg-orange-100 text-orange-700";
                            if (firstTag === 'thông báo') badgeColor = "bg-red-100 text-red-700";
                            if (firstTag === 'hoạt động') badgeColor = "bg-green-100 text-green-700";
                            if (firstTag === 'nổi bật') badgeColor = "bg-yellow-100 text-yellow-700";

                            // Lấy ảnh thumb
                            let thumbUrl = null;
                            if (post.anhdaidien && typeof post.anhdaidien === 'object') {
                                thumbUrl = Object.values(post.anhdaidien)[0];
                            }

                            return (
                                <Link
                                    key={post.mabaiviet}
                                    href={`/bai_viet/${post.mabaiviet}`}
                                    className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-blue-100 transition-all duration-300 flex flex-col h-full"
                                >
                                    {/* Image Area */}
                                    <div className="relative h-56 w-full overflow-hidden bg-gray-100">
                                        {thumbUrl ? (
                                            <Image
                                                src={thumbUrl}
                                                alt={post.tieude}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                                                sizes="(max-width: 768px) 100vw, 33vw"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                                <ImageIcon className="text-gray-300" size={48} />
                                            </div>
                                        )}

                                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                        <div className="absolute top-4 left-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${badgeColor}`}>
                                                {displayLabel}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content Area */}
                                    <div className="p-6 flex flex-col flex-1">
                                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3 font-medium">
                                            <span className="flex items-center gap-1"><Calendar size={14}/> {date}</span>
                                            <span className="flex items-center gap-1"><Eye size={14}/> {post.soluotxem || 0}</span>
                                        </div>

                                        <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                            {post.tieude}
                                        </h3>

                                        <p className="text-gray-500 text-sm line-clamp-3 mb-6 flex-1">
                                            {post.noidung?.replace(/<[^>]*>?/gm, '').substring(0, 120)}...
                                        </p>

                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                                            <span className="text-sm font-semibold text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                                Xem chi tiết <ArrowRight size={16}/>
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                ) : (
                    // EMPTY STATE
                    <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Filter className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy bài viết nào</h3>
                        <p className="text-gray-500">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                        <button
                            onClick={() => { setSearchTerm(''); handleCategoryChange('all'); }}
                            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                        >
                            Xóa bộ lọc
                        </button>
                    </div>
                )}
            </div>

            {/* --- PAGINATION CONTROLS --- */}
            {!loading && pagination.totalPages > 1 && (
                <div className="mt-12 flex justify-center items-center gap-4">
                    <button
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
                    >
                        Trước
                    </button>

                    <span className="text-gray-600 font-medium">
                        Trang {pagination.currentPage} / {pagination.totalPages}
                    </span>

                    <button
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
                    >
                        Sau
                    </button>
                </div>
            )}
        </div>
    );
}

// === MAIN PAGE ===
export default function BaiVietPage() {
    return (
        <div className="min-h-screen bg-gray-50 font-sans">

            {/* HERO BANNER (CSS Gradient - An toàn, không lỗi 404 ảnh) */}
            <div className="relative w-full h-[300px] md:h-[400px] bg-linear-to-br from-blue-900 via-blue-800 to-indigo-900 overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>

                <div className="absolute inset-0 container mx-auto px-4 flex flex-col justify-center items-center text-center z-10">
                    <span className="inline-block px-4 py-1 bg-white/10 border border-white/20 rounded-full text-blue-100 text-sm font-bold mb-4 backdrop-blur-sm">
                        THƯ VIỆN ONLINE
                    </span>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight drop-shadow-lg">
                        Danh sách Bài Viết
                    </h1>
                    <p className="text-blue-100 text-lg md:text-xl max-w-2xl leading-relaxed">
                        Cập nhật những thông tin mới nhất, các hoạt động văn hóa đọc và thông báo quan trọng.
                    </p>
                </div>
            </div>

            <Suspense fallback={
                <div className="container mx-auto px-4 py-20 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                </div>
            }>
                <NewsContent />
            </Suspense>

        </div>
    );
}