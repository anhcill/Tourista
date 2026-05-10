# Tourista - Kế hoạch đọc & hiểu code

## 1. Tổng quan

```
Tourista/
├── backend/          # Java Spring Boot API
├── frontend/         # Next.js React frontend
├── doc/              # Tài liệu test/debug
└── (root)            # Config, README, workspace files
```

**Luồng dữ liệu chính:**
```
User Browser
    └── frontend/ (Next.js 16)
            ├── /api/*  ──────► Backend API (Spring Boot)
            ├── /ws/*   ──────► WebSocket (Chatbot)
            └── Rewrite → Railway URL (production)
```

---

## 2. BACKEND - Đọc từ đâu đến đâu

### 2.1 Entry point & Config

| File | Mục đích |
|------|----------|
| `TouristaApplication.java` | Spring Boot entry, bật các feature (`@EnableCaching`, `@EnableMethodSecurity`) |
| `application.yml` / `application-local.yml` | Cấu hình DB, JWT, Cloudinary, VNPay, CORS |
| `pom.xml` | Dependencies (Spring Web, Security, MySQL, JWT, WebSocket...) |

**Thứ tự đọc:** `TouristaApplication.java` → `application.yml` → `pom.xml`

---

### 2.2 Bảo mật & Authentication

| File | Mục đích |
|------|----------|
| `SecurityConfig.java` | Cấu hình Spring Security: public/private endpoints, CORS, JWT filter |
| `JwtAuthenticationFilter.java` | Filter: đọc JWT từ header, set SecurityContext |
| `JwtTokenProvider.java` | Tạo & xác minh JWT token |
| `AuthController.java` | `/api/auth/*` - Đăng nhập, đăng ký, OAuth2, refresh token |
| `UserRepository.java` | Query user |

**Thứ tự đọc:** `SecurityConfig.java` → `JwtAuthenticationFilter.java` → `JwtTokenProvider.java` → `AuthController.java`

---

### 2.3 Entities (Models)

| Entity | Ý nghĩa |
|--------|---------|
| `User.java` | Tài khoản user (email, password, role...) |
| `Tour.java` | Tour du lịch |
| `TourImage.java` | Ảnh tour |
| `Hotel.java` | Khách sạn |
| `HotelImage.java` | Ảnh khách sạn |
| `ComboPackage.java` | Gói combo tour + khách sạn |
| `Booking.java` | Đặt tour/ khách sạn |
| `BookingCombo.java` | Đặt combo |
| `Review.java` | Đánh giá |
| `Promotion.java` | Khuyến mãi |
| `Favorite.java` | Yêu thích |
| `Article.java` | Bài viết blog |
| `ChatMessage.java` | Tin nhắn chatbot |
| `Payment.java` | Thanh toán VNPay |
| `WeatherCache.java` | Cache thời tiết |
| `OtpCode.java` | Mã OTP email |

**Thứ tự đọc:** `User.java` → `Tour.java` → `Booking.java` (3 entity cốt lõi nhất)

---

### 2.4 Repositories (Database Access)

| Repository | Entity tương ứng |
|------------|-----------------|
| `UserRepository.java` | User |
| `TourRepository.java` | Tour |
| `TourImageRepository.java` | TourImage |
| `HotelRepository.java` | Hotel |
| `HotelImageRepository.java` | HotelImage |
| `ComboPackageRepository.java` | ComboPackage |
| `BookingRepository.java` | Booking |
| `BookingComboRepository.java` | BookingCombo |
| `ReviewRepository.java` | Review |
| `PromotionRepository.java` | Promotion |
| `FavoriteRepository.java` | Favorite |
| `ArticleRepository.java` | Article |
| `ChatMessageRepository.java` | ChatMessage |
| `PaymentRepository.java` | Payment |
| `WeatherCacheRepository.java` | WeatherCache |
| `OtpCodeRepository.java` | OtpCode |

**Cách đọc:** Đi theo cặp Entity + Repository. Mỗi khi muốn hiểu 1 tính năng, đọc entity trước rồi xem repository có gì đặc biệt.

---

### 2.5 Services (Business Logic)

#### 2.5.1 Core Services

