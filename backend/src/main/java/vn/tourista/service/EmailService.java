package vn.tourista.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

/**
 * Email service using SMTP (fallback khi không dùng Brevo).
 * Chủ yếu dùng BrevoEmailService — class này giữ nguyên để tương thích.
 */
@Service
@Slf4j
public class EmailService {

    @Autowired private JavaMailSender mailSender;

    @Value("${app.frontend-url}") private String frontendUrl;
    @Value("${spring.mail.username:}") private String fromEmail;

    // ==================== 1. XÁC THỰC ====================
    @Async("emailExecutor")
    public void sendVerificationEmail(String toEmail, String token) {
        String link = frontendUrl + "/verify-email?token=" + token;
        try {
            SimpleMailMessage m = new SimpleMailMessage();
            m.setFrom(fromEmail); m.setTo(toEmail);
            m.setSubject("Tourista Studio - Xác thực tài khoản của bạn");
            m.setText("Xin chào!\n\nVui lòng nhấn link để xác thực email:\n" + link +
                    "\n\nLink có hiệu lực 24h.\nNếu không đăng ký, hãy bỏ qua.\n\nTrân trọng,\nTourista Studio");
            mailSender.send(m);
        } catch (Exception e) { log.error("Failed to send verification email: {}", e.getMessage()); }
    }

    // ==================== 2. CHÀO MỪNG ====================
    @Async("emailExecutor")
    public void sendWelcomeEmail(String toEmail, String userName) {
        try {
            SimpleMailMessage m = new SimpleMailMessage();
            m.setFrom(fromEmail); m.setTo(toEmail);
            m.setSubject("Chào mừng bạn đến với Tourista Studio!");
            m.setText("Xin chào" + (userName != null && !userName.isBlank() ? ", " + userName : "") + "!\n\n" +
                    "Chúc mừng bạn đã xác thực thành công! Tài khoản Tourista Studio đã sẵn sàng.\n\n" +
                    "Bạn được giảm 10%% cho đặt phòng đầu tiên. Mã: WELCOME10\n\n" +
                    "Khám phá ngay: " + frontendUrl + "/hotels\n\nTrân trọng,\nTourista Studio");
            mailSender.send(m);
        } catch (Exception e) { log.error("Failed to send welcome email: {}", e.getMessage()); }
    }

    // ==================== 3. ĐẶT LẠI MẬT KHẨU ====================
    @Async("emailExecutor")
    public void sendPasswordResetEmail(String toEmail, String token) {
        String link = frontendUrl + "/reset-password?token=" + token;
        try {
            SimpleMailMessage m = new SimpleMailMessage();
            m.setFrom(fromEmail); m.setTo(toEmail);
            m.setSubject("Tourista Studio - Đặt lại mật khẩu");
            m.setText("Bạn đã yêu cầu đặt lại mật khẩu.\n\nNhấn link để tạo mật khẩu mới:\n" + link +
                    "\n\nLink có hiệu lực 1 giờ.\nNếu không yêu cầu, hãy bỏ qua.\n\nTrân trọng,\nTourista Studio");
            mailSender.send(m);
        } catch (Exception e) { log.error("Failed to send password reset email: {}", e.getMessage()); }
    }

