import Link from 'next/link';

// Dữ liệu giả lập - Tạm thời sao chép qua đây
const mockData = [
    { id: '1', title: 'Lập trình Python cơ bản', type: 'Sách', description: 'Mô tả chi tiết về sách lập trình Python dành cho người mới bắt đầu.' },
    { id: '2', title: 'Giáo trình FastAPI cho Backend', type: 'Sách', description: 'Học cách xây dựng API hiệu suất cao với FastAPI và Python.' },
    { id: '3', title: 'Quản trị PostgreSQL với Supabase', type: 'Tài liệu', description: 'Hướng dẫn toàn diện về cách sử dụng Supabase để quản lý cơ sở dữ liệu PostgreSQL.' },
    { id: '4', title: 'Thông báo nghỉ lễ', type: 'Bài viết', description: 'Nội dung chi tiết thông báo về lịch nghỉ lễ của thư viện.' },
    { id: '5', title: 'Cơ sở dữ liệu nâng cao với PostgreSQL', type: 'Sách', description: 'Các khái niệm chuyên sâu về tối ưu hóa và quản trị PostgreSQL.' },
];

// Hàm giả lập "fetch" dữ liệu
async function getDocumentById(id) {
    await new Promise(resolve => setTimeout(resolve, 500));

    const document = mockData.find(doc => doc.id === id);

    return document;
}

// Server Component có khả năng lấy dữ liệu
export default async function ChiTietBaiVietPage({ params }) {
    const docId = params.id;

    const doc = await getDocumentById(docId);

    // Xử lý trường hợp không tìm thấy bài viết
    if (!doc || doc.type !== 'Bài viết') {
        return (
            <div className="text-center">
                <h1 className="text-3xl font-bold text-red-600 mb-4">Không tìm thấy bài viết</h1>
                <p className="text-lg">Bài viết với ID {docId} không tồn tại hoặc không hợp lệ.</p>
                <Link href="/tim_kiem" className="text-blue-600 hover:underline mt-4 inline-block">
                    Quay lại trang tìm kiếm
                </Link>
            </div>
        );
    }

    // Hiển thị thông tin chi tiết bài viết
    return (
        <article>
            <span className="inline-block bg-gray-100 text-gray-800 text-sm font-medium px-2.5 py-0.5 rounded mb-2">
                {doc.type}
            </span>
            <h1 className="text-4xl font-bold mb-4">{doc.title}</h1>

            {/* Giả lập nội dung bài viết */}
            <div className="prose lg:prose-xl max-w-none text-gray-700">
                <p>{doc.description}</p>
                <p>Đây là nội dung chi tiết của bài viết. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
            </div>
        </article>
    );
}