| Service | Interface | Mục đích |
|---------|-----------|----------|
| `UserService` | `UserServiceImpl.java` | Quản lý user, profile, đổi mật khẩu |
| `TourService` | `TourServiceImpl.java` | CRUD tour, tìm kiếm, filter |
| `HotelService` | `HotelServiceImpl.java` | CRUD khách sạn |
| `ComboPackageService` | `ComboPackageServiceImpl.java` | CRUD combo |
| `BookingService` | `BookingServiceImpl.java` | Tạo booking, hủy, xem lịch sử |
| `ReviewService` | `ReviewServiceImpl.java` | Tạo/xem đánh giá |
| `PaymentService` | `PaymentServiceImpl.java` | Tạo & xử lý thanh toán VNPay |
| `EmailService` | `EmailServiceImpl.java` | Gửi email (OTP, xác thực...) |

#### 2.5.2 AI & Chatbot Services

| Service | Mục đích |
|---------|----------|
| `AiService.java` | Gọi OpenAI API cho AI travel planner |
| `ChatService.java` | Quản lý lịch sử chat, session |
| `AiChatbotService.java` | Xử lý intent chatbot (gợi ý tour, tìm booking...) |
| `BookingLookupService.java` | Tìm booking theo email/phone/code |
| `TourRecommendationQueryService.java` | Query tour theo tiêu chí cho AI |

#### 2.5.3 Support Services

| Service | Mục đích |
|---------|----------|
| `CloudinaryService.java` | Upload ảnh lên Cloudinary |
| `WeatherService.java` | Lấy & cache thời tiết |
| `FaqService.java` | Quản lý FAQ chatbot |
| `FavoriteService.java` | Thêm/xoá yêu thích |
| `PromotionService.java` | Quản lý khuyến mãi |

**Thứ tự đọc:** Service chính theo flow: `TourService` → `BookingService` → `PaymentService`

---

### 2.6 Controllers (API Endpoints)

| Controller | Prefix | Mục đích |
|------------|--------|----------|
| `AuthController.java` | `/api/auth` | Đăng nhập, đăng ký, OAuth2 |
| `UserController.java` | `/api/users` | Profile, đổi mật khẩu, admin quản lý user |
| `TourController.java` | `/api/tours` | CRUD tour, tìm kiếm |
| `HotelController.java` | `/api/hotels` | CRUD khách sạn |
| `ComboPackageController.java` | `/api/combos` | CRUD combo |
| `BookingController.java` | `/api/bookings` | Tạo/xem/hủy booking |
| `PaymentController.java` | `/api/payments` | Thanh toán VNPay callback |
| `ReviewController.java` | `/api/reviews` | Đánh giá |
| `ChatController.java` | `/api/chat`, `/ws/chat` | Chatbot, WebSocket |
| `ArticleController.java` | `/api/articles` | Blog |
| `WeatherController.java` | `/api/weather` | Thời tiết |
| `FavoriteController.java` | `/api/favorites` | Yêu thích |
| `PromotionController.java` | `/api/promotions` | Khuyến mãi |
| `FaqController.java` | `/api/faqs` | FAQ |
| `AdminController.java` | `/api/admin` | Dashboard, thống kê |

**Thứ tự đọc:** Nên đọc theo flow người dùng:
1. `AuthController` → đăng nhập
2. `TourController` / `HotelController` → xem danh sách
3. `BookingController` → đặt
4. `PaymentController` → thanh toán
5. `ChatController` → chatbot

---

## 3. FRONTEND - Đọc từ đâu đến đâu

### 3.1 Entry & Config

| File | Mục đích |
|------|----------|
| `next.config.ts` | Cấu hình Next.js, rewrites (API proxy) |
| `package.json` | Dependencies, scripts (dev, build) |
| `tailwind.config.ts` | Cấu hình Tailwind CSS |
| `src/lib/store.ts` | Redux store setup |
| `src/lib/api.ts` | Axios instance, interceptors (JWT auto-refresh) |
| `src/lib/auth.ts` | Logic đăng nhập, token management |

**Thứ tự đọc:** `next.config.ts` → `src/lib/api.ts` → `src/lib/auth.ts`

---

### 3.2 Middleware & Proxy

| File | Mục đích |
|------|----------|
| `middleware.ts` | Next.js proxy: `/api/*` → Railway backend, `/ws/*` → WebSocket |

