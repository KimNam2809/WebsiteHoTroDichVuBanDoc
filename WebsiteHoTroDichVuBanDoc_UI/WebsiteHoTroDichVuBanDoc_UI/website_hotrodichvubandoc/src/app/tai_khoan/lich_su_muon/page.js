// src/app/tai_khoan/lich_su_muon/page.js

// Dữ liệu giả lập
const mockLichSu = [
    { id: 10, title: 'Nguyên lý Hệ điều hành', ngayMuon: '01/10/2025', ngayTra: '15/10/2025', trangThai: 'Đã trả' },
    { id: 12, title: 'Cấu trúc dữ liệu và giải thuật', ngayMuon: '15/09/2025', ngayTra: '30/09/2025', trangThai: 'Đã trả' },
];

export default function LichSuMuonPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Lịch sử mượn trả</h1>
            {/* Giao diện bảng */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên tài liệu</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày mượn</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày trả</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {mockLichSu.map((item) => (
                            <tr key={item.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.ngayMuon}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.ngayTra}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        {item.trangThai}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}