'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link'; // Optional if needed
import QRCode from 'react-qr-code';
import { getNotificationsAction, markAsReadAction } from './actions';
import { Loader2, Mail, MailOpen, Trash2, Clock, AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function ThongBaoPage() {
    const router = useRouter(); // [NEW] Router for navigation
    const [notifications, setNotifications] = useState([]);
    const [selectedNotif, setSelectedNotif] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDetailLoading, setIsDetailLoading] = useState(false); // [NEW] Detail loading state

    // Fetch notifications
    useEffect(() => {
        async function loadData() {
            const data = await getNotificationsAction();
            setNotifications(data || []);
            setIsLoading(false);
        }
        loadData();
    }, []);

    // Handle clicking a notification
    const handleSelect = async (notif) => {
        setSelectedNotif(notif);
        setIsDetailLoading(true);

        // Optimistically update UI to 'daXem' immediately
        if (notif.trangthai !== 'daXem') {
            setNotifications(prev => prev.map(n =>
                n.mathongbao === notif.mathongbao ? { ...n, trangthai: 'daXem' } : n
            ));

            // Trigger backend update in background
            markAsReadAction(notif.mathongbao).catch(err => console.error("Mark read failed", err));
        }

        // Simulate small loading delay for content
        setTimeout(() => setIsDetailLoading(false), 300);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
        );
    }

    return (
        // fixed inset-0 z-9999 flex items-center justify-center p-4 sm:p-6
        <div className="min-h-screen pt-20 pb-10 px-4 bg-gray-100 fixed inset-0 z-9999 flex items-center justify-center">
            {/* [NEW] Main Container with Relative positioning for Close Button */}
            <div className="relative w-full max-w-6xl h-[80vh] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-gray-200">

                {/* [NEW] Close Button */}
                <button
                    onClick={() => router.back()}
                    className="absolute top-2 right-2 z-50 p-2 bg-gray-100/80 hover:bg-gray-200 text-gray-500 hover:text-gray-800 rounded-full transition-all shadow-sm backdrop-blur-sm group"
                    title="Đóng"
                >
                    <X size={20} className="group-hover:scale-110 transition-transform" />
                </button>

                {/* LEFT SIDEBAR: LIST */}
                <div className={`w-full md:w-1/3 lg:w-1/4 border-r border-gray-200 flex flex-col ${selectedNotif ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center sticky top-0 z-10">
                        <h2 className="font-bold text-gray-700 text-lg">Hộp thư</h2>
                        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-bold">
                            {notifications.filter(n => n.trangthai !== 'daXem').length} chưa đọc
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-6 text-center">
                                <Mail size={48} className="mb-2 opacity-50" />
                                <p>Không có thông báo nào</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {notifications.map((notif) => (
                                    <li
                                        key={notif.mathongbao}
                                        onClick={() => handleSelect(notif)}
                                        className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors relative group ${selectedNotif?.mathongbao === notif.mathongbao ? 'bg-blue-50 ring-inset ring-2 ring-blue-500' : ''
                                            } ${notif.trangthai !== 'daXem' ? 'bg-white' : 'bg-gray-100'}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`font-semibold line-clamp-1 ${notif.trangthai !== 'daXem' ? 'text-gray-900' : 'text-gray-500 font-normal'}`}>
                                                {notif.tieude}
                                            </h3>
                                            {notif.trangthai !== 'daXem' && (
                                                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-1.5 shadow-sm shadow-blue-200"></span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                                            {notif.noidung}
                                        </p>
                                        <div className="flex items-center gap-1 text-xs text-gray-400">
                                            <Clock size={12} />
                                            {new Date(notif.thoigiangui).toLocaleDateString('vi-VN')}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDEBAR: DETAIL */}
                <div className={`w-full md:w-2/3 lg:w-3/4 bg-white flex flex-col ${selectedNotif ? 'flex' : 'hidden md:flex'}`}>
                    {selectedNotif ? (
                        <>
                            {/* Toolbar */}
                            <div className="p-4 border-b border-gray-100 flex items-center gap-4">
                                <button
                                    onClick={() => setSelectedNotif(null)}
                                    className="md:hidden p-2 -ml-2 hover:bg-gray-100 rounded-full text-gray-600"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                </button>
                                <div className="flex-1"></div>
                                <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Xóa (Demo)">
                                    <Trash2 size={20} />
                                </button>
                                {/* Spacer for the absolute close button */}
                                <div className="w-8"></div>
                            </div>

                            {/* Content */}
                            <div className="p-6 md:p-10 flex-1 overflow-y-auto">
                                {isDetailLoading ? (
                                    <div className="flex flex-col items-center justify-center h-full">
                                        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
                                        <p className="text-gray-500 font-medium">Đang tải...</p>
                                    </div>
                                ) : (
                                    <div className="max-w-3xl mx-auto">
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className={`p-3 rounded-2xl ${selectedNotif.tieude.includes('thành công') || selectedNotif.tieude.includes('duyệt')
                                                ? 'bg-green-100 text-green-600'
                                                : selectedNotif.tieude.includes('thất bại') || selectedNotif.tieude.includes('từ chối')
                                                    ? 'bg-red-100 text-red-600'
                                                    : 'bg-blue-100 text-blue-600'
                                                }`}>
                                                {selectedNotif.tieude.includes('thành công') || selectedNotif.tieude.includes('duyệt') ? <CheckCircle2 size={32} /> :
                                                    selectedNotif.tieude.includes('thất bại') || selectedNotif.tieude.includes('từ chối') ? <AlertCircle size={32} /> :
                                                        <MailOpen size={32} />}
                                            </div>
                                            <div>
                                                <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
                                                    {selectedNotif.tieude}
                                                </h1>
                                                <div className="text-sm text-gray-500 flex items-center gap-2">
                                                    <span>Từ: <strong>Hệ thống Thư viện</strong></span>
                                                    <span>•</span>
                                                    <span>{new Date(selectedNotif.thoigiangui).toLocaleString('vi-VN')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="prose prose-blue max-w-none text-gray-700 leading-relaxed">
                                            <p>{selectedNotif.noidung}</p>
                                        </div>

                                        {/* [NEW] Hiển thị Dữ liệu gốc (Chi tiết hồ sơ) */}
                                        {selectedNotif.dulieugoc && (
                                            <div className="mt-6 bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                                                <div className="bg-gray-100/50 px-4 py-3 border-b border-gray-200">
                                                    <h3 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                                                        Thông tin hồ sơ đính kèm
                                                    </h3>
                                                </div>
                                                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                                    {(() => {
                                                        // Parse dữ liệu nếu là string
                                                        let data = selectedNotif.dulieugoc;
                                                        if (typeof data === 'string') {
                                                            try { data = JSON.parse(data); } catch (e) { return null; }
                                                        }
                                                        if (!data) return null;

                                                        return (
                                                            <>
                                                                <div className="col-span-1 md:col-span-2 flex items-center gap-4 mb-2">
                                                                    {data.anh_the_url ? (
                                                                        <Image src={data.anh_the_url} alt="Ảnh thẻ" width={80} height={96} className="object-cover rounded-lg shadow-sm border border-gray-200 bg-white" />
                                                                    ) : (
                                                                        <div className="w-20 h-24 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">No Image</div>
                                                                    )}
                                                                    <div>
                                                                        <p className="font-bold text-lg text-gray-900">{data.ho_ten || '---'}</p>
                                                                        <p className="text-gray-500">{data.nghe_nghiep || 'Chưa cập nhật nghề nghiệp'}</p>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <span className="block text-gray-400 text-xs">Ngày sinh</span>
                                                                    <span className="font-medium text-gray-700">{data.ngay_sinh ? new Date(data.ngay_sinh).toLocaleDateString('vi-VN') : '---'}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="block text-gray-400 text-xs">Giới tính</span>
                                                                    <span className="font-medium text-gray-700">{data.gioi_tinh === 'Nam' ? 'Nam' : data.gioi_tinh === 'Nu' ? 'Nữ' : 'Khác'}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="block text-gray-400 text-xs">CCCD/CMND</span>
                                                                    <span className="font-medium text-gray-700">{data.cccd || '---'}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="block text-gray-400 text-xs">Số điện thoại</span>
                                                                    <span className="font-medium text-gray-700">{data.sdt || '---'}</span>
                                                                </div>
                                                                <div className="col-span-1 md:col-span-2">
                                                                    <span className="block text-gray-400 text-xs">Địa chỉ</span>
                                                                    <span className="font-medium text-gray-700">{data.dia_chi || '---'}</span>
                                                                </div>

                                                                {/* Hiển thị Thời gian dự kiến (Cho Trạng thái "daDuyet") */}
                                                                {data.thoi_gian_du_kien && (
                                                                    <div className="col-span-1 md:col-span-2 mt-2 p-3 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100 flex items-center gap-2">
                                                                        <Clock size={16} />
                                                                        <span>
                                                                            <strong>Thời gian dự kiến nhận thẻ: </strong>
                                                                            {new Date(data.thoi_gian_du_kien).toLocaleDateString('vi-VN')}
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {/* Hiển thị QR Code (Cho Trạng thái "choDuyet" - Success) */}
                                                                {data.qr_payment_content && (
                                                                    <div className="col-span-1 md:col-span-2 mt-4 p-6 bg-white rounded-xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center">
                                                                        <h4 className="font-bold text-blue-800 mb-3 text-center uppercase text-sm tracking-wider">
                                                                            Mã hồ sơ & Thanh toán
                                                                        </h4>
                                                                        <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                                                                            <QRCode value={data.qr_payment_content} size={160} />
                                                                        </div>
                                                                        <p className="mt-3 text-xs text-center text-gray-500 max-w-xs">
                                                                            Vui lòng xuất trình mã này tại quầy để hoàn tất thủ tục.
                                                                        </p>
                                                                        {data.tong_tien && (
                                                                            <div className="mt-2 flex flex-col items-center">
                                                                                <span className="text-xs text-gray-400">Tổng phí cần thanh toán</span>
                                                                                <span className="font-mono font-bold text-lg text-blue-600">
                                                                                    {parseInt(data.tong_tien).toLocaleString('vi-VN')} đ
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {/* Hiển thị lý do từ chối nếu có trong dulieugoc */}
                                                                {data.ly_do_tu_choi && (
                                                                    <div className="col-span-1 md:col-span-2 mt-2 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                                                                        <strong>Lý do từ chối: </strong> {data.ly_do_tu_choi}
                                                                    </div>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Suggestions (Nếu cần) */}
                                        <div className="mt-8 pt-8 border-t border-gray-100">
                                            <p className="text-sm text-gray-400 italic">Đây là tin nhắn tự động, vui lòng không trả lời.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-300">
                            <MailOpen size={80} className="mb-4 opacity-20" />
                            <p className="text-lg font-medium text-gray-400">Chọn một thông báo để đọc</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
