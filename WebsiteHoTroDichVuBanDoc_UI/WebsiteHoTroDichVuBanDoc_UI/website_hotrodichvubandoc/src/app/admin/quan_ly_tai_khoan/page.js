// src/app/admin/quan_ly_tai_khoan/page.js

export default function QLTaiKhoanPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Quản lý tài khoản</h1>
            {/* Giao diện phân quyền sẽ ở đây */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <p>Danh sách tất cả tài khoản (Bạn đọc, Nhân viên, Admin)...</p>
                <p className="text-red-600 font-semibold">(Chức năng này chỉ Admin mới thấy)</p>
            </div>
        </div>
    );
}