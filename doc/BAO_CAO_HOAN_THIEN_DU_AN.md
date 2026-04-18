# Tourista — Báo Cáo Phân Tích Toàn Diện & Kế Hoạch Hoàn Thiện Đồ Án

> Phiên bản: 1.0 — Ngày: 18/04/2026
> Tác giả: AI Analysis (Claude)
> Trạng thái dự án: Đã có nền tảng — Cần hoàn thiện để đạt điểm đột phá

---

## MỤC LỤC

1. [Tổng Quan Dự Án](#1-tổng-quan-dự-án)
2. [Thành Tựu Đạt Được](#2-thành-tựu-đạt-được)
3. [Các Vấn Đề Cần Sửa (BUGS & FIXES)](#3-các-vấn-đề-cần-sửa-bugs--fixes)
4. [Các Phần Thiếu Cần Hoàn Thiện](#4-các-phần-thiếu-cần-hoàn-thiện)
5. [Tính Năng Đột Phá Gợi Ý Thêm](#5-tính-năng-đột-phá-gợi-ý-thêm)
6. [Kế Hoạch Thực Hiện Chi Tiết](#6-kế-hoạch-thực-hiện-chi-tiết)
7. [Ưu Tiên Thực Hiện](#7-ưu-tiên-thực-hiện)

---

## 1. Tổng Quan Dự Án

### 1.1 Kiến Trúc

```
Tourista/
├── backend/          # Spring Boot 3.4.3 — Java 21
│   └── src/main/java/vn/tourista/
│       ├── controller/   (13 controller: Auth, Hotel, Tour, Booking, Payment, Review, Chat, Admin, Home, UserProfile, Message)
│       ├── service/     (Business logic + Gemini AI)
│       ├── repository/  (JPA repositories)
│       ├── entity/      (JPA entities: User, Hotel, Tour, Booking, Promotion, AuditLog...)
│       ├── dto/         (Request/Response DTOs)
│       ├── security/    (JWT, OAuth2, Rate Limiting, WebSocket Auth)
│       └── exception/   (GlobalExceptionHandler + custom exceptions)
├── frontend/        # Next.js 16 — React 19 — TypeScript — Tailwind CSS 4
│   └── app/
│       ├── (auth): login, register, verify-email, reset-password, forgot-password, oauth2/callback
│       ├── (main): home page, hotels/, tours/
│       ├── profile/: profile, bookings, favorites
│       ├── articles/: page, create, [slug]
│       ├── admin/: dashboard, users, hotels, tours, bookings, promotions, settings
│       └── payments/: success, vnpay/return, booking-qr
├── database/        # MySQL schema + CSV import scripts
└── doc/             # Release plans, deployment guides
```

### 1.2 Công Nghệ Sử Dụng

| Lớp | Công nghệ | Ghi chú |
|-----|-----------|---------|
| Backend | Spring Boot 3.4.3, Java 21, Maven | Hiện đại, LTS |
| Database | MySQL 8.0+ | Schema đầy đủ |
| Security | Spring Security, JWT (JJWT 0.12.x), Google OAuth2, Bucket4j (rate-limit) | Bảo mật nhiều lớp |
| Realtime | WebSocket (STOMP/SockJS) | Chat |
| Payment | VNPay (sandbox) | Tích hợp sẵn |
| AI | Google Gemini 2.0 Flash | Chatbot/FAQ |
| Email | SMTP Gmail | Xác thực email |
| Frontend | Next.js 16, React 19, TypeScript | App Router |
| State | Redux Toolkit (6 slices: auth, hotels, bookings, search, ui, chat) | Quản lý state |
| API Client | Axios + interceptors (token refresh, hardened storage) | |
| Styling | Tailwind CSS 4, custom CSS Modules | |
| Images | Cloudinary (server-side sign URL) | Upload ảnh |
| Testing | Playwright (E2E) | |
| Search | Next.js sitemap | SEO |

### 1.3 Phạm Vi Nghiệp Vụ

- **Đặt khách sạn**: Danh sách, tìm kiếm, filter, chi tiết, đặt phòng
- **Đặt tour**: Danh sách, tìm kiếm, filter, chi tiết, lịch trình, đặt tour
- **Thanh toán**: VNPay (tạo URL, IPN, return)
- **Xác thực**: Register, login, OAuth2 Google, xác thực email, quên/mật khẩu
- **Người dùng**: Profile, booking history, favorites
- **Bài viết**: CMS cơ bản (lưu localStorage — cần backend)
- **Chat**: Realtime WebSocket (bot + partner messages)
- **Quản trị**: Dashboard, quản lý users/hotels/tours/bookings/promotions, audit log
- **Thông báo & Quảng cáo**: TopAnnouncementBar, PromoPopup, FloatingGiftWidget, InlineAdBanner

---

## 2. Thành Tựu Đạt Được

- Backend Spring Boot đầy đủ với phân quyền, JWT, rate limiting, audit log
- Frontend Next.js với 32+ trang/page hoàn chỉnh
- Redux store với 6 slices, interceptors cho auto token refresh
- Tích hợp VNPay thực tế (backend + frontend success page + IPN)
- Chat realtime WebSocket với bot scenario choices + booking itinerary card
- Admin dashboard với chart doanh thu 6 tháng + bảng recent bookings
- Review system với upload ảnh/video lên Cloudinary
- OAuth2 Google login (backend + frontend callback)
- Schema MySQL phong phú với 30+ bảng
- Playwright E2E test framework
- Có sitemap.ts cho SEO
- Hotel detail page rất chi tiết (1100+ dòng, gallery, map, tabs, FAQ, reviews)
- Tour detail page chi tiết (800+ dòng, itinerary, includes/excludes, reviews)
- Article detail page với comments system
- Booking QR code page (qrcode.react)

---

## 3. Các Vấn Đề Cần Sửa (BUGS & FIXES)

### 🔴 Nghiêm Trọng

**[BUG-01] Lỗi tiếng Việt không dấu trong UI Admin**
- **Mô tả**: Các button/admin page dùng chữ tiếng Việt không dấu (ví dụ: "Dang cho", "Da xac nhan", "Da huy", "Tong doanh thu", "Dang tai du lieu..."). Đây là bug rất rõ trên dashboard và nhiều trang admin.
- **File**: `frontend/app/admin/page.tsx`, `frontend/app/admin/bookings/page.tsx`
- **Sửa**: Thay toàn bộ text không dấu bằng tiếng Việt có dấu đúng chính tả.

**[BUG-02] Lộ thông tin nhạy cảm trong mã nguồn**
- **Mô tả**: File `backend/src/main/resources/application.yml` chứa JWT secret mặc định rỗng và các config placeholder — đúng để chạy local, nhưng **KHÔNG bao gồm `.env.example`** để hướng dẫn cấu hình an toàn.
- **Sửa**: Tạo `backend/.env.example` đầy đủ với tất cả biến môi trường cần thiết.

**[BUG-03] CURRENCY trong constants.js là USD nhưng app dùng VND**
- **Mô tả**: `frontend/src/utils/constants.js` có:
  ```js
  export const CURRENCY = {
    SYMBOL: "$",
    CODE: "USD",
    LOCALE: "en-US",
  };
  ```
  Nhưng toàn bộ UI hiển thị `₫` và `VND`. Constants FILTER_OPTIONS cũng dùng `$`.
- **Sửa**: Đổi thành `SYMBOL: "₫"`, `CODE: "VND"`, `LOCALE: "vi-VN"`.

**[BUG-04] CURRENCY trong FILTER_OPTIONS dùng $ thay vì VND**
- **Mô tả**: `FILTER_OPTIONS.PRICE_RANGES` trong constants.js dùng giá USD (`$50`, `$100`...).
- **Sửa**: Chuyển thành khoảng giá VND phù hợp với thị trường Việt Nam.

### 🟠 Quan Trọng

**[BUG-05] Article system dùng localStorage thay vì API**
- **Mô tả**: `articles/page.jsx`, `articles/create/page.jsx`, `articles/[slug]/page.jsx` đều lưu trữ dữ liệu bài viết trong `localStorage`. Comment system cũng dùng localStorage.
- **Ảnh hưởng**: Không bền vững, không chia sẻ được giữa người dùng, không có backend validation.
- **Sửa**: Cần tạo backend Article entity/repository/service/controller và kết nối API.

**[BUG-06] next.config.ts trống — chưa cấu hình**
- **Mô tả**: `frontend/next.config.ts` chỉ có type imports, không có cấu hình `images` (remote patterns cho Cloudinary, Unsplash, pravatar), không có redirects, rewrites, headers.
- **Sửa**: Thêm:
  ```ts
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'i.pravatar.cc' },
    ],
  },
  ```

**[BUG-07] Không có trang tạo/sửa hotel cho admin**
- **Mô tả**: Admin có module quản lý hotels nhưng **không có trang** tạo mới hoặc sửa thông tin hotel.
- **Sửa**: Tạo `/admin/hotels/create` và `/admin/hotels/[id]/edit`.

**[BUG-08] Không có trang tạo/sửa tour cho admin**
- **Tương tự** như hotel, admin không có trang quản lý CRUD tour.
- **Sửa**: Tạo `/admin/tours/create` và `/admin/tours/[id]/edit`.

**[BUG-09] Lỗi hydration nếu có in `frontend/app/tours/page.tsx`**
- **Mô tả**: Dòng 337: `onClick={undefined}` — prop `onClick` nhận giá trị `undefined` thay vì function.
- **Sửa**: Xóa prop `onClick={undefined}` hoặc xử lý đúng.

**[BUG-10] social_links và contact_info trong constants.js chứa thông tin cá nhân thật**
- **Mô tả**: `SOCIAL_LINKS.FACEBOOK` = `le.uc.anh.607536`, `CONTACT_INFO.EMAIL` = `ducanhle28072003@gmail.com`, `CONTACT_INFO.PHONE` = `0815913408`.
- **Sửa**: Chuyển thành thông tin công ty hoặc placeholder. Giữ lại Zalo URL.

### 🟡 Nhỏ

**[BUG-11] Các page articles sử dụng `jsx` thay vì `tsx`**
- **Mô tả**: Các file `.jsx` không có TypeScript, không có type checking. Nên chuyển sang `.tsx`.
- **Sửa**: Đổi sang TypeScript để đồng nhất codebase.

**[BUG-12] Không có Error Boundary cho Next.js**
- **Mô tả**: Có `global-error.tsx` nhưng không có error boundary ở cấp page/component.
- **Sửa**: Thêm error boundary cho các section quan trọng.

**[BUG-13] Helper `Hasher.java` trong backend không rõ mục đích**
- **Mô tả**: `backend/src/main/java/vn/tourista/Hasher.java` — class này nằm ngoài package chuẩn, không có javadoc.
- **Sửa**: Xóa hoặc document rõ ràng nếu còn cần.

**[BUG-14] Admin Dashboard dùng hardcoded labels**
- **Mô tả**: Status labels như `statusLabelMap` hardcoded không có i18n.
- **Sửa**: Tách ra constants hoặc i18n.

---

## 4. Các Phần Thiếu Cần Hoàn Thiện

### 4.1 Backend — API Endpoints & Business Logic

| # | Tính năng | Mô tả | Độ ưu tiên |
|---|-----------|--------|------------|
| B-01 | Article CRUD API | Controller, Service, Entity cho articles (hiện chỉ có Article entity) | 🔴 Cao |
| B-02 | Tour CRUD API (Admin) | Admin tạo/sửa tour (itinerary, images, departure schedule) | ✅ Đã xong (Week 2) |
| B-03 | Hotel CRUD API (Admin) | Admin tạo/sửa hotel (amenities, room types, images) | ✅ Đã xong (Week 2) |
| B-04 | Review moderation | Admin duyệt/xóa review | 🟠 Trung |
| B-05 | Email templates | HTML email templates đẹp cho verify email, booking confirmation | 🟠 Trung |
| B-06 | Statistics / Analytics API | API chuyên biệt cho dashboard stats (revenue, bookings by date, top destinations) | 🟠 Trung |
| B-07 | Notification system | Lưu và gửi notification khi booking confirmed/cancelled | 🟡 Thấp |
| B-08 | Payment refund logic | Xử lý hoàn tiền khi admin cancel booking đã thanh toán | 🟡 Thấp |
| B-09 | Booking conflict detection | Kiểm tra trùng booking khi user đặt cùng phòng/cùng tour | 🟡 Thấp |
| B-10 | Gemini FAQ chatbot backend | Endpoint để bot trả lời FAQ dựa trên Gemini | 🟠 Trung |

### 4.2 Frontend — Pages & Components

| # | Tính năng | Mô tả | Độ ưu tiên |
|---|-----------|--------|------------|
| F-01 | Hotel create/edit (Admin) | Trang admin tạo/sửa hotel với form đầy đủ | ✅ Đã xong (Week 2) |
| F-02 | Tour create/edit (Admin) | Trang admin tạo/sửa tour với itinerary builder | ✅ Đã xong (Week 2) |
| F-03 | Article list/search (API) | Kết nối articles page với backend API | 🔴 Cao |
| F-04 | Article detail (API) | Kết nối article detail với backend | 🔴 Cao |
| F-05 | Article create (API) | Kết nối article create với backend | 🔴 Cao |
| F-06 | Hotel search autocomplete | Autocomplete địa điểm khi tìm kiếm | 🟠 Trung |
| F-07 | Tour search autocomplete | Tương tự cho tour | 🟠 Trung |
| F-08 | Booking cancellation flow | Trang user hủy booking với lý do + refund info | 🟠 Trung |
| F-09 | Invoice/Receipt page | Trang xem hóa đơn booking chi tiết | 🟡 Thấp |
| F-10 | Notification dropdown | Component hiển thị notifications | 🟡 Thấp |
| F-11 | Tour map view | Hiển thị địa điểm tour trên bản đồ | 🟡 Thấp |
| F-12 | Hotel map view | Hiển thị vị trí hotel trên bản đồ (Leaflet/Google Maps) | 🟡 Thấp |

### 4.3 DevOps & Infrastructure

| # | Tính năng | Mô tả | Độ ưu tiên |
|---|-----------|--------|------------|
| D-01 | Docker / Docker Compose | Containerize backend + frontend + MySQL | 🟠 Trung |
| D-02 | CI/CD pipeline | GitHub Actions: build → test → deploy | 🟠 Trung |
| D-03 | `.env.example` đầy đủ | Hướng dẫn tất cả biến môi trường cần thiết | 🔴 Cao |
| D-04 | Seed data script | Script tạo dữ liệu mẫu cho demo/presentation | 🟠 Trung |
| D-05 | Database migration (Flyway/Liquibase) | Quản lý schema versioning | 🟡 Thấp |

---

## 5. Tính Năng Đột Phá Gợi Ý Thêm

### 5.1 Tính Năng Đột Phá (Gợi Ý Mức Độ Cao — Giúp Đồ Án Nổi Bật)

| # | Tính năng | Mô tả chi tiết | Độ khó |
|---|-----------|----------------|--------|
| **A-01** | **AI Travel Assistant (Gemini)** | Chatbot tích hợp Gemini AI thực sự hoạt động: gợi ý điểm đến theo sở thích, so sánh tour, trả lời FAQ, đặt tour qua chat. Backend đã có GeminiService — cần kết nối với frontend BotChatWidget. | 🟠 Trung |
| **A-02** | **Interactive Map với Leaflet/Mapbox** | Bản đồ tương tác trên hotel/tour detail: hiển thị vị trí, tính khoảng cách đến điểm du lịch, xem nearby hotels/tours. | 🟠 Trung |
| **A-03** | **Tour/Hotel Price Comparison Dashboard** | So sánh giá theo thời gian (best time to book), so sánh giữa các đối thủ, price history chart. | 🟠 Trung |
| **A-04** | **Travel Timeline / Trip Planner** | User tạo lịch trình trip cá nhân: ghép nhiều tour + hotel thành 1 chuyến đi, xem timeline, tổng chi phí. | 🔴 Cao |
| **A-05** | **Social Features — Share & Follow** | Chia sẻ review/bookings lên mạng xã hội, follow other travelers, xem "where friends are traveling". | 🔴 Cao |
| **A-06** | **Referral & Loyalty Program** | Mã giới thiệu, tích điểm thưởng, VIP tiers cho repeat customers. Cần backend loyalty points system. | 🟠 Trung |
| **A-07** | **Multi-language Support (i18n)** | Hỗ trợ tiếng Anh + tiếng Việt (react-i18next). Rất ấn tượng cho đồ án. | 🟠 Trung |
| **A-08** | **PWA — Progressive Web App** | Service worker, offline support, push notifications, install to home screen. | 🟠 Trung |
| **A-09** | **Advanced Analytics Dashboard** | Admin xem: bookings by date range, revenue by city/hotel/tour, user growth, conversion rate, top customers. | 🟠 Trung |
| **A-10** | **Dynamic Pricing** | Giá tour thay đổi theo: mùa cao điểm, số chỗ còn lại, thời gian đặt (last-minute / early-bird). | 🔴 Cao |
| **A-11** | **Payment: Thêm MoMo, ZaloPay, VNPay QR** | Ngoài VNPay redirect, thêm thanh toán QR code MoMo/ZaloPay. Backend đã define phương thức trong schema. | 🟠 Trung |
| **A-12** | **Email & Push Notifications** | Gửi email khi booking confirmed, 1 ngày trước trip, reminder check-in. | 🟡 Thấp |
| **A-13** | **Admin Booking Calendar** | Lịch trực quan theo ngày/tháng cho admin xem tất cả bookings | 🟡 Thấp |

### 5.2 So Sánh Với Đồ Án Tương Tự

Điểm **đột phá** mà giám khảo sẽ ấn tượng:

1. **AI chatbot thực sự hoạt động** (Gemini đã tích hợp sẵn — chỉ cần kết nối)
2. **Dynamic pricing** — giá thay đổi theo thời gian/thời vụ
3. **PWA** — install được như app mobile
4. **i18n** — đa ngôn ngữ
5. **Loyalty program** — tích điểm, VIP
6. **Trip planner** — ghép nhiều dịch vụ thành 1 chuyến đi
7. **Interactive map** — Leaflet tích hợp

---

## 6. Kế Hoạch Thực Hiện Chi Tiết

### Phase 1: Sửa Bug + Hoàn Thiện Cơ Bản (Tuần 1)

#### Bước 1.1 — Sửa Bug Nghiêm Trọng & Quan Trọng

| Task | Mô tả | File(s) |
|------|-------|---------|
| B1.1.1 | Sửa text tiếng Việt không dấu trong admin dashboard | `admin/page.tsx` |
| B1.1.2 | Sửa tiếng Việt không dấu trong bookings admin | `admin/bookings/page.tsx` |
| B1.1.3 | Sửa tiếng Việt không dấu trong admin users/hotels/tours/promotions | Các file tương ứng |
| B1.1.4 | Sửa CURRENCY constant thành VND | `constants.js` |
| B1.1.5 | Sửa FILTER_OPTIONS PRICE_RANGES thành VND | `constants.js` |
| B1.1.6 | Thêm remote image patterns vào next.config.ts | `next.config.ts` |
| B1.1.7 | Xóa `onClick={undefined}` trong tours/page.tsx | `tours/page.tsx` |
| B1.1.8 | Thêm `.env.example` đầy đủ cho backend | Tạo file mới |
| B1.1.9 | Xóa thông tin cá nhân trong constants.js | `constants.js` |

#### Bước 1.2 — Hoàn Thiện Article System (Backend + Frontend)

| Task | Mô tả |
|------|-------|
| B1.2.1 | Tạo Article entity (title, slug, content, category, author, status, views, likes) |
| B1.2.2 | Tạo ArticleRepository |
| B1.2.3 | Tạo ArticleService + ArticleServiceImpl |
| B1.2.4 | Tạo ArticleController (CRUD + search + by-slug) |
| B1.2.5 | Thêm articleApi vào frontend |
| B1.2.6 | Chuyển articles pages sang TypeScript (.tsx) |
| B1.2.7 | Kết nối articles/page.tsx với API |
| B1.2.8 | Kết nối articles/[slug]/page.tsx với API |
| B1.2.9 | Kết nối articles/create/page.tsx với API |
| B1.2.10 | Chuyển comments sang backend (Comment entity + API) |

### Phase 2: Tính Năng CRUD Admin (Tuần 2) — ✅ HOÀN THÀNH

#### Bước 2.1 — Admin Hotel Management (CRUD)

| Task | Mô tả |
|------|-------|
| B2.1.1 | Thêm AdminHotelUpsertRequest DTO |
| B2.1.2 | Thêm createHotel / updateHotel trong AdminServiceImpl |
| B2.1.3 | Thêm PATCH + POST endpoint trong AdminController |
| B2.1.4 | Tạo `frontend/app/admin/hotels/create/page.tsx` |
| B2.1.5 | Tạo `frontend/app/admin/hotels/[id]/edit/page.tsx` |
| B2.1.6 | Kết nối hotel create/edit form với API |

#### Bước 2.2 — Admin Tour Management (CRUD)

| Task | Mô tả |
|------|-------|
| B2.2.1 | Thêm AdminTourUpsertRequest DTO (với itinerary items, images) |
| B2.2.2 | Thêm createTour / updateTour trong AdminServiceImpl |
| B2.2.3 | Thêm PATCH + POST endpoint trong AdminController |
| B2.2.4 | Tạo `frontend/app/admin/tours/create/page.tsx` (itininerary builder) |
| B2.2.5 | Tạo `frontend/app/admin/tours/[id]/edit/page.tsx` |
| B2.2.6 | Kết nối tour create/edit form với API |

#### Seed Data (Database)

| Task | Mô tả | Status |
|------|--------|--------|
| D-04 | Seed data script (hotels + tours + amenities) | ✅ Đã xong |

### Phase 3: Tính Năng Đột Phá (Tuần 3–4) — ✅ ĐANG THỰC HIỆN

#### Bước 3.1 — AI Chatbot (Gemini kết nối)

| Task | Mô tả |
|------|-------|
| B3.1.1 | Hoàn thiện GeminiService — kết nối với ChatController | ✅ Đã xong |
| B3.1.2 | Backend: xử lý conversation context cho bot | ✅ Đã xong |
| B3.1.3 | Frontend: kết nối BotChatWidget với Gemini API thực | ✅ Đã xong |
| B3.1.4 | FAQ chatbot cho hotel/tour detail pages | ✅ Đã xong |
| B3.1.5 | Tour recommendation engine dựa trên Gemini | ✅ Đã xong |
| B3.1.4 | FAQ chatbot cho hotel/tour detail pages | ✅ Đã xong |
| B3.1.5 | Tour recommendation engine dựa trên Gemini | ✅ Đã xong |
| B3.1.4 | Thêm FAQ chatbot cho hotel/tour detail pages |
| B3.1.5 | Tour recommendation engine dựa trên Gemini |

#### Bước 3.2 — Dynamic Pricing

| Task | Mô tả |
|------|-------|
| B3.2.1 | Tạo PricingRule entity (season, dayOfWeek, slots remaining) |
| B3.2.2 | PricingService tính giá động |
| B3.2.3 | Frontend: hiển thị "giá tốt nhất" kèm giải thích |
| B3.2.4 | Frontend: price calendar view |

#### Bước 3.3 — PWA + i18n

| Task | Mô tả |
|------|-------|
| B3.3.1 | Cấu hình Next.js PWA (next-pwa hoặc @ducanh2912/next-pwa) |
| B3.3.2 | Thêm service worker, manifest.json |
| B3.3.3 | Tích hợp react-i18next |
| B3.3.4 | Tạo translation files (vi.json, en.json) |
| B3.3.5 | i18n cho các trang quan trọng |

#### Bước 3.4 — Loyalty Program

| Task | Mô tả |
|------|-------|
| B3.4.1 | Tạo LoyaltyPoint entity + transaction log |
| B3.4.2 | Logic tính điểm khi booking completed |
| B3.4.3 | API: apply loyalty points at checkout |
| B3.4.4 | Frontend: hiển thị điểm tích lũy trong profile |
| B3.4.5 | Referral code system |

### Phase 4: Polish & Deployment (Tuần 5)

| Task | Mô tả |
|------|-------|
| B4.1 | Seed data script — tạo 50+ hotels, 30+ tours, 100+ bookings mẫu |
| B4.2 | Docker Compose cho dev environment |
| B4.3 | GitHub Actions CI/CD |
| B4.4 | Performance audit (Next.js bundle size, database queries) |
| B4.5 | Accessibility audit (WCAG) |
| B4.6 | Chuẩn bị demo presentation |

---

## 7. Ưu Tiên Thực Hiện

```
TUẦN 1 (Ngay lập tức)
├── 🔴 Fix bugs nghiêm trọng (BUG-01 → BUG-04, BUG-09 → BUG-10)
├── 🔴 Kết nối Article với Backend API (B-01, F-03 → F-05)
├── 🔴 Thêm next.config.ts images remote patterns (BUG-06)
└── 🔴 Tạo .env.example (BUG-02 fix)

TUẦN 2 (ĐÃ HOÀN THÀNH)
├── ✅ Admin Hotel CRUD pages (F-01)
├── ✅ Admin Tour CRUD pages (F-02)
└── ✅ Seed data script (D-04) — 20+ hotels, 22 tours, 22 amenities, 27 cities

TUẦN 3
├── ✅ AI Chatbot — Hoan tat: Backend context + Gemini session persistence + Frontend TypeScript + FAQ pages + Tour recommendation engine (B3.1.1 → B3.1.5)
├── 🟠 i18n foundation (A-07)
├── 🟠 i18n foundation (A-07)
└── 🟠 Dynamic Pricing backend (A-10 backend part)

TUẦN 4
├── 🟠 PWA setup (A-08)
├── 🟠 Dynamic Pricing frontend (A-10 frontend part)
├── 🟠 Interactive Map — Leaflet (A-02)
└── 🟠 Loyalty Program (A-06)

TUẦN 5
├── 🟠 Docker + CI/CD (D-01, D-02)
├── 🟡 Advanced Analytics Dashboard (A-09)
├── 🟡 Notification system (B-07)
└── 🟡 Demo + Polish
```

---

## Checklist Trước Khi Nộp Đồ Án

- [ ] **Bắt buộc**: Sửa toàn bộ text tiếng Việt không dấu trong admin
- [ ] **Bắt buộc**: next.config.ts có remote image patterns
- [ ] **Bắt buộc**: Article system kết nối backend (không localStorage)
- [x] **Bắt buộc**: Admin có trang tạo/sửa hotel và tour (Week 2)
- [ ] **Bắt buộc**: .env.example có đầy đủ variables
- [ ] **Nên có**: Gemini AI chatbot hoạt động thực sự
- [ ] **Nên có**: PWA hoặc i18n
- [x] **Nên có**: Seed data script (Week 2 — 22 tours, 3000+ hotels, 22 amenities)
- [ ] **Nên có**: Dynamic pricing
- [ ] **Ưu tiên cao**: Fix CURRENCY constant → VND
- [ ] **Ưu tiên cao**: Xóa thông tin cá nhân trong constants

---

*Kế hoạch này được tạo tự động bằng AI. Cần rà soát lại theo yêu cầu cụ thể của giám khảo/trường.*
