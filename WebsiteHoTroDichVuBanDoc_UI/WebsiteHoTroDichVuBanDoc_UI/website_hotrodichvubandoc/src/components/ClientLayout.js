// src/components/ClientLayout.js
'use client';

import { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import Header from '@/components/Header';
import Chatbot from '@/components/Chatbot';

export default function ClientLayout({ children }) {
    // Toàn bộ logic 'useEffect' xử lý modal được chuyển vào đây
    useEffect(() => {
        const handleModalClose = (e) => {
            // Tìm nút đóng modal
            const closeButton = e.target.closest('[data-modal-close-target]');
            if (closeButton) {
                e.preventDefault();
                const targetId = closeButton.dataset.modalCloseTarget;
                const modal = document.getElementById(targetId);
                if (modal) {
                    modal.classList.add('hidden');
                    modal.classList.remove('flex');
                }
            }

            // Logic đóng khi nhấp ra ngoài
            const modal = e.target.closest('.fixed[z-50]');
            if (modal && e.target === modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        };

        document.addEventListener('click', handleModalClose);
        return () => document.removeEventListener('click', handleModalClose);
    }, []); // Chạy 1 lần

    return (
        <>
            <Header />
            <main className="grow flex flex-col">
                {children}
            </main>
            <Chatbot />

            {/* Book Detail Modal */}
            <div id="bookModal" className="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h2 id="bookTitle" className="text-2xl font-bold text-gray-800">Tên sách...</h2>
                            <button data-modal="close" data-target="bookModal" className="text-gray-500 hover:text-gray-700">
                                <FontAwesomeIcon icon={faTimes} className="text-xl" />
                            </button>
                        </div>
                        <div id="bookDetails" className="space-y-4">
                            {/* Nội dung chi tiết sách sẽ được JS chèn vào đây */}
                        </div>
                    </div>
                </div>
            </div>

            {/* Borrow Modal */}
            <div id="borrowModal" className="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-md w-full">
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Mượn sách</h2>
                            <button data-modal="close" data-target="borrowModal" className="text-gray-500 hover:text-gray-700"><FontAwesomeIcon icon={faTimes} className="text-xl" /></button>
                        </div>
                        <form id="borrowForm">
                            {/* ... (Nội dung form mượn sách) ... */}
                            <button type="submit" className="w-full mt-6 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700">Xác nhận mượn</button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Reserve Modal */}
            <div id="reserveModal" className="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-md w-full">
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold text-gray-800">Đặt trước</h2>
                            <button data-modal="close" data-target="reserveModal" className="text-gray-500 hover:text-gray-700"><FontAwesomeIcon icon={faTimes} className="text-xl" /></button>
                        </div>
                        <form id="reserveForm">
                            {/* ... (Nội dung form đặt trước) ... */}
                            <button type="submit" className="w-full mt-6 bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900">Xác nhận đặt trước</button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Booking Modal  */}
            <div id="bookingModal" className="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg w-full max-w-xl max-h-[90vh] flex flex-col">
                    <div className="p-6 border-b sticky top-0 bg-white z-10">
                        <div className="flex justify-between items-start">
                            <h2 className="text-2xl font-bold text-gray-800">Đặt lịch dịch vụ</h2>
                            <button data-modal-close-target="bookingModal" className="text-gray-500 hover:text-gray-700">
                                <FontAwesomeIcon icon={faTimes} className="text-xl" />
                            </button>
                        </div>
                    </div>
                    <form id="bookingForm" className="flex-1 flex flex-col overflow-hidden">
                        <div className="p-6 space-y-4 overflow-y-auto">
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Dịch vụ</label>
                                <select id="bookingService" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" required>
                                    <option value="">Chọn dịch vụ</option>
                                    <option value="study-room">Phòng học nhóm</option>
                                    <option value="computer">Máy tính</option>
                                    <option value="workshop">Workshop</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Ngày</label>
                                <input id="bookingDate" type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" required />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">Giờ</label>
                                <select id="bookingTime" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500" required>
                                    <option value="">Chọn giờ</option>
                                    <option value="08:00">08:00 - 10:00</option>
                                    <option value="10:00">10:00 - 12:00</option>
                                    <option value="14:00">14:00 - 16:00</option>
                                    <option value="16:00">16:00 - 18:00</option>
                                </select>
                            </div>
                            {/* (Chúng ta sẽ thêm logic sơ đồ chỗ ngồi sau) */}
                        </div>
                        <div className="p-6 border-t sticky bottom-0 bg-white z-10">
                            <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors">
                                Đặt lịch
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}