// src/components/BookCopiesList.js
'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Check, Loader2, BookOpen, UserCheck, Lock, MapPin, X, Info, CalendarClock, BookmarkCheck } from 'lucide-react';
import { borrowBookAction, reserveBookAction } from '@/app/tai_lieu/actions';
import { getLoansByStatusAction } from '@/app/tai_khoan/actions';

export default function BookCopiesList({ copies, initialOwnedIds = [], initialReservedIds = [] }) {
    const [selectedCopy, setSelectedCopy] = useState(null);
    const [returnDate, setReturnDate] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);

    const [myBorrowedCopyIds, setMyBorrowedCopyIds] = useState(new Set(
        initialOwnedIds.map(id => String(id))
    ));

    const [myReservedCopyIds, setMyReservedCopyIds] = useState(new Set(
        initialReservedIds.map(id => String(id))
    ));

    useEffect(() => {
        setMounted(true);
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
            // 🛠️ FIX: Add String ID vào Set để cập nhật UI ngay lập tức
            setMyBorrowedCopyIds(prev => new Set(prev).add(String(selectedCopy.mabansao)));
        } else {
            alert(result.error || "Có lỗi xảy ra. Vui lòng thử lại.");
        }
    };

    // Hàm xử lý Đặt trước
    const handleReserve = async () => {
        setIsSubmitting(true);
        const result = await reserveBookAction(selectedCopy.mabansao);
        setIsSubmitting(false);

        if (result.success) {
            setIsReserveModalOpen(false);
            // Cập nhật UI ngay lập tức: Thêm ID vào danh sách đã đặt
            setMyReservedCopyIds(prev => new Set(prev).add(String(selectedCopy.mabansao)));
            // Hiển thị thông báo (có thể thay bằng Modal đẹp nếu muốn)
            alert("Đặt trước thành công! Hệ thống sẽ thông báo khi có sách.");
        } else {
            alert(result.error || "Có lỗi xảy ra.");
        }
    };

    const openReserveModal = (copy) => {
        setSelectedCopy(copy);
        setIsReserveModalOpen(true);
    }

    const BorrowModal = () => (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10 animate-in zoom-in-95 duration-200">
                <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"><X size={20}/></button>
                <div className="p-6 sm:p-8">
                    <div className="text-center mb-6">
                        <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-100"><BookOpen className="text-purple-600" size={28}/></div>
                        <h3 className="text-2xl font-bold text-gray-900">Xác nhận mượn sách</h3>
                        <p className="text-sm text-gray-500 mt-2">Vui lòng kiểm tra kỹ thông tin trước khi xác nhận.</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6">
                        <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200 border-dashed">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mã bản sao</span>
                            <span className="font-mono font-bold text-lg text-gray-900">{selectedCopy?.mabansaonoibo}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Vị trí</span>
                            <div className="flex items-center gap-1 text-sm font-medium text-gray-700 bg-white px-2 py-1 rounded border border-gray-200">
                                <MapPin size={14} className="text-purple-500"/>{selectedCopy?.vitri}
                            </div>
                        </div>
                    </div>
                    <div className="mb-8">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Hạn trả sách dự kiến <span className="text-red-500">*</span></label>
                        <div className="relative group">
                            <input type="date" value={returnDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => setReturnDate(e.target.value)} className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none pl-12 font-medium text-gray-700 bg-white transition-all group-hover:border-purple-300"/>
                            <Calendar className="absolute left-4 top-3.5 text-gray-400 group-hover:text-purple-500 transition-colors" size={20} />
                        </div>
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><Info size={12}/> Quá hạn trả sách sẽ bị tính phí phạt theo quy định.</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="flex-1 px-5 py-3.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 hover:text-gray-900 transition-colors">Hủy bỏ</button>
                        <button onClick={handleBorrow} disabled={isSubmitting} className="flex-1 px-5 py-3.5 rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 text-white font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">{isSubmitting ? <Loader2 className="animate-spin w-5 h-5"/> : "Xác nhận"}</button>
                    </div>
                </div>
            </div>
        </div>
    );

    // --- MODAL ĐẶT TRƯỚC (Reserve Modal) ---
    const ReserveModal = () => (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsReserveModalOpen(false)}></div>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative z-10 animate-in zoom-in-95">
                <div className="p-6 text-center">
                    <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-100">
                        <CalendarClock className="text-orange-600" size={28}/>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Đặt trước tài liệu</h3>
                    <p className="text-sm text-gray-500 mt-2">
                        Bản sao <strong>{selectedCopy?.mabansaonoibo}</strong> đang được mượn. Bạn có muốn đặt hàng chờ không?
                    </p>
                    <div className="mt-6 flex gap-3">
                        <button onClick={() => setIsReserveModalOpen(false)} className="flex-1 px-4 py-3 rounded-xl border font-bold text-gray-600 hover:bg-gray-50">Hủy</button>
                        <button
                            onClick={handleReserve}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-3 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 flex justify-center items-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin"/> : "Xác nhận"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const SuccessModal = () => (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowSuccessModal(false)}></div>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm text-center overflow-hidden relative z-10 animate-in zoom-in-95 duration-300">
                <div className="h-2 w-full bg-linear-to-r from-green-400 via-emerald-500 to-teal-500"></div>
                <div className="p-8 pb-6">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-100"><Check className="w-10 h-10 text-green-600" strokeWidth={3} /></div>
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Đăng ký thành công!</h2>
                    <p className="text-gray-600 leading-relaxed">Bạn đã đăng ký mượn cuốn sách <br/><span className="inline-block mt-1 font-mono font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">{selectedCopy?.mabansaonoibo}</span></p>
                </div>
                <div className="px-8 pb-8">
                    <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-xl mb-6 text-left border border-blue-100 flex gap-3 items-start"><Info className="shrink-0 text-blue-600 mt-0.5" size={18}/><div><strong>Bước tiếp theo:</strong> Vui lòng đến quầy thủ thư để nhận sách. Mang theo thẻ thành viên hoặc mã QR trên ứng dụng.</div></div>
                    <button onClick={() => setShowSuccessModal(false)} className="w-full py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95">Đã hiểu, cảm ơn!</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="p-2 bg-purple-100 rounded-lg"><BookOpen className="text-purple-600" size={20}/></div>
                Danh sách bản sao vật lý
            </h3>

            <div className="overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mã bản sao</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Vị trí lưu trữ</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {copies.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <Info size={32} className="text-gray-300"/>
                                            <p>Chưa có bản sao nào được cập nhật.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                copies.map((copy) => {
                                    const copyIdStr = String(copy.mabansao);
                                    const isMine = myBorrowedCopyIds.has(copyIdStr);
                                    const isReserved = myReservedCopyIds.has(copyIdStr);
                                    const isAvailable = copy.trangthaichomuon;

                                    return (
                                        <tr key={copy.mabansao} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg text-sm border border-blue-100">
                                                    {copy.mabansaonoibo}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                <div className="flex items-center gap-2 font-medium">
                                                    <MapPin size={16} className="text-gray-400"/> {copy.vitri}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {isMine ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                                        <UserCheck size={14} className="mr-1.5"/> Bạn đang giữ
                                                    </span>
                                                ) : isAvailable ? (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                                        <Check size={14} className="mr-1.5"/> Có sẵn
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                                        <Lock size={14} className="mr-1.5"/> Đã mượn
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                {isMine ? (
                                                    <button disabled className="text-sm font-semibold text-blue-600/50 cursor-not-allowed flex items-center gap-1 ml-auto">
                                                        <UserCheck size={16}/> Đang sở hữu
                                                    </button>
                                                ) : isReserved ? (
                                                    <button disabled className="px-4 py-2 bg-yellow-50 text-yellow-700 text-sm font-bold rounded-xl border border-yellow-200 cursor-not-allowed flex items-center gap-2 ml-auto opacity-80">
                                                        <BookmarkCheck size={16}/> Bạn đã đặt trước
                                                    </button>
                                                ) : isAvailable ? (
                                                    <button
                                                        onClick={() => openBorrowModal(copy)}
                                                        className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-md hover:bg-blue-700 transition-all ml-auto"
                                                    >
                                                        Mượn ngay
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => openReserveModal(copy)}
                                                        className="px-4 py-2 bg-orange-100 text-orange-700 text-sm font-bold rounded-xl border border-orange-200 hover:bg-orange-200 transition-all flex items-center gap-2 ml-auto"
                                                    >
                                                        <CalendarClock size={16}/> Đặt trước
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {mounted && isModalOpen && createPortal(<BorrowModal />, document.body)}
            {mounted && isReserveModalOpen && createPortal(<ReserveModal />, document.body)}
            {mounted && showSuccessModal && createPortal(<SuccessModal />, document.body)}
        </div>
    );
}