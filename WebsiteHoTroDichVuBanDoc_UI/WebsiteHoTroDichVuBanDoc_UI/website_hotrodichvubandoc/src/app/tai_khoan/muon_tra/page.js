// src/app/tai_khoan/muon_tra/page.js

// Dữ liệu giả lập
const mockMuonTra = [
    { id: 1, title: 'Lập trình Python cơ bản', ngayMuon: '01/11/2025', hanTra: '15/11/2025', trangThai: 'Đang mượn' },
    { id: 2, title: 'Giáo trình FastAPI cho Backend', ngayMuon: '05/11/2025', hanTra: '20/11/2025', trangThai: 'Đang mượn' },
    { id: 5, title: 'Cơ sở dữ liệu nâng cao với PostgreSQL', ngayMuon: '10/10/2025', hanTra: '10/11/2025', trangThai: 'Quá hạn' },
];

export default function MuonTraPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Sách đang mượn</h1>
            <div className="space-y-4">
                {mockMuonTra.map((item) => (
                    <div
                        key={item.id}
                        className={`p-4 rounded-lg shadow-md flex justify-between items-center ${
                        item.trangThai === 'Quá hạn' ? 'bg-red-50 border-red-200' : 'bg-white'
                        }`}
                    >
                        <div>
                            <h3 className={`text-xl font-semibold ${item.trangThai === 'Quá hạn' ? 'text-red-700' : 'text-gray-900'}`}>
                                {item.title}
                            </h3>
                            <p className="text-sm text-gray-600">Ngày mượn: {item.ngayMuon} | Hạn trả: {item.hanTra}</p>
                        </div>
                        <div className="flex space-x-2">
                            <button className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600">
                                Gia hạn
                            </button>
                            <button className="px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600">
                                Trả sách
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}