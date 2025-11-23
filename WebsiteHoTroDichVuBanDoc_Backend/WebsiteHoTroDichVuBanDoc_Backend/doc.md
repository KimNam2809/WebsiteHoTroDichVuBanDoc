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

# Install file requirements.txt tự động:
pip freeze > requirements.txt

# Install toàn bộ package trong file requirements
pip install -r requirements.txt

# Khởi chạy FastAPI
uvicorn app.main:app --reload

# URL test API (Swagger)
http://127.0.0.1:8000/docs

# File Expoler
/du_an_tot_nghiep/
|
|-- /frontend/       <-- Nơi chứa code Next.js
|
|-- /backend/        <-- Nơi chứa code FastAPI
|   |
|   |-- /app/        <-- Thư mục chứa code logic chính
|   |   |-- /api/    <-- Nơi chứa các file định nghĩa endpoints
|   |   |   |-- __init__.py
|   |   |   |-- v1/
|   |   |   |   |-- __init__.py
|   |   |   |   |-- endpoints/
|   |   |   |   |   |-- __init__.py
|   |   |   |   |   |-- tac_pham_api.py    <-- API cho tác phẩm
|   |   |   |   |   |-- auth_api.py  <-- API cho xác thực
|   |   |   |   |   |-- ...
|   |   |   |   |-- api.py        <-- File tổng hợp các router v1
|   |   |
|   |   |-- /connect/     <-- Nơi chứa cấu hình, file kết nối
|   |   |   |-- __init__.py
|   |   |   |-- config.py    <-- Để đọc file .env
|   |   |   |-- db.py        <-- Để khởi tạo Supabase client
|   |   |   |-- auth.py      <-- Nơi tạo các xác thực phân quyền cho các nghiệp vụ (Ví dụ: xác thực là bạn đọc hoặc nhân viên)
|   |   |   |-- security.py  <-- Nơi tạo các phương thức băm mật khẩu, xác thực mật khẩu, tạo JWT token, ...
|   |   |
|   |   |-- /models/   <-- Nơi chứa Pydantic models (Schemas)
|   |   |   |-- __init__.py
|   |   |   |-- tac_pham.py
|   |   |   |-- ban_doc.py
|   |   |   |-- ...
|   |   |
|   |   |-- __init__.py
|   |   |-- main.py    <-- File FastAPI chính
|   |   |-- utils.py   <-- File chứa các phương thức định dạng kiểu dữ liệu json đặc biệt được gửi đi như "datetime, decimal, ..."
|   |
|   |-- .env           <-- File chứa thông tin nhạy cảm (API keys, Supabase API keys, ...)
|   |-- .gitignore
|   |-- requirements.txt
|   |-- venv/          <-- Thư mục môi trường ảo


# Tạo models
Base: Các trường chung, thường dùng làm cơ sở.

Create: Các trường cần thiết khi tạo mới (thường không chứa id hay ngayTao).

Update: Các trường có thể cập nhật (thường tất cả đều là Optional).

Model chính (ví dụ: TinhThanhPho): Kế thừa từ Base, chứa tất cả các trường đọc từ database (bao gồm id, ngayTao...).


