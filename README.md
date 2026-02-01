<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase"/>
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="TailwindCSS"/>
  <img src="https://img.shields.io/badge/LangChain-AI-FFA500?style=for-the-badge" alt="LangChain"/>
</p>

<h1 align="center">📚 Website Hỗ Trợ Dịch Vụ Bạn Đọc</h1>

<p align="center">
  <strong>Hệ thống quản lý thư viện thông minh tích hợp AI Chatbot</strong><br/>
  <em>Graduation Project - Do Phu Huy (Teacher) & Le Kim Nam</em>
</p>

---

## 📋 Mục Lục

- [Giới Thiệu](#-giới-thiệu)
- [Tính Năng Chính](#-tính-năng-chính)
- [Công Nghệ Sử Dụng](#️-công-nghệ-sử-dụng)
- [Sơ Đồ Cơ Sở Dữ Liệu](#-sơ-đồ-cơ-sở-dữ-liệu)
- [Giao Diện Ứng Dụng](#-giao-diện-ứng-dụng)
- [Hướng Dẫn Cài Đặt](#-hướng-dẫn-cài-đặt)
- [Cấu Trúc Thư Mục](#-cấu-trúc-thư-mục)
- [Tác Giả](#-tác-giả)

---

## 🌟 Giới Thiệu

**Website Hỗ Trợ Dịch Vụ Bạn Đọc** là một hệ thống quản lý thư viện toàn diện, kết hợp giữa nghiệp vụ thư viện truyền thống và công nghệ AI tiên tiến. Hệ thống hỗ trợ:

- 🔍 **Tra cứu tài liệu thông minh** với tìm kiếm ngữ nghĩa
- 🤖 **AI Chatbot 24/7** giải đáp thắc mắc và hỗ trợ bạn đọc
- 📱 **Đăng ký dịch vụ online** (thẻ thư viện, mượn sách, đặt chỗ ngồi)
- 👨‍💼 **Dashboard quản trị** cho nhân viên thư viện

---

## ✨ Tính Năng Chính

### 👤 Dành cho Bạn Đọc

| Tính năng | Mô tả |
|-----------|-------|
| **Tra cứu tài liệu** | Tìm kiếm sách theo tên, tác giả, từ khóa hoặc mô tả |
| **Đăng ký thẻ online** | Nộp hồ sơ, upload ảnh, chọn loại thẻ và thanh toán |
| **Đặt mượn tài liệu** | Đặt trước bản sao sách, nhận thông báo khi sách sẵn sàng |
| **Gia hạn tài liệu** | Gia hạn thời gian mượn trực tuyến |
| **Đặt chỗ ngồi/phòng** | Đặt chỗ học tập hoặc phòng họp nhóm |
| **Xem lịch sử mượn trả** | Theo dõi toàn bộ hoạt động mượn/trả |
| **Xem bài viết thư viện** | Đọc tin tức, hướng dẫn và thông báo |

### 🤖 AI Chatbot (RAG Agent)

| Tính năng | Mô tả |
|-----------|-------|
| **Trợ lý ảo 24/7** | Giải đáp về nội quy, giờ mở cửa, thủ tục |
| **Tra cứu ngữ nghĩa** | Tìm sách bằng mô tả tự nhiên |
| **Cá nhân hóa** | Kiểm tra lịch sử mượn, nợ phạt, trạng thái thẻ |
| **Điều hướng thông minh** | Tự động chuyển đến trang chức năng phù hợp |

### 👨‍💼 Dành cho Nhân Viên Thư Viện

| Tính năng | Mô tả |
|-----------|-------|
| **Phê duyệt đăng ký thẻ** | Xét duyệt hồ sơ đăng ký thẻ bạn đọc |
| **Xác nhận mượn/trả** | Đối chiếu và xác nhận giao dịch mượn/trả sách |
| **Quản lý bài viết** | Tạo, sửa, xóa tin tức và thông báo |
| **Quản lý đặt chỗ** | Theo dõi và quản lý việc đặt chỗ ngồi/phòng |

---

## 🛠️ Công Nghệ Sử Dụng

| Thành phần | Công nghệ |
|------------|-----------|
| **Frontend** | Next.js 14 (App Router), TailwindCSS, Supabase Auth Helper |
| **Backend** | Python FastAPI, Pydantic, Uvicorn |
| **Database** | Supabase (PostgreSQL), pgvector (Vector Search) |
| **AI Core** | LangChain, Groq API (Llama 3), FlashRank (Reranking) |
| **Storage** | Supabase Storage (lưu ảnh bìa sách, ảnh thẻ) |
| **Authentication** | JWT, Supabase Auth |

---

## 🗄️ Sơ Đồ Cơ Sở Dữ Liệu

<p align="center">
  <img src="docs/screenshots/database_schema.png" alt="Database Schema" width="100%"/>
</p>

---

## 🖥️ Giao Diện Ứng Dụng

### 📱 Giao Diện Người Dùng

<details>
<summary><strong>🏠 Trang Chủ</strong></summary>
<br/>
<img src="docs/screenshots/homepage.png" alt="Homepage" width="100%"/>
</details>

<details>
<summary><strong>📝 Đăng Ký Tài Khoản</strong></summary>
<br/>
<img src="docs/screenshots/register.png" alt="Register" width="100%"/>
</details>

<details>
<summary><strong>🔐 Đăng Nhập</strong></summary>
<br/>
<img src="docs/screenshots/login.png" alt="Login" width="100%"/>
</details>

<details>
<summary><strong>🔍 Tra Cứu Tài Liệu</strong></summary>
<br/>
<img src="docs/screenshots/search_documents.png" alt="Search Documents" width="100%"/>
</details>

<details>
<summary><strong>📰 Danh Sách Bài Viết</strong></summary>
<br/>
<img src="docs/screenshots/articles_list.png" alt="Articles List" width="100%"/>
</details>

<details>
<summary><strong>📄 Chi Tiết Bài Viết</strong></summary>
<br/>
<img src="docs/screenshots/article_detail.png" alt="Article Detail" width="100%"/>
</details>

<details>
<summary><strong>📖 Chi Tiết Tài Liệu</strong></summary>
<br/>
<img src="docs/screenshots/document_detail.png" alt="Document Detail" width="100%"/>
</details>

<details>
<summary><strong>💳 Đăng Ký Thẻ Thư Viện</strong></summary>
<br/>
<img src="docs/screenshots/card_registration.png" alt="Card Registration" width="100%"/>
</details>

<details>
<summary><strong>👤 Trang Cá Nhân Bạn Đọc</strong></summary>
<br/>
<img src="docs/screenshots/reader_profile.png" alt="Reader Profile" width="100%"/>
</details>

<details>
<summary><strong>📚 Đặt Mượn Tài Liệu</strong></summary>
<br/>
<img src="docs/screenshots/borrow_document.png" alt="Borrow Document" width="100%"/>
</details>

<details>
<summary><strong>🔄 Gia Hạn Tài Liệu</strong></summary>
<br/>
<img src="docs/screenshots/renew_document.png" alt="Renew Document" width="100%"/>
</details>

<details>
<summary><strong>📋 Lịch Sử Mượn Trả</strong></summary>
<br/>
<img src="docs/screenshots/borrow_history.png" alt="Borrow History" width="100%"/>
</details>

<details>
<summary><strong>💺 Đặt Chỗ Ngồi/Phòng</strong></summary>
<br/>
<img src="docs/screenshots/seat_booking.png" alt="Seat Booking" width="100%"/>
</details>

---

### 👨‍💼 Giao Diện Quản Trị

<details>
<summary><strong>✅ Phê Duyệt Đăng Ký Thẻ</strong></summary>
<br/>
<img src="docs/screenshots/admin_card_approval.png" alt="Admin Card Approval" width="100%"/>
</details>

<details>
<summary><strong>📥 Xác Nhận Mượn Tài Liệu</strong></summary>
<br/>
<img src="docs/screenshots/admin_borrow_confirm.png" alt="Admin Borrow Confirm" width="100%"/>
</details>

<details>
<summary><strong>📤 Xác Nhận Trả Tài Liệu</strong></summary>
<br/>
<img src="docs/screenshots/admin_return_confirm.png" alt="Admin Return Confirm" width="100%"/>
</details>

<details>
<summary><strong>📝 Quản Lý Bài Viết</strong></summary>
<br/>
<img src="docs/screenshots/admin_articles.png" alt="Admin Articles" width="100%"/>
</details>

<details>
<summary><strong>🪑 Quản Lý Đặt Chỗ</strong></summary>
<br/>
<img src="docs/screenshots/admin_seat_booking.png" alt="Admin Seat Booking" width="100%"/>
</details>

---

## 🚀 Hướng Dẫn Cài Đặt

### Yêu Cầu Hệ Thống

- **Node.js** >= 18.x
- **Python** >= 3.10
- **Git**
- Tài khoản **Supabase** (miễn phí)

---

### 1️⃣ Clone Repository

```bash
git clone https://github.com/KimNam2809/WebsiteHoTroDichVuBanDoc.git
cd WebsiteHoTroDichVuBanDoc
```

---

### 2️⃣ Tạo Database với Supabase

#### Bước 1: Tạo Project Supabase

1. Truy cập [https://supabase.com](https://supabase.com) và đăng nhập
2. Click **"New Project"** và điền thông tin:
   - **Name**: `library-management` (hoặc tên tùy chọn)
   - **Database Password**: Đặt mật khẩu mạnh (lưu lại để dùng sau)
   - **Region**: Chọn vùng gần nhất

3. Chờ project được khởi tạo (~2 phút)

#### Bước 2: Lấy Connection String

1. Vào **Project Settings** → **Database**
2. Copy **Connection string** (URI) dạng:
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
   ```
3. Thay `[PASSWORD]` bằng mật khẩu database của bạn

#### Bước 3: Tạo Bảng và Dữ Liệu Mẫu

1. Vào **SQL Editor** trên Supabase Dashboard
2. Mở file `schema_database.txt` trong repository
3. Copy toàn bộ nội dung và paste vào SQL Editor
4. Click **Run** để tạo tất cả các bảng

> ⚠️ **Lưu ý**: File `schema_database.txt` chứa toàn bộ schema database bao gồm:
> - Các bảng chính: `nguoidung`, `bandoc`, `nhanvien`, `tacpham`, `bansao`, `muontra`, etc.
> - Các trigger tự động cập nhật `updated_at`
> - Vector index cho tìm kiếm ngữ nghĩa

#### Bước 4: Kích Hoạt pgvector (Tùy chọn - cho AI Search)

```sql
-- Chạy trong SQL Editor
CREATE EXTENSION IF NOT EXISTS vector;
```

---

### 3️⃣ Cấu Hình Backend (FastAPI)

```bash
# Di chuyển vào thư mục backend
cd WebsiteHoTroDichVuBanDoc_Backend/WebsiteHoTroDichVuBanDoc_Backend
```

#### Bước 1: Tạo môi trường ảo

```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux/macOS
python3 -m venv venv
source venv/bin/activate
```

#### Bước 2: Cài đặt thư viện

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

#### Bước 3: Cấu hình biến môi trường

Tạo file `.env` trong thư mục backend:

```env
# ============ DATABASE CONFIG ============
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_DB_STR=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# ============ JWT SECURITY ============
JWT_SECRET_KEY=your_super_secret_key_change_this_to_random_string
JWT_ALGORITHM=HS256

# ============ AI SERVICES ============
GROQ_API_KEY=gsk_your_groq_api_key
# OPENAI_API_KEY=sk_your_openai_key  # Optional
USE_OPENAI=false

# ============ 3RD PARTY (Optional) ============
# SENDGRID_API_KEY=your_sendgrid_key
# GOOGLE_API_KEY=your_google_api_key
```

> 💡 **Lấy API Keys**:
> - **Supabase Keys**: Project Settings → API
> - **Groq API Key**: [https://console.groq.com](https://console.groq.com)

#### Bước 4: Khởi chạy Backend

```bash
uvicorn app.main:app --reload
```

✅ Backend sẽ chạy tại: `http://127.0.0.1:8000`  
📖 API Docs: `http://127.0.0.1:8000/docs`

---

### 4️⃣ Cấu Hình Frontend (Next.js)

Mở terminal mới:

```bash
# Di chuyển vào thư mục frontend
cd WebsiteHoTroDichVuBanDoc_UI/WebsiteHoTroDichVuBanDoc_UI/website_hotrodichvubandoc
```

#### Bước 1: Cài đặt dependencies

```bash
npm install
```

#### Bước 2: Cấu hình biến môi trường

Tạo file `.env.local`:

```env
# ============ SUPABASE CLIENT ============
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# ============ BACKEND CONNECTION ============
FASTAPI_BACKEND_URL=http://127.0.0.1:8000
FASTAPI_JWT_SECRET=your_super_secret_key_change_this_to_random_string  # Phải khớp với Backend
```

#### Bước 3: Khởi chạy Frontend

```bash
npm run dev
```

✅ Website sẽ chạy tại: `http://localhost:3000`

---

## 📂 Cấu Trúc Thư Mục

```
WebsiteHoTroDichVuBanDoc/
├── 📁 WebsiteHoTroDichVuBanDoc_Backend/
│   └── 📁 WebsiteHoTroDichVuBanDoc_Backend/
│       ├── 📁 app/
│       │   ├── 📁 api/v1/endpoints/   # API routes (Auth, Sách, Mượn trả, Chatbot)
│       │   ├── 📁 services/           # Business logic (RAG, AI Brain)
│       │   ├── 📁 tools/              # AI Tools (DB queries, Actions)
│       │   └── 📁 models/             # Pydantic schemas
│       ├── 📁 ingest/                 # Scripts nạp dữ liệu Vector DB
│       ├── 📁 rag_data/               # Dữ liệu RAG (nội quy, hướng dẫn)
│       └── 📄 requirements.txt
│
├── 📁 WebsiteHoTroDichVuBanDoc_UI/
│   └── 📁 WebsiteHoTroDichVuBanDoc_UI/
│       └── 📁 website_hotrodichvubandoc/
│           ├── 📁 src/
│           │   ├── 📁 app/            # Next.js App Router
│           │   │   ├── 📁 admin/      # Trang quản trị (protected)
│           │   │   ├── 📁 tai_khoan/  # Trang cá nhân bạn đọc
│           │   │   └── 📁 ...         # Các route khác
│           │   ├── 📁 components/     # UI Components (Chatbot, Header, Table)
│           │   └── 📁 lib/            # Supabase Client, Server Actions
│           ├── 📄 middleware.js       # Auth & Role-based access control
│           └── 📄 package.json
│
├── 📁 docs/
│   ├── 📁 screenshots/                # Ảnh chụp giao diện
│   ├── 📁 uml/                        # Sơ đồ UML (Use Case, Sequence, Class)
│   └── 📁 sql/                        # SQL scripts
│
├── 📄 schema_database.txt             # Full database schema
└── 📄 README.md
```

---

## 👥 Tác Giả

<table>
  <tr>
    <td align="center">
      <strong>Đỗ Phú Huy</strong><br/>
      <em>Teacher</em>
    </td>
    <td align="center">
      <strong>Lê Kim Nam</strong><br/>
      <em>Frontend Developer & Backend Developer & AI Engineer</em>
    </td>
  </tr>
</table>

---

<p align="center">
  <strong>⭐ Nếu thấy project hữu ích, hãy cho tôi một star nhé! ⭐</strong>
</p>
