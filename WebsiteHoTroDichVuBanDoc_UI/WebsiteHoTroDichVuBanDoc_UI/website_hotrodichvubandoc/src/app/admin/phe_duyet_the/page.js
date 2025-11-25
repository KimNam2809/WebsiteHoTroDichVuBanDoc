// src/app/admin/phe_duyet_the/page.js
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Check, X, Eye, Loader2, MapPin } from 'lucide-react';
import { getPendingCardsAction, approveCardAction, getCardRequestDetailAction } from '../actions';

export default function PheDuyetThePage() {
    // State cho danh sách
    const [applications, setApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // State cho Modal chi tiết
    const [selectedRequest, setSelectedRequest] = useState(null); // Lưu object chi tiết đang xem
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState(''); // Lưu lý do từ chối
    const [isProcessing, setIsProcessing] = useState(false); // Loading khi bấm nút duyệt/từ chối

    // 1. Tải danh sách hồ sơ chờ duyệt khi vào trang
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
        setSelectedRequest(null); // Reset để hiện loading trong modal
        setRejectReason(''); // Reset lý do cũ

        // Gọi Server Action để lấy chi tiết đầy đủ (bao gồm thông tin bổ sung)
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
        // Validate: Nếu từ chối thì bắt buộc phải có lý do
        if (status === 'tuChoi' && !rejectReason.trim()) {
            alert("Vui lòng nhập lý do từ chối để lưu vào lịch sử.");
            return;
        }

        const confirmMsg = status === 'daDuyet'
            ? 'Bạn có chắc chắn muốn DUYỆT hồ sơ này và cấp thẻ mới?'
            : 'Bạn có chắc chắn muốn TỪ CHỐI hồ sơ này?';

        if (!confirm(confirmMsg)) return;

        setIsProcessing(true);
        // Gọi Server Action cập nhật trạng thái
        const res = await approveCardAction(
            selectedRequest.mayeucauthe,
            status,
            rejectReason
        );
        setIsProcessing(false);

        if (res.success) {
            alert('Thao tác thành công!');
            closeModal();
            loadList(); // Tải lại danh sách bên ngoài để cập nhật
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
                                                {/* Avatar nhỏ trong danh sách */}
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in">

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
                        <div className="flex-1 overflow-y-auto p-6">
                            {!selectedRequest ? (
                                <div className="flex flex-col items-center justify-center h-64 space-y-3">
                                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                                    <p className="text-gray-500">Đang tải thông tin chi tiết...</p>
                                </div>
                            ) : (
                                <div className="grid md:grid-cols-12 gap-8">

                                    {/* Cột Trái: Ảnh thẻ & Loại thẻ (Chiếm 4/12) */}
                                    <div className="md:col-span-4 flex flex-col items-center">
                                        <div className="w-full bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col items-center">
                                            <p className="text-sm font-semibold text-gray-500 mb-3 w-full text-center border-b pb-2">ẢNH THẺ ĐĂNG KÝ</p>
                                            {selectedRequest.thongtinbosung?.anh_the_url ? (
                                                <div className="relative w-48 h-64 border-4 border-white shadow-md bg-gray-200 rounded-sm overflow-hidden">
                                                    <Image
                                                        src={selectedRequest.thongtinbosung.anh_the_url}
                                                        alt="Ảnh thẻ"
                                                        fill
                                                        className="object-cover hover:scale-105 transition-transform duration-300"
                                                        unoptimized
                                                    />
                                                </div>
                                            ) : (
                                                <div className="w-48 h-64 bg-gray-200 flex items-center justify-center text-gray-400 rounded">Không có ảnh</div>
                                            )}

                                            <div className="mt-4 w-full text-center">
                                                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-bold">
                                                    {selectedRequest.tenloaithe || 'Chưa xác định'}
                                                </span>
                                                <p className="text-xs text-gray-500 mt-2">Phí làm thẻ: {selectedRequest.lephi?.toLocaleString()} VNĐ</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cột Phải: Thông tin chi tiết (Chiếm 8/12) */}
                                    <div className="md:col-span-8 space-y-6">

                                        {/* Thông tin cá nhân */}
                                        <div>
                                            <h4 className="font-bold text-gray-800 border-b pb-2 mb-3 flex items-center">
                                                <span className="bg-blue-600 w-1 h-5 mr-2 rounded-full"></span>
                                                Thông tin cá nhân
                                            </h4>
                                            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                                                <div>
                                                    <p className="text-gray-500 text-xs uppercase font-semibold">Họ và tên</p>
                                                    <p className="font-medium text-gray-900 text-lg">{selectedRequest.thongtinbosung?.ho_ten}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-xs uppercase font-semibold">Ngày sinh</p>
                                                    <p className="font-medium text-gray-900">{selectedRequest.thongtinbosung?.ngay_sinh}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-xs uppercase font-semibold">Số CCCD/CMND</p>
                                                    <p className="font-medium text-gray-900 tracking-wide">{selectedRequest.thongtinbosung?.cccd}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-xs uppercase font-semibold">Giới tính</p>
                                                    <p className="font-medium text-gray-900">{selectedRequest.thongtinbosung?.gioi_tinh || '---'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Thông tin liên hệ */}
                                        <div>
                                            <h4 className="font-bold text-gray-800 border-b pb-2 mb-3 flex items-center">
                                                <span className="bg-green-600 w-1 h-5 mr-2 rounded-full"></span>
                                                Thông tin liên hệ
                                            </h4>
                                            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                                                <div>
                                                    <p className="text-gray-500 text-xs uppercase font-semibold">Số điện thoại</p>
                                                    <p className="font-medium text-blue-600">{selectedRequest.thongtinbosung?.sdt}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-xs uppercase font-semibold">Email</p>
                                                    <p className="font-medium text-gray-900">{selectedRequest.thongtinbosung?.email}</p>
                                                </div>

                                                {/* Hiển thị địa chỉ thông minh (Ưu tiên dữ liệu Backend trả về) */}
                                                <div className="col-span-2 bg-blue-50 p-3 rounded border border-blue-100">
                                                    <p className="text-blue-500 text-xs uppercase font-bold flex items-center mb-1">
                                                        <MapPin className="w-3 h-3 mr-1" /> Địa chỉ thường trú
                                                    </p>
                                                    <p className="font-medium text-gray-800 text-base">
                                                        {selectedRequest.thongtinbosung?.dia_chi_hien_thi ||
                                                            `${selectedRequest.thongtinbosung?.dia_chi}, ${selectedRequest.thongtinbosung?.ten_phuong_xa || ''}, ${selectedRequest.thongtinbosung?.ten_tinh_thanh_pho || ''}`
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Khu vực nhập lý do từ chối */}
                                        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                                            <label className="block text-sm font-bold text-red-700 mb-2">
                                                Lý do từ chối (Chỉ nhập nếu muốn từ chối hồ sơ)
                                            </label>
                                            <textarea
                                                className="w-full border border-red-200 rounded-md p-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none bg-white"
                                                placeholder="Ví dụ: Ảnh thẻ không hợp lệ, Thông tin sai lệch..."
                                                rows="2"
                                                value={rejectReason}
                                                onChange={(e) => setRejectReason(e.target.value)}
                                            ></textarea>
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