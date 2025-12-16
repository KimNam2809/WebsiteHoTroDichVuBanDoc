// src/app/tai_lieu/[id]/page.js
import Link from 'next/link';
import Image from 'next/image';
import { cookies } from 'next/headers';
import BookCopiesList from '@/components/BookCopiesList';
import { ArrowLeft, BookOpen, Calendar, User, Info, Hash, Clock, CheckCircle, XCircle, Share2, Heart } from 'lucide-react';

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL;

// === 1. Hàm Helper gọi API ===
async function fetchFromAPI(endpoint) {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
        const res = await fetch(`${FASTAPI_URL}${endpoint}`, { headers, cache: 'no-store' });
        if (!res.ok) {
            if (res.status === 404) return null;
            return null;
        }
        return await res.json();
    } catch (error) {
        console.error('Fetch Error:', error);
        return null;
    }
}

// === 2. Lấy dữ liệu chi tiết ===
async function getWorkDetails(id) {
    const [workData, categoriesData, copiesData] = await Promise.all([
        fetchFromAPI(`/api/v1/tac-pham/${id}`),
        fetchFromAPI(`/api/v1/tac-pham-danh-muc/${id}`),
        fetchFromAPI(`/api/v1/tac-pham/${id}/ban-sao`)
    ]);

    if (!workData) return { error: 'Không tìm thấy thông tin tác phẩm.' };

    const availableCopies = copiesData?.filter(copy => copy.trangthaichomuon === true) || [];

    return {
        work: workData,
        categories: categoriesData || [],
        copies: copiesData || [],
        availableCount: availableCopies.length
    };
}

// === 3. Component Trang Chi Tiết ===
export default async function ChiTietTacPhamPage({ params }) {
    const { id } = await params;
    const { work, categories, copies, availableCount, error } = await getWorkDetails(id);

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto text-gray-400">
                        <BookOpen size={40} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Không tìm thấy tài liệu</h1>
                    <Link href="/tim_kiem" className="inline-flex items-center text-blue-600 hover:underline gap-2 mt-4">
                        <ArrowLeft size={18} /> Quay lại danh mục
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">

            {/* 1. HERO HEADER (Giống trang Danh mục) */}
            {/* Phần này tạo khoảng trống an toàn cho Header fixed và chứa thông tin chính */}
            <div className="relative bg-linear-to-r from-blue-900 to-indigo-900 min-h-[400px] flex flex-col justify-center overflow-hidden pb-20">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                {/* Decorative Blobs */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>

                <div className="relative z-10 container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-20">

                    {/* Breadcrumb */}
                    <Link href="/tim_kiem" className="inline-flex items-center gap-2 text-blue-200 hover:text-white mb-6 font-medium transition-colors w-fit px-3 py-1 rounded-full hover:bg-white/10">
                        <ArrowLeft size={18}/> Quay lại danh mục
                    </Link>

                    {/* Title Section */}
                    <div className="max-w-4xl">
                        {/* Categories Chips */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {categories.map((cat) => (
                                <span key={cat.madanhmuc} className="px-3 py-1 bg-white/10 backdrop-blur-md text-cyan-200 border border-white/20 text-xs font-bold uppercase tracking-wider rounded-lg">
                                    {cat.tendanhmuc}
                                </span>
                            ))}
                        </div>

                        <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 leading-tight shadow-black drop-shadow-lg">
                            {work.tentacpham}
                        </h1>

                        <div className="flex items-center gap-4 text-blue-100 text-lg">
                            <span className="flex items-center gap-2"><User size={20}/> {work.tacgia}</span>
                            <span className="opacity-50">|</span>
                            <span className="flex items-center gap-2 opacity-80">{work.namxuatban}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. MAIN CONTENT CARD (Overlap Hero) */}
            {/* Sử dụng margin âm (-mt-20) để đè lên phần Hero */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col md:flex-row">

                    {/* CỘT TRÁI: ẢNH BÌA & THÔNG SỐ */}
                    <div className="md:w-1/3 lg:w-[30%] bg-gray-50 p-8 flex flex-col items-center border-b md:border-b-0 md:border-r border-gray-100">
                        {/* Book Cover */}
                        <div className="relative w-48 md:w-56 aspect-2/3 shadow-2xl rounded-lg overflow-hidden transform -translate-y-12 md:translate-y-0 hover:scale-105 transition-transform duration-500 z-10 mb-6 group">
                            {work.anhbia ? (
                                <Image
                                    src={work.anhbia}
                                    alt={work.tentacpham}
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, 300px"
                                    priority
                                />
                            ) : (
                                <div className="w-full h-full bg-linear-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center text-gray-400">
                                    <BookOpen size={48} strokeWidth={1} />
                                </div>
                            )}
                            {/* Shine effect */}
                            <div className="absolute inset-0 bg-linear-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        {/* Metadata Box */}
                        <div className="w-full bg-white rounded-xl border border-gray-200 p-4 space-y-3 shadow-sm">
                            <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                                <span className="text-gray-500 flex items-center gap-2"><Hash size={14}/> ISBN</span>
                                <span className="font-mono font-medium text-gray-800">{work.isbn}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                                <span className="text-gray-500 flex items-center gap-2"><Calendar size={14}/> Năm XB</span>
                                <span className="font-medium text-gray-800">{work.namxuatban}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm pt-1">
                                <span className="text-gray-500 flex items-center gap-2"><Clock size={14}/> Cập nhật</span>
                                <span className="font-medium text-gray-800">Mới nhất</span>
                            </div>
                        </div>

                        {/* Action Buttons (Like/Share) */}
                        <div className="flex gap-3 mt-6 w-full">
                            <button className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                                <Heart size={16}/> Yêu thích
                            </button>
                            <button className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                                <Share2 size={16}/> Chia sẻ
                            </button>
                        </div>
                    </div>

                    {/* CỘT PHẢI: NỘI DUNG & DANH SÁCH BẢN SAO */}
                    <div className="md:w-2/3 lg:w-[70%] p-8 md:p-10 flex flex-col">

                        {/* Status Alert */}
                        <div className={`mb-8 p-4 rounded-xl flex items-start sm:items-center justify-between border ${
                            availableCount > 0
                            ? 'bg-green-50 border-green-100'
                            : 'bg-orange-50 border-orange-100'
                        }`}>
                            <div className="flex gap-3">
                                <div className={`mt-1 sm:mt-0 p-1.5 rounded-full shrink-0 ${availableCount > 0 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                                    {availableCount > 0 ? <CheckCircle size={20}/> : <Clock size={20}/>}
                                </div>
                                <div>
                                    <h3 className={`font-bold text-lg ${availableCount > 0 ? 'text-green-800' : 'text-orange-800'}`}>
                                        {availableCount > 0 ? 'Sách đang có sẵn' : 'Tạm thời hết sách'}
                                    </h3>
                                    <p className={`text-sm ${availableCount > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                                        {availableCount > 0
                                            ? `Hiện còn ${availableCount} bản tại thư viện. Đăng ký mượn ngay!`
                                            : 'Vui lòng quay lại sau hoặc đặt lịch hẹn trước.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mb-10">
                            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Info size={18} className="text-blue-600"/> Giới thiệu nội dung
                            </h3>
                            <div className="prose prose-slate max-w-none text-gray-600 leading-relaxed text-base">
                                <p>{work.mota || "Nội dung đang được cập nhật..."}</p>
                            </div>
                        </div>

                        {/* DANH SÁCH BẢN SAO (Component Con) */}
                        <div className="border-t border-gray-100 pt-8 mt-auto">
                            <BookCopiesList copies={copies} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}