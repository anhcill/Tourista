# ĐẶC TẢ USE CASE — UC02: ĐĂNG KÝ / ĐĂNG NHẬP TÀI KHOẢN

---

## 1. Thông tin tổng quan

| Thuộc tính | Nội dung |
|---|---|
| **Tên UC** | UC02 — Đăng ký / Đăng nhập tài khoản |
| **Mã UC** | UC02 |
| **Tác nhân chính** | Người dùng (Guest, Customer) |
| **Tác nhân phụ** | Hệ thống Email, Google OAuth2, Facebook OAuth2 |
| **Mô tả** | Cho phép người dùng tạo tài khoản mới hoặc đăng nhập vào hệ thống bằng email/password hoặc tài khoản mạng xã hội (Google, Facebook). Sau khi xác thực thành công, hệ thống cấp JWT Token để xác thực các yêu cầu API tiếp theo. |
| **Phạm vi** | Hệ thống Tourista Studio |
| **Tiền điều kiện | Không có |
| **Hậu điều kiện** | Người dùng đăng nhập thành công, nhận được JWT Token |

---

## 2. Luồng sự kiện chính (Main Flow)

### 2.1. Đăng ký tài khoản mới

| Bước | Tác nhân | Hành động |
|---|---|---|
| 1 | Người dùng | Nhấn nút "Đăng ký" trên giao diện |
| 2 | Hệ thống | Hiển thị form đăng ký: email, password, xác nhận password, họ tên |
| 3 | Người dùng | Nhập thông tin và nhấn "Đăng ký" |
| 4 | Hệ thống | Validate dữ liệu (email đúng định dạng, password ≥ 8 ký tự, password trùng khớp) |
| 5 | Hệ thống | Kiểm tra email đã tồn tại trong CSDL chưa |
| 6 | Hệ thống | Mã hóa password bằng thuật toán BCrypt |
| 7 | Hệ thống | Lưu thông tin người dùng vào CSDL với trạng thái `email_verified = false` |
| 8 | Hệ thống | Gửi email xác thực chứa mã OTP đến hộp thư người dùng |
| 9 | Người dùng | Nhận email, nhấn vào link xác thực hoặc nhập mã OTP |
| 10 | Hệ thống | Xác thực mã OTP → cập nhật `email_verified = true` |
| 11 | Hệ thống | Hiển thị thông báo "Đăng ký thành công" và chuyển hướng trang đăng nhập |

### 2.2. Đăng nhập bằng Email + Password

| Bước | Tác nhân | Hành động |
|---|---|---|
| 1 | Người dùng | Nhấn nút "Đăng nhập" trên giao diện |
| 2 | Hệ thống | Hiển thị form đăng nhập: email, password |
| 3 | Người dùng | Nhập email và password → nhấn "Đăng nhập" |
| 4 | Hệ thống | Validate dữ liệu đầu vào |
| 5 | Hệ thống | Tìm người dùng theo email trong CSDL |
| 6 | Hệ thống | So sánh password nhập vào với BCrypt hash trong CSDL |
| 7 | Hệ thống | Xác thực thành công → Tạo **JWT Access Token** (thời hạn 15 phút) |
| 8 | Hệ thống | Tạo **Refresh Token** (thời hạn 7 ngày) và lưu vào CSDL |
| 9 | Hệ thống | Trả về Access Token + Refresh Token về Frontend |
| 10 | Frontend | Lưu token vào Redux state, chuyển hướng đến trang chủ |
| 11 | Người dùng | Đăng nhập thành công, có quyền truy cập các chức năng của Khách hàng |

### 2.3. Đăng nhập bằng Google OAuth2

| Bước | Tác nhân | Hành động |
|---|---|---|
| 1 | Người dùng | Nhấn nút "Đăng nhập với Google" |
| 2 | Hệ thống | Chuyển hướng đến trang xác thực Google |
| 3 | Người dùng | Chọn tài khoản Google và cho phép truy cập |
| 4 | Google | Gửi mã xác thực (Authorization Code) về hệ thống |
| 5 | Hệ thống | Trao đổi mã xác thực lấy Access Token từ Google |
| 6 | Hệ thống | Gọi Google API lấy thông tin người dùng (email, tên, avatar) |
| 7 | Hệ thống | Kiểm tra người dùng đã tồn tại chưa (theo `provider_id` của Google) |
| 8 | Hệ thống | Nếu chưa có → tạo tài khoản mới tự động |
| 9 | Hệ thống | Tạo JWT Access Token và Refresh Token |
| 10 | Hệ thống | Trả về Frontend → đăng nhập thành công |

### 2.4. Đăng nhập bằng Facebook OAuth2

