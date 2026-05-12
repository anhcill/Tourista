# Câu Hỏi Bảo Vệ Khóa Luận — Tourista

> File này tổng hợp câu hỏi phỏng vấn bảo vệ khóa luận tốt nghiệp.
> Gồm: **Câu hỏi về hệ thống** · **Câu hỏi về logic** · **Câu hỏi thực tế**
> Kèm **cách trả lời** để bạn tự tin bảo vệ.

---

## 1. CÂU HỎI VỀ HỆ THỐNG

### Q1: Mô tả kiến trúc tổng thể của hệ thống Tourista.

**Cách trả lời:**

Hệ thống Tourista gồm **3 thành phần chính**:

1. **Frontend** — Ứng dụng web Next.js 16 (React, TypeScript, Redux, Tailwind CSS), deploy trên Vercel tại `https://tourista-nine.vercel.app`. Frontend giao tiếp với backend qua REST API và WebSocket.

2. **Backend** — API Spring Boot (Java 17) chạy trên Railway, cổng `8080`. Xử lý toàn bộ nghiệp vụ: xác thực, đặt tour/khách sạn, thanh toán VNPay, chatbot AI, gửi email.

3. **Database** — MySQL 8.0 chạy trên Railway (connection string `interchange.proxy.rlwy.net:38550`). Các bảng chính: `users`, `tours`, `hotels`, `bookings`, `promotions`, `chat_messages`, `reviews`, `conversations`.

Luồng dữ liệu: `User → Frontend (Next.js) → API Proxy (middleware.ts) → Backend (Spring Boot) → MySQL`. Frontend có `middleware.ts` để proxy request `/api/*` sang Railway backend trên production.

---

### Q2: Frontend dùng kiến trúc gì? Tại sao chọn Next.js thay vì React thuần?

**Cách trả lời:**

Frontend dùng **Next.js 16 App Router** (React Server Components). Lý do chọn Next.js:

- **SEO**: Trang chủ, tours, hotels cần SEO tốt — Next.js hỗ trợ SSR/SSG giúp Google index tốt hơn React SPA thuần.
- **API Routes**: Có `/api/*` routes để upload ảnh Cloudinary (sign request), không cần server riêng.
- **File-based Routing**: Mỗi folder trong `app/` tự động là 1 route, giảm boilerplate.
- **Middleware**: Dùng để proxy request API, chuyển hướng theo ngôn ngữ (i18n), bảo mật.

**State Management**: Dùng **Redux Toolkit** để quản lý global state (auth user, cart, filters). Component-level state dùng React hooks.

**CSS**: **Tailwind CSS** — utility-first, giúp UI nhất quán, responsive, dễ maintain.

---

### Q3: Backend dùng những công nghệ gì? Tại sao chọn Spring Boot?

**Cách trả lời:**

- **Framework**: Spring Boot 3.x — chuẩn Java enterprise, có sẵn Spring Security, Spring Data JPA, Spring WebSocket.
- **ORM**: Spring Data JPA với Hibernate — ánh xạ entity ↔ MySQL, tự động generate queries.
- **Security**: Spring Security với **JWT** (stateless authentication) — không dùng session để scale tốt trên Railway.
- **WebSocket**: Spring WebSocket (STOMP over SockJS) — hỗ trợ real-time chatbot.
- **Scheduling**: `@EnableScheduling` — chạy job tự động hoàn thành booking, gửi email nhắc nhở.
- **Async**: `@EnableAsync` — xử lý bot response bất đồng bộ, tránh block thread.
- **Validation**: Jakarta Bean Validation — validate request DTO trước khi vào service layer.
- **Build tool**: Maven (`pom.xml`).

---

### Q4: Cách hệ thống xác thực người dùng (Authentication) hoạt động như thế nào?

**Cách trả lời:**

