// src/components/LoanListTable.js
// Component này sẽ được dùng cho cả trang "Lịch sử" và trang "Đang mượn"
'use client';

import { useState } from 'react';
import { Eye, X, Calendar, Book, AlertCircle, CheckCircle, Clock, Hash } from 'lucide-react';

// Hàm format tiền
const formatCurrency = (amount) => {
    if (!amount) return '0 VNĐ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

// Hàm format ngày
const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('vi-VN');
};

export default function LoanListTable({ loans, title, emptyMessage }) {
    const [selectedLoan, setSelectedLoan] = useState(null);

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
                                        {/* Ưu tiên hiện ngày trả thực tế nếu đã trả, nếu không hiện hạn trả */}
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
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-5 border-b bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-800">Phiếu mượn #{selectedLoan.mamuontra}</h3>
                            <button onClick={() => setSelectedLoan(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6 overflow-y-auto">

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

                                {/* Thông tin trả sách (nếu có) */}
                                {selectedLoan.trangthai === 'daTra' && (
                                    <div className="col-span-2 border-t pt-4">
                                        <p className="text-gray-500 text-xs uppercase font-semibold mb-1">Ngày trả thực tế</p>
                                        <p className="font-medium flex items-center gap-2 text-green-700 text-lg">
                                            <CheckCircle size={20}/> {formatDate(selectedLoan.ngaytrathucte)}
                                        </p>
                                    </div>
                                )}

                                {/* Thông tin tiền phạt (nếu có) */}
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