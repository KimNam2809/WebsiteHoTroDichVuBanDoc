'use client';

import { useEffect } from 'react';

// Component này vô hình, chỉ có tác dụng gọi API khi được mount
export default function ViewIncrementer({ id }) {
    useEffect(() => {
        // Hàm gọi API tăng view
        const increaseView = async () => {
            const API_ROOT = process.env.NEXT_PUBLIC_FASTAPI_BACKEND_URL;
            try {
                // Dùng fetch với keepalive: true để đảm bảo request vẫn gửi đi
                // ngay cả khi user đóng tab nhanh
                await fetch(`${API_ROOT}/api/v1/bai-viet/${id}/tang-luot-xem`, {
                    method: 'POST',
                    keepalive: true,
                    cache: 'no-store'
                });
                console.log(`Đã tăng view cho bài viết #${id}`);
            } catch (error) {
                console.error("Lỗi tăng view:", error);
            }
        };

        increaseView();
        // Mảng dependency rỗng [] đảm bảo chỉ chạy 1 lần khi vào trang
    }, [id]);

    return null; // Không hiển thị gì cả
}