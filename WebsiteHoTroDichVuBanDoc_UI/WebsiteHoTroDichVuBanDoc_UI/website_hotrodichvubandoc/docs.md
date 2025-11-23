# 🛠️ Hướng dẫn Cài đặt & Triển khai Frontend (Next.js)

- Cài đặt các gói thư viện
Di chuyển vào thư mục chứa mã nguồn Frontend và chạy lệnh sau để cài đặt các thư viện phụ thuộc (dependencies):
npm install

- Cấu hình Biến môi trường
Tạo một tệp tin tên là .env.local tại thư mục gốc của dự án (ngang hàng với thư mục src và package.json). Sau đó, dán nội dung sau và điền các giá trị tương ứng:

NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

FASTAPI_BACKEND_URL=link_url
FASTAPI_JWT_SECRET=your_jwt_secret_key

- Cấu hình next.config.js
Để hiển thị ảnh từ các nguồn bên ngoài (như Supabase Storage hoặc trang placeholder), thầy/cô vui lòng cập nhật nội dung tệp next.config.js như sau:

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                // Cho phép ảnh giả lập (nếu có dùng)
                protocol: 'https',
                hostname: 'via.placeholder.com',
            },
            {
                // Cho phép ảnh từ Supabase Storage
                // Lưu ý: Thay 'PROJECT_ID' bằng ID project thực tế của Supabase nếu cần
                protocol: 'https',
                hostname: '*.supabase.co',
            }
        ]
    }
};

export default nextConfig;

- Khởi chạy Website:
Chạy lệnh sau để bắt đầu server phát triển:

npm run dev

Sau khi khởi chạy, truy cập Website tại địa chỉ Local bằng cách "Ctrl +Chuột trái" ngay bên dưới terminal

## 🧪 Kịch bản Kiểm thử (Test Scenarios)

Dưới đây là quy trình kiểm thử các chức năng cốt lõi của hệ thống để nghiệm thu sản phẩm.

- Kịch bản 1: Tra cứu Tài liệu (Người dùng vãng lai)
Mục tiêu: Kiểm tra khả năng tìm kiếm và xem chi tiết sách mà không cần đăng nhập.

Bước 1: Truy cập trang chủ

Bước 2: Nhấn vào menu "Danh mục sách" hoặc nút "Tìm kiếm sách".

Bước 3: Tại thanh tìm kiếm, nhập từ khóa (ví dụ: "Python" hoặc "Trí tuệ").

Kết quả: Hệ thống hiển thị danh sách kết quả tìm kiếm chính xác từ Database.

Bước 4: Nhấn vào nút "Xem chi tiết" một cuốn sách bất kỳ.

Kết quả: Trang chi tiết hiện ra đầy đủ thông tin tác phẩm, danh mục và trạng thái các bản sao (Có sẵn/Đang mượn).

- Kịch bản 2: Đăng ký Thẻ Bạn đọc (Quy trình Online)
Mục tiêu: Kiểm tra luồng đăng ký thẻ, upload ảnh và tạo mã QR thanh toán.

Bước 1: Đăng nhập tài khoản người dùng thường (nếu hệ thống yêu cầu) hoặc truy cập trực tiếp menu "Đăng ký thẻ".

Bước 2: Chọn "Bắt đầu đăng ký".

Bước 3: Điền đầy đủ thông tin cá nhân (Họ tên, CCCD, SĐT...).

Bước 4: Chọn Loại thẻ (Hệ thống sẽ tự động tính tiền lệ phí).

Bước 5: Tải lên ảnh thẻ 3x4 (Hệ thống sẽ upload file lên Supabase Storage).

Bước 6: Nhấn nút "Gửi hồ sơ".

Kết quả: Hệ thống hiển thị thông báo "Đăng ký thành công" kèm theo Mã hồ sơ và Mã QR thanh toán.

- Kịch bản 3: Phê duyệt Thẻ (Dành cho Nhân viên/Admin)
Mục tiêu: Kiểm tra chức năng quản trị và cập nhật trạng thái dữ liệu.

Bước 1: Truy cập /dang_nhap.

Bước 2: Đăng nhập bằng tài khoản Nhân viên (Ví dụ: staff / 123).

Kết quả: Hệ thống chuyển hướng đến Dashboard Nhân viên (Giao diện khác với bạn đọc).

Bước 3: Truy cập menu "Phê duyệt thẻ" (hoặc /admin/phe_duyet_the).

Bước 4: Tìm thấy hồ sơ vừa đăng ký ở Kịch bản 2 trong danh sách chờ.

Bước 5: Nhấn nút "Duyệt".

Kết quả: Hồ sơ biến mất khỏi danh sách chờ (đã chuyển sang trạng thái được duyệt).

- Kịch bản 4: Dashboard Cá nhân & Bảo mật
Mục tiêu: Kiểm tra phân quyền (Middleware) và hiển thị dữ liệu cá nhân hóa.

Bước 1: Đăng nhập bằng tài khoản Bạn đọc (Ví dụ: student / 123).

Kết quả: Hệ thống chuyển hướng đến /tai_khoan.

Bước 2: Kiểm tra Dashboard hiển thị đúng: Tên người dùng, Số thẻ, Ngày hết hạn và Danh sách sách đang mượn của chính user đó.

Bước 3: Test Bảo mật (Phân quyền):

Cố tình gõ URL /admin trên thanh địa chỉ trình duyệt.

Kết quả: Hệ thống tự động chuyển hướng (redirect) ngược lại về /tai_khoan (Middleware hoạt động tốt, chặn truy cập trái phép).

Bước 4: Nhấn nút "Đăng xuất". Sau đó thử truy cập lại /tai_khoan.

Kết quả: Bị chuyển hướng về trang /dang_nhap.