1. **Đăng ký**: User gửi `POST /api/auth/register` → backend hash password bằng BCrypt → lưu vào DB → gửi email xác thực (OTP 6 số, hết hạn 15 phút).
2. **Đăng nhập**: `POST /api/auth/login` → verify password → `JwtTokenProvider` tạo **access token** (JWT, 15 phút) + **refresh token** (lưu DB, 7 ngày).
3. **JWT Filter**: Mỗi request API đều qua `JwtAuthFilter` — đọc token từ header `Authorization: Bearer <token>`, verify signature → set `SecurityContext`.
4. **Rate Limiting**: `RateLimitFilter` chạy trước JWT filter — giới hạn 5 login/1 phút/IP, 3 register/1 phút/IP để chống brute-force.
5. **OAuth2**: Hỗ trợ Google OAuth2 — `OAuth2SuccessHandler` tạo JWT sau khi nhận callback từ Google.
6. **Account Locking**: Sau 5 lần đăng nhập sai → khóa 10 phút (lưu vào `login_attempts` table).

---

### Q5: Database có những bảng chính nào? Mối quan hệ giữa chúng?

**Cách trả lời:**

```
Users (1) ─── (N) Bookings
  │                    │
  └── (N) Reviews      ├── (1) BookingTourDetail ─── (1) Tour ─── (N) TourDeparture
  │                    ├── (1) BookingHotelDetail ─── (1) RoomType ─── (1) Hotel
  └── (N) Favorites    └── (1) BookingCombo ─── (1) ComboPackage

Users (1) ─── (N) ChatMessages ─── (1) Conversation
Users (1) ─── (N) Promotions (qua BookingPromotion)

Tour (N) ─── (1) Hotel   ←── ComboPackage (N) ─── (1) BookingCombo
```

**Các bảng chính**:
- `users` — tài khoản, roles (USER/ADMIN/PARTNER/HOTEL_OWNER)
- `tours` — thông tin tour (giá, mô tả, số chỗ)
- `tour_departures` — lịch khởi hành + số chỗ trống
- `hotels` — thông tin khách sạn, tiện ích
- `room_types` — loại phòng + số lượng phòng trống
- `bookings` — đơn đặt (PENDING/CONFIRMED/CANCELLED/COMPLETED)
- `booking_tour_details` / `booking_hotel_details` / `booking_combos` — chi tiết từng loại booking
- `promotions` — mã giảm giá (% hoặc fixed)
- `chat_messages` + `conversations` — lịch sử chatbot
- `reviews` — đánh giá tour/khách sạn

---

### Q6: Hệ thống phân quyền (Authorization) như thế nào?

**Cách trả lời:**

Dùng **Spring Security** với **RBAC** (Role-Based Access Control):

| Vai trò | Quyền truy cập |
|---------|---------------|
| PUBLIC | Xem tour, khách sạn, combo, FAQ, autocomplete |
| USER | Đặt tour/khách sạn, quản lý booking, chatbot |
| PARTNER / HOST | Quản lý tour/khách sạn của mình |
| HOTEL_OWNER | Quản lý khách sạn, phòng |
| ADMIN | Toàn quyền: quản lý user, tour, booking, duyệt review |

Trong code:
- `SecurityConfig.java` (lines 66-100): khai báo endpoint nào public, endpoint nào cần role nào.
- Method-level: dùng `@PreAuthorize("hasRole('ADMIN')")` trên controller/service.
- Frontend: kiểm tra `user.role` từ Redux state để ẩn/hiện UI.

---

### Q7: Các cổng thanh toán nào được tích hợp? VNPay hoạt động ra sao?

**Cách trả lời:**

**VNPay** là cổng thanh toán chính:

1. User đặt tour → chọn "Thanh toán VNPay" → frontend gọi `POST /api/payments/vnpay/create`.
2. Backend tạo **payment URL** (VNPay sandbox: `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html`) với checksum HMAC-SHA256 từ `vnp_HashSecret`.
3. User được chuyển sang trang VNPay → nhập thẻ → thanh toán.
4. VNPay callback về 2 endpoint:
   - **Return URL** (`/api/payments/vnpay/return`): Chuyển hướng user về frontend với trạng thái thanh toán.
   - **IPN URL** (`/api/payments/vnpay/ipn`): VNPay server-to-server notification để backend cập nhật trạng thái booking (bảo mật hơn).
5. Backend verify checksum → cập nhật booking từ PENDING → CONFIRMED.

