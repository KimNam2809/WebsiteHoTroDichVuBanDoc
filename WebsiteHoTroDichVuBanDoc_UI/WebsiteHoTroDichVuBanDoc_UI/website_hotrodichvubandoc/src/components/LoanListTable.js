// src/components/LoanListTable.js
'use client';

import { useState, useEffect } from 'react';
import { Eye, X, Calendar, Book, AlertCircle, CheckCircle, Clock, Hash, RefreshCw, Save } from 'lucide-react';
import { renewLoanAction } from '@/app/tai_khoan/actions';

// Hàm format tiền
const formatCurrency = (amount) => {
    if (!amount) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Hàm format ngày hiển thị (DD/MM/YYYY)
const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('vi-VN');
};

// Hàm format ngày cho input type="date" (YYYY-MM-DD)
const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().split('T')[0];
};

export default function LoanListTable({ loans, title, emptyMessage }) {
    const [selectedLoan, setSelectedLoan] = useState(null);

    // --- STATES CHO CHỨC NĂNG GIA HẠN ---
    const [isRenewing, setIsRenewing] = useState(false); // Bật/tắt form gia hạn
    const [renewDate, setRenewDate] = useState('');
    const [renewReason, setRenewReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

    // Reset state khi mở modal mới
    useEffect(() => {
        if (selectedLoan) {
            setIsRenewing(false);
            setMessage(null);
            setRenewReason('');

            // Mặc định gợi ý ngày trả mới = Hạn cũ + 7 ngày
            if (selectedLoan.ngaytradukien) {
                const nextWeek = new Date(selectedLoan.ngaytradukien);
                nextWeek.setDate(nextWeek.getDate() + 7);
                setRenewDate(formatDateForInput(nextWeek));
            }
        }
    }, [selectedLoan]);

    // --- HÀM XỬ LÝ GIA HẠN ---
    const handleRenewSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            // Chuẩn bị dữ liệu gửi đi
            const payload = {
                maMuonTra: selectedLoan.mamuontra,
                maNhanVien: null, // Bạn đọc tự gia hạn
                ngayTraMoi: renewDate,
                lyDoGiaHan: renewReason || "Gia hạn trực tuyến"
            };

            // 👇 Gọi Server Action thay vì fetch trực tiếp
            const result = await renewLoanAction(payload);

            if (!result.success) {
                throw new Error(result.error);
            }

            setMessage({ type: 'success', text: 'Gia hạn thành công!' });

            // Tắt form và reload trang sau 1.5s để cập nhật dữ liệu mới
            setTimeout(() => {
                setIsRenewing(false);
                window.location.reload();
            }, 1500);

        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    // Helper lấy màu sắc trạng thái
    const getStatusBadge = (status) => {
        switch (status) {
            case 'daMuon': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">Đang mượn</span>;
            case 'quaHan': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">Quá hạn</span>;
            case 'daTra': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">Đã trả</span>;
            default: return <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            {/* Header của bảng */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-800">{title}</h2>
                <span className="text-sm text-gray-500">{loans.length} bản ghi</span>
            </div>

            {loans.length === 0 ? (
                <div className="p-12 text-center text-gray-500 italic">
                    {emptyMessage}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tài liệu</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày mượn</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hạn trả / Ngày trả</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loans.map((loan) => (
                                <tr key={loan.mamuontra} className="hover:bg-blue-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-bold text-gray-900">{loan.tentacpham}</div>
                                        <div className="text-xs text-gray-500 font-mono flex items-center gap-1">
                                            <Hash size={10}/> {loan.mabansaonoibo}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {formatDate(loan.ngaymuon)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {loan.trangthai === 'daTra' ? formatDate(loan.ngaytrathucte) : formatDate(loan.ngaytradukien)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(loan.trangthai)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <button
                                            onClick={() => setSelectedLoan(loan)}
                                            className="text-blue-600 hover:text-blue-900 p-2 rounded-full hover:bg-blue-100 transition-colors"
                                            title="Xem chi tiết"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* === MODAL CHI TIẾT === */}
            {selectedLoan && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-5 border-b bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-800">Phiếu mượn #{selectedLoan.mamuontra}</h3>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">

                            {/* Thông tin sách */}
                            <div className="flex items-start gap-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <div className="p-3 bg-white rounded-full shadow-sm">
                                    <Book className="text-blue-600 w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-blue-600 font-bold uppercase mb-1">Tài liệu</p>
                                    <p className="font-bold text-lg text-gray-800 leading-tight">{selectedLoan.tentacpham}</p>
                                    <p className="text-sm text-gray-600 mt-1 font-mono">Mã bản sao: {selectedLoan.mabansaonoibo}</p>
                                </div>
                            </div>

                            {/* Lưới thông tin thời gian */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Ngày mượn</p>
                                    <p className="font-medium text-gray-900 flex items-center gap-2">
                                        <Calendar size={16} className="text-gray-400"/> {formatDate(selectedLoan.ngaymuon)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Hạn trả</p>
                                    <p className="font-medium text-gray-900 flex items-center gap-2">
                                        <Clock size={16} className="text-gray-400"/> {formatDate(selectedLoan.ngaytradukien)}
                                    </p>
                                </div>

                                {selectedLoan.trangthai === 'daTra' && (
                                    <div className="col-span-2 border-t pt-4">
                                        <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Ngày trả thực tế</p>
                                        <p className="font-medium flex items-center gap-2 text-green-700 text-lg">
                                            <CheckCircle size={20}/> {formatDate(selectedLoan.ngaytrathucte)}
                                        </p>
                                    </div>
                                )}

                                {selectedLoan.tienphat > 0 && (
                                    <div className="col-span-2 bg-red-50 p-4 rounded-lg border border-red-100 flex items-center justify-between mt-2">
                                        <div className="flex items-center gap-2 text-red-700">
                                            <AlertCircle size={20} />
                                            <span className="font-bold">Tiền phạt vi phạm</span>
                                        </div>
                                        <span className="font-bold text-red-700 text-xl">{formatCurrency(selectedLoan.tienphat)}</span>
                                    </div>
                                )}
                            </div>

                            {/* =================================================== */}
                            {/* KHU VỰC GIA HẠN (Chỉ hiện khi Đang mượn) */}
                            {/* =================================================== */}
                            {selectedLoan.trangthai === 'daMuon' && (
                                <div className="mt-4 border-t border-gray-100 pt-6">
                                    {/* Nút bấm để mở Form */}
                                    {!isRenewing ? (
                                        <button
                                            onClick={() => setIsRenewing(true)}
                                            className="w-full py-3 bg-white border-2 border-blue-600 text-blue-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-all"
                                        >
                                            <RefreshCw size={18} /> Đăng ký Gia hạn
                                        </button>
                                    ) : (
                                        // Form Gia hạn
                                        <form onSubmit={handleRenewSubmit} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                                    <RefreshCw size={18} className="text-blue-600"/> Gia hạn tài liệu
                                                </h4>
                                                <button type="button" onClick={() => setIsRenewing(false)} className="text-gray-400 hover:text-red-500">
                                                    <X size={18} />
                                                </button>
                                            </div>

                                            {/* Chọn ngày */}
                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700">Gia hạn đến ngày:</label>
                                                <input
                                                    type="date"
                                                    required
                                                    value={renewDate}
                                                    onChange={(e) => setRenewDate(e.target.value)}
                                                    min={formatDateForInput(new Date())} // Không chọn ngày quá khứ
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                                />
                                            </div>

                                            {/* Lý do */}
                                            <div className="space-y-1">
                                                <label className="text-sm font-semibold text-gray-700">Lý do (Tùy chọn):</label>
                                                <textarea
                                                    value={renewReason}
                                                    onChange={(e) => setRenewReason(e.target.value)}
                                                    placeholder="Ví dụ: Chưa đọc xong..."
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white h-20 resize-none"
                                                />
                                            </div>

                                            {/* Thông báo lỗi/thành công */}
                                            {message && (
                                                <div className={`p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {message.type === 'success' ? <CheckCircle size={16}/> : <AlertCircle size={16}/>}
                                                    {message.text}
                                                </div>
                                            )}

                                            {/* Buttons Action */}
                                            <div className="flex gap-3 pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setIsRenewing(false)}
                                                    className="flex-1 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100"
                                                >
                                                    Hủy
                                                </button>
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-70 flex items-center justify-center gap-2"
                                                >
                                                    {loading ? 'Đang xử lý...' : <><Save size={18}/> Xác nhận</>}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-5 border-t bg-gray-50 flex justify-end">
                            <button
                                onClick={() => setSelectedLoan(null)}
                                className="px-6 py-2.5 rounded-lg bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium shadow-sm transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}