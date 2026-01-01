# 📚 Hệ Thống Quản Lý Thư Viện Thông Minh (Smart Library Management System)

Chào mừng bạn đến với dự án Hệ thống Quản lý Thư viện Thông minh. Đây là giải pháp toàn diện kết hợp giữa quản lý thư viện truyền thống và công nghệ AI tiên tiến, giúp tự động hóa quy trình mượn trả, tra cứu tài liệu và hỗ trợ bạn đọc 24/7 thông qua Chatbot thông minh.

## 🌟 Tính Năng Nổi Bật

### 🤖 AI & Chatbot (RAG Agent)

Trợ lý ảo thông minh: Giải đáp thắc mắc về nội quy, giờ mở cửa, thủ tục làm thẻ.

Tra cứu ngữ nghĩa: Tìm sách theo mô tả, chủ đề (ví dụ: "Tìm sách về lập trình của bác Ánh").

Cá nhân hóa: Kiểm tra lịch sử mượn, nợ phạt, trạng thái thẻ ngay trong khung chat.

Điều hướng thông minh: Tự động chuyển hướng người dùng đến các trang chức năng (Đăng ký thẻ, Đặt phòng...).

### 🏢 Nghiệp vụ Thư viện

Quản lý Sách & Bản sao: Theo dõi chi tiết từng cuốn sách vật lý, trạng thái (Có sẵn/Đang mượn).

Mượn/Trả sách: Quy trình khép kín, hỗ trợ nhân viên đối chiếu hình ảnh người mượn và sách để tránh sai sót.

Đăng ký thẻ Online: Người dùng tự nộp hồ sơ, upload ảnh thẻ, hệ thống tính phí tự động.

Phân quyền chặt chẽ: Hệ thống phân quyền chi tiết cho Bạn đọc, Thủ thư và Quản trị viên (Middleware & JWT).

## 🛠️ Công Nghệ Sử Dụng

Thành phần

Công nghệ

Frontend

Next.js 14 (App Router), Tailwind CSS, Supabase Auth Helper

Backend

Python FastAPI, Pydantic, Uvicorn

Database

Supabase (PostgreSQL), pgvector (Vector Search)

AI Core

LangChain, Groq API (Llama 3), OpenAI (Optional), FlashRank (Reranking)

Storage

Supabase Storage (Lưu ảnh bìa, ảnh thẻ)

## 🚀 Hướng Dẫn Cài Đặt & Triển Khai

Để chạy dự án, bạn cần mở 2 cửa sổ Terminal: một cho Backend và một cho Frontend.

### 1️⃣ Cấu Hình Backend (FastAPI)

Di chuyển vào thư mục backend:

cd backend

Bước 1: Tạo môi trường ảo và cài đặt thư viện

- Tạo môi trường ảo (Windows)

python -m venv venv

- Kích hoạt môi trường ảo (Windows PowerShell)

.\venv\Scripts\Activate.ps1

- Hoặc Windows cmd

.\venv\Scripts\activate

- Hoặc Linux/macOS

source venv/bin/activate

- Cập nhật pip và cài đặt thư viện

python -m pip install --upgrade pip
pip install -r requirements.txt

Bước 2: Cấu hình biến môi trường
Tạo file .env trong thư mục backend/ và điền thông tin cấu hình (tham khảo mẫu bên dưới):

--- DATABASE CONFIG ---

SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_DB_STR=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres

--- POSTGRESQL LOCAL (Optional) ---

LOCAL_DB_NAME=library_db
LOCAL_DB_USER=postgres
LOCAL_DB_PASS=password
LOCAL_DB_HOST=localhost
LOCAL_DB_PORT=5432

--- JWT SECURITY ---

JWT_SECRET_KEY=your_super_secret_key_change_this
JWT_ALGORITHM=HS256

--- AI SERVICES ---

GROQ_API_KEY=gsk_your_groq_api_key
OPENAI_API_KEY=sk_your_openai_key (Optional)
USE_OPENAI="false"

--- 3RD PARTY ---

SENDGRID_API_KEY=your_sendgrid_key
GOOGLE_API_KEY=your_google_api_key

Bước 3: Khởi chạy Backend

uvicorn app.main:app --reload

🔥 Backend sẽ chạy tại: <http://127.0.0.1:8000> (Tài liệu API Swagger tại <http://127.0.0.1:8000/docs>)

### 2️⃣ Cấu Hình Frontend (Next.js)

Mở một Terminal mới và di chuyển vào thư mục frontend:

cd frontend