Cấu hình VNPay trong `application.yml`: `vnp_TmnCode=R5V2JO22`, hash secret từ biến môi trường.

---

### Q8: Hệ thống dùng Cloudinary để làm gì? Upload ảnh hoạt động như thế nào?

**Cách trả lời:**

Cloudinary là **CDN + Media Management** để lưu ảnh tour/khách sạn thay vì lưu trong MySQL.

**Luồng upload**:
1. Frontend gọi `POST /api/images/sign` (Next.js API route) → backend ký request bằng Cloudinary API secret.
2. Frontend nhận signed request → upload trực tiếp lên Cloudinary (browser → Cloudinary server).
3. Cloudinary trả về **secure URL** → frontend lưu vào form data.
4. Backend nhận URL → lưu vào `tour_images` / `hotel_images` table.

**Lợi ích**:
- Giảm tải cho backend và MySQL (ảnh không lưu trong DB).
- Cloudinary tự động tạo ảnh responsive (multiple sizes).
- Có CDN toàn cầu, tốc độ load nhanh.

---

### Q9: Email được gửi bằng cách nào? Dùng dịch vụ gì?

**Cách trả lời:**

Dùng **Brevo (Sendinblue) API** — lý do: không cần xác minh domain như Gmail SMTP, API-based, reliable.

**Các email được gửi tự động**:
- `BrevoEmailService.java` gửi email xác thực khi đăng ký (OTP).
- Email xác nhận booking khi tạo thành công.
- Email hủy booking khi user hủy.
- Email cảm ơn khi booking hoàn thành.
- Email đặt lại mật khẩu (forgot password).

Cấu hình: `application.yml` có `brevo-api-key`, `from-email`, `from-name`.

---

### Q10: Frontend proxy API như thế nào? Tại sao cần proxy?

**Cách trả lời:**

Trong `middleware.ts` (Next.js), request đến `/api/*` được rewrite thẳng đến Railway backend URL.

**Lý do cần proxy**:
- **CORS**: Backend chỉ cho phép origin cụ thể (Vercel URL + localhost). Proxy giữ origin header.
- **Bảo mật**: API key backend không lộ ở frontend client-side.
- **Single Domain**: User chỉ cần truy cập 1 domain (Vercel), không cần biết backend ở đâu.
- **WebSocket**: Proxy hỗ trợ `/ws/*` cho chatbot real-time.

Production: `https://interchange.proxy.rlwy.net:38550` → proxy qua middleware.
Development: `http://localhost:8080`.

---

## 2. CÂU HỎI VỀ LOGIC NGHIỆP VỤ

### Q11: Luồng đặt tour hoàn chỉnh từ A→Z là gì?

**Cách trả lời:**

```
1. User xem danh sách tour: GET /api/tours → TourService → TourRepository
2. User chọn tour → xem chi tiết: GET /api/tours/{id}
3. User chọn lịch khởi hành + số người → gọi POST /api/bookings/tour
   ├─ Kiểm tra trùng booking (same user + same tour + same date)
   ├─ Lock row (SELECT FOR UPDATE) → decrement available_slots atomically
   ├─ Tính giá: PricingService.calculateTourPrice() (dynamic pricing)
   ├─ Áp dụng promo code (nếu có)
   ├─ Tính VAT 10%
   ├─ Lưu Booking + BookingTourDetail
   ├─ Gửi email xác nhận (Brevo)
   └─ Trả booking_code (format: TRS-YYYYMMDD-XXXXX)
4. User chọn thanh toán VNPay: POST /api/payments/vnpay/create
   └─ Tạo payment URL với HMAC-SHA256 checksum
5. User thanh toán trên VNPay → callback về return URL + IPN
   └─ Backend verify → cập nhật booking CONFIRMED
6. Sau ngày khởi hành → scheduler job tự động COMPLETED → gửi email cảm ơn
```

---

### Q12: Chatbot AI hoạt động như thế nào? Có những luồng nào?

**Cách trả lời:**

Chatbot dùng **multi-layer intent routing**:

