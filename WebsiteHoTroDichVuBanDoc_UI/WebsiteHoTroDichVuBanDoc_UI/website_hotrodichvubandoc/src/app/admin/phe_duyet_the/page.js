// src/app/admin/phe_duyet_the/page.js
import Image from 'next/image';
import { Check, X, Download } from 'lucide-react';

// Dữ liệu giả lập cho các hồ sơ đang chờ
const mockApplications = [
    {
        id: 'HS001',
        hoTen: 'Nguyễn Văn B',
        loaiThe: 'Thẻ Mượn (Cá nhân > 16 tuổi)',
        ngayNop: '11/11/2025',
        anhThe: 'https://via.placeholder.com/100x133', // Ảnh thẻ 3x4 giả
        minhChung: 'cccd_nguyenvanb.pdf',
    },
    {
        id: 'HS002',
        hoTen: 'Trần Thị C',
        loaiThe: 'Thẻ Đọc (Thiếu nhi 7-15 tuổi)',
        ngayNop: '10/11/2025',
        anhThe: 'https://via.placeholder.com/100x133',
        minhChung: 'giaykhaisinh_tranthic.jpg',
    },
];

export default function PheDuyetThePage() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Phê duyệt hồ sơ đăng ký thẻ</h1>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">
                    Hồ sơ đang chờ ({mockApplications.length})
                </h2>

                {/* Bảng hiển thị danh sách hồ sơ */}
                <div className="space-y-6">
                    {mockApplications.map((app) => (
                        <div key={app.id} className="border border-gray-200 rounded-lg overflow-hidden">
                            {/* Header của hồ sơ */}
                            <div className="bg-gray-50 p-4 flex justify-between items-center">
                                <div>
                                    <span className="font-semibold text-lg text-blue-700">{app.hoTen}</span>
                                    <span className="text-sm text-gray-500 ml-2">({app.id})</span>
                                </div>
                                <span className="text-sm text-gray-600">Ngày nộp: {app.ngayNop}</span>
                            </div>

                            {/* Thân của hồ sơ */}
                            <div className="p-4 flex flex-col md:flex-row">
                                {/* Ảnh thẻ */}
                                <div className="text-center p-2">
                                    <Image
                                        src={app.anhThe}
                                        alt="Ảnh thẻ"
                                        width={100}
                                        height={133}
                                        className="rounded-md border shadow-sm"
                                    />
                                </div>

                                {/* Thông tin chi tiết */}
                                <div className="flex-1 p-2 md:ml-4">
                                    <p><strong>Loại thẻ:</strong> {app.loaiThe}</p>
                                    <p className="mt-2"><strong>Minh chứng:</strong></p>
                                    <button className="flex items-center space-x-2 text-blue-600 hover:underline">
                                        <Download className="w-4 h-4" />
                                        <span>{app.minhChung}</span>
                                    </button>
                                </div>

                                {/* Nút hành động */}
                                <div className="flex flex-col space-y-2 p-2 justify-center">
                                    <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600">
                                        <Check className="w-5 h-5" />
                                        <span>Phê duyệt</span>
                                    </button>
                                    <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">
                                        <X className="w-5 h-5" />
                                        <span>Từ chối</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}