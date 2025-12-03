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

- Kịch bản 5: Quy trình Mượn Sách (Chọn bản sao & Kiểm tra trạng thái)
Mục tiêu: Đảm bảo người dùng mượn đúng cuốn sách vật lý mong muốn và hệ thống cập nhật trạng thái chính xác cho các người dùng khác.

Bước 1: Đăng nhập bằng tài khoản Bạn đọc A (Ví dụ: student).

Bước 2: Tìm kiếm một cuốn sách có nhiều bản sao (Ví dụ: "Đắc Nhân Tâm").

Bước 3: Nhấn vào "Chi tiết".

Kiểm tra: Danh sách bản sao hiện ra. Chọn một bản sao có trạng thái "Có sẵn" (Ví dụ: mã KN.001).

Bước 4: Nhấn nút "Đăng ký mượn" -> Chọn ngày trả -> Nhấn "Xác nhận".

Kết quả (Bạn đọc A):

Hiển thị Modal thành công màu xanh: "Mượn thành công!".

Trạng thái của bản sao KN.001 chuyển ngay lập tức thành: "Bạn đang giữ" (Màu xanh dương) và nút hành động chuyển thành "Đang mượn".

Bước 5 (Kiểm tra chéo): Mở trình duyệt ẩn danh (hoặc đăng nhập tài khoản Bạn đọc B).

Vào cùng cuốn sách đó.

Kết quả: Bản sao KN.001 hiển thị trạng thái: "Đã có người mượn" (Màu xám/đỏ) và nút hành động bị khóa là "Đã hết".

- Kịch bản 6: Quy trình Trả Sách (Admin đối chiếu hình ảnh)
Mục tiêu: Kiểm tra tính năng hỗ trợ nhân viên đối chiếu khuôn mặt và sách khi nhận trả để tránh sai sót.

Bước 1: Đăng nhập bằng tài khoản Nhân viên (staff).

Bước 2: Truy cập menu "Quản lý mượn trả" (/admin/quan_ly_muon_tra).

Bước 3: Tại ô tìm kiếm, nhập Mã phiếu mượn (hoặc Tên bạn đọc A vừa mượn ở Kịch bản 5).

Kết quả: Tìm thấy dòng dữ liệu phiếu mượn tương ứng.

Bước 4: Nhấn nút "Xác nhận Trả".

Kết quả:

Một Modal lớn hiện ra chia làm 2 cột.

Cột trái: Hiển thị Ảnh bìa sách + Tên sách.

Cột phải: Hiển thị Ảnh thẻ bạn đọc + Tên bạn đọc (Lấy từ dữ liệu đăng ký).

Mục đích: Nhân viên nhìn màn hình và nhìn người thật để xác nhận đúng người đúng sách.

Bước 5: Nhấn "Hoàn tất trả sách".

Kết quả: Dòng dữ liệu biến mất khỏi danh sách "Đang mượn". Sách trong kho (trang chi tiết) chuyển trạng thái về "Có sẵn".

- Kịch bản 7: Kiểm tra Logic Trạng thái Thẻ (State Management)
Mục tiêu: Đảm bảo Dashboard hiển thị đúng trạng thái "treo" khi người dùng mới đăng ký nhưng chưa được duyệt (Fix lỗi "Chưa cập nhật hồ sơ").

Bước 1: Đăng ký một tài khoản User mới hoàn toàn (Ví dụ: new_user).

Bước 2: Vào /dang_ky_the, nộp hồ sơ đăng ký.

Bước 3: Truy cập Dashboard /tai_khoan (Lúc này Admin CHƯA duyệt).

Kết quả:

Câu chào: "Xin chào, [Tên lấy từ Email]!" (Không được hiện "Chưa cập nhật").

Thẻ thư viện: Hiển thị khung màu Vàng với trạng thái "Đang chờ duyệt".

Bước 4: (Admin) Vào duyệt hồ sơ cho new_user.

Bước 5: (User) F5 lại trang Dashboard.

Kết quả:

Thẻ thư viện: Tự động chuyển sang khung màu Xanh với thông tin Số thẻ và Ngày hết hạn chính thức.

- Kịch bản 8: Phân trang & Tìm kiếm Nâng cao
Mục tiêu: Kiểm tra khả năng xử lý dữ liệu lớn và điều hướng trang.

Bước 1: Truy cập trang "Danh mục sách" (/tim_kiem).

Bước 2: Không nhập từ khóa, nhấn tìm kiếm (để lấy toàn bộ sách).

Kết quả:

Hệ thống hiển thị danh sách sách (8 cuốn/trang).

Bên dưới xuất hiện dãy số phân trang: [1] [2] [3] ... (Thay vì chỉ nút Trước/Sau).

Bước 3: Nhấn vào số trang bất kỳ (ví dụ: trang 2).

Kết quả:

Danh sách sách thay đổi.

URL trên thanh địa chỉ thay đổi theo: ?page=2.

Bước 4: F5 (Tải lại trang).

Kết quả: Vẫn ở đúng trang 2 (Trạng thái được lưu trên URL).