    // ==================== 4. BOOKING TẠO ====================
    @Async("emailExecutor")
    public void sendBookingCreatedEmail(String toEmail, String bookingCode, String bookingType,
            String serviceName, String serviceSubtitle, String checkIn, String checkOut,
            int adults, int children, int roomsOrSlots, BigDecimal totalAmount, String currency) {
        try {
            String guest = adults + " nguoi lon" + (children > 0 ? ", " + children + " tre em" : "");
            String date = "HOTEL".equals(bookingType) ? "Nhan phong: " + checkIn + "\nTra phong: " + checkOut : "Khoi hanh: " + checkIn;
            String room = "HOTEL".equals(bookingType) ? "So phong: " + roomsOrSlots : "So cho: " + roomsOrSlots;
            String type = "HOTEL".equals(bookingType) ? "khach san" : "tour";
            SimpleMailMessage m = new SimpleMailMessage();
            m.setFrom(fromEmail); m.setTo(toEmail);
            m.setSubject("Tourista Studio - Xac nhan yeu cau dat " + type + " #" + bookingCode);
            m.setText("Xin chao,\n\nChung toi da nhan yeu cau dat " + type + " cua ban!\n\n" +
                    "MA BOOKING: " + bookingCode + "\n" +
                    ("HOTEL".equals(bookingType) ? "Khach san" : "Tour") + ": " + serviceName + "\n" + serviceSubtitle + "\n" +
                    "Khach: " + guest + "\n" + room + "\n" + date + "\n\n" +
                    "TONG CONG: " + totalAmount.toPlainString() + " " + currency + "\n\n" +
                    "LUU Y: Vui long thanh toan trong 30 phut de xac nhan.\n\n" +
                    "Theo doi: " + frontendUrl + "/profile/bookings\n\nCam on,\nTourista Studio");
            mailSender.send(m);
        } catch (Exception e) { log.error("Failed to send booking created email: {}", e.getMessage()); }
    }

    // ==================== 5. THANH TOÁN THÀNH CÔNG ====================
    @Async("emailExecutor")
    public void sendBookingConfirmedEmail(String toEmail, String bookingCode, String bookingType,
            String serviceName, String serviceSubtitle, String checkIn, String checkOut,
            int adults, int children, int roomsOrSlots, BigDecimal totalAmount, String currency,
            String paymentMethod, String transactionNo) {
        try {
            String guest = adults + " nguoi lon" + (children > 0 ? ", " + children + " tre em" : "");
            String date = "HOTEL".equals(bookingType) ? "Nhan phong: " + checkIn + "\nTra phong: " + checkOut : "Khoi hanh: " + checkIn;
            String type = "HOTEL".equals(bookingType) ? "khach san" : "tour";
            SimpleMailMessage m = new SimpleMailMessage();
            m.setFrom(fromEmail); m.setTo(toEmail);
            m.setSubject("Tourista Studio - Thanh toan thanh cong cho " + type + " #" + bookingCode);
            m.setText("Xin chao,\n\nThanh toan da xac nhan thanh cong!\n\n" +
                    "MA BOOKING: " + bookingCode + "\n" +
                    ("HOTEL".equals(bookingType) ? "Khach san" : "Tour") + ": " + serviceName + "\n" + serviceSubtitle + "\n" +
                    "Khach: " + guest + "\n" + date + "\n\n" +
                    "TONG CONG: " + totalAmount.toPlainString() + " " + currency + "\n" +
                    "PHUONG THUC: " + paymentMethod + "\n" +
                    "MA GIAO DICH: " + transactionNo + "\n\n" +
                    "Vui long giu ma booking de doi chieu.\n\n" +
                    "Theo doi: " + frontendUrl + "/profile/bookings\n\nCam on,\nTourista Studio");
            mailSender.send(m);
        } catch (Exception e) { log.error("Failed to send booking confirmed email: {}", e.getMessage()); }
    }

    // ==================== 6. HỦY BOOKING ====================
    @Async("emailExecutor")
    public void sendBookingCancelledEmail(String toEmail, String bookingCode,
            String bookingType, String serviceName, String cancelReason) {
        try {
            String type = "HOTEL".equals(bookingType) ? "khach san" : "tour";
            SimpleMailMessage m = new SimpleMailMessage();
            m.setFrom(fromEmail); m.setTo(toEmail);
            m.setSubject("Tourista Studio - Booking #" + bookingCode + " da bi huy");
            m.setText("Xin chao,\n\nBooking #" + bookingCode + " (" + type + ": " + serviceName + ") da bi huy.\n\n" +
                    "Ly do: " + (cancelReason != null ? cancelReason : "Khong xac dinh") + "\n\n" +
                    "Neu da thanh toan, lien he hotro@tourista.vn de duoc hoan tien.\n\n" +
                    "Dat lai: " + frontendUrl + "/hotels\n\nTran trong,\nTourista Studio");
            mailSender.send(m);
        } catch (Exception e) { log.error("Failed to send booking cancelled email: {}", e.getMessage()); }
    }