**Quan trọng:** Hiểu middleware trước để biết frontend gọi backend ở đâu.

---

### 3.3 Redux State Management

| Slice | Mục đích |
|-------|----------|
| `authSlice.ts` | User, token, login/logout |
| `tourSlice.ts` | Danh sách tour, filters |
| `hotelSlice.ts` | Danh sách khách sạn |
| `bookingSlice.ts` | Booking form, lịch sử |
| `favoriteSlice.ts` | Yêu thích |

**Thứ tự đọc:** `store.ts` → `authSlice.ts` → `tourSlice.ts`

---

### 3.4 Components

#### 3.4.1 Layout Components

| Component | Mục đích |
|-----------|----------|
| `AppShell.tsx` | Layout chính: header, footer, sidebar |
| `Header/` | Thanh điều hướng |
| `Footer/` | Footer |
| `Sidebar/` | Sidebar admin |

#### 3.4.2 Shared Components

| Component | Mục đích |
|-----------|----------|
| `Button.tsx` | Nút bấm |
| `Input.tsx` | Input form |
| `Select.tsx` | Dropdown |
| `Modal.tsx` | Popup |
| `Loading.tsx` | Spinner loading |
| `StarRating.tsx` | Đánh giá sao |
| `Map/` | Bản đồ Leaflet |

#### 3.4.3 Feature Components

| Component | Mục đích |
|-----------|----------|
| `AI/AIPanel.tsx` | AI chatbot panel |
| `Home/HeroBanner.tsx` | Banner trang chủ |
| `Tours/TourCard/` | Card hiển thị tour |
| `Hotels/HotelCard/` | Card khách sạn |
| `Combos/ComboCard/` | Card combo |
| `Booking/` | Form đặt tour/khách sạn |
| `Payments/` | Thanh toán VNPay |
| `Reviews/` | Hiển thị đánh giá |

**Thứ tự đọc:** `AppShell.tsx` → `Header/` → feature components

---

### 3.5 Pages (App Router)

```
frontend/app/
├── page.tsx                      # Trang chủ
├── tours/                        # Danh sách & chi tiết tour
│   ├── page.tsx                  # List tours
│   ├── [id]/page.jsx             # Chi tiết tour
│   └── [id]/book/page.jsx        # Form đặt tour
├── hotels/                       # Tương tự tours
├── combos/                       # Tương tự tours
├── booking-qr/                   # QR booking
├── profile/
│   └── bookings/page.jsx         # Lịch sử đặt
├── favorites/                    # Yêu thích
├── login/                        # Đăng nhập
├── register/                     # Đăng ký
├── ai-travel-planner/            # AI lập kế hoạch
├── admin/                        # Dashboard admin
│   ├── tours/, hotels/, combos/  # CRUD
│   ├── bookings/                 # Quản lý booking
│   └── users/                    # Quản lý user
├── partner/                      # Dashboard đối tác
├── articles/                     # Blog
├── promotions/                   # Khuyến mãi
├── support/                      # Hỗ trợ
├── faq/                          # FAQ
├── payments/
│   ├── success/                 # Thanh toán thành công
│   └── vnpay/return/            # VNPay return
└── api/                          # Next.js API routes
    └── cloudinary/sign/         # Sign upload Cloudinary
```

**Thứ tự đọc:** `page.tsx` → `tours/` → `tours/[id]/` → `book/` → `profile/bookings/`

---

## 4. Cách đọc theo luồng tính năng

### Luồng 1: Đăng nhập → Đặt tour

```
Frontend                    Backend
─────────────────────────────────────────────────
login/page.tsx         →    AuthController (POST /api/auth/login)
                             → UserService (verify password)
                             → JwtTokenProvider (issue token)
                             → return JWT

tours/page.tsx        →    TourController (GET /api/tours)
                             → TourService
                             → TourRepository
                             → return list tours

tours/[id]/page.jsx   →    TourController (GET /api/tours/{id})
                             → return tour details

tours/[id]/book/page.jsx → BookingController (POST /api/bookings)
                             → BookingService (create booking)
                             → BookingRepository (save)
                             → return booking

payment/              →    PaymentController (POST /api/payments/create)
                             → PaymentService (init VNPay)
                             → return payment URL

vnpay/return/         →    PaymentController (GET /api/payments/vnpay/return)
                             → PaymentService (verify, update booking)
                             → return success/fail
```

