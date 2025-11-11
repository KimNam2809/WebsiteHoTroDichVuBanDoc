## Tổng quan kiến trúc

- `index.html`: Markup các trang/section và các modal. Tất cả hành vi tương tác dùng data-attributes để ủy quyền sự kiện (event delegation), không còn `onclick/onsubmit` inline.
- `main.js`: Điểm khởi động. Khởi tạo API, thời tiết, hoạt ảnh; đăng ký bộ lắng nghe sự kiện ủy quyền; gọi các tiện ích đóng modal bằng Esc/ngoài vùng.
- `modules/*`: Mỗi module xử lý một miền chức năng:
  - `navigation.js`: Điều hướng trang, menu mobile, khôi phục trang gần nhất, hoạt ảnh.
  - `articles.js`: Bài viết và sự kiện (mở chi tiết, in, bình luận demo).
  - `catalog.js`: Tìm kiếm, phân trang, chi tiết sách; quy trình mượn/đặt/gia hạn (localStorage) và modal liên quan.
  - `card.js`: Đăng ký thẻ thư viện (tính phí, xác thực, ảnh + Cropper, captcha, QR code, tra cứu).
  - `member.js`: Đăng nhập/đăng ký demo, dashboard/đăng xuất.
  - `admin.js`: Tab quản trị và hành động mẫu.
  - `booking.js`: Đặt chỗ/đặt phòng demo.
  - `weather.js`: Widget thời tiết (Open-Meteo, không cần API key).
  - `api.js`: Tầng API chuyển đổi giữa dữ liệu cục bộ và JSON Server (qua localStorage).
  - `utils.js`: Modal, ngày giờ, phím Esc, click ra ngoài để đóng, format ngày.
    - `storage.js`: Abstraction quản lý key namespaced (`tvdn:`), hàm domain get/set (loans, reservations, registrations, visits) + migrate legacy.
    - `sanitize.js`: `escapeHTML` và `safeHTML` (DOMParser + allow list thẻ/thuộc tính) dùng cho render động.
    - `notify.js`: Hệ thống toast hàng đợi (success/error/warn/info) thay `alert()`.

## Ủy quyền sự kiện (Event Delegation)

Các thuộc tính data-* trong `index.html` được map sang hàm trong module theo bảng sau (đã đăng ký trong `main.js`):

- `data-nav="<pageId>"` → `navigation.showPage(pageId)`
- `data-action="toggle-mobile"` → `navigation.toggleMobileMenu()`
- `data-article="<id>"` → `articles.showArticle(id)`
- `data-event="<id>"` → `articles.showEvent(id)`
- `data-card-section="form|lookup|rules|success|home"` → `card.showCardSection(section)`; khi `section==='form'` hệ thống tạo mới captcha.
- `data-captcha="refresh"` → `card.generateCaptcha()`
- `data-photo="pick|crop|apply|cancel|remove"`
  - `pick` → click ẩn vào `#photoUpload`
  - `crop` → `card.openCropper()`
  - `apply` → `card.applyCrop()`
  - `cancel` → `card.closeCropper()`
  - `remove` → `card.removePhoto()`
- `data-action="open-booking"` → `booking.showBookingForm()`
- `data-member="logout"` → `member.logout()`
- `data-admin="add-book"` → `admin.showAddBookForm()`
- `data-modal="close"` với `data-target="<modalId>"` → Đóng modal mục tiêu.

Các form theo ID:
- `#registrationForm` → `card.handleCardRegistration`
- `#cardLookupForm` → `card.handleCardLookup`
- `#borrowForm` → `catalog.handleBorrow`
- `#reserveForm` → `catalog.handleReserve`
- `#extendForm` → `catalog.handleExtend`
- `#bookingForm` → `booking.handleBooking`

