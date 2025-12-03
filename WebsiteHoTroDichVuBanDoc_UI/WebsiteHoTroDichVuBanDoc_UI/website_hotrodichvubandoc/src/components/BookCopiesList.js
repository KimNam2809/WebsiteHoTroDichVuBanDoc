'use client';

import { useState, useEffect } from 'react';
import { Calendar, Check, Loader2, AlertCircle, BookOpen, UserCheck, Lock } from 'lucide-react';
import { borrowBookAction } from '@/app/tai_lieu/actions';
import { getLoansByStatusAction } from '@/app/tai_khoan/actions';

export default function BookCopiesList({ copies }) {
    const [selectedCopy, setSelectedCopy] = useState(null);
    const [returnDate, setReturnDate] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Set chứa các ID bản sao MÀ TÔI (bạn đọc đang đăng nhập) ĐANG MƯỢN
    const [myBorrowedCopyIds, setMyBorrowedCopyIds] = useState(new Set());

    useEffect(() => {
        async function checkMyLoans() {
            const [borrowing, overdue] = await Promise.all([
                getLoansByStatusAction('daMuon'),
                getLoansByStatusAction('quaHan')
            ]);
            const allMyLoans = [...(borrowing || []), ...(overdue || [])];

            const ids = new Set(allMyLoans.map(loan => loan.maBanSao));
            setMyBorrowedCopyIds(ids);
        }
        checkMyLoans();
    }, []);

    const defaultReturnDate = () => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d.toISOString().split('T')[0];
    };

    const openBorrowModal = (copy) => {
        setSelectedCopy(copy);
        setReturnDate(defaultReturnDate());
        setIsModalOpen(true);
    };

    const handleBorrow = async () => {
        if (!returnDate) return alert("Vui lòng chọn ngày trả.");
        setIsSubmitting(true);
        const result = await borrowBookAction(selectedCopy.mabansao, returnDate);
        setIsSubmitting(false);

        if (result.success) {
            setIsModalOpen(false);
            setShowSuccessModal(true);
            setMyBorrowedCopyIds(prev => new Set(prev).add(selectedCopy.mabansao));
        } else {
            alert(result.error || "Có lỗi xảy ra.");
        }
    };

    return (
        <div className="mt-10 border-t pt-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Các bản sao vật lý ({copies.length})</h2>
            <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Mã nội bộ</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Vị trí</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Trạng thái</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {copies.map((copy) => {
                            const isMine = myBorrowedCopyIds.has(copy.mabansao);
                            const isAvailable = copy.trangthaichomuon;

                            // Logic hiển thị hàng
                            let rowClass = "hover:bg-gray-50";
                            if (isMine) rowClass = "bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500";

                            return (
                                <tr key={copy.mabansao} className={`transition-colors ${rowClass}`}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-blue-700">
                                        {copy.mabansaonoibo}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {copy.vitri}
                                    </td>

                                    {/* CỘT TRẠNG THÁI */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {isMine ? (
                                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-sm flex items-center w-fit gap-1">
                                                <UserCheck size={14} /> Bạn đang giữ
                                            </span>
                                        ) : isAvailable ? (
                                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                                Có sẵn
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 border border-gray-200 flex items-center w-fit gap-1">
                                                <Lock size={12} /> Đã mượn
                                            </span>
                                        )}
                                    </td>

                                    {/* CỘT HÀNH ĐỘNG */}
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        {isMine ? (
                                            <button disabled className="text-sm font-bold text-blue-700 cursor-default px-4 py-2">
                                                Đang mượn
                                            </button>
                                        ) : isAvailable ? (
                                            <button
                                                onClick={() => openBorrowModal(copy)}
                                                className="px-4 py-2 rounded-md text-sm font-bold bg-purple-600 text-white hover:bg-purple-700 shadow-sm transition-transform active:scale-95"
                                            >
                                                Đăng ký mượn
                                            </button>
                                        ) : (
                                            <button
                                                disabled
                                                className="px-4 py-2 rounded-md text-sm font-bold bg-gray-100 text-gray-400 cursor-not-allowed"
                                            >
                                                Đã được mượn
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL XÁC NHẬN --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-5 border-b bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800">Xác nhận mượn sách</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <p className="text-xs font-bold text-blue-500 uppercase mb-1">Sách đang chọn</p>
                                <div className="flex justify-between items-center">
                                    <span className="font-mono font-bold text-lg text-gray-800">{selectedCopy?.mabansaonoibo}</span>
                                    <span className="text-sm text-gray-500">{selectedCopy?.vitri}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ngày trả dự kiến</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={returnDate}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setReturnDate(e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 pl-10"
                                    />
                                    <Calendar className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                                </div>
                            </div>
                        </div>
                        <div className="p-5 border-t bg-gray-50 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="px-5 py-2 rounded-lg border bg-white hover:bg-gray-100 text-gray-700 font-medium">Hủy</button>
                            <button onClick={handleBorrow} disabled={isSubmitting} className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md flex items-center gap-2">
                                {isSubmitting ? <Loader2 className="animate-spin w-4 h-4"/> : <Check className="w-4 h-4"/>} Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL THÀNH CÔNG --- */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in zoom-in-95 duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm text-center overflow-hidden">
                        <div className="bg-green-500 h-32 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/20 rotate-12 scale-150"></div>
                            <div className="bg-white p-4 rounded-full shadow-lg relative z-10">
                                <Check className="w-10 h-10 text-green-600" strokeWidth={4} />
                            </div>
                        </div>
                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">Mượn thành công!</h2>
                            <p className="text-gray-600 mb-6">
                                Cuốn sách <strong>{selectedCopy?.mabansaonoibo}</strong> đã được thêm vào danh sách mượn của bạn.
                            </p>
                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95"
                            >
                                Tuyệt vời
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}