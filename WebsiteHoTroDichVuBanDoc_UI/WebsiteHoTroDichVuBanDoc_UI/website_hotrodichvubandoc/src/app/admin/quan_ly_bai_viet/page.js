// src/app/admin/quan_ly_bai_viet/page.js

import Link from 'next/link';

export default function QLBaiVietPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Quản lý bài viết</h1>
            {/* Giao diện CRUD (Tạo, Sửa, Xóa) bài viết sẽ ở đây */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <Link href="/admin/quan_ly_bai_viet/tao_moi_bai_viet" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    + Thêm bài viết mới
                </Link>
                <p className="mt-4">Danh sách các bài viết đã đăng...</p>
            </div>
        </div>
    );
}