Các input động/validation:
- `#cardType`, `#readerType`, radio `name="delivery"` → `card.calculateTotal`
- `#birthDate` → `card.validateAge`
- `#idNumber` → `card.validateIdNumber`
- `#email` → `card.validateEmail`
- `#phone` → `card.validatePhone`
- `#photoUpload` → `card.handlePhotoUpload`

Tab thành viên và quản trị:
- `#loginTab` → `member.showLoginForm()`; `#registerTab` → `member.showRegisterForm()`
- `#booksTab|#membersTab|#loansTab|#reportsTab` → `admin.showAdminTab('<prefix>')`

## Chuyển chế độ API

- Mặc định: dữ liệu cục bộ được đóng gói trong code.
- Bật JSON Server:
  - Chạy: `npm install` và `npm run serve:api` (server tại `http://localhost:3000`).
  - Trên trình duyệt (DevTools Console):
    ```js
    localStorage.setItem('useApiServer','1');
    localStorage.setItem('apiBaseUrl','http://localhost:3000');
    location.reload();
    ```
  - Tắt: `localStorage.removeItem('useApiServer'); location.reload();`

## Lưu trữ localStorage (demo)

- `loans`, `reservations`, `extensions`: Ghi nhận các thao tác mượn/đặt/gia hạn (mảng JSON).
- `registrations`: Hồ sơ đã đăng ký thẻ (mảng JSON, có dữ liệu QR).
- `member`: Trạng thái đăng nhập demo.
 - Namespacing mới: Các key chuẩn hóa qua `storage.js` (`tvdn:loans`, `tvdn:reservations`, ...). Legacy key vẫn được migrate một lần.

### Abstraction `storage.js`
Hàm chính:
- `getLoans() / setLoans(loans)`
- `getReservations() / setReservations(res)`
- `getRegistrations() / setRegistrations(list)`
- `incrementVisit()`
Ưu điểm: Dễ mở rộng (ví dụ: chuyển sang IndexedDB hoặc remote sync) mà không phải sửa từng module.

### Migration
Khi nạp module lần đầu, các key cũ (không namespaced) sẽ được đọc và ghi sang key mới rồi giữ nguyên bản cũ (an toàn, không xóa) để tránh mất dữ liệu.

## Sanitization & An toàn nội dung

Rủi ro: Trước đây nhiều chèn `innerHTML` trực tiếp -> nguy cơ XSS nếu dữ liệu ngoài / người dùng được đưa vào.

Giải pháp triển khai:
- Thêm `sanitize.js` với:
  - `escapeHTML(str)` dùng cho nội suy text vào template.
  - `safeHTML(html, {allowedTags, allowedAttrs})` parse DOM và lọc thẻ theo allow list.
- Ứng dụng vào: `catalog.js` (chi tiết sách), `card.js` (lookup & preview các field động), `articles.js` (articleContent qua allow list, event fields escaped).

Mặc định allow list: `p,strong,em,b,i,u,ul,ol,li,br,h1,h2,h3,h4,h5,h6,blockquote,code,pre,span` và thuộc tính an toàn (`href`,`title`,`class`,`aria-*`,`data-*`).

## Hệ thống Toast Notifications

Module: `notify.js`
- API: `notify(message, {type, duration})` + alias `notifySuccess|Error|Warn|Info`.
- Hàng đợi đảm bảo chỉ animate một toast mới sau khi toast trước bắt đầu hiển thị.
- Tự động biến mất sau 3.5s (config được).
- Thay thế toàn bộ `alert()` trong: catalog, card, articles, member, booking, admin.

Lý do: Trải nghiệm mềm, không block UI, hỗ trợ nhiều thông báo nối tiếp.

## Debounce Tìm kiếm

`utils.debounce` gắn vào `keyup` của `#searchInput` (300ms). Nút “Tìm kiếm” vẫn gọi ngay để phù hợp hành vi người dùng chủ động.

## Tối ưu ảnh

