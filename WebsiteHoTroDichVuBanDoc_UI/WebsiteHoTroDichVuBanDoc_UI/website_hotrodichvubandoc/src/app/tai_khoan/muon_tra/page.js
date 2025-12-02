// src/app/tai_khoan/muon_tra/page.js
import { getLoansByStatusAction } from '../actions';
import LoanListTable from '@/components/LoanListTable';

export default async function TaiLieuDangMuonPage() {
    // 1. Gọi tuần tự để tránh lỗi Socket trên Windows Backend
    const borrowing = await getLoansByStatusAction('daMuon');
    const overdue = await getLoansByStatusAction('quaHan');

    // 2. Gộp mảng an toàn
    const safeBorrowing = Array.isArray(borrowing) ? borrowing : [];
    const safeOverdue = Array.isArray(overdue) ? overdue : [];

    // 3. Gộp lại: Quá hạn lên đầu để gây chú ý
    const allCurrentLoans = [...safeOverdue, ...safeBorrowing];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Tài liệu đang mượn</h1>
                <p className="text-gray-600">Danh sách các tài liệu bạn đang giữ. Vui lòng chú ý hạn trả.</p>
            </div>

            <LoanListTable
                loans={allCurrentLoans}
                title="Danh sách hiện tại"
                emptyMessage="Bạn hiện không mượn tài liệu nào."
            />
        </div>
    );
}