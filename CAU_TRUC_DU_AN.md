# Cấu Trúc Dự Án Tourista Chi Tiết

Dưới đây là cấu trúc chi tiết đi sâu vào từng thư mục và ý nghĩa/chức năng của từng file trong dự án **Tourista**.

## 1. Hệ Thống Backend (Spring Boot)
Vị trí: `Tourista/backend/src/main/java/vn/tourista/`

### 1.1 Thư mục `controller/` (Nhận Request từ Client)
Chứa các file tiếp nhận yêu cầu (HTTP Requests) từ giao diện.
- `AuthController.java`: Quản lý Đăng nhập, Đăng ký, Quên mật khẩu.
- `AdminController.java` / `AdminComboController.java`: Xử lý các API dành riêng cho quản trị viên.
- `ChatController.java` / `MessageController.java`: Xử lý nhắn tin (Chatbot) và Websocket.
- `BookingController.java` / `PaymentController.java`: Xử lý luồng đặt Tour/Khách sạn và Thanh toán (VNPay...).
- `HotelController.java` / `TourController.java`: Lấy thông tin, tìm kiếm Khách sạn và Tour.
- `HomeController.java`: Cung cấp dữ liệu cho trang chủ (Tour nổi bật, Khách sạn hot).
- `DynamicPricingController.java`: Xử lý giá động (Dynamic Pricing) theo thời điểm.
- `ImageController.java`: Xử lý upload và lấy hình ảnh (từ Cloudinary).
- `ReviewController.java` / `ReviewModerationController.java`: Quản lý và kiểm duyệt đánh giá của khách hàng.
- `UserProfileController.java`: Quản lý thông tin hồ sơ người dùng cá nhân.
- `FaqController.java` / `ArticleController.java`: Quản lý bài viết và các câu hỏi thường gặp.
- `PartnerController.java`: Xử lý các API dành cho đối tác (Partner).

### 1.2 Thư mục `entity/` (Ánh xạ Database MySQL)
Các file Java ánh xạ trực tiếp thành các bảng trong CSDL.
- `User.java` / `Role.java`: Bảng tài khoản người dùng và Quyền hạn.
- `Tour.java` / `TourCategory.java` / `TourDeparture.java` / `TourImage.java` / `TourItinerary.java`: Các bảng quản lý thông tin chi tiết của một Tour du lịch (Hình ảnh, Lịch trình, Điểm khởi hành).
- `Hotel.java` / `RoomType.java` / `HotelImage.java` / `Amenity.java`: Các bảng quản lý Khách sạn, loại phòng và tiện ích phòng.
- `ComboPackage.java`: Bảng quản lý các gói Combo (kết hợp Tour + Khách sạn).
- `Booking.java` / `BookingTourDetail.java` / `BookingHotelDetail.java` / `Payment.java`: Lưu trữ hóa đơn, chi tiết đặt chỗ và lịch sử thanh toán.
- `Conversation.java` / `ChatMessage.java`: Bảng lưu lịch sử trò chuyện giữa người dùng và Chatbot.
- `Review.java` / `ReviewImage.java`: Bảng lưu trữ đánh giá, bình luận của khách hàng.
- `Promotion.java` / `PricingRule.java`: Bảng lưu mã giảm giá và quy tắc tính giá động.
- `City.java`: Bảng dữ liệu tỉnh/thành phố.
- `Article.java` / `Report.java`: Bảng bài viết và báo cáo vi phạm.

### 1.3 Thư mục `service/` (Xử lý Logic Nghiệp Vụ)
Nơi chứa toàn bộ logic xử lý chính của ứng dụng.
- `AuthService.java`: Logic xác thực JWT, mã hóa mật khẩu.
- `AiService.java` / `ChatService.java` / `BotService.java`: Gọi API AI (Gemini/OpenAI) và xử lý luồng trò chuyện Chatbot.
- `EmailService.java` / `BrevoEmailService.java`: Logic gửi email xác thực, email hóa đơn cho người dùng (dùng Brevo).
- `PricingService.java`: Thuật toán tính toán giá cả, áp dụng giá động hoặc khuyến mãi.
- `BookingService.java`: Tính toán tổng tiền, kiểm tra số lượng trống và tạo đơn đặt chỗ.
- `VnpayService.java`: Tích hợp và tạo URL thanh toán qua cổng VNPay.
- `TourRecommendationService.java`: Thuật toán gợi ý Tour phù hợp cho người dùng (AI Recommendation).
- `StatisticsService.java` / `ReportService.java`: Tính toán doanh thu, thống kê số liệu cho Dashboard Admin.
- `PartnerService.java` / `AdminService.java`: Logic xử lý nghiệp vụ cho đối tác và quản trị viên.
- (Các service khác tương ứng với Controller: `TourService.java`, `HotelService.java`, `ReviewService.java`...)