    // ==================== 7. NHẮC TRƯỚC CHECK-IN ====================
    @Async("emailExecutor")
    public void sendReminderEmail(String toEmail, String bookingCode, String bookingType,
            String serviceName, String serviceSubtitle, String checkIn, String checkOut,
            int adults, int children, int roomsOrSlots, BigDecimal totalAmount, String currency) {
        try {
            String guest = adults + " nguoi lon" + (children > 0 ? ", " + children + " tre em" : "");
            String date = "HOTEL".equals(bookingType) ? "Nhan phong: " + checkIn + "\nTra phong: " + checkOut : "Khoi hanh: " + checkIn;
            String action = "HOTEL".equals(bookingType) ? "Nhan phong" : "Khoi hanh";
            SimpleMailMessage m = new SimpleMailMessage();
            m.setFrom(fromEmail); m.setTo(toEmail);
            m.setSubject("Tourista Studio - Nhac nho: " + action + " vao ngay mai!");
            m.setText("Xin chao,\n\nChuyen di cua ban se bat dau vao ngay mai!\n\n" +
                    "MA BOOKING: " + bookingCode + "\n" +
                    ("HOTEL".equals(bookingType) ? "Khach san" : "Tour") + ": " + serviceName + "\n" + serviceSubtitle + "\n" +
                    guest + "\n" + date + "\n\n" +
                    "Vui long mang theo CMND/CCCD va ma booking #" + bookingCode + ".\n\n" +
                    "Hotline: 028 1234 5678\n\nTran trong,\nTourista Studio");
            mailSender.send(m);
        } catch (Exception e) { log.error("Failed to send reminder email: {}", e.getMessage()); }
    }

    // ==================== 8. CẢM ƠN SAU CHUYẾN ĐI ====================
    @Async("emailExecutor")
    public void sendThankYouEmail(String toEmail, String bookingCode, String bookingType,
            String serviceName, String checkIn, String checkOut,
            int adults, int children, BigDecimal totalAmount, String currency) {
        try {
            SimpleMailMessage m = new SimpleMailMessage();
            m.setFrom(fromEmail); m.setTo(toEmail);
            m.setSubject("Tourista Studio - Cam on ban da dong hanh cung chung toi!");
            m.setText("Xin chao,\n\nCam on ban da su dung Tourista Studio!\n\n" +
                    "MA BOOKING: " + bookingCode + "\n" +
                    ("HOTEL".equals(bookingType) ? "Khach san" : "Tour") + ": " + serviceName + "\n" +
                    ("HOTEL".equals(bookingType) ? "Nhan phong: " + checkIn + "\nTra phong: " + checkOut : "Khoi hanh: " + checkIn) + "\n\n" +
                    "Chung toi mong muon duoc dong hanh cung ban trong chuyen di tiep theo!\n\n" +
                    "Uu dai 8%% cho dat tiep theo. Ma: BACK5\n\n" +
                    "Dat lai: " + frontendUrl + "/hotels\n\nTran trong,\nTourista Studio");
            mailSender.send(m);
        } catch (Exception e) { log.error("Failed to send thank you email: {}", e.getMessage()); }
    }

    // ==================== 9. KHUYẾN MÃI ====================
    @Async("emailExecutor")
    public void sendPromotionEmail(List<String> recipients, String subject,
            String title, String subtitle, String body, String ctaLink, String ctaText) {
        log.info("SMTP promotion email not implemented (use BrevoEmailService)");
    }
}
