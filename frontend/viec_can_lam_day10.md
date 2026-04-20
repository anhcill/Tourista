❌ VẤN ĐỀ CẦN FIX NGAY

1. [NGHIÊM TRỌNG] Lỗi Google OAuth (đang fix)
   Redirect URI mismatch → 401 → ĐÃ FIX application.yml indent + redirect URI
   Cần: thêm redirect URI mới vào Google Console ✅ (chờ user làm)
2. [NGHIÊM TRỌNG] SecurityConfig có thể thiếu endpoint
   /api/auth/google/callback — endpoint này có controller xử lý không? Hoặc dùng /login/oauth2/code/google mặc định Spring Security → đã fix về format này ✅
3. [NẶNG] Hotel Booking — selectedRoom KHÔNG persist khi chuyển tab
   Hotel detail page: chọn room → chuyển tab → quay lại → room reset
   selectedRoom là local state, không lưu vào URL params
   Khi vào /hotels/[id]/book, roomTypeId từ URL param có thể không match → fallback về room đầu tiên
4. [NẶNG] Booking trạng thái PENDING nhưng không thanh toán
   Tạo booking → không thanh toán VNPAY → booking ở trạng thái PENDING mãi
   Không có timeout auto-cancel (cron job hủy booking PENDING quá hạn)
5. [TRUNG BÌNH] Payment Methods có UI nhưng MoMo/ZaloPay/BankTransfer chưa có backend xử lý
   Frontend hiển thị 5 phương thức, nhưng chỉ VNPAY thực sự gọi backend
   4 phương thức còn lại → redirect thẳng sang /payments/success?status=success → FAKE payment
6. [TRUNG BÌNH] Admin Hotels/Tours CRUD chưa hoàn chỉnh
   Có page create/edit nhưng chưa thấy API endpoints đầy đủ cho POST/PUT /api/admin/hotels, POST/PUT /api/admin/tours
   AdminController đang có gì?
   📋 BUGS CẦN FIX

# Mức Mô tả

1
Cao
Hotel detail: selectedRoom không persist khi chuyển tab
2
Cao
Booking PENDING không auto-cancel
3
Cao
4/5 payment methods là FAKE (MoMo, ZaloPay, BankTransfer, Card form)
4
TB
Hotel book page: roomTypeId fallback không đúng → sai phòng
5
TB
Rating breakdown trong Tour detail là MOCK (hardcoded %)
6
TB
Review helpful count là MOCK (luôn = 0)
7
TB
Admin create/edit hotels/tours chưa có backend API
8
TB
Dashboard revenue có thể dùng mock data
9
TB
BotController không tồn tại (404 khi chatbot gọi)
🚀 TÍNH NĂNG CÒN THIẾU (để đột phá điểm cao)
Phải có (Critical):
Auto-cancel booking PENDING — scheduler chạy mỗi 15 phút, hủy booking PENDING > 30 phút
Payment webhook thật — MoMo/ZaloPay IPN endpoint
Email xác nhận booking — gửi email khi tạo booking thành công
SMS notification — thông báo booking status qua SMS ( Nexmo/VNPT)
Nên có (Important):
Wishlist/Favorite toggle trong Hotel/Tour detail page — button có UI nhưng chưa gọi API ✅ (Week 1)
Booking cancellation — user tự hủy booking, admin duyệt hủy ✅ (Week 2)
Partner/Host dashboard — trang riêng cho chủ khách sạn/chủ tour xem booking ✅ (Week 3)
Tour departure notification — nhắc trước 24h qua email
Review moderation notifications ✅ (Week 3)
Review helpful vote — backend + frontend (hiện tại là mock)
Search autocomplete — thay vì chỉ filter sidebar
Để gây ấn tượng (Bonus):
PWA / Offline support — service worker cho trang detail
Real-time notification — WebSocket cho booking status thay đổi
Advanced analytics — heatmap, user journey trong admin
Multi-language SEO — i18n với static generation
A/B testing framework — thử nghiệm UI variants
Booking QR check-in — quét QR tại check-in desk
Referral system — mời bạn nhận voucher
Loyalty points — tích điểm cho mỗi booking
📊 ƯỚC TÍNH THỨ TỰ LÀM
Tuần 1 — Fix bugs nghiêm trọng:

Fix Favorite/Wishlist toggle (Hotel/Tour detail)
Fix selectedRoom persist via URL params
Thêm Auto-cancel booking scheduler
Fix payment methods (hoặc disable 4 cái chưa có backend)
Tuần 2 — Hoàn thiện payment: 5. Thêm Payment Webhook cho MoMo/ZaloPay 6. Email confirmation khi booking 7. Booking cancellation flow

Tuần 3 — Admin & Partner: ✅ Hoan thanh! (Admin CRUD API, Partner Dashboard, Review Moderation page + API)

