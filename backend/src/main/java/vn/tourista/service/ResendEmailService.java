package vn.tourista.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Email service using Resend API (works on Railway without SMTP blocked).
 * Resend: free 100 emails/day, no SMTP port needed.
 */
@Service
@Slf4j
public class ResendEmailService {

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.email.from:noreply@tourista.vn}")
    private String fromEmail;

    @Value("${app.email.resend-api-key:}")
    private String resendApiKey;

    private Resend getResendClient() {
        if (resendApiKey == null || resendApiKey.isBlank()) {
            log.warn("RESEND_API_KEY not configured. Emails will be skipped.");
            return null;
        }
        return new Resend(resendApiKey);
    }

    private String buildVerificationBody(String verifyLink) {
        return """
            Xin chào!

            Cam on ban da dang ky tai khoan Tourista.

            Vui long click vao link ben duoi de xac thuc email:
            %s

            Link co hieu luc trong 24 gio.

            Neu ban khong dang ky tai khoan nay, vui long bo qua email nay.

            Tran trong,
            Doi ngu Tourista
            """.formatted(verifyLink);
    }

    private String buildPasswordResetBody(String resetLink) {
        return """
            Ban da yeu cau dat lai mat khau.

            Click vao link ben duoi de tao mat khau moi:
            %s

            Link co hieu luc trong 1 gio.

            Neu ban khong yeu cau, vui long bo qua email nay.

            Tran trong,
            Doi ngu Tourista
            """.formatted(resetLink);
    }

    private String buildBookingCreatedBody(
            String bookingCode, String bookingType, String serviceName, String serviceSubtitle,
            String checkIn, String checkOut, int adults, int children, int roomsOrSlots,
            BigDecimal totalAmount, String currency) {

        String guests = adults + " nguoi lon" + (children > 0 ? ", " + children + " tre em" : "");
        String checkInfo = "HOTEL".equals(bookingType)
                ? "Nhan phong: " + checkIn + "\nTra phong: " + checkOut
                : "Ngay khoi hanh: " + checkIn;
        String extraInfo = "HOTEL".equals(bookingType)
                ? "So phong: " + roomsOrSlots
                : "So cho: " + roomsOrSlots;
        String serviceLabel = "HOTEL".equals(bookingType) ? "khach san" : "tour";

        return String.format("""
            Xin chao,

            Chung toi da nhan duoc yeu cau dat %s cua ban!

            MA BOOKING: %s

            %s: %s
            %s
            Khach: %s
            %s

            TONG CONG: %s %s

            LUU Y: Don dat cua ban hien dang o trang thai CHO THANH TOAN.
            Vui long thanh toan trong vong 30 phut de xac nhan dat phong.
            Neu khong thanh toan kip thoi, he thong se tu dong huy don.

            Theo doi trang thai booking tai: %s/profile/bookings

            Cam on ban da su dung dich vu Tourista!

            Tran trong,
            Doi ngu Tourista
            """,
            serviceLabel,
            bookingCode,
            "HOTEL".equals(bookingType) ? "Khach san" : "Tour", serviceName,
            serviceSubtitle,
            guests,
            extraInfo,
            checkInfo,
            totalAmount.toPlainString(), currency,
            frontendUrl);
    }

    private String buildBookingConfirmedBody(
            String bookingCode, String bookingType, String serviceName, String serviceSubtitle,
            String checkIn, String checkOut, int adults, int children, int roomsOrSlots,
            BigDecimal totalAmount, String currency, String paymentMethod, String transactionNo) {

        String guestInfo = adults + " nguoi lon" + (children > 0 ? ", " + children + " tre em" : "");
        String checkInfo = "HOTEL".equals(bookingType)
                ? "Nhan phong: " + checkIn + "\nTra phong: " + checkOut
                : "Ngay khoi hanh: " + checkIn;
        String extraInfo = "HOTEL".equals(bookingType)
                ? "So phong: " + roomsOrSlots
                : "So cho: " + roomsOrSlots;
        String serviceLabel = "HOTEL".equals(bookingType) ? "khach san" : "tour";

        return String.format("""
            Xin chao,

            Thanh toan cua ban da duoc xac nhan thanh cong!

            MA BOOKING: %s
            TRANG THAI: DA XAC NHAN

            %s: %s
            %s
            Khach: %s
            %s

            TONG CONG: %s %s
            PHUONG THUC: %s
            MA GIAO DICH: %s

            Vui long giu ma booking nay de doi chieu khi nhan phong / khoi hanh.

            Theo doi booking tai: %s/profile/bookings

            Cam on ban da dat %s qua Tourista!

            Tran trong,
            Doi ngu Tourista
            """,
            bookingCode,
            "HOTEL".equals(bookingType) ? "Khach san" : "Tour", serviceName,
            serviceSubtitle,
            guestInfo,
            extraInfo,
            checkInfo,
            totalAmount.toPlainString(), currency,
            paymentMethod, transactionNo,
            frontendUrl,
            serviceLabel);
    }

    private String buildBookingCancelledBody(
            String bookingCode, String bookingType, String serviceName, String cancelReason) {

        String serviceLabel = "HOTEL".equals(bookingType) ? "Khach san" : "Tour";

        return String.format("""
            Xin chao,

            Booking #%s (%s: %s) da bi HUY.

            Ly do: %s

            Neu ban da thanh toan, vui long lien he bo phan ho tro de duoc hoan tien.

            Dat lai booking moi tai: %s/hotels (khach san) hoac %s/tours (tour)

            Tran trong,
            Doi ngu Tourista
            """,
            bookingCode,
            serviceLabel, serviceName,
            cancelReason != null && !cancelReason.isBlank() ? cancelReason : "Khong xac dinh",
            frontendUrl, frontendUrl);
    }

    // ===================== PUBLIC SEND METHODS =====================

    @Async("emailExecutor")
    public void sendVerificationEmail(String toEmail, String token) {
        Resend resend = getResendClient();
        if (resend == null) {
            log.info("[RESEND-STUB] Verification email would be sent to {} with link: {}/verify-email?token={}", toEmail, frontendUrl, token);
            return;
        }

        try {
            String verifyLink = frontendUrl + "/verify-email?token=" + token;
            CreateEmailOptions email = CreateEmailOptions.builder()
                    .from(fromEmail)
                    .to(toEmail)
                    .subject("Tourista Studio - Xac thuc tai khoan cua ban")
                    .text(buildVerificationBody(verifyLink))
                    .build();
            resend.emails().send(email);
            log.info("Verification email sent via Resend to {}", toEmail);
        } catch (ResendException e) {
            log.error("Failed to send verification email via Resend to {}: {}", toEmail, e.getMessage());
        }
    }

    @Async("emailExecutor")
    public void sendPasswordResetEmail(String toEmail, String token) {
        Resend resend = getResendClient();
        if (resend == null) {
            log.info("[RESEND-STUB] Password reset email would be sent to {} with link: {}/reset-password?token={}", toEmail, frontendUrl, token);
            return;
        }

        try {
            String resetLink = frontendUrl + "/reset-password?token=" + token;
            CreateEmailOptions email = CreateEmailOptions.builder()
                    .from(fromEmail)
                    .to(toEmail)
                    .subject("Tourista Studio - Dat lai mat khau")
                    .text(buildPasswordResetBody(resetLink))
                    .build();
            resend.emails().send(email);
            log.info("Password reset email sent via Resend to {}", toEmail);
        } catch (ResendException e) {
            log.error("Failed to send password reset email via Resend to {}: {}", toEmail, e.getMessage());
        }
    }

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

        Resend resend = getResendClient();
        if (resend == null) {
            log.info("[RESEND-STUB] Booking created email for {}", bookingCode);
            return;
        }

        try {
            String subject = String.format("Tourista Studio - Xac nhan yeu cau dat %s #%s",
                    "HOTEL".equals(bookingType) ? "khach san" : "tour", bookingCode);
            CreateEmailOptions email = CreateEmailOptions.builder()
                    .from(fromEmail)
                    .to(toEmail)
                    .subject(subject)
                    .text(buildBookingCreatedBody(bookingCode, bookingType, serviceName, serviceSubtitle,
                            checkIn, checkOut, adults, children, roomsOrSlots, totalAmount, currency))
                    .build();
            resend.emails().send(email);
            log.info("Booking created email sent via Resend for {} to {}", bookingCode, toEmail);
        } catch (ResendException e) {
            log.error("Failed to send booking created email via Resend for {} to {}: {}", bookingCode, toEmail, e.getMessage());
        }
    }

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

        Resend resend = getResendClient();
        if (resend == null) {
            log.info("[RESEND-STUB] Booking confirmed email for {}", bookingCode);
            return;
        }

        try {
            String subject = String.format("Tourista Studio - Thanh toan thanh cong cho %s #%s",
                    "HOTEL".equals(bookingType) ? "khach san" : "tour", bookingCode);
            CreateEmailOptions email = CreateEmailOptions.builder()
                    .from(fromEmail)
                    .to(toEmail)
                    .subject(subject)
                    .text(buildBookingConfirmedBody(bookingCode, bookingType, serviceName, serviceSubtitle,
                            checkIn, checkOut, adults, children, roomsOrSlots, totalAmount, currency,
                            paymentMethod, transactionNo))
                    .build();
            resend.emails().send(email);
            log.info("Booking confirmed email sent via Resend for {} to {}", bookingCode, toEmail);
        } catch (ResendException e) {
            log.error("Failed to send booking confirmed email via Resend for {} to {}: {}", bookingCode, toEmail, e.getMessage());
        }
    }

    @Async("emailExecutor")
    public void sendBookingCancelledEmail(
            String toEmail,
            String bookingCode,
            String bookingType,
            String serviceName,
            String cancelReason) {

        Resend resend = getResendClient();
        if (resend == null) {
            log.info("[RESEND-STUB] Booking cancelled email for {}", bookingCode);
            return;
        }

        try {
            String subject = String.format("Tourista Studio - Booking #%s da bi huy", bookingCode);
            CreateEmailOptions email = CreateEmailOptions.builder()
                    .from(fromEmail)
                    .to(toEmail)
                    .subject(subject)
                    .text(buildBookingCancelledBody(bookingCode, bookingType, serviceName, cancelReason))
                    .build();
            resend.emails().send(email);
            log.info("Booking cancelled email sent via Resend for {} to {}", bookingCode, toEmail);
        } catch (ResendException e) {
            log.error("Failed to send booking cancelled email via Resend for {} to {}: {}", bookingCode, toEmail, e.getMessage());
        }
    }
}