**Layer 1 — Intent Detection** (`ChatbotNlpService`):
- Regex pattern matching: "tra cứu booking" → `LOOKUP_BOOKING`, "gợi ý tour" → `TOUR_RECOMMENDATION`, "hủy" → `CANCEL_BOOKING`.
- Extract entities: budget, travelers, city, duration từ text.

**Layer 2 — Routing**:
| Intent | Handler |
|--------|---------|
| `TOUR_RECOMMENDATION` | `ChatbotTourFlowService` → slot-filling → query DB → push tour cards |
| `LOOKUP_BOOKING` | `BookingLookupService` → query booking by code |
| `FAQ` | `FaqService` → return pre-defined Q&A |
| `GENERAL` | `AiCoreService` → gọi AI (Beeknoee/Gemini/OpenAI/Claude) |

**Luồng gợi ý tour (Slot-Filling)**:
1. User: "gợi ý tour" → bot hỏi "Bạn muốn chuyến đi kiểu nào?" (scenario buttons)
2. User: "ngân sách 8tr cho 2 người" → parse budget + travelers → query DB
3. Tính `perPerson = budget / travelers` → lọc tour theo giá, city, duration
4. Push 3 tour cards → user refine: "Đà Nẵng 3 ngày" → lọc tiếp
5. User: "dừng" → clear state (TTL 20 phút)

**AI Provider**: `AiCoreService` hỗ trợ 4 provider (Beeknoee, OpenAI, Gemini, Claude) qua `ai-config.yml`. Default: **Beeknoee** (deepseek/deepseek-v4-pro). Dùng **Semaphore** để giới hạn 1 request đồng thời, tránh quá tải.

**State Management**: Trạng thái slot-filling lưu vào `session_recommendation_states` table (DB) — tồn tại qua server restart và hỗ trợ multi-instance.

---

### Q13: Giá động (Dynamic Pricing) hoạt động như thế nào?

**Cách trả lời:**

`PricingService` tính giá động cho cả tour lẫn khách sạn:

**Tour Dynamic Pricing** (`calculateTourPrice`):
- **Early bird**: Giảm giá nếu đặt trước X ngày.
- **Group size**: Giảm giá khi đoàn đông (khuyến khích booking).
- **Seasonal**: Tăng giá mùa cao điểm (lễ, Tết, hè).
- **Last minute**: Tăng giá nếu còn ít chỗ (< threshold).

**Hotel Dynamic Pricing** (`calculateHotelNightPrice`):
- Tính giá theo từng đêm trong khoảng lưu trú.
- Áp dụng pricing rules: weekend premium, seasonal adjustments.
- Room type availability affect price.

Kết quả trả về: `base_price`, `final_price`, `applied_rules[]` để frontend hiển thị.

---

### Q14: Idempotency trong đặt booking hoạt động ra sao?

**Cách trả lời:**

Client gửi `idempotencyKey` (UUID) trong request body khi đặt booking.

```java
// BookingServiceImpl.java lines 113-118
if (request.getIdempotencyKey() != null) {
    CreateBookingResponse cached = idempotencyService.get(idempotencyKey);
    if (cached != null) {
        return cached; // Trả booking đã tạo trước đó
    }
}
// ... tạo booking mới ...
idempotencyService.put(idempotencyKey, result);
```

**Mục đích**: Nếu user click đặt 2 lần (do mạng lag, duplicate submit), hệ thống chỉ tạo 1 booking thay vì 2. Server restart → cache mất → user có thể đặt lại (chấp nhận được).

---

### Q15: Làm sao tránh race condition khi nhiều user đặt cùng 1 tour cùng lúc?

**Cách trả lời:**

Dùng **pessimistic locking** (SELECT FOR UPDATE) trong transaction:

```java
// BookingServiceImpl.java lines 328-329
tourDepartureRepository.lockDepartureForUpdate(departure.getId());
int updated = tourDepartureRepository.decrementAvailableSlots(departure.getId(), totalGuests);
if (updated == 0) {
    throw new IllegalArgumentException("Không đủ chỗ trống");
}
```