| Bước | Tác nhân | Hành động |
|---|---|---|
| 1 | Người dùng | Nhấn nút "Đăng nhập với Facebook" |
| 2 | Hệ thống | Chuyển hướng đến trang đăng nhập Facebook |
| 3 | Người dùng | Đăng nhập Facebook và cho phép truy cập |
| 4 | Facebook | Gửi mã xác thực về hệ thống |
| 5 | Hệ thống | Trao đổi mã → lấy thông tin người dùng từ Facebook Graph API |
| 6 | Hệ thống | Kiểm tra / tạo tài khoản, tạo JWT Token (tương tự Google) |

---

## 3. Luồng sự kiện phụ (Alternative Flows)

### 3.1. Đăng nhập thất bại — Email chưa đăng ký

| Bước | Mô tả |
|---|---|
| 1 | Ở bước 5 (Main Flow), hệ thống không tìm thấy email → hiển thị lỗi: "Email chưa được đăng ký" |
| 2 | Người dùng có thể nhấn "Đăng ký ngay" để chuyển sang luồng đăng ký |

### 3.2. Đăng nhập thất bại — Password sai

| Bước | Mô tả |
|---|---|
| 1 | Ở bước 6 (Main Flow), BCrypt so sánh sai → hiển thị lỗi: "Email hoặc mật khẩu không đúng" |
| 2 | Cho phép thử lại tối đa 5 lần, sau đó tài khoản bị khóa tạm thời 15 phút |

### 3.3. Refresh Token hết hạn

| Bước | Mô tả |
|---|---|
| 1 | Khi Access Token hết hạn (15 phút), Frontend gửi Refresh Token để lấy Access Token mới |
| 2 | Nếu Refresh Token hết hạn hoặc đã bị thu hồi → yêu cầu đăng nhập lại |

### 3.4. Quên mật khẩu

| Bước | Mô tả |
|---|---|
| 1 | Người dùng nhấn "Quên mật khẩu" → nhập email đã đăng ký |
| 2 | Hệ thống gửi email chứa link đặt lại mật khẩu |
| 3 | Người dùng nhấn link → nhập mật khẩu mới |
| 4 | Hệ thống cập nhật BCrypt hash mới vào CSDL |

---

## 4. Yêu cầu mở rộng (Extension Points)

| Điều kiện mở rộng | Mô tả |
|---|---|
| UC02-E1 | Khóa tài khoản tạm thời khi đăng nhập sai quá 5 lần |
| UC02-E2 | Gửi thông báo đăng nhập từ thiết bị lạ qua email |
| UC02-E3 | Thu hồi Refresh Token khi đăng xuất |

---

## 5. Thuật toán bảo mật

### 5.1. BCrypt — Mã hóa mật khẩu

```
Mục đích: Lưu mật khẩu dưới dạng hash, không thể đảo ngược
Thuật toán: BCrypt với cost factor = 12
Đầu vào:  plaintext password
Đầu ra:   $2a$12$... (60 ký tự hash)
```

### 5.2. JWT Token — Xác thực API

```
JWT Access Token (15 phút):
├── Header: { alg: HS256, typ: JWT }
├── Payload: {
│     sub: userId,
│     email: "...",
│     role: "CUSTOMER" | "PARTNER" | "ADMIN",
│     iat: timestamp,
│     exp: timestamp + 15 phút
│   }
└── Signature: HMAC-SHA256(header + payload, SECRET_KEY)

JWT Refresh Token (7 ngày):
├── Payload: {
│     sub: userId,
│     type: "refresh",
│     iat: timestamp,
│     exp: timestamp + 7 ngày
│   }
└── Signature: HMAC-SHA256(header + payload, SECRET_KEY)
```

### 5.3. OAuth2 — Đăng nhập mạng xã hội

```
1. Frontend → Backend: POST /api/auth/oauth2/callback?code=XXX&provider=GOOGLE
2. Backend → Google: POST https://oauth2.googleapis.com/token
3. Google → Backend: Access Token + ID Token
4. Backend → Google: GET https://www.googleapis.com/oauth2/v3/userinfo
5. Google → Backend: { email, name, picture, sub }
6. Backend → Database: Tạo / cập nhật user record
7. Backend → Frontend: JWT Access Token + JWT Refresh Token
```

---

## 6. Bảng quyết định

| Email | Password | Email xác thực? | Kết quả |
|---|---|---|---|
| Chưa đăng ký | — | — | Báo lỗi: "Email chưa đăng ký" |
| Đã đăng ký | Sai | — | Báo lỗi: "Email hoặc mật khẩu không đúng" |
| Đã đăng ký | Đúng | Chưa xác thực | Báo lỗi: "Vui lòng xác thực email trước" |
| Đã đăng ký | Đúng | Đã xác thực | ✅ Đăng nhập thành công |
| Đã đăng ký | — | — (OAuth2) | ✅ Đăng nhập thành công (tự tạo tài khoản nếu mới) |

---

## 7. Sơ đồ luồng (Flowchart mô tả)

