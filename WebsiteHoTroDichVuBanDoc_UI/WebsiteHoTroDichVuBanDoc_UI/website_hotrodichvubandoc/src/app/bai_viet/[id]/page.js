import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
    Calendar, Clock, Eye, Share2, Tag,
    ChevronLeft, User, BookOpen, Facebook, Link as LinkIcon
} from 'lucide-react';

// Cấu hình API URL
const API_ROOT = process.env.NEXT_PUBLIC_FASTAPI_BACKEND_URL || 'http://127.0.0.1:8000';

// === 1. HÀM GỌI API LẤY CHI TIẾT ===
async function getPostDetail(id) {
    try {
        // Lưu ý: Đảm bảo Backend có API GET /api/v1/bai-viet/{id}
        const res = await fetch(`${API_ROOT}/api/v1/bai-viet/${id}`, {
            cache: 'no-store', // Luôn lấy dữ liệu mới nhất
            // Hoặc dùng next: { revalidate: 60 } nếu muốn cache 60s
        });

        if (!res.ok) {
            if (res.status === 404) return null;
            throw new Error(`Lỗi lấy dữ liệu: ${res.status}`);
        }

        return await res.json();
    } catch (error) {
        console.error("Fetch Post Detail Error:", error);
        return null;
    }
}

// === 2. GENERATE METADATA (SEO) ===
export async function generateMetadata({ params }) {
    const { id } = await params;
    const post = await getPostDetail(id);

    if (!post) {
        return { title: 'Không tìm thấy bài viết' };
    }

    return {
        title: `${post.tieude} - Thư viện Online`,
        description: post.noidung?.substring(0, 150).replace(/<[^>]*>?/gm, '') + '...', // Lấy 150 ký tự đầu, bỏ HTML tag
        openGraph: {
            images: post.anhdaidien?.anh_1 ? [post.anhdaidien.anh_1] : [],
        },
    };
}

// === 3. COMPONENT CHÍNH ===
export default async function BaiVietDetailPage({ params }) {
    const { id } = await params;
    const post = await getPostDetail(id);

    if (!post) {
        return notFound(); // Chuyển hướng sang trang 404 Next.js
    }

    // Xử lý dữ liệu
    // Lấy ảnh bìa (ưu tiên anh_1, nếu không có thì lấy placeholder)
    const coverImage = post.anhdaidien?.anh_1 || '/images/default-post-cover.jpg';

    // Format ngày tháng
    const publishDate = new Date(post.ngaydang).toLocaleDateString('vi-VN', {
        day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            {/* --- HERO HEADER --- */}
            <div className="relative w-full h-[400px] md:h-[500px] bg-gray-900 overflow-hidden">
                {/* Ảnh nền mờ */}
                <div className="absolute inset-0 opacity-60">
                    <Image
                        src={coverImage}
                        alt={post.tieude}
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-linear-to-t from-gray-900 via-gray-900/40 to-transparent"></div>

                {/* Nội dung Header */}
                <div className="absolute inset-0 container mx-auto px-4 flex flex-col justify-end pb-16">
                    <div className="max-w-4xl mx-auto w-full">
                        {/* Breadcrumb */}
                        <Link href="/tin-tuc" className="inline-flex items-center text-blue-300 hover:text-white mb-4 transition-colors gap-1 text-sm font-medium">
                            <ChevronLeft size={16} /> Quay lại tin tức
                        </Link>

                        {/* Tiêu đề */}
                        <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-6 drop-shadow-lg">
                            {post.tieude}
                        </h1>

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-4 md:gap-8 text-gray-300 text-sm md:text-base">
                            <div className="flex items-center gap-2">
                                <Calendar size={18} className="text-blue-400" />
                                <span>{publishDate}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Eye size={18} className="text-blue-400" />
                                <span>{post.soluotxem || 0} lượt xem</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <User size={18} className="text-blue-400" />
                                <span>Ban biên tập</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="container mx-auto px-4 -mt-10 relative z-10">
                <div className="max-w-4xl mx-auto">

                    {/* Bài viết Container */}
                    <div className="bg-white rounded-3xl shadow-xl p-6 md:p-12 border border-gray-100">

                        {/* Nội dung HTML (Được render từ Editor) */}
                        <article
                            className="prose prose-lg md:prose-xl prose-blue max-w-none
                            prose-headings:font-bold prose-headings:text-gray-800
                            prose-p:text-gray-600 prose-p:leading-relaxed
                            prose-img:rounded-xl prose-img:shadow-md prose-img:mx-auto
                            prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                            prose-figcaption:text-center prose-figcaption:text-gray-500 prose-figcaption:italic"
                            dangerouslySetInnerHTML={{ __html: post.noidung }}
                        />

                        {/* --- FOOTER BÀI VIẾT --- */}
                        <div className="mt-12 pt-8 border-t border-gray-100">

                            {/* Từ khóa (Tags) */}
                            {post.tukhoa && post.tukhoa.length > 0 && (
                                <div className="flex items-start gap-3 mb-8">
                                    <Tag className="text-gray-400 mt-1 shrink-0" size={20} />
                                    <div className="flex flex-wrap gap-2">
                                        {post.tukhoa.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
                                            >
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50 p-6 rounded-2xl">
                                <div className="flex items-center gap-2 text-gray-600 font-medium">
                                    <BookOpen size={20} className="text-blue-600"/>
                                    <span>Bạn thấy bài viết này hữu ích?</span>
                                </div>

                                <div className="flex gap-3">
                                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-md shadow-blue-200">
                                        <Facebook size={18} /> Chia sẻ
                                    </button>
                                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 transition">
                                        <LinkIcon size={18} /> Sao chép Link
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* --- BÀI VIẾT LIÊN QUAN (Placeholder) --- */}
                    {/* Phần này bạn có thể gọi thêm API lấy bài viết cùng chủ đề */}
                    <div className="mt-12">
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 pl-4 border-l-4 border-blue-600">
                            Tin tức khác
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Card 1 Demo */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition cursor-pointer">
                                <div className="w-24 h-24 bg-gray-200 rounded-lg shrink-0 overflow-hidden relative">
                                    <Image src="/images/demo-book.jpg" alt="Related" fill className="object-cover"/>
                                </div>
                                <div>
                                    <span className="text-xs text-blue-600 font-bold uppercase">Sự kiện</span>
                                    <h4 className="font-bold text-gray-800 line-clamp-2 mt-1 mb-2">Hội sách mùa thu 2024: Lan tỏa văn hóa đọc</h4>
                                    <span className="text-xs text-gray-500">12/10/2024</span>
                                </div>
                            </div>
                             {/* Card 2 Demo */}
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition cursor-pointer">
                                <div className="w-24 h-24 bg-gray-200 rounded-lg shrink-0 overflow-hidden relative">
                                    <Image src="/images/demo-library.jpg" alt="Related" fill className="object-cover"/>
                                </div>
                                <div>
                                    <span className="text-xs text-orange-600 font-bold uppercase">Thông báo</span>
                                    <h4 className="font-bold text-gray-800 line-clamp-2 mt-1 mb-2">Lịch nghỉ lễ Quốc Khánh 2/9 tại thư viện</h4>
                                    <span className="text-xs text-gray-500">28/08/2024</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}