- `lockDepartureForUpdate`: Lock row trong DB → các transaction khác phải chờ.
- `decrementAvailableSlots`: Atomic UPDATE với điều kiện `available_slots >= totalGuests`. Nếu không đủ chỗ, `updated == 0` → throw exception → rollback transaction.
- Tất cả nằm trong `@Transactional` → đảm bảo atomicity.

---

### Q16: Luồng hủy booking + hoàn tiền như thế nào?

**Cách trả lời:**

1. User gọi `DELETE /api/bookings/{id}` với lý do hủy.
2. Backend verify ownership (email phải trùng với user đặt).
3. Chỉ PENDING hoặc CONFIRMED mới được hủy.
4. **Khôi phục tài nguyên**:
   - Tour: `incrementAvailableSlots` trên `tour_departures`.
   - Hotel: `incrementRoomsAvailable` trên `room_types`.
   - Combo: `incrementSlots` trên `combo_packages`.
5. **Rollback promo**: giảm `used_count` của promotion.
6. Cập nhật booking status → CANCELLED + lưu `cancel_reason`, `cancelled_at`.
7. Gửi email thông báo hủy (Brevo).

**Chính sách hoàn tiền** (lưu ý: hệ thống hiện chưa tự động hoàn tiền — chỉ cập nhật trạng thái, user liên hệ hotline để được hoàn tiền thủ công):
- 7+ ngày: hoàn 80%
- 3-7 ngày: hoàn 50%
- Dưới 3 ngày: không hoàn

---

### Q17: AI Travel Planner hoạt động như thế nào?

**Cách trả lời:**

1. User nhập: điểm đến, ngày đi/về, số người, ngân sách, sở thích, loại chuyến đi.
2. Frontend gọi `POST /api/travel-plan/generate` → `TravelPlanService`.
3. Backend gửi prompt đến AI với:
   - User preferences (interests, budget, trip type).
   - Database context (danh sách điểm đến phổ biến, mùa, giá cả).
   - Output format template (day plans, activities, packing list).
4. AI trả về JSON structured travel plan → backend parse → return.
5. Frontend hiển thị: tabs theo ngày, danh sách hoạt động (thời gian, địa điểm, chi phí ước tính), packing list, weather note, local tips.
6. User có thể nhấn "Tìm tour" / "Tìm khách sạn" để chuyển sang booking.

---

### Q18: Session recommendation state trong chatbot là gì? Tại sao lưu vào DB thay vì Redis?

**Cách trả lời:**

Khi user đang trong luồng gợi ý tour, hệ thống cần nhớ: `budget`, `travelers`, `city`, `duration` qua các lần nhắn tin.

**Thiết kế**: Lưu vào `session_recommendation_states` table trong MySQL.

**Tại sao không Redis**:
- Hệ thống đã có MySQL, không muốn thêm dependency (Redis).
- Dữ liệu nhỏ, không cần Redis performance.
- MySQL đã đủ nhanh cho use-case này.

**Tại sao không Session/HTTP session**:
- Backend dùng **JWT stateless** — không có HTTP session.
- Railway có thể scale thành nhiều instance → session in-memory sẽ không share được giữa các instance.
- DB lưu state → bất kỳ instance nào cũng đọc được.

**TTL**: 20 phút không hoạt động → state expired (`updated_at` check).

---

### Q19: WebSocket (Chatbot real-time) hoạt động như thế nào?

**Cách trả lời:**

Spring WebSocket với **STOMP over SockJS**:

1. Backend: `WebSocketConfig` enable STOMP, map `/ws` endpoint.
2. Frontend: dùng `sockjs-client` + `@stomp/stompjs` để connect đến `/ws/chat`.
3. Subscribe topic: `/user/{email}/queue/messages` — mỗi user nhận tin nhắn riêng.
4. Gửi tin nhắn: `/app/chat.sendMessage` — frontend publish lên server.
5. Backend xử lý message → save vào DB → push response qua `SimpMessagingTemplate.convertAndSendToUser`.

