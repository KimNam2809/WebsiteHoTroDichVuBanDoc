// src/app/dich_vu/page.js
'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBook, faLaptop, faPrint, faWifi,
    faTablet, faHeadphones, faDatabase, faMobileAlt,
    faUsers, faUser, faVolumeMute, faCoffee,
    faCalendar, faChalkboardTeacher, faChild, faMicrophone
} from '@fortawesome/free-solid-svg-icons';

// Dịch logic từ booking.js [cite: 1-19, 119-122]
// Hàm này sẽ mở modal "bookingModal" trong layout
const showBookingForm = () => {
    // Chúng ta sẽ dùng JavaScript thuần túy để tìm và mở modal
    // mà chúng ta sắp thêm vào layout
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
};

export default function ServicesPage() {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Dịch vụ thư viện</h1>
            <div className="grid md:grid-cols-2 gap-8">
                {/* Dịch vụ cơ bản [cite: 1689-1912, 398-409] */}
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-semibold mb-6 text-purple-600">Dịch vụ cơ bản</h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <FontAwesomeIcon icon={faBook} className="text-purple-600 text-2xl w-7 text-center" />
                            <span className="text-gray-800 text-base leading-6">Mượn sách tại chỗ và về nhà</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <FontAwesomeIcon icon={faLaptop} className="text-purple-600 text-2xl w-7 text-center" />
                            <span className="text-gray-800 text-base leading-6">Sử dụng máy tính và internet miễn phí</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <FontAwesomeIcon icon={faPrint} className="text-purple-600 text-2xl w-7 text-center" />
                            <span className="text-gray-800 text-base leading-6">In ấn và photocopy</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <FontAwesomeIcon icon={faWifi} className="text-purple-600 text-2xl w-7 text-center" />
                            <span className="text-gray-800 text-base leading-6">Wifi miễn phí toàn thư viện</span>
                        </div>
                    </div>
                </div>

                {/* Dịch vụ số [cite: 1689-1912, 411-422] */}
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-semibold mb-6 text-blue-600">Dịch vụ số</h2>
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <FontAwesomeIcon icon={faTablet} className="text-blue-600 text-2xl w-7 text-center" />
                            <span className="text-gray-800 text-base leading-6">Thư viện điện tử</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <FontAwesomeIcon icon={faHeadphones} className="text-blue-600 text-2xl w-7 text-center" />
                            <span className="text-gray-800 text-base leading-6">Sách nói và podcast</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <FontAwesomeIcon icon={faDatabase} className="text-blue-600 text-2xl w-7 text-center" />
                            <span className="text-gray-800 text-base leading-6">Cơ sở dữ liệu học thuật</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <FontAwesomeIcon icon={faMobileAlt} className="text-blue-600 text-2xl w-7 text-center" />
                            <span className="text-gray-800 text-base leading-6">Ứng dụng di động</span>
                        </div>
                    </div>
                </div>

                {/* (Bạn có thể thêm 2 mục còn lại 'Không gian học tập' và 'Sự kiện'
                từ [cite: 1689-1912, 424-449] nếu muốn) */}

            </div>

            {/* Booking Section [cite: 1689-1912, 451-457] */}
            <div className="mt-8 bg-linear-to-r from-purple-600 to-blue-600 text-white p-8 rounded-lg">
                <h2 className="text-2xl font-bold mb-4">Đặt lịch sử dụng dịch vụ</h2>
                <p className="mb-6">Đặt trước phòng học nhóm, máy tính hoặc tham gia các hoạt động</p>
                <button
                    onClick={showBookingForm} // Dịch data-action="open-booking"
                    className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                    Đặt lịch ngay
                </button>
            </div>
        </div>
    );
}