```
[BẮT ĐẦU]
     │
     ▼
[Chọn phương thức đăng nhập?]
     │
     ├─ Email + Password ──>> [Nhập email, password]
     │                            │
     │                            ▼
     │                     [Tìm user theo email?]
     │                            │
     │               ┌────────────┴────────────┐
     │               ▼                         ▼
     │         [Tìm thấy]              [Không tìm thấy]
     │               │                         │
     │               ▼                         ▼
     │        [So sánh BCrypt]          [Báo lỗi:
     │               │                   Email chưa đăng ký]
     │      ┌────────┴────────┐
     │      ▼                 ▼
     │  [Đúng]           [Sai]
     │      │                 │
     │      │                 ▼
     │      │           [Báo lỗi: Sai password]
     │      │           [Đếm số lần sai]
     │      │                 │
     │      ▼                 ▼
     │  [Tạo JWT Token]   [Sai > 5 lần?]
     │      │                 │
     │      ▼            ┌────┴────┐
     │  [Tạo Refresh   ▼         ▼
     │   Token]     [Có]    [Không]
     │      │           │         │
     │      ▼           ▼         │
     │  [Trả token] [Khóa TK     │
     │      │        15 phút]     │
     │      ▼                       │
     └─►[ĐĂNG NHẬP THÀNH CÔNG]◄──┘
               │
               ▼
         [KẾT THÚC]

───────────────────────────────────

[OAuth2 Google/Facebook]
     │
     ▼
[Nhấn nút Google/Facebook]
     │
     ▼
[Chuyển hướng OAuth Provider]
     │
     ▼
[User cho phép truy cập]
     │
     ▼
[Nhận Authorization Code]
     │
     ▼
[Backend trao đổi lấy Access Token]
     │
     ▼
[Lấy thông tin user từ Provider API]
     │
     ▼
[Tạo/Cập nhật user trong CSDL]
     │
     ▼
[Tạo JWT Token → Đăng nhập thành công]
```

---

## 8. So sánh các phương thức đăng nhập

| Tiêu chí | Email + Password | Google OAuth2 | Facebook OAuth2 |
|---|---|---|---|
| Thao tác | Nhập tay | 1 nhấn nút | 1 nhấn nút |
| Mật khẩu | Cần nhớ | Không cần | Không cần |
| Bảo mật | Phụ thuộc user | Rất cao (Google) | Cao (Facebook) |
| Tạo tài khoản | Thủ công | Tự động | Tự động |
| Xác thực email | Bắt buộc | Theo Google | Theo Facebook |
| Thuật toán mã hóa | BCrypt + JWT | JWT | JWT |
| Thời hạn Access Token | 15 phút | 15 phút | 15 phút |
| Thời hạn Refresh Token | 7 ngày | 7 ngày | 7 ngày |

---

## 9. Các API Endpoints liên quan

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/auth/register` | Đăng ký tài khoản mới |
| POST | `/api/auth/login` | Đăng nhập (email + password) |
| POST | `/api/auth/oauth2/callback` | Callback OAuth2 (Google/Facebook) |
| POST | `/api/auth/refresh` | Làm mới Access Token |
| POST | `/api/auth/logout` | Đăng xuất (thu hồi token) |
| POST | `/api/auth/forgot-password` | Gửi email đặt lại mật khẩu |
| POST | `/api/auth/reset-password` | Đặt lại mật khẩu mới |
| GET | `/api/auth/verify-email` | Xác thực email (OTP) |
| GET | `/api/auth/me` | Lấy thông tin user hiện tại |

---

## 10. Biểu đồ Sequence (luồng đăng nhập chính)

```
Người dùng    Frontend        Backend         CSDL         Email
    │             │              │             │            │
    │──Nhấn ĐN───>>│              │             │            │
    │             │──POST login───>>│             │            │
    │             │              │──Tìm user────>>│            │
    │             │              │<<──User───────│            │
    │             │              │──So sánh BCrypt             │
    │             │              │   (đúng?)                    │
    │             │              │──Lưu Refresh Token──>>│      │
    │             │<<──JWT Token──│             │            │
    │             │──Lưu Redux──>>│             │            │
    │<<ĐN thành công│              │             │            │
    │             │              │                            │
    │──Nhấn Đăng ký>>│              │             │            │
    │             │──POST register──>>│             │            │
    │             │              │──Mã hóa BCrypt│            │
    │             │              │──Lưu user─────>>│            │
    │             │              │──Gửi email xác thực──>>    │
    │             │              │             │    <<──Email──│
    │<<Đăng ký thành công│              │             │       │
```

---

> **Tài liệu này được sử dụng cho báo cáo đồ án tốt nghiệp — Hệ thống Tourista Studio**
> **Môn: Phân tích và Thiết kế Hệ thống Thông tin**
