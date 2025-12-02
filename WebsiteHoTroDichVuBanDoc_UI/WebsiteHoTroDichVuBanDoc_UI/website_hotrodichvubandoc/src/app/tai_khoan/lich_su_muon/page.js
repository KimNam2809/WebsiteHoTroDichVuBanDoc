// src/app/tai_khoan/lich_su_muon/page.js
import { getLoansByStatusAction } from '../actions';
import LoanListTable from '@/components/LoanListTable';

export default async function LichSuMuonPage() {
    // 1. Gọi Server Action để lấy dữ liệu thật
    const history = await getLoansByStatusAction('daTra');

    // 2. Xử lý mảng an toàn
    const safeHistory = Array.isArray(history) ? history : [];

    // 3. Sắp xếp: Mới nhất lên đầu (dựa vào ngày trả)
    const sortedHistory = safeHistory.sort((a, b) => {
        const dateA = new Date(a.ngaytrathucte || a.ngaymuon);
        const dateB = new Date(b.ngaytrathucte || b.ngaymuon);
        return dateB - dateA; // Giảm dần
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Lịch sử mượn trả</h1>
                <p className="text-gray-600">Danh sách các tài liệu bạn đã hoàn tất thủ tục trả sách.</p>
            </div>

            {/* Sử dụng Component bảng chung */}
            <LoanListTable
                loans={sortedHistory}
                title="Tài liệu đã trả"
                emptyMessage="Bạn chưa có lịch sử mượn trả nào."
            />
        </div>
    );
}