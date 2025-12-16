// src/components/BookCopiesList.js
'use client';

import { useState, useEffect } from 'react';
import { Calendar, Check, Loader2, BookOpen, UserCheck, Lock, MapPin, X } from 'lucide-react';
import { borrowBookAction } from '@/app/tai_lieu/actions';
import { getLoansByStatusAction } from '@/app/tai_khoan/actions';

export default function BookCopiesList({ copies }) {
    const [selectedCopy, setSelectedCopy] = useState(null);
    const [returnDate, setReturnDate] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [myBorrowedCopyIds, setMyBorrowedCopyIds] = useState(new Set());

    useEffect(() => {
        async function checkMyLoans() {
            // Cần try-catch để tránh lỗi nếu user chưa login (API trả về lỗi)
            try {
                const [borrowing, overdue] = await Promise.all([
                    getLoansByStatusAction('daMuon'),
                    getLoansByStatusAction('quaHan')
                ]);
                const allMyLoans = [...(Array.isArray(borrowing) ? borrowing : []), ...(Array.isArray(overdue) ? overdue : [])];
                const ids = new Set(allMyLoans.map(loan => loan.maBanSao));
                setMyBorrowedCopyIds(ids);
            } catch (e) {
                console.log("User not logged in or error checking loans");
            }
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
        <div className="animate-in">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <BookOpen className="text-purple-600"/> Danh sách bản sao vật lý
            </h3>

            <div className="overflow-hidden bg-white rounded-xl shadow-sm border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mã bản sao</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Vị trí lưu trữ</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {copies.length === 0 && (
                            <tr>
                                <td colSpan="4" className="px-6 py-8 text-center text-gray-500 italic">Chưa có bản sao nào được cập nhật.</td>
                            </tr>
                        )}
                        {copies.map((copy) => {
                            const isMine = myBorrowedCopyIds.has(copy.mabansao);
                            const isAvailable = copy.trangthaichomuon;

                            return (
                                <tr key={copy.mabansao} className={`transition-colors ${isMine ? 'bg-blue-50/60' : 'hover:bg-gray-50'}`}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded text-sm">
                                            {copy.mabansaonoibo}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <MapPin size={16} className="text-gray-400"/> {copy.vitri}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {isMine ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                <UserCheck size={12} className="mr-1"/> Bạn đang giữ
                                            </span>
                                        ) : isAvailable ? (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                <Check size={12} className="mr-1"/> Có sẵn
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                                <Lock size={12} className="mr-1"/> Đã mượn
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        {isMine ? (
                                            <button disabled className="text-sm font-semibold text-blue-600 opacity-50 cursor-not-allowed">
                                                Đang sở hữu
                                            </button>
                                        ) : isAvailable ? (
                                            <button
                                                onClick={() => openBorrowModal(copy)}
                                                className="px-4 py-2 bg-linear-to-r from-purple-600 to-indigo-600 text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                                            >
                                                Mượn ngay
                                            </button>
                                        ) : (
                                            <button disabled className="text-sm font-semibold text-gray-400 cursor-not-allowed">
                                                Không khả dụng
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL XÁC NHẬN (Glassmorphism) --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative transform transition-all scale-100">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition">
                            <X size={20}/>
                        </button>

                        <div className="p-6 pb-0">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                                <BookOpen className="text-purple-600" size={24}/>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Xác nhận mượn sách</h3>
                            <p className="text-sm text-gray-500 mt-1">Vui lòng kiểm tra kỹ thông tin bản sao và ngày trả dự kiến.</p>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Mã bản sao</span>
                                    <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Vị trí</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="font-mono font-bold text-xl text-gray-900">{selectedCopy?.mabansaonoibo}</span>
                                    <span className="text-sm font-medium text-gray-700">{selectedCopy?.vitri}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Hạn trả sách dự kiến</label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={returnDate}
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setReturnDate(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none pl-11 font-medium text-gray-700 bg-gray-50 focus:bg-white transition-colors"
                                    />
                                    <Calendar className="absolute left-3.5 top-3.5 text-gray-400" size={20} />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Lưu ý: Quá hạn trả sách sẽ bị tính phí phạt theo quy định.</p>
                            </div>
                        </div>

                        <div className="p-6 pt-0 flex gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                disabled={isSubmitting}
                                className="flex-1 px-5 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleBorrow}
                                disabled={isSubmitting}
                                className="flex-1 px-5 py-3 rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 text-white font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin w-5 h-5"/> : <Check className="w-5 h-5"/>} Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL THÀNH CÔNG --- */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm text-center overflow-hidden relative">
                        {/* Confetti Decoration (CSS) */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-green-400 via-blue-500 to-purple-600"></div>

                        <div className="p-8 pb-0 flex flex-col items-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce-slow">
                                <Check className="w-10 h-10 text-green-600" strokeWidth={4} />
                            </div>
                            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Đăng ký thành công!</h2>
                            <p className="text-gray-600">
                                Bạn đã đăng ký mượn cuốn sách <br/>
                                <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{selectedCopy?.mabansaonoibo}</span>
                            </p>
                        </div>

                        <div className="p-8">
                            <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-lg mb-6 text-left">
                                💡 <strong>Tiếp theo:</strong> Vui lòng đến quầy thủ thư để nhận sách. Mang theo thẻ thành viên hoặc mã QR trên ứng dụng.
                            </div>
                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="w-full py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95"
                            >
                                Đã hiểu, cảm ơn!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}