// src/app/admin/quan_ly_muon_tra/page.js
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, RefreshCw, CheckCircle, BookUp, QrCode, X, User, BookOpen, Calendar, AlertTriangle, Loader2 } from 'lucide-react';
import { getActiveLoansAction, returnBookAction } from '../actions';

export default function QuanLyMuonTraPage() {
    const [loans, setLoans] = useState([]);
    const [filteredLoans, setFilteredLoans] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // State cho Modal Xác nhận Trả
    const [loanToReturn, setLoanToReturn] = useState(null); // Lưu object phiếu mượn đang chọn
    const [isProcessing, setIsProcessing] = useState(false);

    // 1. Tải dữ liệu
    useEffect(() => { loadData(); }, []);

    async function loadData() {
        setIsLoading(true);
        const data = await getActiveLoansAction();
        setLoans(data || []);
        setFilteredLoans(data || []);
        setIsLoading(false);
    }

    // 2. Tìm kiếm
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredLoans(loans);
            return;
        }
        const lowerTerm = searchTerm.toLowerCase();
        const filtered = loans.filter(loan =>
            loan.mabansaonoibo?.toLowerCase().includes(lowerTerm) ||
            loan.nguoimuon?.toLowerCase().includes(lowerTerm) ||
            loan.tentacpham?.toLowerCase().includes(lowerTerm) ||
            String(loan.mamuontra).includes(lowerTerm)
        );
        setFilteredLoans(filtered);
    }, [searchTerm, loans]);

    // 3. Xử lý nút "Xác nhận Trả" (Chỉ mở Modal)
    function openConfirmModal(loan) {
        setLoanToReturn(loan);
    }

    // 4. Xử lý logic Trả sách thật (Gọi API)
    async function confirmReturn() {
        if (!loanToReturn) return;

        setIsProcessing(true);
        const res = await returnBookAction(loanToReturn.mamuontra);
        setIsProcessing(false);

        if (res.success) {
            // Đóng modal và cập nhật list
            setLoanToReturn(null);
            const newLoans = loans.filter(l => l.mamuontra !== loanToReturn.mamuontra);
            setLoans(newLoans);
            // Nếu đang search thì filter lại luôn
            if (searchTerm) {
                setFilteredLoans(newLoans.filter(l => String(l.mamuontra).includes(searchTerm) || l.nguoimuon.toLowerCase().includes(searchTerm.toLowerCase())));
            } else {
                setFilteredLoans(newLoans);
            }
            alert("Đã trả sách thành công!");
        } else {
            alert(res.error);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Quản lý Mượn Trả</h1>
                <button onClick={loadData} className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-3 py-2 rounded transition">
                    <RefreshCw size={18} /> Làm mới
                </button>
            </div>

            {/* Search Bar (Giữ nguyên) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm phiếu mượn</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Nhập mã phiếu, mã sách, tên sách hoặc tên bạn đọc..."
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                            <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <button className="flex items-center gap-2 bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-900 transition shadow-md" onClick={() => alert('Tính năng đang phát triển')}>
                            <QrCode size={20} /> Quét Mã QR
                        </button>
                    </div>
                </div>
            </div>

            {/* Table List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-blue-50 flex justify-between items-center">
                    <h3 className="font-bold text-blue-800 flex items-center gap-2"><BookUp size={20}/> Danh sách đang mượn</h3>
                    <span className="text-sm text-gray-500">{filteredLoans.length} kết quả</span>
                </div>

                {isLoading ? (
                    <div className="p-10 text-center text-gray-500">Đang tải dữ liệu...</div>
                ) : filteredLoans.length === 0 ? (
                    <div className="p-10 text-center text-gray-500 italic">Không tìm thấy phiếu mượn nào.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                                <tr>
                                    <th className="px-6 py-3 text-left">Mã Phiếu</th>
                                    <th className="px-6 py-3 text-left">Thông tin Sách</th>
                                    <th className="px-6 py-3 text-left">Bạn đọc</th>
                                    <th className="px-6 py-3 text-left">Hạn trả</th>
                                    <th className="px-6 py-3 text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {filteredLoans.map((loan) => {
                                    const isOverdue = loan.trangthai === 'quaHan';
                                    return (
                                        <tr key={loan.mamuontra} className="hover:bg-blue-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-gray-700">#{loan.mamuontra}</td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold text-gray-900">{loan.tentacpham}</div>
                                                <div className="text-xs text-gray-500 font-mono bg-gray-100 px-1 py-0.5 rounded w-fit mt-1">{loan.mabansaonoibo}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{loan.nguoimuon}</td>
                                            <td className="px-6 py-4">
                                                <div className={`text-xs font-bold ${isOverdue ? 'text-red-600' : 'text-green-600'}`}>
                                                    {new Date(loan.ngaytradukien).toLocaleDateString('vi-VN')}
                                                    {isOverdue && <span className="ml-1">(Quá hạn)</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => openConfirmModal(loan)}
                                                    className="inline-flex items-center px-4 py-2 rounded-md text-sm font-bold text-white bg-green-600 hover:bg-green-700 shadow-sm hover:shadow-md active:scale-95 transition-all"
                                                >
                                                    <CheckCircle size={16} className="mr-2" /> Trả sách
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* === MODAL ĐỐI CHIẾU THÔNG TIN (NEW) === */}
            {loanToReturn && (
                <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden">

                        {/* Header */}
                        <div className="flex justify-between items-center p-5 border-b bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <CheckCircle className="text-green-600" /> Xác nhận Trả Sách
                            </h3>
                            <button onClick={() => setLoanToReturn(null)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
                        </div>

                        {/* Body: So sánh 2 cột */}
                        <div className="flex-1 p-6 bg-gray-50/50">
                            <div className="grid md:grid-cols-2 gap-8">

                                {/* Cột 1: Thông tin Sách */}
                                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                    <h4 className="text-sm font-bold text-gray-500 uppercase mb-4 border-b pb-2 flex items-center gap-2">
                                        <BookOpen size={18} /> Tài liệu hoàn trả
                                    </h4>
                                    <div className="flex flex-col items-center text-center">
                                        {/* Ảnh bìa sách */}
                                        <div className="relative w-32 h-48 bg-gray-200 rounded-md shadow-md overflow-hidden mb-4">
                                            {loanToReturn.anhbia ? (
                                                <Image src={loanToReturn.anhbia} alt="" fill className="object-cover" unoptimized />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-400 text-xs">No Cover</div>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">{loanToReturn.tentacpham}</h3>
                                        <p className="text-sm text-gray-500 mt-1">Mã bản sao: <span className="font-mono font-bold text-black bg-yellow-100 px-1 rounded">{loanToReturn.mabansaonoibo}</span></p>
                                    </div>
                                </div>

                                {/* Cột 2: Thông tin Bạn đọc */}
                                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                    <h4 className="text-sm font-bold text-gray-500 uppercase mb-4 border-b pb-2 flex items-center gap-2">
                                        <User size={18} /> Người mượn
                                    </h4>
                                    <div className="flex flex-col items-center text-center">
                                        {/* Ảnh bạn đọc */}
                                        <div className="relative w-32 h-40 bg-gray-200 rounded-md shadow-md overflow-hidden mb-4 border-2 border-white">
                                            {loanToReturn.anhdocgia ? (
                                                <Image src={loanToReturn.anhdocgia} alt="" fill className="object-cover" unoptimized />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-gray-400 text-xs">No Avatar</div>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold text-blue-800">{loanToReturn.nguoimuon}</h3>
                                        {/* <p className="text-sm text-gray-500 mt-1">Số thẻ: <span className="font-mono">{loanToReturn.soThe}</span></p> */}

                                        <div className="mt-4 w-full bg-gray-50 p-3 rounded border text-left text-sm">
                                            <div className="flex justify-between mb-1">
                                                <span className="text-gray-500">Ngày mượn:</span>
                                                <span className="font-medium">{new Date(loanToReturn.ngaymuon).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Hạn trả:</span>
                                                <span className={`font-bold ${loanToReturn.trangthai === 'quaHan' ? 'text-red-600' : 'text-green-600'}`}>
                                                    {new Date(loanToReturn.ngaytradukien).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            {/* Cảnh báo nếu quá hạn */}
                            {loanToReturn.trangThai === 'quaHan' && (
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
                                onClick={() => setLoanToReturn(null)}
                                className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                                disabled={isProcessing}
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={confirmReturn}
                                disabled={isProcessing}
                                className="px-8 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg flex items-center gap-2 transition-transform active:scale-95"
                            >
                                {isProcessing ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />}
                                XÁC NHẬN TRẢ SÁCH
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}