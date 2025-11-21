// src/app/admin/page.js

export default function AdminDashboardPage() {
    // Dữ liệu thống kê giả lập
    const stats = [
        { title: 'Hồ sơ chờ duyệt', value: 12, color: 'text-yellow-600' },
        { title: 'Sách đang mượn', value: 450, color: 'text-blue-600' },
        { title: 'Sách bị quá hạn', value: 31, color: 'text-red-600' },
        { title: 'Lượt truy cập hôm nay', value: 1.204, color: 'text-green-600' },
    ];

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Tổng quan hệ thống</h1>

            {/* Thẻ thống kê */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat) => (
                    <div key={stat.title} className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="font-semibold text-gray-500">{stat.title}</h3>
                        <p className={`text-4xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Các biểu đồ và báo cáo khác sẽ ở đây */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Dự báo nhu cầu (AI)</h2>
                <p className="text-gray-600">
                    (Khu vực này sẽ hiển thị biểu đồ dự báo số lượng mượn sách
                    và nhu cầu đặt chỗ ngồi trong 7 ngày tới...)
                </p>
            </div>
        </div>
    );
}