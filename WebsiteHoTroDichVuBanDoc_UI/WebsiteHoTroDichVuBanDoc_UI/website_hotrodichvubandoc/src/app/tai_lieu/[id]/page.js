import Link from 'next/link';
import Image from 'next/image';
import { cookies } from 'next/headers'; // Để lấy token

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL;

// === 1. Hàm Helper để gọi API an toàn ===
async function fetchFromAPI(endpoint) {
    const token = cookies().get('auth_token')?.value;
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${FASTAPI_URL}${endpoint}`, { headers });
    if (!res.ok) {
        // Trả về null nếu không tìm thấy (ví dụ: 404)
        if (res.status === 404) return null;
        throw new Error(`Lỗi API: ${res.status} ${res.statusText}`);
    }
    return res.json();
}

// === 2. Hàm thu thập dữ liệu (Chạy trên Server) ===
async function getWorkDetails(id) {
    try {
        // Chạy 3 lệnh gọi API song song để tăng tốc
        const [workData, categoriesData, copiesData] = await Promise.all([
            fetchFromAPI(`/api/v1/tac-pham/${id}`),
            fetchFromAPI(`/api/v1/tac-pham-danh-muc/${id}`),
            fetchFromAPI(`/api/v1/tac-pham/${id}/ban-sao`)
        ]);

        if (!workData) {
            return { error: 'Không tìm thấy tác phẩm này.' };
        }

        // Đếm số bản sao có sẵn
        const availableCopies = copiesData?.filter(copy => copy.trangthaichomuon === true) || [];

        return {
            work: workData, // Dữ liệu từ /api/v1/tac-pham/{id}
            categories: categoriesData || [], // Dữ liệu từ /api/v1/tac-pham-danh-muc/{id}
            copies: copiesData || [], // Dữ liệu từ /api/v1/tac-pham/{id}/ban-sao
            availableCount: availableCopies.length
        };
    } catch (error) {
        console.error('Lỗi fetch chi tiết tác phẩm:', error);
        return { error: 'Không thể tải dữ liệu chi tiết tác phẩm.' };
    }
}

// === 3. Component Trang (Server Component) ===
export default async function ChiTietTacPhamPage({ params }) {
    const { id } = params;
    const { work, categories, copies, availableCount, error } = await getWorkDetails(id);

    // Xử lý lỗi
    if (error) {
        return (
            <div className="max-w-4xl mx-auto my-10 p-8 bg-white shadow-lg rounded-lg text-center">
                <h1 className="text-3xl font-bold text-red-600 mb-4">Đã xảy ra lỗi</h1>
                <p className="text-lg">{error}</p>
                <Link href="/tim_kiem" className="text-blue-600 hover:underline mt-4 inline-block">
                    Quay lại trang tìm kiếm
                </Link>
            </div>
        );
    }

    // Giao diện render (dịch từ template HTML)
    return (
        <div className="max-w-5xl mx-auto my-10 p-8 bg-white shadow-lg rounded-lg">
            <div className="grid md:grid-cols-3 gap-8">
                {/* Cột trái (Ảnh bìa) */}
                <div className="md:col-span-1">
                    {/* (Chúng ta sẽ dùng ảnh giả lập cho đến khi bạn có URL ảnh thật) */}
                    <Image
                        src="https://via.placeholder.com/300x450.png?text=Bia+Sach"
                        alt={work.tentacpham}
                        width={300}
                        height={450}
                        className="w-full h-auto rounded-lg shadow-md"
                    />
                </div>

                {/* Cột phải (Thông tin) */}
                <div className="md:col-span-2">
                    {/* Hiển thị danh mục [cite: 1-19] */}
                    <div className="flex flex-wrap gap-2 mb-2">
                        {categories.map((cat) => (
                            <span key={cat.madanhmuc} className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                {cat.tendanhmuc}
                            </span>
                        ))}
                    </div>

                    <h1 className="text-4xl font-bold mb-3">{work.tentacpham}</h1>
                    <p className="text-xl text-gray-700 mb-4">Tác giả: {work.tacgia}</p>
                    <p className="text-md text-gray-600 mb-4">Năm XB: {work.namxuatban} | ISBN: {work.isbn}</p>

                    {/* Mô tả [cite: 1-19] */}
                    <div className="prose max-w-none text-gray-700 mb-6">
                        <p>{work.mota}</p>
                    </div>

                    {/* Trạng thái bản sao [cite: 1-19] */}
                    <div className={`p-4 rounded-lg mb-6 ${availableCount > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <h3 className="text-lg font-semibold">
                            Trạng thái:
                            <span className={availableCount > 0 ? 'text-green-700' : 'text-red-700'}>
                                {availableCount > 0 ? ` Có sẵn (${availableCount} bản sao)` : ' Đã mượn hết'}
                            </span>
                        </h3>
                    </div>

                    {/* Nút hành động */}
                    <div className="flex flex-wrap gap-3">
                        <button
                            disabled={availableCount === 0}
                            className="px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold shadow-md
                                        hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Mượn sách
                        </button>
                        <button
                            disabled={availableCount > 0}
                            className="px-6 py-3 bg-gray-800 text-white rounded-lg font-semibold shadow-md
                                        hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            Đặt trước (Khi hết sách)
                        </button>
                    </div>
                </div>
            </div>

            {/* Hiển thị chi tiết các bản sao [cite: 1-19] */}
            <div className="mt-10 border-t pt-6">
                <h2 className="text-2xl font-bold mb-4">Các bản sao vật lý ({copies.length})</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Mã nội bộ</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Vị trí</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {copies.map((copy) => (
                                <tr key={copy.mabansao}>
                                    <td className="px-4 py-3 text-sm font-mono">{copy.mabansaonoibo}</td>
                                    <td className="px-4 py-3 text-sm">{copy.vitri}</td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                            copy.trangthaichomuon ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {copy.trangthaichomuon ? 'Có sẵn' : 'Đang mượn'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}