// src/app/admin/phe_duyet_the/page.js
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Check, X, Eye, Loader2, MapPin, User, Calendar, Phone, Mail, AlertTriangle } from 'lucide-react';
import { getPendingCardsAction, approveCardAction, getCardRequestDetailAction } from '../actions';

export default function PheDuyetThePage() {
    // State cho danh sách
    const [applications, setApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // State cho Modal chi tiết
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // 1. Tải danh sách hồ sơ chờ duyệt
    useEffect(() => {
        loadList();
    }, []);

    async function loadList() {
        setIsLoading(true);
        const data = await getPendingCardsAction();
        setApplications(data || []);
        setIsLoading(false);
    }

    // 2. Hàm mở Modal và gọi API lấy chi tiết
    async function openDetailModal(id) {
        setIsModalOpen(true);
        setSelectedRequest(null);
        setRejectReason('');

        const detail = await getCardRequestDetailAction(id);

        if (detail) {
            setSelectedRequest(detail);
        } else {
            alert("Không thể tải thông tin chi tiết hồ sơ này.");
            setIsModalOpen(false);
        }
    }

    function closeModal() {
        setIsModalOpen(false);
        setRejectReason('');
    }

    // 3. Xử lý hành động Duyệt hoặc Từ chối
    async function handleReviewInModal(status) {
        if (status === 'tuChoi' && !rejectReason.trim()) {
            alert("Vui lòng nhập lý do từ chối để lưu vào lịch sử.");
            return;
        }

        const confirmMsg = status === 'daDuyet'
            ? 'Bạn có chắc chắn muốn DUYỆT hồ sơ này và cấp thẻ mới?'
            : 'Bạn có chắc chắn muốn TỪ CHỐI hồ sơ này?';

        if (!confirm(confirmMsg)) return;

        setIsProcessing(true);
        const res = await approveCardAction(
            selectedRequest.mayeucauthe,
            status,
            rejectReason
        );
        setIsProcessing(false);

        if (res.success) {
            alert('Thao tác thành công!');
            closeModal();
            loadList();
        } else {
            alert(res.error || 'Có lỗi xảy ra trong quá trình xử lý.');
        }
    }

    return (
        <div className="relative min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">Phê duyệt hồ sơ đăng ký thẻ</h1>

            {/* --- PHẦN 1: DANH SÁCH (List View) --- */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-700">
                        Hồ sơ đang chờ ({applications.length})
                    </h2>
                    <button
                        onClick={loadList}
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                    >
                        Làm mới danh sách
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
                    </div>
                ) : applications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 italic">
                        Hiện không có hồ sơ nào đang chờ duyệt.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mã HS</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Thông tin người đăng ký</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Loại thẻ</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ngày đăng ký</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {applications.map((app) => (
                                    <tr key={app.ma_ho_so} className="hover:bg-blue-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                                            #{app.ma_ho_so}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 shrink-0 relative mr-3 border rounded overflow-hidden bg-gray-100">
                                                    {app.anh_the_url ? (
                                                        <Image src={app.anh_the_url} alt="" fill className="object-cover" unoptimized />
                                                    ) : (
                                                        <span className="flex items-center justify-center h-full w-full text-xs text-gray-400">N/A</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">{app.ho_ten}</div>
                                                    <div className="text-sm text-gray-500">{app.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                {app.loai_the}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(app.ngay_dang_ky).toLocaleDateString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => openDetailModal(app.ma_ho_so)}
                                                className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-blue-600 rounded-md text-sm font-medium hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                <Eye className="w-4 h-4 mr-1.5" /> Xem & Duyệt
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* --- PHẦN 2: MODAL CHI TIẾT (Detail View) --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">

                        {/* Modal Header */}
                        <div className="flex justify-between items-center p-5 border-b bg-gray-50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">
                                    Chi tiết hồ sơ #{selectedRequest ? selectedRequest.mayeucauthe : '...'}
                                </h3>
                                <p className="text-sm text-gray-500">Kiểm tra thông tin kỹ trước khi phê duyệt</p>
                            </div>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                        {!selectedRequest ? (
                            <div className="flex flex-col items-center justify-center h-64 space-y-3">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                            <p className="text-gray-500">Đang tải thông tin chi tiết...</p>
                            </div>
                        ) : (
                            <div className="space-y-6">

                                {/* === KHỐI HIỂN THỊ ĐÁNH GIÁ RỦI RO TỪ AI (MỚI) === */}
                                {selectedRequest.thongtinbosung?.ket_qua_xac_thuc && (
                                    <div className={`p-4 rounded-lg border-l-4 shadow-sm ${
                                        selectedRequest.thongtinbosung.ket_qua_xac_thuc.risk_level === 'HIGH'
                                            ? 'bg-red-50 border-red-500 text-red-900'
                                            : selectedRequest.thongtinbosung.ket_qua_xac_thuc.risk_level === 'MEDIUM'
                                            ? 'bg-yellow-50 border-yellow-500 text-yellow-900'
                                            : 'bg-green-50 border-green-500 text-green-900'
                                    }`}>
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1">
                                                {selectedRequest.thongtinbosung.ket_qua_xac_thuc.risk_level === 'HIGH' && <AlertTriangle size={24} className="text-red-600"/>}
                                                {selectedRequest.thongtinbosung.ket_qua_xac_thuc.risk_level === 'MEDIUM' && <AlertTriangle size={24} className="text-yellow-600"/>}
                                                {selectedRequest.thongtinbosung.ket_qua_xac_thuc.risk_level === 'LOW' && <Check size={24} className="text-green-600"/>}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-lg flex items-center gap-2">
                                                    Đánh giá rủi ro AI:
                                                    <span>
                                                        {selectedRequest.thongtinbosung.ket_qua_xac_thuc.risk_level === 'HIGH' ? 'CAO (Nguy hiểm)' :
                                                        selectedRequest.thongtinbosung.ket_qua_xac_thuc.risk_level === 'MEDIUM' ? 'TRUNG BÌNH (Cần xem xét)' : 'THẤP (An toàn)'}
                                                    </span>
                                                </h4>

                                                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="font-semibold">Độ khớp khuôn mặt:</span>
                                                        <span className="ml-2 px-2 py-0.5 bg-white rounded border text-gray-700">
                                                            {(selectedRequest.thongtinbosung.ket_qua_xac_thuc.face_match_score * 100).toFixed(1)}%
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Danh sách các lỗi cụ thể */}
                                                {selectedRequest.thongtinbosung.ket_qua_xac_thuc.details && selectedRequest.thongtinbosung.ket_qua_xac_thuc.details.length > 0 ? (
                                                    <div className="mt-3 bg-white/60 p-3 rounded border border-black/5">
                                                        <p className="text-xs font-bold uppercase mb-1 opacity-70">Các vấn đề phát hiện:</p>
                                                        <ul className="list-disc list-inside space-y-1">
                                                            {selectedRequest.thongtinbosung.ket_qua_xac_thuc.details.map((detail, idx) => (
                                                                <li key={idx} className="text-sm font-medium text-red-700">
                                                                    {detail}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm mt-2 italic opacity-80">✓ Thông tin văn bản và hình ảnh hoàn toàn trùng khớp với CSDL.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {/* === KẾT THÚC KHỐI AI === */}

                                <div className="grid md:grid-cols-12 gap-6">
                                    {/* Cột Trái: Ảnh thẻ */}
                                    <div className="md:col-span-4 flex flex-col gap-4">
                                        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                            <p className="text-xs font-bold text-gray-400 uppercase mb-2 text-center">Ảnh thẻ đăng ký</p>
                                            <div className="relative w-full aspect-3/4 bg-gray-200 rounded overflow-hidden border">
                                                {selectedRequest.thongtinbosung?.anh_the_url ? (
                                                    <Image
                                                        src={selectedRequest.thongtinbosung.anh_the_url}
                                                        alt="Ảnh thẻ"
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-gray-400">Không có ảnh</div>
                                                )}
                                            </div>
                                            <div className="mt-4 text-center">
                                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                                                    {selectedRequest.tenloaithe}
                                                </span>
                                                <p className="text-xs text-gray-500 mt-2">Phí: {selectedRequest.lephi?.toLocaleString()} VNĐ</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cột Phải: Thông tin chi tiết */}
                                    <div className="md:col-span-8 space-y-6">
                                        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
                                            <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
                                                <User size={20} className="text-blue-600" /> Thông tin cá nhân
                                            </h4>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase">Họ và tên</p>
                                                    <p className="font-medium text-lg text-gray-900">{selectedRequest.thongtinbosung?.ho_ten}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase">Ngày sinh</p>
                                                    <p className="font-medium text-gray-900 flex items-center gap-2">
                                                        <Calendar size={16} className="text-gray-400"/> {selectedRequest.thongtinbosung?.ngay_sinh}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase">CCCD/CMND</p>
                                                    <p className="font-medium text-gray-900 tracking-wide font-mono">{selectedRequest.thongtinbosung?.cccd}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase">Giới tính</p>
                                                    <p className="font-medium text-gray-900">{selectedRequest.thongtinbosung?.gioi_tinh}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
                                            <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2 border-b pb-2">
                                                <MapPin size={20} className="text-green-600" /> Liên hệ
                                            </h4>
                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="col-span-2">
                                                    <p className="text-xs text-gray-500 uppercase">Địa chỉ đầy đủ</p>
                                                    <p className="font-medium text-gray-900">
                                                        {selectedRequest.thongtinbosung?.dia_chi_hien_thi || selectedRequest.thongtinbosung?.dia_chi}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase">Số điện thoại</p>
                                                    <p className="font-medium text-gray-900 flex items-center gap-2">
                                                        <Phone size={16} className="text-gray-400"/> {selectedRequest.thongtinbosung?.sdt}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 uppercase">Email</p>
                                                    <p className="font-medium text-gray-900 flex items-center gap-2">
                                                        <Mail size={16} className="text-gray-400"/> {selectedRequest.thongtinbosung?.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Form Từ chối */}
                                        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                                            <label className="block text-sm font-bold text-red-800 mb-2">Lý do từ chối (nếu có)</label>
                                            <textarea
                                                className="w-full p-3 border border-red-200 rounded bg-white text-sm focus:ring-2 focus:ring-red-500 outline-none"
                                                rows="2"
                                                placeholder="Nhập lý do nếu bạn muốn từ chối hồ sơ này..."
                                                value={rejectReason}
                                                onChange={(e) => setRejectReason(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        </div>

                        {/* Modal Footer Actions */}
                        {selectedRequest && (
                            <div className="p-5 border-t bg-gray-50 flex justify-end gap-3 sticky bottom-0">
                                <button
                                    onClick={closeModal}
                                    className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 font-medium transition-colors"
                                    disabled={isProcessing}
                                >
                                    Đóng
                                </button>
                                <button
                                    onClick={() => handleReviewInModal('tuChoi')}
                                    className="px-5 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 flex items-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? <Loader2 className="animate-spin w-4 h-4"/> : <X className="w-5 h-5"/>}
                                    Từ chối hồ sơ
                                </button>
                                <button
                                    onClick={() => handleReviewInModal('daDuyet')}
                                    className="px-6 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 flex items-center gap-2 font-bold shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? <Loader2 className="animate-spin w-4 h-4"/> : <Check className="w-5 h-5"/>}
                                    PHÊ DUYỆT & CẤP THẺ
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}