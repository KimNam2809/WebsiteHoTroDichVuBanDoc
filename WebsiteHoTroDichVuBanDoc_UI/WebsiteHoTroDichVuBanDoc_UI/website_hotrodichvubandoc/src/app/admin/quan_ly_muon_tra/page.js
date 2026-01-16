'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { Search, RefreshCw, CheckCircle, BookUp, QrCode, X, User, BookOpen, Calendar, AlertTriangle, Loader2, Clock, BadgeCheck, Check, Info } from 'lucide-react';
import { getActiveLoansAction, getPendingBorrowAction, returnBookAction, confirmBorrowAction } from '../actions';

export default function QuanLyMuonTraPage() {
    // Data State
    const [loans, setLoans] = useState([]); // Active Loans
    const [pendingLoans, setPendingLoans] = useState([]); // Pending Loans

    // Filtered State
    const [filteredLoans, setFilteredLoans] = useState([]);
    const [filteredPending, setFilteredPending] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    // UI State
    const [activeTab, setActiveTab] = useState('active'); // 'pending', 'active'

    // Modal State
    const [selectedLoan, setSelectedLoan] = useState(null); // Used for both Confirm & Return
    const [modalMode, setModalMode] = useState(''); // 'confirm_borrow', 'return_book'
    const [isProcessing, setIsProcessing] = useState(false);

    // Modal Success Notification State
    const [showSuccessModalConfirm, setShowSuccessModalConfirm] = useState(false);
    const [showSuccessModalReturn, setShowSuccessModalReturn] = useState(false);

    // 1. Tải dữ liệu
    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        setMounted(true);
    }, []);

    async function loadData() {
        setIsLoading(true);
        const [activeData, pendingData] = await Promise.all([
            getActiveLoansAction(),
            getPendingBorrowAction()
        ]);

        setLoans(activeData || []);
        setPendingLoans(pendingData || []);

        // Reset filters (simple version, re-apply search if needed but reset is safer for now)
        setFilteredLoans(activeData || []);
        setFilteredPending(pendingData || []);

        setIsLoading(false);
    }

    // 2. Tìm kiếm (Effect chạy khi searchTerm hoặc data gốc thay đổi)
    useEffect(() => {
        const lowerTerm = searchTerm.toLowerCase().trim();

        const filterFn = (list) => {
            if (!lowerTerm) return list;
            return list.filter(loan =>
                loan.mabansaonoibo?.toLowerCase().includes(lowerTerm) ||
                loan.nguoimuon?.toLowerCase().includes(lowerTerm) ||
                loan.tentacpham?.toLowerCase().includes(lowerTerm) ||
                String(loan.mamuontra).includes(lowerTerm)
            );
        };

        setFilteredLoans(filterFn(loans));
        setFilteredPending(filterFn(pendingLoans));

    }, [searchTerm, loans, pendingLoans]);

    // 3. Modal Handlers
    function openReturnModal(loan) {
        setSelectedLoan(loan);
        setModalMode('return_book');
    }

    function openConfirmModal(loan) {
        setSelectedLoan(loan);
        setModalMode('confirm_borrow');
    }

    // 4. API Handlers
    async function handleConfirmBorrow() {
        if (!selectedLoan) return;
        setIsProcessing(true);

        const res = await confirmBorrowAction(selectedLoan.mamuontra);

        setIsProcessing(false);
        if (res.success) {
            setShowSuccessModalConfirm(true);
            closeModal();
            loadData(); // Reload to move item from Pending -> Active
        } else {
            alert(res.error || "Có lỗi xảy ra.");
        }
    }

    async function handleReturnBook() {
        if (!selectedLoan) return;
        setIsProcessing(true);

        const res = await returnBookAction(selectedLoan.mamuontra);

        setIsProcessing(false);
        if (res.success) {
            setShowSuccessModalReturn(true);
            closeModal();
            loadData(); // Reload to remove from Active
        } else {
            alert(res.error || "Có lỗi xảy ra.");
        }
    }

    function closeModal() {
        setSelectedLoan(null);
        setModalMode('');
    }

    const SuccessModalConfirm = () => (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowSuccessModal(false)}></div>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm text-center overflow-hidden relative z-10 animate-in zoom-in-95 duration-300">
                <div className="h-2 w-full bg-linear-to-r from-green-400 via-emerald-500 to-teal-500"></div>
                <div className="p-8 pb-6">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-100"><Check className="w-10 h-10 text-green-600" strokeWidth={3} /></div>
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Phê duyệt thành công!</h2>
                    <p className="text-gray-600 leading-relaxed">Bạn đã phê duyệt đăng ký mượn thành công <br/></p>
                </div>
                <div className="px-8 pb-8">
                    <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-xl mb-6 text-left border border-blue-100 flex gap-3 items-start"><Info className="shrink-0 text-blue-600 mt-0.5" size={18}/><div><strong>Bước tiếp theo:</strong> Thực hiện tiếp công việc.</div></div>
                    <button onClick={() => setShowSuccessModal(false)} className="w-full py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95">Đã hiểu, cảm ơn!</button>
                </div>
            </div>
        </div>
    );

    const SuccessModalReturn = () => (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowSuccessModalReturn(false)}></div>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm text-center overflow-hidden relative z-10 animate-in zoom-in-95 duration-300">
                <div className="h-2 w-full bg-linear-to-r from-green-400 via-emerald-500 to-teal-500"></div>
                <div className="p-8 pb-6">
                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-green-100"><Check className="w-10 h-10 text-green-600" strokeWidth={3} /></div>
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Đã trả sách thành công!</h2>
                    <p className="text-gray-600 leading-relaxed">Bạn đã thực hiện xong công việc trả sách <br/></p>
                </div>
                <div className="px-8 pb-8">
                    <div className="bg-blue-50 text-blue-800 text-sm p-4 rounded-xl mb-6 text-left border border-blue-100 flex gap-3 items-start"><Info className="shrink-0 text-blue-600 mt-0.5" size={18}/><div><strong>Bước tiếp theo:</strong> Thực hiện tiếp công việc.</div></div>
                    <button onClick={() => setShowSuccessModalReturn(false)} className="w-full py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95">Đã hiểu, cảm ơn!</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Quản lý Mượn Trả</h1>
                <button onClick={loadData} className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-3 py-2 rounded transition">
                    <RefreshCw size={18} /> Làm mới
                </button>
            </div>

            {/* TABS */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('active')}
                    className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'active' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <BookUp size={18} /> Đang Mượn
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{filteredLoans.length}</span>
                </button>
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'pending' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Clock size={18} /> Chờ Xác Nhận
                    {pendingLoans.length > 0 && <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs animate-pulse">{pendingLoans.length}</span>}
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm phiếu</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Nhập mã phiếu, mã sách, tên sách hoặc tên bạn đọc..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="p-20 flex flex-col items-center justify-center text-gray-500 gap-4">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                        <span>Đang tải dữ liệu...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                                <tr>
                                    <th className="px-6 py-3 text-left">Mã Phiếu</th>
                                    <th className="px-6 py-3 text-left">Thông tin Sách</th>
                                    <th className="px-6 py-3 text-left">Bạn đọc</th>
                                    <th className="px-6 py-3 text-left">Thời gian</th>
                                    <th className="px-6 py-3 text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {(activeTab === 'active' ? filteredLoans : filteredPending).map((loan) => {
                                    // Logic: Quá hạn = Hiện tại > Hạn trả
                                    // User Request: "quá 2 ngày so với ngaytra" -> warning logic
                                    const dueDate = new Date(loan.ngaytradukien);
                                    const now = new Date();

                                    // Calculate diff in days
                                    const diffTime = now - dueDate;
                                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                                    // Logic hiển thị warning theo yêu cầu
                                    // Nếu đã có nhân viên (Active) & daMuon & quá 2 ngày -> Cảnh báo
                                    const isLateWarning = activeTab === 'active' && diffDays > 2;

                                    // Logic status gốc từ DB (để tham khảo)
                                    const isDbOverdue = loan.trangthai === 'quaHan';

                                    return (
                                        <tr key={loan.mamuontra} className="hover:bg-blue-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-gray-700">#{loan.mamuontra}</td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-gray-900">{loan.tentacpham}</div>
                                                <div className="text-xs text-gray-500 font-mono bg-gray-100 px-1 py-0.5 rounded w-fit mt-1">{loan.mabansaonoibo}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                <div>{loan.nguoimuon}</div>
                                                <div className="text-xs text-gray-400">{loan.sothe || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {activeTab === 'active' ? (
                                                    <div className={`text-xs font-bold ${isLateWarning || isDbOverdue ? 'text-red-600' : 'text-green-600'}`}>
                                                        Hạn: {dueDate.toLocaleDateString('vi-VN')}

                                                        {/* Hiển thị cảnh báo nếu quá hạn > 2 ngày */}
                                                        {isLateWarning && (
                                                            <div className="flex items-center gap-1 mt-1 text-red-600 animate-pulse">
                                                                <AlertTriangle size={12} />
                                                                <span>Quá hạn {diffDays} ngày</span>
                                                            </div>
                                                        )}

                                                        {!isLateWarning && isDbOverdue && <span className="ml-1 block text-[10px] bg-red-100 text-red-600 w-fit px-1 rounded">Quá hạn</span>}
                                                    </div>
                                                ) : (
                                                    <div className="text-xs text-orange-600 font-medium">
                                                        Đặt lúc: {new Date(loan.ngaymuon).toLocaleDateString('vi-VN')}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {activeTab === 'active' ? (
                                                    <button
                                                        onClick={() => openReturnModal(loan)}
                                                        className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-bold text-green-700 bg-green-100 hover:bg-green-200 transition-colors border border-green-200"
                                                    >
                                                        <CheckCircle size={14} className="mr-1" /> Trả sách
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => openConfirmModal(loan)}
                                                        className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all active:scale-95"
                                                    >
                                                        <BadgeCheck size={14} className="mr-1" /> Duyệt Mượn
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {(activeTab === 'active' ? filteredLoans : filteredPending).length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-10 text-center text-gray-400 italic">
                                            Không có dữ liệu nào.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* === MODAL CONFIRMATION (REUSABLE) === */}
            {selectedLoan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden max-h-[90vh]">

                        {/* Header */}
                        <div className={`flex justify-between items-center p-5 border-b ${modalMode === 'confirm_borrow' ? 'bg-blue-50' : 'bg-green-50'}`}>
                            <h3 className={`text-xl font-bold flex items-center gap-2 ${modalMode === 'confirm_borrow' ? 'text-blue-800' : 'text-green-800'}`}>
                                {modalMode === 'confirm_borrow' ? <BadgeCheck className="text-blue-600" /> : <CheckCircle className="text-green-600" />}
                                {modalMode === 'confirm_borrow' ? 'Xác nhận Cho Mượn' : 'Xác nhận Trả Sách'}
                            </h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>

                        {/* Body */}
                        <div className="flex-1 p-6 bg-gray-50/50 overflow-y-auto">
                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Cột 1: Thông tin Sách */}
                                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                    <h4 className="text-sm font-bold text-gray-500 uppercase mb-4 border-b pb-2 flex items-center gap-2">
                                        <BookOpen size={18} /> Tài liệu
                                    </h4>
                                    <div className="flex flex-col items-center text-center">
                                        <div className="relative w-32 h-48 bg-gray-200 rounded-md shadow-md overflow-hidden mb-4">
                                            {selectedLoan.anhbia ? (
                                                <Image src={selectedLoan.anhbia} alt="" fill className="object-cover" unoptimized />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-400 text-xs">No Cover</div>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">{selectedLoan.tentacpham}</h3>
                                        <p className="text-sm text-gray-500 mt-1">Mã bản sao: <span className="font-mono font-bold text-black bg-yellow-100 px-1 rounded">{selectedLoan.mabansaonoibo}</span></p>
                                    </div>
                                </div>

                                {/* Cột 2: Thông tin Bạn đọc */}
                                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                    <h4 className="text-sm font-bold text-gray-500 uppercase mb-4 border-b pb-2 flex items-center gap-2">
                                        <User size={18} /> Người mượn
                                    </h4>
                                    <div className="flex flex-col items-center text-center">
                                        <div className="relative w-32 h-40 bg-gray-200 rounded-md shadow-md overflow-hidden mb-4 border-2 border-white">
                                            {selectedLoan.anhdocgia ? (
                                                <Image src={selectedLoan.anhdocgia} alt="" fill className="object-cover" unoptimized />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-400 text-xs">No Avatar</div>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold text-blue-800">{selectedLoan.nguoimuon}</h3>
                                        <p className="text-sm text-gray-500 mt-1">Số thẻ: {selectedLoan.sothe || '---'}</p>

                                        <div className="mt-4 w-full bg-gray-50 p-3 rounded border text-left text-sm">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-gray-500">Ngày tạo:</span>
                                                <span className="font-medium">{new Date(selectedLoan.ngaymuon).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Hạn trả:</span>
                                                <span className="font-bold text-blue-600">
                                                    {new Date(selectedLoan.ngaytradukien).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Alert Context */}
                            {modalMode === 'confirm_borrow' && (
                                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
                                    <strong><BadgeCheck size={16} className="inline mr-1" /> Xác nhận cho mượn:</strong> Hành động này sẽ cập nhật trạng thái phiếu thành &quot;Đã mượn&quot; và ghi nhận Mã nhân viên của bạn vào hệ thống.
                                </div>
                            )}

                            {modalMode === 'return_book' && selectedLoan.trangThai === 'quaHan' && (
                                <div className="mt-6 p-3 bg-red-100 border border-red-200 rounded-lg flex items-center gap-3 text-red-800">
                                    <AlertTriangle size={24} />
                                    <div>
                                        <p className="font-bold">Cảnh báo quá hạn!</p>
                                        <p className="text-sm">Bạn đọc này trả sách muộn. Vui lòng kiểm tra và thu phí phạt (nếu có) trước khi xác nhận.</p>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Footer */}
                        <div className="p-5 border-t bg-white flex justify-end gap-3">
                            <button
                                onClick={closeModal}
                                className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                                disabled={isProcessing}
                            >
                                Hủy bỏ
                            </button>

                            {modalMode === 'confirm_borrow' ? (
                                <button
                                    onClick={handleConfirmBorrow}
                                    disabled={isProcessing}
                                    className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95"
                                >
                                    {isProcessing ? <Loader2 className="animate-spin" /> : <BadgeCheck size={20} />}
                                    XÁC NHẬN CHO MƯỢN
                                </button>
                            ) : (
                                <button
                                    onClick={handleReturnBook}
                                    disabled={isProcessing}
                                    className="px-8 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95"
                                >
                                    {isProcessing ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                                    XÁC NHẬN TRẢ SÁCH
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            )}

        {mounted && showSuccessModalConfirm && createPortal(<SuccessModalConfirm />, document.body)}
        {mounted && showSuccessModalReturn && createPortal(<SuccessModalReturn />, document.body)}
        </div>
    );
}