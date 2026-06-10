<p align="center">
  <img src="https://img.shields.io/badge/Vue.js-3.4-42b883?style=for-the-badge&logo=vuedotjs" alt="Vue.js"/>
  <img src="https://img.shields.io/badge/Spring%20Boot-3.3-6db33f?style=for-the-badge&logo=springboot" alt="Spring Boot"/>
  <img src="https://img.shields.io/badge/Java-17-007396?style=for-the-badge&logo=openjdk" alt="Java 17"/>
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite" alt="Vite"/>
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase"/>
</p>

<h1 align="center">Website Hỗ Trợ Dịch Vụ Bạn Đọc</h1>

<p align="center">
  Ứng dụng quản lý thư viện với frontend VueJS và backend Spring Boot.
</p>

---

## Giới Thiệu

Đây là hệ thống hỗ trợ bạn đọc và nhân viên thư viện với các chức năng chính:

- Tra cứu tài liệu
- Xem bài viết, tin tức, thông báo
- Đăng ký thẻ thư viện
- Quản lý mượn trả, đặt chỗ, hồ sơ bạn đọc
- Đăng nhập bằng tài khoản nội bộ hoặc Google OAuth qua Supabase

---

## Công Nghệ Sử Dụng

| Thành phần | Công nghệ |
|---|---|
| Frontend | Vue 3, Vite, Vue Router, Pinia, Axios |
| Backend | Spring Boot 3.3, Java 17, Spring Security, Spring Data JPA |
| Database | PostgreSQL trên Supabase |
| UI | TailwindCSS, lucide-vue-next |
| Xác thực | JWT, Supabase Auth |

---

## Cấu Trúc Dự Án

```text
WebsiteHoTroDichVuBanDoc/
├── Backend/
│   ├── pom.xml
│   ├── mvnw.cmd
│   └── src/
└── Frontend/
    ├── package.json
    ├── vite.config.js
    └── src/
```

---

## Yêu Cầu Cài Đặt

- Node.js 18+
- Java 17+
- Tài khoản Supabase và PostgreSQL đã cấu hình sẵn

Ghi chú: trên Windows có thể dùng `mvnw.cmd`, không cần cài Maven riêng.

---

## Chạy Dự Án

### 1) Chạy Backend

Mở terminal tại thư mục `Backend` rồi chạy:

```bash
cd Backend
.\mvnw.cmd spring-boot:run
```

Backend mặc định chạy tại:

```text
http://localhost:8000
```

### 2) Chạy Frontend

Mở terminal khác tại thư mục `Frontend` rồi chạy:

```bash
cd Frontend
npm install
npm run dev
```

Frontend mặc định chạy tại:

```text
http://localhost:3000
```

---

## Cấu Hình Môi Trường

### Frontend

Tạo file `Frontend/.env` hoặc `Frontend/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend

Cấu hình chính nằm trong `Backend/src/main/resources/application.yml`:

- `server.port`: cổng backend
- `spring.datasource.*`: kết nối PostgreSQL
- `jwt.secret`: khóa ký JWT
- `supabase.*`: cấu hình Supabase Storage

Nếu đổi cổng backend, nhớ cập nhật `VITE_API_BASE_URL` cho khớp.

---

## Kiểm Tra Nhanh Sau Khi Chạy

Mở các URL sau để xác nhận hệ thống đang hoạt động:

- `http://localhost:3000/`
- `http://localhost:3000/dang_nhap`
- `http://localhost:3000/tim_kiem`
- `http://localhost:3000/bai_viet`
- `http://localhost:3000/dang_ky_the`
- `http://localhost:3000/tai_khoan` sau khi đăng nhập

API backend có thể kiểm tra nhanh tại:

- `http://localhost:8000/api/v1/auth/login`
- `http://localhost:8000/api/v1/tac-pham/tim-kiem-nang-cao`

---

## Tài Khoản Test

Trong quá trình kiểm thử đã tạo một tài khoản test tạm thời:

- Username: `temp_test_20260609`
- Password: `abc123`

Tài khoản này dùng để kiểm tra luồng đăng nhập và các màn hình cần xác thực.

---

## Ghi Chú

- Repository này dùng **VueJS** cho frontend, không còn là Next.js.
- Backend là **Spring Boot**, không còn là FastAPI.
- Nếu màn hình hiển thị trống hoặc báo lỗi tải dữ liệu, kiểm tra lại backend đã chạy ở port `8000` và frontend đã trỏ đúng `VITE_API_BASE_URL`.
