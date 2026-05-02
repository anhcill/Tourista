# Khởi động và cấu hình runtime (Backend)

## 1) Entry point

**File:** `backend/src/main/java/vn/tourista/TouristaApplication.java`

- Nạp file `.env` trước khi Spring Boot khởi chạy (java-dotenv).
- Đẩy tất cả biến trong `.env` vào `System.setProperty(...)` để Spring đọc được.
- Nếu không có `.env` thì dùng environment variables hệ thống.
- Bật async (`@EnableAsync`) cho các tác vụ nền (bot, email, ...).

## 2) Cấu hình runtime

**File:** `backend/src/main/resources/application.yml`

Các nhóm cấu hình chính:

- **Cloudinary**: `cloudinary.cloud-name`, `cloudinary.api-key`, `cloudinary.api-secret`
- **File upload**: `spring.servlet.multipart.*`
- **Server**: `server.port`, `server.forward-headers-strategy`
- **Datasource (MySQL)**:
  - `spring.datasource.url`, `username`, `password`, `driver-class-name`
  - HikariCP: `maximum-pool-size`, `minimum-idle`, `idle-timeout`, ...
- **JPA**:
  - `spring.jpa.hibernate.ddl-auto` (đang set `none`)
  - `spring.jpa.open-in-view` (false)
- **SQL init**:
  - `spring.sql.init.mode`
  - `spring.sql.init.schema-locations` (chat, articles, combo)
- **Email SMTP (local)**:
  - `spring.mail.*`
- **Google OAuth2**:
  - `spring.security.oauth2.client.registration.google.*`
- **JWT + app config**:
  - `app.jwt.secret`, `app.jwt.access-token-expiry-ms`, `app.jwt.refresh-token-expiry-days`
  - `app.auth.*` (lockout policy)
  - `app.rate-limit.*` (login/register)
  - `app.frontend-url`
  - `app.cors.allowed-origins`
- **VNPay**:
  - `app.vnpay.*` (tmn-code, hash-secret, pay-url, return-url)
- **Brevo email**:
  - `app.email.*`
- **AI (Beeknoee)**:
  - `beeknoee.api-key`, `beeknoee.model`, `beeknoee.api-url`, ...

**Lưu ý quan trọng:**
- File có nhiều giá trị mặc định (JWT, mail, vnpay, ai). Khi deploy, nên override bằng env vars.
- `spring.config.import: optional:classpath:application.properties` cho phép thêm file cấu hình phụ nếu cần.

## 3) Biến môi trường thường dùng

- DB: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- Auth: `JWT_SECRET`
- OAuth2: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- VNPay: `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_RETURN_URL`
- Email: `MAIL_USERNAME`, `MAIL_PASSWORD` hoặc `BREVO_API_KEY`
- Frontend/CORS: `FRONTEND_URL`, `APP_CORS_ALLOWED_ORIGINS`
- AI: `BEEKNOEE_API_KEY`