**Luồng**:
```
Frontend STOMP Client
  → connect() /ws/chat
  → subscribe /user/{email}/queue/messages
  → send() /app/chat.sendMessage { text }
      ↓
  MessageController (STOMP handler)
  → BotService.processMessage()
  → AI / Recommendation / FAQ routing
  → chatService.saveBotMessage()
  → SimpMessagingTemplate.convertAndSendToUser(email, "/queue/messages", response)
      ↓
  Frontend STOMP Listener
  → append to chat UI
```

---

### Q20: Promotions (mã giảm giá) hoạt động như thế nào?

**Cách trả lời:**

**Các loại promotion**:
- `PERCENTAGE`: Giảm % trên subtotal (VD: 10% off).
- `FIXED_AMOUNT`: Giảm số tiền cố định (VD: 200,000 VND).

**Validation khi apply** (`BookingServiceImpl.java` lines 958-995):
1. Mã tồn tại và đang active.
2. Áp dụng đúng loại dịch vụ (TOUR / HOTEL / ALL).
3. Trong khoảng `valid_from` → `valid_until`.
4. Chưa vượt `usage_limit`.
5. Đơn hàng đạt `min_order_amount`.

**Khi booking thành công**: tăng `used_count`.
**Khi hủy booking**: giảm `used_count` (rollback).

**Max discount**: Có `max_discount_amount` cap để không giảm quá nhiều.

---

## 3. CÂU HỎI THỰC TẾ / THI TRẮC NGHIỆM

### Q21: Nếu 1000 user cùng đặt 1 tour có 50 chỗ, làm sao đảm bảo không bán quá số chỗ?

**Cách trả lời:**

Hệ thống dùng **pessimistic locking + atomic UPDATE** trong MySQL transaction.

Cơ chế: Khi user đặt tour, backend sẽ lock dòng `tour_departures` lại bằng câu lệnh `SELECT FOR UPDATE`. Transaction đầu tiên lock dòng này, các transaction khác phải chờ. Khi transaction đầu thực hiện UPDATE giảm số chỗ — nếu `available_slots < requested`, UPDATE trả về 0 dòng → hệ thống throw exception → rollback. Transaction tiếp theo mới được thực thi.

Kết quả: dù 1000 user đặt cùng lúc, chỉ có 50 booking đầu tiên thành công. Booking thứ 51 sẽ nhận thông báo "Không đủ chỗ trống". Đảm bảo không bao giờ bán quá số chỗ.

---

### Q22: Nếu AI server bị down, chatbot có hoạt động không? Fallback ra sao?

**Cách trả lời:**

**Có, hệ thống có 3 tầng fallback**:

- **Tầng 1 — Structured Intent**: Chatbot có lớp NLP riêng dùng regex và keyword matching để nhận diện intent. Lớp này hoạt động hoàn toàn không cần AI. Các tính năng như tra cứu booking, gợi ý tour, FAQ vẫn trả lời được bình thường.

- **Tầng 2 — Multi-provider Fallback**: `AiCoreService` hỗ trợ 4 provider AI: Beeknoee (provider chính, dùng model gemini-3-flash), OpenAI, Gemini native, Claude. Nếu provider chính fail, hệ thống tự động thử provider dự phòng.

- **Tầng 3 — Static Response**: Nếu tất cả AI đều fail, hệ thống trả về một message tĩnh: "Xin lỗi, mình đang gặp sự cố kỹ thuật. Bạn liên hệ hotline 1900 1234 nhé!"

---

### Q23: JWT bị leak → làm sao revoke? Hệ thống có hỗ trợ không?

**Cách trả lời:**

JWT có đặc điểm là stateless — khi bị leak, không thể revoke ngay lập tức được vì token vẫn hợp lệ đến khi hết hạn (15 phút).

**Giải pháp hiện tại**:
- Hệ thống dùng **refresh token** lưu trong DB (`refresh_tokens` table). Nếu phát hiện leak, revoke refresh token → user phải login lại để nhận JWT mới.
- JWT có thời hạn ngắn (15 phút) → giảm thiểu window attack.

**Cải thiện thêm** (nếu hỏi sâu):
- Dùng **token blacklist**: lưu JWT ID (`jti`) vào DB khi revoke → mỗi request kiểm tra token có trong blacklist không. Cách này revoke được ngay nhưng có overhead.

---

