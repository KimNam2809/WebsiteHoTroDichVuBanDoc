
<!-- Create Environment -->
# Create Environment

```bash
python -m venv venv

# Activate (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Activate (Windows cmd)
.\venv\Scripts\activate

# Activate (Linux/macOS)
source venv/bin/activate

# Update pip vesion
python -m pip install --upgrade pip

# Install Package:
# fastapi: thư viện backend fastapi
# uvicorn: máy chủ để chạy ứng dụng FastAPI
# supabase: thư viện python chính thức để tương tác với Supabase
# python-dotenv và pydantic-settings: dùng để quản lý các biến môi trường như API Keys, ...
# passLib[bcrypt]: thư viện hashing (băm) mật khẩu
# argon2-cffi: thư viện hashing (băm) mật khẩu tiêu chuẩn vàng hiện nay, giải quyết vấn đề chỉ băm đc tối đa 72 ký tự của bcrypt
pip install fastapi "uvicorn[standard]" supabase python-dotenv pydantic-settings passlib[bcrypt] pydantic[email] argon2-cffi

# File Expoler
/du_an_tot_nghiep/
|
|-- /frontend/       <-- Nơi chứa code Next.js của bạn
|
|-- /backend/        <-- Chúng ta sẽ làm việc ở đây
|   |
|   |-- /app/        <-- Thư mục chứa code logic chính
|   |   |-- /api/    <-- Nơi chứa các file định nghĩa endpoints
|   |   |   |-- __init__.py
|   |   |   |-- v1/
|   |   |   |   |-- __init__.py
|   |   |   |   |-- endpoints/
|   |   |   |   |   |-- __init__.py
|   |   |   |   |   |-- books.py    <-- API cho Sách
|   |   |   |   |   |-- members.py  <-- API cho Độc giả
|   |   |   |   |-- api.py        <-- File tổng hợp các router v1
|   |   |
|   |   |-- /connect/     <-- Nơi chứa cấu hình, file kết nối
|   |   |   |-- __init__.py
|   |   |   |-- config.py   <-- Để đọc file .env
|   |   |   |-- db.py       <-- Để khởi tạo Supabase client
|   |   |
|   |   |-- /models/   <-- Nơi chứa Pydantic models (Schemas)
|   |   |   |-- __init__.py
|   |   |   |-- book.py
|   |   |   |-- member.py
|   |   |
|   |   |-- __init__.py
|   |   |-- main.py    <-- File FastAPI chính
|   |
|   |-- .env           <-- File chứa thông tin nhạy cảm (API keys)
|   |-- .gitignore
|   |-- requirements.txt
|   |-- venv/          <-- Thư mục môi trường ảo (sẽ tạo ở bước 2)


# Tạo models
Base: Các trường chung, thường dùng làm cơ sở.

Create: Các trường cần thiết khi tạo mới (thường không chứa id hay ngayTao).

Update: Các trường có thể cập nhật (thường tất cả đều là Optional).

Model chính (ví dụ: TinhThanhPho): Kế thừa từ Base, chứa tất cả các trường đọc từ database (bao gồm id, ngayTao...).


