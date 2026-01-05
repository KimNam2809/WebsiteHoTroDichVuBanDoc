'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Plus, Search, Edit, Trash2, Eye,
    MoreVertical, FileText, Calendar, Loader2, AlertCircle
} from 'lucide-react';
import { getPostsAction, deletePostAction } from './actions';

export default function QLBaiVietPage() {
    // --- STATE ---
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingId, setDeletingId] = useState(null);

    // --- EFFECT: Load dữ liệu khi vào trang ---
    useEffect(() => {
        fetchPosts();
    }, []);

    // Hàm gọi Action lấy dữ liệu
    const fetchPosts = async (query = '') => {
        setLoading(true);
        const data = await getPostsAction(query);
        // Giả sử API trả về list trực tiếp, nếu trả về { data: [], total: ... } thì sửa lại
        setPosts(Array.isArray(data) ? data : (data.data || []));
        setLoading(false);
    };

    // Xử lý tìm kiếm (Debounce nhẹ hoặc Enter)
    const handleSearch = (e) => {
        e.preventDefault();
        fetchPosts(searchTerm);
    };

    // Xử lý xóa bài viết
    const handleDelete = async (id, tieuDe) => {
        if (!confirm(`Bạn có chắc chắn muốn xóa bài viết: "${tieuDe}"? Hành động này không thể hoàn tác!`)) return;

        setDeletingId(id);
        const res = await deletePostAction(id);

        if (res.success) {
            // Xóa thành công thì loại bỏ khỏi state luôn (đỡ phải gọi lại API)
            setPosts(prev => prev.filter(p => p.mabaiviet !== id));
            alert("Đã xóa bài viết thành công.");
        } else {
            alert("Lỗi xóa bài: " + (res.error || "Không xác định"));
        }
        setDeletingId(null);
    };

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="text-blue-600" /> Quản lý bài viết
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Danh sách tin tức, sự kiện và thông báo của thư viện</p>
                </div>
                <Link
                    href="/admin/quan_ly_bai_viet/tao_moi_bai_viet"
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                >
                    <Plus size={20} /> Viết bài mới
                </Link>
            </div>

            {/* TOOLBAR (SEARCH & FILTER) */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                <form onSubmit={handleSearch} className="relative w-full md:w-96 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tiêu đề..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all"
                    />
                </form>
                <div className="text-sm text-gray-500 font-medium">
                    Tổng số: <span className="text-gray-900 font-bold">{posts.length}</span> bài viết
                </div>
            </div>

            {/* TABLE LIST */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold w-20">Ảnh</th>
                                <th className="px-6 py-4 font-semibold">Tiêu đề / Tóm tắt</th>
                                <th className="px-6 py-4 font-semibold w-40">Thông tin</th>
                                <th className="px-6 py-4 font-semibold w-32 text-center">Trạng thái</th>
                                <th className="px-6 py-4 font-semibold w-32 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                // Skeleton Loading Rows
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="w-12 h-12 bg-gray-200 rounded-lg"></div></td>
                                        <td className="px-6 py-4 space-y-2"><div className="h-4 bg-gray-200 rounded w-3/4"></div><div className="h-3 bg-gray-200 rounded w-1/2"></div></td>
                                        <td className="px-6 py-4"><div className="h-3 bg-gray-200 rounded w-full"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-gray-200 rounded-full w-20 mx-auto"></div></td>
                                        <td className="px-6 py-4"></td>
                                    </tr>
                                ))
                            ) : posts.length === 0 ? (
                                // Empty State
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                                <FileText size={32} className="opacity-50" />
                                            </div>
                                            <p>Chưa có bài viết nào.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                // Data Rows
                                posts.map((post) => {
                                    // Xử lý ảnh đại diện (Lấy ảnh đầu tiên trong JSON hoặc placeholder)
                                    let thumb = '/images/placeholder-image.jpg';
                                    if (post.anhdaidien && typeof post.anhdaidien === 'object') {
                                        // Lấy value đầu tiên của object
                                        thumb = Object.values(post.anhdaidien)[0] || thumb;
                                    }

                                    return (
                                        <tr key={post.mabaiviet} className="hover:bg-gray-50/80 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 shadow-sm">
                                                    <Image src={thumb} alt="thumb" fill className="object-cover" sizes="56px" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 max-w-md">
                                                <h3 className="font-bold text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                    {post.tieude}
                                                </h3>
                                                <div className="flex flex-wrap gap-2 mt-1">
                                                    {post.tukhoa && post.tukhoa.map((tag, idx) => (
                                                        <span key={idx} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200">#{tag}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1 text-sm text-gray-500">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar size={14} />
                                                        {new Date(post.ngaydang).toLocaleDateString('vi-VN')}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Eye size={14} />
                                                        {post.soluotxem || 0} lượt xem
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {post.trangthai ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                        Hiển thị
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                                                        Đang ẩn
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Xem chi tiết */}
                                                    <Link
                                                        href={`/bai_viet/${post.mabaiviet}`}
                                                        target="_blank"
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" 
                                                        title="Xem bài viết"
                                                    >
                                                        <Eye size={18} />
                                                    </Link>

                                                    {/* Sửa bài (Sẽ làm sau) */}
                                                    <Link
                                                        href={`/admin/quan_ly_bai_viet/chinh_sua/${post.mabaiviet}`}
                                                        className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit size={18} />
                                                    </Link>

                                                    {/* Xóa bài */}
                                                    <button
                                                        onClick={() => handleDelete(post.mabaiviet, post.tieude)}
                                                        disabled={deletingId === post.mabaiviet}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                        title="Xóa bài viết"
                                                    >
                                                        {deletingId === post.mabaiviet ? <Loader2 size={18} className="animate-spin"/> : <Trash2 size={18} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (Demo) */}
                {!loading && posts.length > 0 && (
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center text-sm text-gray-500">
                        <span>Hiển thị {posts.length} kết quả</span>
                        <div className="flex gap-2">
                            <button disabled className="px-3 py-1 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50">Trước</button>
                            <button disabled className="px-3 py-1 bg-white border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50">Sau</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}