### Luồng 2: Chatbot AI

```
Frontend                    Backend
─────────────────────────────────────────────────
AI/AIPanel.tsx         →    ChatController (WebSocket /ws/chat)
                             → ChatService (save message)
                             → AiChatbotService (route intent)
                                   ├── TourRecommendationQueryService (gợi ý tour)
                                   ├── BookingLookupService (tìm booking)
                                   ├── FaqService (trả lời FAQ)
                                   └── AiService (OpenAI fallback)
                             → return response

ai-travel-planner/    →    AiService (POST /api/ai/travel-plan)
                             → OpenAI API
                             → return travel plan
```

### Luồng 3: Quản lý Admin

```
Frontend                    Backend
─────────────────────────────────────────────────
admin/tours/           →    TourController (GET /api/tours/admin)
                             → check ROLE_ADMIN
                             → TourService (CRUD)

admin/bookings/        →    BookingController (GET /api/bookings/admin)
                             → BookingService
                             → return all bookings

admin/hotels/create/   →    HotelController (POST /api/hotels)
                             → HotelService
                             → CloudinaryService (upload image)
                             → HotelRepository (save)
```

---

## 5. Database Schema (MySQL)

```
Users
  ├── id, email, password, full_name, phone, role, avatar_url
  └── created_at, verified

Tours
  ├── id, name, description, destination, duration, price
  ├── departure_location, max_participants, includes, excludes
  └── images, reviews, bookings

Hotels
  ├── id, name, address, city, star_rating, price_per_night
  └── amenities, images, rooms

ComboPackages
  ├── id, name, description, tour_id, hotel_id
  ├── discount_percent, total_price, validity_days

Bookings
  ├── id, user_id, booking_type (TOUR/HOTEL/COMBO)
  ├── reference_id (Tour/Hotel/Combo id)
  ├── status (PENDING/PAID/CANCELLED/REFUNDED)
  ├── total_price, payment_status
  └── booking_date, travel_date

Reviews
  ├── id, user_id, tour_id/hotel_id
  ├── rating, comment, images

ChatMessages
  ├── id, session_id, user_id
  ├── message, response, intent
  └── created_at

WeatherCache
  ├── id, location, date
  └── temperature, condition, icon, humidity
```

---

## 6. Checklist để hiểu toàn bộ project

- [ ] Đọc `TouristaApplication.java` + `application.yml`
- [ ] Đọc `SecurityConfig.java` + `JwtTokenProvider.java`
- [ ] Hiểu middleware proxy (`frontend/middleware.ts`)
- [ ] Đọc `api.ts` + `auth.ts` (frontend lib)
- [ ] Hiểu 3 entity cốt lõi: `User`, `Tour`, `Booking`
- [ ] Đọc flow đặt tour: Controller → Service → Repository
- [ ] Đọc flow thanh toán VNPay
- [ ] Đọc chatbot: `ChatController` → `AiChatbotService`
- [ ] Đọc AI planner: `AiService`
- [ ] Đọc frontend pages: `tours/` → `book/` → `profile/bookings/`
- [ ] Đọc admin pages: `admin/tours/`, `admin/bookings/`
- [ ] Hiểu Redis cache (nếu dùng) và Cloudinary upload

---

## 7. Key Environment Variables

### Backend (`application.yml`)
```yaml
spring:
  datasource:
    url: jdbc:mysql://${DB_HOST}:${DB_PORT}/${DB_NAME}
    username: ${DB_USER}
    password: ${DB_PASSWORD}
jwt:
  secret: ${JWT_SECRET}
  expiration: ${JWT_EXPIRATION}
vnPay:
  vnp_Url: ${VNPAY_URL}
  vnp_TmnCode: ${VNPAY_TMNCODE}
  vnp_HashSecret: ${VNPAY_HASH_SECRET}
cloudinary:
  cloud-name: ${CLOUDINARY_CLOUD_NAME}
  api-key: ${CLOUDINARY_API_KEY}
  api-secret: ${CLOUDINARY_API_SECRET}
openai:
  api-key: ${OPENAI_API_KEY}
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=https://api.tourista.com
NEXT_PUBLIC_WS_URL=wss://api.tourista.com
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=xxx
```