### 1.4 Thư mục `resources/` (Cấu hình)
- `application.yml` / `application-local.yml`: File cấu hình Spring Boot (Port, Database URL, JWT Secret).
- `schema-*.sql`: Các file script SQL (như `schema-chat.sql`, `schema-combo.sql`) để khởi tạo bảng cấu trúc DB.

---

## 2. Hệ Thống Frontend (Next.js)
Vị trí: `Tourista/frontend/`

### 2.1 Thư mục `src/api/` (Tích hợp API)
Chứa các file gọi API bằng `axios` tới Backend.
- `axiosClient.js`: Cấu hình gốc (Base URL, tự động gắn token JWT vào Header, xử lý lỗi chung).
- `authApi.js`: Gọi API Đăng nhập, Đăng ký.
- `bookingApi.js`: Gọi API tạo hóa đơn đặt Tour/Khách sạn.
- `tourApi.js` / `hotelApi.js` / `comboApi.js`: Lấy danh sách, chi tiết dịch vụ.
- `chatApi.js`: Gửi/nhận tin nhắn chatbot bằng REST.
- `adminApi.js`: Thư viện API dành cho mọi thao tác của Admin (tạo sửa xóa).
- `paymentApi.js` (hoặc trong booking): Gọi API lấy link thanh toán.
- `imageApi.js`: Upload ảnh lên Cloudinary.
- `partnerApi.js`: Gọi API quản lý gian hàng của đối tác.
- `userApi.js`: API lấy/cập nhật thông tin profile cá nhân.

### 2.2 Thư mục `app/` (Các Trang Hiển Thị - App Router)
Định tuyến URL của website. Mỗi thư mục tương ứng 1 URL.
- `page.tsx`: File UI Trang chủ của website (`/`).
- `layout.tsx`: Giao diện bao bọc mọi trang (chứa Header Navbar, Footer).
- `(auth)/` (Gồm `login/`, `register/`, `forgot-password/`): Chứa các trang hiển thị form đăng nhập, đăng ký.
- `tours/`: Trang danh sách hiển thị các Tour (`/tours`) và chi tiết Tour (`/tours/[id]`).
- `hotels/`: Trang hiển thị khách sạn.
- `admin/`: Khu vực Dashboard của quản trị viên (biểu đồ doanh thu, quản lý user/tour...).
- `profile/`: Trang quản lý tài khoản của người dùng đang đăng nhập.
- `payments/`: Trang trạng thái sau khi thanh toán xong (Thành công/Thất bại).
- `ai-travel-planner/`: Trang công cụ AI tự động lên lịch trình du lịch cho khách.
- `partner/`: Giao diện dành riêng cho chủ khách sạn/tour.
- `globals.css`: File định nghĩa style CSS chung toàn cục và cài đặt Tailwind CSS.

### 2.3 Thư mục `src/components/` (Các Component dùng lại)
- `Home/`: Các thành phần nhỏ tạo nên Trang chủ (Banner, Danh sách nổi bật).
- `Auth/`: Các form đăng nhập nhỏ dùng chung.
- `Chat/`: Giao diện hộp thoại Chatbot nổi lên ở góc màn hình.
- `Layout/`: Chứa `Header.jsx`, `Footer.jsx`, `Sidebar.jsx`.
- `Admin/`: Các bảng Data Table biểu đồ dùng cho Admin.
- `Tours/`, `Hotels/`: Giao diện card hiển thị thông tin chi tiết từng dịch vụ.
- `Common/`: Nút bấm (Button), hộp thoại thông báo (Modal/Dialog), input chung.
- `I18nProvider/` / `LanguageSwitcher/`: Nút chuyển đổi ngôn ngữ (Anh/Việt) và Provider đa ngôn ngữ.

### 2.4 Các thư mục khác trong `src/`
- `types/` (VD: `chat.ts`): Chứa khai báo kiểu dữ liệu TypeScript (Interfaces).
- `store/`: Chứa cấu hình Redux Toolkit lưu state toàn cục (thông tin user đang đăng nhập, ngôn ngữ, giỏ hàng...).
- `hooks/`: Chứa custom hooks tự viết để xử lý logic lặp lại (VD: debounce search).
- `utils/`: Chứa các hàm tiện ích như format tiền VNĐ (`formatCurrency`), format ngày tháng (`formatDate`), v.v.
