// src/app/admin/phe_duyet_the/page.js
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Check, X } from 'lucide-react';
import { getPendingCardsAction, approveCardAction } from '../actions';

export default function PheDuyetThePage() {
    const [applications, setApplications] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Tải dữ liệu ban đầu
    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setIsLoading(true);
        const data = await getPendingCardsAction();
        setApplications(data || []);
        setIsLoading(false);
    }

    // Xử lý duyệt/từ chối
    async function handleReview(id, status) {
        const confirmMsg = status === 'daDuyet' ? 'Duyệt hồ sơ này?' : 'Từ chối hồ sơ này?';
        if (!confirm(confirmMsg)) return;

        const res = await approveCardAction(id, status);
        if (res.success) {
            alert('Thao tác thành công!');
            loadData(); // Tải lại danh sách
        } else {
            alert(res.error);
        }
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Phê duyệt hồ sơ đăng ký thẻ</h1>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">
                    Hồ sơ đang chờ ({applications.length})
                </h2>

                {isLoading && <p>Đang tải...</p>}

                <div className="space-y-6">
                    {applications.map((app) => (
                        <div key={app.ma_ho_so} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 p-4 flex justify-between items-center">
                                <div>
                                    <span className="font-semibold text-lg text-blue-700">{app.ho_ten}</span>
                                    <span className="text-sm text-gray-500 ml-2">(ID: {app.ma_ho_so})</span>
                                </div>
                                <span className="text-sm text-gray-600">Ngày nộp: {new Date(app.ngay_dang_ky).toLocaleDateString('vi-VN')}</span>
                            </div>

                            <div className="p-4 flex flex-col md:flex-row">
                                <div className="text-center p-2">
                                    {app.anh_the_url ? (
                                        <Image
                                            src={app.anh_the_url}
                                            alt="Ảnh thẻ"
                                            width={100} height={133}
                                            className="rounded-md border shadow-sm object-cover"
                                        />
                                    ) : (
                                        <div className="w-[100px] h-[133px] bg-gray-200 flex items-center justify-center text-xs">No Image</div>
                                    )}
                                </div>

                                <div className="flex-1 p-2 md:ml-4 space-y-1 text-sm">
                                    <p><strong>Loại thẻ:</strong> {app.loai_the}</p>
                                    <p><strong>Email:</strong> {app.email}</p>
                                    <p><strong>SĐT:</strong> {app.sdt}</p>
                                </div>

                                <div className="flex flex-col space-y-2 p-2 justify-center">
                                    <button
                                        onClick={() => handleReview(app.ma_ho_so, 'daDuyet')}
                                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                                    >
                                        <Check className="w-5 h-5" />
                                        <span>Duyệt</span>
                                    </button>
                                    <button
                                        onClick={() => handleReview(app.ma_ho_so, 'tuChoi')}
                                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                                    >
                                        <X className="w-5 h-5" />
                                        <span>Từ chối</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}