Tuần 4 — Polish: 11. Helpful vote backend 12. Search autocomplete 13. Dashboard analytics 14. i18n polish

Bạn muốn bắt đầu từ đâu? Top 3 ưu tiên cao nhất để cải thiện điểm ngay lập tức là: Fix wishlist toggle, Auto-cancel booking, và Fix payment UI → disable fake methods.
BÁO CÁO TỔNG THỂ — TOURISTA
Thống kê hệ thống
Backend	Frontend
Files
231 Java files
200+ files
Controllers
23 endpoints
35+ pages
Services
26 interfaces + 16 impls
60+ components
Repositories
39 repositories
12 API clients
Những gì ĐÃ LÀM TỐT (vượt trội so với Traveloka/Booking)
AI Chatbot Gemini — Cá nhân hóa theo favorites/bookings/history, tìm booking trong chat (độc nhất)
Dynamic Pricing Engine — Season, weekday, early-bird, last-minute rules
Tour Departures System — Quản lý lịch khởi hành với slots
Brute-force Protection — 5 lần fail = khóa 10 phút, enterprise-level security
P2P Real-time Chat — WebSocket/STOMP với rich content types
Review Helpful Votes — Cộng đồng vote review hữu ích
Email Verification Gate — Bắt buộc verify trước khi login
Review Moderation — Admin approve/reject/reply workflow
Article/Blog CMS — Full content system cho SEO
VNPAY IPN — Server-to-server callback đầy đủ
Những gì CÒN THIẾU (Backend)
Ưu tiên	Tính năng
🔴 Cao
Partner Hotel/Tour CRUD (partners không tạo được listing)
🔴 Cao
Image Upload API (không có upload ảnh)
🔴 Cao
Promotion Redemption API (validate promo khi đặt)
🔴 Cao
Review Responses (partner không trả lời review)
🟡 Trung
MoMo/ZaloPay đầy đủ (chỉ có webhook stub)
🟡 Trung
Password Change API
🟡 Trung
Tour Recommendation API (service tồn tại nhưng không có endpoint)
🟡 Trung
Article Service Impl (chỉ có interface)
Những gì CÒN THIẾU (Frontend)
Ưu tiên	Tính năng
🔴 Cao
Dark Mode toggle
🔴 Cao
Price Calendar (lịch giá theo ngày)
🔴 Cao
Booking Modification UI
🔴 Cao
Partner Revenue Dashboard (biểu đồ doanh thu cho đối tác)
🟡 Trung
Hotel Map Search (Google Maps)
🟡 Trung
AI Travel Planner (nhập ngân sách → itinerary)
🟡 Trung
Admin Analytics Charts (biểu đồ thay vì số)
🟡 Trung
Social Sharing (chia sẻ booking/favorites)
🟡 Trung
Real-time Availability (còn X phòng)
🟡 Trung
Review Responses UI
🟢 Thấp
PWA Mobile App
🟢 Thấp
Multi-language (thêm EN/KO/ZH)
🟢 Thấp
Loyalty/Rewards Points
🟢 Thấp
Push Notifications
🟢 Thấp
Human Agent Chat Transfer
Ý tưởng ĐỘT PHÁ để khiến thầy cô KHOANH NGAY
Price Calendar — Lịch tương tác 30 ngày, giá thay đổi theo ngày (Traveloka premium feature)
Dark Mode — Full toggle, modern UX
Booking Modification — Đổi ngày/phòng sau khi đặt
Partner Revenue Dashboard — Biểu đồ + payout schedule cho đối tác
Review Responses — Đối tác trả lời review công khai
Real-time Availability — "Chỉ còn 2 phòng", "Đang bán nhanh"
Admin Analytics Charts — Revenue trends, booking rates, destination popularity
Social Sharing — Chia sẻ itinerary lên Facebook/Zalo
AI Travel Planner — Nhập ngân sách + sở thích → Gemini tạo itinerary
Loyalty Points — Tích điểm đặt phòng, đổi voucher
Lộ trình ưu tiên
ƯU TIÊN CAO (làm ngay):
├── Dark Mode toggle ✅
├── Price Calendar view ✅
├── Booking Modification ✅
├── Partner Revenue Dashboard ✅
├── Review Responses UI ✅
└── Admin Analytics Charts ✅
ƯU TIÊN TRUNG (cải thiện UX):
├── Hotel Map Search ✅
├── AI Travel Planner ✅
├── Real-time Availability badges ✅
├── Social Sharing buttons ✅
└── MoMo/ZaloPay full integration
ƯU TIÊN THẤP (nâng cao):
├── PWA Mobile App
├── Multi-language (EN/KO/ZH)
├── Loyalty/Rewards Points
├── Push Notifications
└── E2E Playwright Tests
Mở canvas "tourista-final-report" bên cạnh chat để xem báo cáo chi tiết với bảng đầy đủ. Bạn muốn tôi bắt đầu implement tính năng nào trước?