- Thêm `loading="lazy"` cho ảnh modal crop, preview, ảnh thẻ, ảnh sách.
- Có thể bổ sung thêm `width/height` hoặc `aspect-ratio` trong bước tiếp theo để giảm layout shift.

## ESLint & Prettier

Thiết lập:
- `.eslintrc.json`: `eslint:recommended`, rule bổ sung: `eqeqeq`, `no-var`, `prefer-const`, `no-alert`, kiểm soát console.
- `.prettierrc`: width 100, semi true.
- Scripts: `npm run lint`, `npm run lint:fix`, `npm run format`.

Lợi ích: Chuẩn hóa style, tránh reintroduce alert/XSS patterns, dễ code review.

## Kiến trúc thông báo thống kê (stats)

`stats.js` lắng các sự kiện thay đổi (mượn, đặt, gia hạn) qua `notifyChange()` để cập nhật thống kê hiển thị ở trang chủ (số đang mượn, visits...).

## Checklist các cải tiến đã áp dụng

1. Tách monolith -> modules + archive `legacy/app-legacy.js`.
2. Storage abstraction namespaced + migration.
3. Sanitization allow list & escape cho field động.
4. Toast notifications thay `alert`.
5. ESLint + Prettier.
6. Lazy loading ảnh.
7. Debounce search.

## Định hướng tương lai (Roadmap gợi ý)

- Role / Auth thực sự: JWT hoặc session backend thay localStorage đơn giản.
- Module test: Jest + tests tối thiểu (storage, sanitize, debounce, catalog search logic).
- Bundling & code splitting: Vite / Rollup để giảm tải lần đầu, tree-shake icon libs.
- Performance: Preload critical fonts, thêm `rel=preconnect` tới CDN frequently used.
- Accessibility: Bổ sung ARIA roles cho toast, modal traps focus, skip links.
- Error tracking: Hook window.onerror + gửi log (ẩn danh) đến endpoint.
- Progressive enhancement: Offline caching (Service Worker) cho catalog.

## Bảo mật mở rộng (khuyến nghị)

- Chặn URL protocol nguy hiểm trong ảnh/links: filter `javascript:` / `data:text/html`.
- Thêm CSP meta vào `index.html` (script-src 'self' https: 'unsafe-inline' (tạm) → dần giảm inline).
- Tách quyền admin/staff/member chuẩn với backend xác thực.
- Hash / encrypt thông tin nhạy cảm nếu lưu local (chỉ khi bắt buộc – vẫn nên tránh lưu nhạy cảm phía client).

## Hướng dẫn đóng góp nhanh

1. Tạo nhánh mới: `feat/<ten>`.
2. Chạy lint: `npm run lint` (sửa tự động: `npm run lint:fix`).
3. Format: `npm run format`.
4. Test thủ công UI chính: mở server static + thử mượn/đặt/gia hạn.
5. Pull request mô tả module tác động và lỗi tiềm ẩn.

## Ghi chú Legacy

File gốc `app.js` đã được đưa vào `legacy/` (rút gọn) để tránh drift. Tuyệt đối không khôi phục thay vì module hóa.

---
Nếu cần tài liệu chi tiết sâu hơn (sequence diagram luồng mượn sách, lifecycle modal, v.v.) có thể mở rộng thêm phần Phụ lục.

## UX và Modal

- Nhấn `Esc` hoặc click ra ngoài vùng modal sẽ đóng modal (`utils.initGlobalEscClose` và `utils.initOutsideClickClose`).
- Thêm class `fade-in` để có hiệu ứng vào, `fade-in--visible` sau khi vào viewport. Điều khiển trong `navigation.initAnimations()`.

## Lỗi thường gặp

- Không thấy API trả dữ liệu: Kiểm tra đã bật JSON Server và đặt `useApiServer`, `apiBaseUrl` đúng chưa.
- Không bấm được nút: Đảm bảo phần tử có đúng `data-*` như trên; `main.js` đã được nạp dưới dạng `type="module"` và không còn `app.js` cũ.