### Q24: Hệ thống xử lý overload/DoS attack như thế nào?

**Cách trả lời:**

Có 5 lớp bảo vệ:

1. **Rate Limiting**: Hệ thống dùng `RateLimitFilter` giới hạn 5 lần login/phút/IP và 3 lần register/phút/IP. Dùng `LoginAttempt` table trong MySQL để đếm — có thể mở rộng lên Redis nếu cần.

2. **AI Semaphore**: `AiCoreService` chỉ cho phép 1 request AI đồng thời, timeout 60 giây → tránh quá tải AI provider.

3. **Connection Pooling**: Backend dùng HikariCP — tối đa 10 connections, tối thiểu 2 idle, auto-reconnect. Không có connection leak.

4. **Request Validation**: Mọi request đều validate bằng `@Valid` và Jakarta Bean Validation → reject invalid request sớm, giảm tải.

5. **CORS Policy**: Chỉ cho phép specific origins (Vercel URL + localhost), chặn request từ domain lạ.

---

### Q25: Nếu VNPay bị downtime, user có đặt được tour không?

**Cách trả lời:**

**Có**. User vẫn đặt được tour bình thường. Khi đặt tour, booking được tạo ở trạng thái **PENDING** (chưa thanh toán). Sau đó user có 2 lựa chọn:

1. **Chờ VNPay khôi phục**: Sau đó quay lại thanh toán. Booking PENDING có thời hạn 24-48 giờ (job scheduler sẽ hủy booking quá hạn).
2. **Chuyển khoản thủ công**: Theo thông tin trong email xác nhận, chuyển khoản và dùng mã booking làm nội dung. Backend có job định kỳ kiểm tra bank transfer để tự động xác nhận.

Hệ thống chỉ cập nhật booking → CONFIRMED khi nhận VNPay IPN callback thành công HOẶC phát hiện bank transfer khớp mã booking.

---

### Q26: So sánh giữa đặt khách sạn và đặt tour — khác nhau ở đâu?

**Cách trả lời:**

| Khía cạnh | Đặt Tour | Đặt Khách sạn |
|-----------|----------|----------------|
| **Quản lý chỗ** | Số chỗ trên mỗi lịch khởi hành (theo ngày) | Số phòng trên mỗi loại phòng (theo khoảng ngày) |
| **Tính giá** | Tính theo người (người lớn + trẻ em), có dynamic pricing theo departure | Tính theo đêm × số đêm × số phòng |
| **Locking** | SELECT FOR UPDATE trên dòng lịch khởi hành | Đếm phòng đã đặt trong khoảng ngày |
| **Hủy** | Khôi phục số chỗ trên lịch khởi hành | Khôi phục số phòng trên loại phòng |
| **Check trùng** | Kiểm tra cùng user + cùng tour + cùng ngày khởi hành | Không check trùng (vì hotel booking không giới hạn đặt lại) |

---

### Q27: Điều gì xảy ra khi user đặt combo (tour + khách sạn)?

**Cách trả lời:**

ComboPackage là gói kết hợp Tour + Khách sạn với **giá ưu đãi** — tổng giá combo nhỏ hơn tổng giá đặt riêng từng dịch vụ.

Luồng đặt combo gồm 6 bước:

1. User chọn combo → gửi request với `combo_package_id`.
2. Backend kiểm tra combo còn slot → lock `available_slots` trên combo bằng `FOR UPDATE`.
3. Tính giá: `combo.total_price` (đã có discount) + VAT 10%.
4. Lưu: một `Booking` (type = COMBO) kèm `BookingCombo` chứa chi tiết cả tour lẫn hotel.
5. Decrement `available_slots` của combo.
6. Gửi email xác nhận combo.

---

### Q28: Làm sao user chưa đăng nhập vẫn dùng được chatbot?

**Cách trả lời:**

Hệ thống xử lý **anonymous user** bằng cách tạo email tạm thời. Trong code, nếu principal là null, hệ thống gán email = `"anonymous_" + timestamp + "@tourista.vn"`. Anonymous user vẫn lưu được lịch sử chat vào DB bình thường.

