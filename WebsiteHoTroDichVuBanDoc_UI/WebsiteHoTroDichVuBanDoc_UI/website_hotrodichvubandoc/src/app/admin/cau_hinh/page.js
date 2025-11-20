export default function CauHinhPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Cấu hình hệ thống</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <p className="text-red-600 font-semibold">(Chức năng này chỉ Admin mới thấy)</p>
                <p>Nơi Admin cài đặt các tham số hệ thống (ví dụ: số sách mượn tối đa, thời gian mượn...).</p>
            </div>
        </div>
    );
}