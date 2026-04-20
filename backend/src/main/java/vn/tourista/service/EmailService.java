package vn.tourista.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
public class EmailService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_TIME_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    // ===================== EMAIL XÁC THỰC =====================

    @Async("emailExecutor")
    public void sendVerificationEmail(String toEmail, String token) {
        String verifyLink = frontendUrl + "/verify-email?token=" + token;

        System.out.println("==================================================");
        System.out.println("TESTING: Verification Link: " + verifyLink);
        System.out.println("==================================================");

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Tourista Studio - Xác thực tài khoản của bạn");
            message.setText(buildVerificationEmailBody(verifyLink));
            mailSender.send(message);
            log.info("Verification email sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send verification email to {}: {}", toEmail, e.getMessage());
        }
    }

    // ===================== EMAIL QUÊN MẬT KHẨU =====================

    @Async("emailExecutor")
    public void sendPasswordResetEmail(String toEmail, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Tourista Studio - Đặt lại mật khẩu");
            message.setText(buildPasswordResetEmailBody(resetLink));
            mailSender.send(message);
            log.info("Password reset email sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}: {}", toEmail, e.getMessage());
        }
    }

    // ===================== EMAIL XÁC NHẬN BOOKING TẠO THÀNH CÔNG =====================

    /**
     * Gửi email xác nhận booking mới (trạng thái PENDING).
     * Booking chưa thanh toán, user cần thanh toán trong 30 phút.
     */
    @Async("emailExecutor")
    public void sendBookingCreatedEmail(
            String toEmail,
            String bookingCode,
            String bookingType,
            String serviceName,
            String serviceSubtitle,
            String checkIn,
            String checkOut,
            int adults,
            int children,
            int roomsOrSlots,
            BigDecimal totalAmount,
            String currency) {

        String subject = String.format("Tourista Studio - Xác nhận yêu cầu đặt %s #%s",
                bookingType.equals("HOTEL") ? "khách sạn" : "tour", bookingCode);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(buildBookingCreatedEmailBody(
                    bookingCode, bookingType, serviceName, serviceSubtitle,
                    checkIn, checkOut, adults, children, roomsOrSlots,
                    totalAmount, currency));
            mailSender.send(message);
            log.info("Booking created email sent for {} to {}", bookingCode, toEmail);
        } catch (Exception e) {
            log.error("Failed to send booking created email for {} to {}: {}", bookingCode, toEmail, e.getMessage());
        }
    }

    // ===================== EMAIL THANH TOÁN THÀNH CÔNG =====================

    /**
     * Gửi email thông báo thanh toán thành công (VNPAY/MoMo/ZaloPay).
     * Booking chuyển sang CONFIRMED.
     */
    @Async("emailExecutor")
    public void sendBookingConfirmedEmail(
            String toEmail,
            String bookingCode,
            String bookingType,
            String serviceName,
            String serviceSubtitle,
            String checkIn,
            String checkOut,
            int adults,
            int children,
            int roomsOrSlots,
            BigDecimal totalAmount,
            String currency,
            String paymentMethod,
            String transactionNo) {

        String subject = String.format("Tourista Studio - Thanh toán thành công cho %s #%s",
                bookingType.equals("HOTEL") ? "khách sạn" : "tour", bookingCode);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(buildBookingConfirmedEmailBody(
                    bookingCode, bookingType, serviceName, serviceSubtitle,
                    checkIn, checkOut, adults, children, roomsOrSlots,
                    totalAmount, currency, paymentMethod, transactionNo));
            mailSender.send(message);
            log.info("Booking confirmed email sent for {} to {}", bookingCode, toEmail);
        } catch (Exception e) {
            log.error("Failed to send booking confirmed email for {} to {}: {}", bookingCode, toEmail, e.getMessage());
        }
    }

    // ===================== EMAIL BOOKING BỊ HỦY =====================

    /**
     * Gửi email thông báo booking bị hủy (auto-cancel hoặc user cancel).
     */
    @Async("emailExecutor")
    public void sendBookingCancelledEmail(
            String toEmail,
            String bookingCode,
            String bookingType,
            String serviceName,
            String cancelReason) {

        String subject = String.format("Tourista Studio - Booking #%s đã bị hủy", bookingCode);

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(buildBookingCancelledEmailBody(
                    bookingCode, bookingType, serviceName, cancelReason));
            mailSender.send(message);
            log.info("Booking cancelled email sent for {} to {}", bookingCode, toEmail);
        } catch (Exception e) {
            log.error("Failed to send booking cancelled email for {} to {}: {}", bookingCode, toEmail, e.getMessage());
        }
    }

    // ===================== BODY TEMPLATES =====================

    private String buildVerificationEmailBody(String verifyLink) {
        return """
                Xin chào!

                Cảm ơn bạn đã đăng ký tài khoản Tourista.

                Vui lòng click vào link bên dưới để xác thực email:
                %s

                Link có hiệu lực trong 24 giờ.

                Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.

                Trân trọng,
                Đội ngũ Tourista
                """.formatted(verifyLink);
    }

    private String buildPasswordResetEmailBody(String resetLink) {
        return """
                Bạn đã yêu cầu đặt lại mật khẩu.

                Click vào link bên dưới để tạo mật khẩu mới:
                %s

                Link có hiệu lực trong 1 giờ.

                Nếu bạn không yêu cầu, vui lòng bỏ qua email này.

                Trân trọng,
                Đội ngũ Tourista
                """.formatted(resetLink);
    }

    private String buildBookingCreatedEmailBody(
            String bookingCode, String bookingType, String serviceName, String serviceSubtitle,
            String checkIn, String checkOut, int adults, int children, int roomsOrSlots,
            BigDecimal totalAmount, String currency) {

        StringBuilder guests = new StringBuilder();
        guests.append(adults).append(" người lớn");
        if (children > 0) {
            guests.append(", ").append(children).append(" trẻ em");
        }

        String checkInfo = bookingType.equals("HOTEL")
                ? "Nhận phòng: " + checkIn + "\nTrả phòng: " + checkOut
                : "Ngày khởi hành: " + checkIn;

        String extraInfo = bookingType.equals("HOTEL")
                ? "Số phòng: " + roomsOrSlots
                : "Số chỗ: " + roomsOrSlots;

        return """
                Xin chào,

                Chúng tôi đã nhận được yêu cầu đặt %s của bạn!

                ╔════════════════════════════════════════╗
                ║  MÃ BOOKING: %s
                ╚════════════════════════════════════════╝

                %s: %s
                %s
                Khách: %s
                %s

                TỔNG CỘNG: %s %s

                ⚠️  LƯU Ý QUAN TRỌNG:
                Đơn đặt của bạn hiện đang ở trạng thái CHỜ THANH TOÁN.
                Vui lòng thanh toán trong vòng 30 phút để xác nhận đặt phòng.
                Nếu không thanh toán kịp thời, hệ thống sẽ tự động hủy đơn.

                Theo dõi trạng thái booking tại: %s/profile/bookings

                Cảm ơn bạn đã sử dụng dịch vụ Tourista!

                Trân trọng,
                Đội ngũ Tourista
                """.formatted(
                bookingType.equals("HOTEL") ? "khách sạn" : "tour",
                bookingCode,
                bookingType.equals("HOTEL") ? "Khách sạn" : "Tour", serviceName,
                serviceSubtitle,
                guests,
                extraInfo,
                checkInfo,
                totalAmount.toPlainString(), currency,
                frontendUrl);
    }

    private String buildBookingConfirmedEmailBody(
            String bookingCode, String bookingType, String serviceName, String serviceSubtitle,
            String checkIn, String checkOut, int adults, int children, int roomsOrSlots,
            BigDecimal totalAmount, String currency, String paymentMethod, String transactionNo) {

        String checkInfo = bookingType.equals("HOTEL")
                ? "Nhận phòng: " + checkIn + "\nTrả phòng: " + checkOut
                : "Ngày khởi hành: " + checkIn;

        String extraInfo = bookingType.equals("HOTEL")
                ? "Số phòng: " + roomsOrSlots
                : "Số chỗ: " + roomsOrSlots;

        String guestInfo = adults + " người lớn" + (children > 0 ? ", " + children + " trẻ em" : "");

        return """
                Xin chào,

                🎉 Thanh toán của bạn đã được xác nhận thành công!

                ╔════════════════════════════════════════╗
                ║  MÃ BOOKING: %s
                ║  TRẠNG THÁI: ✅ ĐÃ XÁC NHẬN
                ╚════════════════════════════════════════╝

                %s: %s
                %s
                Khách: %s
                %s

                TỔNG CỘNG: %s %s
                PHƯƠNG THỨC: %s
                MÃ GIAO DỊCH: %s

                Vui lòng giữ mã booking này để đối chiếu khi nhận phòng / khởi hành.

                Theo dõi booking: %s/profile/bookings

                Cảm ơn bạn đã đặt %s qua Tourista!

                Trân trọng,
                Đội ngũ Tourista
                """.formatted(
                bookingCode,
                bookingType.equals("HOTEL") ? "Khách sạn" : "Tour", serviceName,
                serviceSubtitle,
                guestInfo,
                extraInfo,
                checkInfo,
                totalAmount.toPlainString(), currency,
                paymentMethod, transactionNo,
                frontendUrl,
                bookingType.equals("HOTEL") ? "khách sạn" : "tour");
    }

    private String buildBookingCancelledEmailBody(
            String bookingCode, String bookingType, String serviceName, String cancelReason) {

        return """
                Xin chào,

                Booking #%s (%s: %s) đã bị HỦY.

                Lý do: %s

                Nếu bạn đã thanh toán, vui lòng liên hệ bộ phận hỗ trợ để được hoàn tiền.

                Đặt lại booking mới: %s/hotels (khách sạn) hoặc %s/tours (tour)

                Trân trọng,
                Đội ngũ Tourista
                """.formatted(bookingCode,
                bookingType.equals("HOTEL") ? "Khách sạn" : "Tour", serviceName,
                cancelReason != null && !cancelReason.isBlank() ? cancelReason : "Không xác định",
                frontendUrl, frontendUrl);
    }
}