**Giới hạn của anonymous user**:
- Chat AI → hoạt động bình thường, không cần đăng nhập.
- Tra cứu booking → **yêu cầu đăng nhập**. Lý do: chỉ chủ booking mới được xem thông tin booking, không thể expose thông tin cho người lạ.

---

### Q29: Review/Đánh giá được kiểm duyệt như thế nào?

**Cách trả lời:**

Hệ thống kiểm duyệt review gồm 4 bước:

1. **Điều kiện đánh giá**: User chỉ được đánh giá khi booking đã ở trạng thái COMPLETED (đã hoàn thành chuyến đi). Điều này tránh spam review từ người chưa trải nghiệm dịch vụ.

2. **Admin duyệt**: Admin xem danh sách pending reviews → approve (hiển thị công khai) hoặc reject (không hiển thị).

3. **Auto-moderation**: `ReviewModerationService` kiểm tra từ khóa spam, tục tĩu trước khi approve.

4. **Hiển thị**: Chỉ review đã approve mới hiển thị trên trang tour/khách sạn. Nhờ đó, nội dung không phù hợp được lọc bỏ.

---

### Q30: Scheduler/Jobs tự động nào đang chạy?

**Cách trả lời:**

Backend dùng `@EnableScheduling` để chạy các job định kỳ:

1. **Auto-complete booking**: Kiểm tra booking đã qua ngày khởi hành/khách sạn → tự động cập nhật trạng thái COMPLETED → gửi email cảm ơn. User không cần thao tác gì sau chuyến đi.

2. **Expire OTP codes**: Xóa OTP đã hết hạn (>15 phút) khỏi DB để tránh rác dữ liệu.

3. **Expire verification tokens**: Xóa email verification token hết hạn (user không xác thực email sau 24h).

4. **Rollback stale bookings**: Hủy booking PENDING quá 24 giờ không thanh toán → giải phóng slot tour/phòng khách sạn. Đảm bảo tài nguyên không bị lock vĩnh viễn.

---

## 4. BẢNG TỔNG HỢP CÔNG NGHỆ

| Thành phần | Công nghệ |
|------------|-----------|
| Frontend | Next.js 16, React 18, TypeScript, Redux Toolkit, Tailwind CSS, Axios, Leaflet |
| Backend | Spring Boot 3, Java 17, Spring Security, Spring Data JPA, Spring WebSocket |
| Database | MySQL 8.0 (Railway) |
| AI | Beeknoee API (gemini-3-flash), OpenAI, Gemini, Claude |
| Payment | VNPay (sandbox → production) |
| Email | Brevo (Sendinblue) API |
| Image CDN | Cloudinary |
| Deploy | Vercel (frontend) + Railway (backend + MySQL) |
| Auth | JWT (access 15 phút + refresh 7 ngày) + OAuth2 (Google) |
| Real-time | WebSocket (STOMP over SockJS) |
| Rate Limiting | Custom filter (Spring) |
| ORM | Hibernate (JPA) |

---

## 5. MẸO BẢO VỆ

### Khi gặp câu hỏi khó:
- **Luôn bắt đầu bằng**: "Theo em hiểu thì..." → cho phép mình suy nghĩ thêm.
- **Dùng diagram**: Vẽ luồng bằng mũi tên trên giấy/bảng — trực quan và dễ giải thích.
- **Nói code**: Trích dẫn file + method cụ thể → thể hiện mình đã đọc và hiểu code thật.
- **Thừa nhận giới hạn**: "Phần này em chưa implement, nhưng nếu được phát triển thêm, em sẽ làm..."

### Những điểm "ấn tượng" để nhấn mạnh:
1. **Pessimistic locking** → giải quyết race condition thực tế.
2. **Slot-filling chatbot** → không chỉ gọi AI, mà có structured flow.
3. **Dynamic pricing** → tính năng thương mại thực tế.
4. **Idempotency** → xử lý duplicate request.
5. **Multi-provider AI fallback** → production-ready.
6. **State stored in DB** (không phải Redis/Session) → phù hợp với stateless JWT + multi-instance.

---

*Chúc bạn bảo vệ thành công! 🎓*