Bước 1: Cài đặt thư viện Node.js

npm install

Bước 2: Cấu hình biến môi trường
Tạo file .env.local trong thư mục frontend/ (ngang hàng package.json) và điền thông tin:

--- SUPABASE CLIENT ---

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

--- BACKEND CONNECTION ---

FASTAPI_BACKEND_URL=[http://127.0.0.1:8000](http://127.0.0.1:8000)
FASTAPI_JWT_SECRET=your_super_secret_key_change_this (Phải khớp với Backend)

Bước 3: Cấu hình next.config.mjs (Để hiển thị ảnh)
Đảm bảo file next.config.mjs đã được cấu hình cho phép load ảnh từ Supabase:

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'via.placeholder.com',
            },
            {
                protocol: 'https',
                hostname: '*.supabase.co', // Cho phép tất cả project Supabase
            }
        ]
    }
};

export default nextConfig;

Bước 4: Khởi chạy Frontend

npm run dev

🌐 Website sẽ chạy tại: <http://localhost:3000>

## 🧪 Kịch Bản Kiểm Thử (Test Scenarios)

Dưới đây là các luồng chính để bạn trải nghiệm hệ thống và kiểm tra các chức năng:

### 🕵️ 1. Khách Vãng Lai (Tra cứu sách)

Truy cập trang chủ.

Vào menu "Danh mục sách" hoặc ô tìm kiếm.

Gõ từ khóa (VD: "Python").

Bấm xem chi tiết sách để xem trạng thái các bản sao.

### 💳 2. Đăng Ký Thẻ Bạn Đọc

Vào menu "Đăng ký thẻ".

Điền thông tin cá nhân, chọn loại thẻ.

Upload ảnh chân dung.

Nhấn gửi hồ sơ -> Nhận mã hồ sơ & QR thanh toán.

👮 3. Admin Phê Duyệt (Role: Nhân viên)

Đăng nhập tài khoản nhân viên (VD: staff/123).

Vào Dashboard -> "Phê duyệt thẻ".

Tìm hồ sơ vừa đăng ký và nhấn "Duyệt".

### 👤 4. Dashboard Cá Nhân (Role: Bạn đọc)

Đăng nhập tài khoản bạn đọc (VD: student/123).

Trang tự động chuyển về /tai_khoan.

Kiểm tra thông tin: Số thẻ, Hạn thẻ, Sách đang mượn.

Thử truy cập /admin -> Hệ thống sẽ chặn và đẩy về dashboard (Security Check).

### 📚 5. Mượn Sách Online

(Là Bạn đọc) Tìm sách "Đắc Nhân Tâm".

Chọn bản sao có trạng thái "Có sẵn".

Nhấn "Đăng ký mượn".

Trạng thái bản sao chuyển thành "Bạn đang giữ". (Kiểm tra chéo: Tài khoản khác sẽ thấy "Đã có người mượn").

### 🤖 6. Chatbot AI

Bấm vào biểu tượng Chat góc dưới màn hình.

Hỏi: "Thư viện mở cửa lúc nào?" (Kiểm tra RAG - Kiến thức chung).

Hỏi: "Tôi đang mượn sách gì?" (Kiểm tra Personal Dashboard - Cần đăng nhập).

Hỏi: "Tìm cho tôi sách về lập trình" (Kiểm tra SQL Search - Tìm kiếm nâng cao).

Hỏi: "Tôi muốn làm thẻ" (Kiểm tra Navigation - Điều hướng).

## 📂 Cấu Trúc Thư Mục

Để giúp bạn dễ dàng nắm bắt mã nguồn:

### Backend Structure (/backend)

app/api/v1/endpoints/: Chứa các API (Auth, Sách, Mượn trả, Chatbot...).

app/services/: Logic nghiệp vụ phức tạp (Brain AI, RAG Service, History Service).

app/tools/: Các công cụ cho AI gọi xuống Database (DB Tools, Action Tools).

app/models/: Định nghĩa Schema dữ liệu (Pydantic Models).

ingest/: Các script để nạp dữ liệu sách và nội quy vào Vector DB.

### Frontend Structure (/frontend)

src/app/: Sử dụng Next.js App Router (Mỗi thư mục là một route).

admin/: Trang quản trị (được bảo vệ).

tai_khoan/: Trang cá nhân bạn đọc.

components/: Các UI tái sử dụng (Chatbot, Header, Table...).

src/lib/: Cấu hình Supabase Client và Server Actions.

middleware.js: Bộ lọc bảo mật, phân quyền truy cập dựa trên Role.
