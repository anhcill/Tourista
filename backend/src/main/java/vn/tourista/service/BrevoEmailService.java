package vn.tourista.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

/**
 * Email service using Brevo (Sendinblue) API.
 * Does NOT require domain verification — works with free tier immediately.
 * Free: 300 emails/day.
 */
@Service
@Slf4j
public class BrevoEmailService {

    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.email.from:noreply@tourista.vn}")
    private String fromEmail;

    @Value("${app.email.from-name:Tourista Studio}")
    private String fromName;

    @Value("${app.email.brevo-api-key:}")
    private String brevoApiKey;

    private static final HttpClient HTTP_CLIENT = HttpClient.newHttpClient();

    private boolean sendEmail(String toEmail, String subject, String textContent) {
        if (brevoApiKey == null || brevoApiKey.isBlank()) {
            log.warn("BREVO_API_KEY not configured. Email to {} skipped.", toEmail);
            return false;
        }

        try {
            String jsonBody = """
                {
                    "sender": {"name": "%s", "email": "%s"},
                    "to": [{"email": "%s"}],
                    "subject": "%s",
                    "textContent": "%s"
                }
                """.formatted(
                    escapeJson(fromName),
                    escapeJson(fromEmail),
                    escapeJson(toEmail),
                    escapeJson(subject),
                    escapeJson(textContent)
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BREVO_API_URL))
                    .header("api-key", brevoApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());

            int statusCode = response.statusCode();
            if (statusCode >= 200 && statusCode < 300) {
                log.info("Brevo email sent successfully to {} (status {})", toEmail, statusCode);
                return true;
            } else {
                log.error("Brevo API error {}: {}", statusCode, response.body());
                return false;
            }
        } catch (Exception e) {
            log.error("Failed to send Brevo email to {}: {}", toEmail, e.getMessage());
            return false;
        }
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    // ===================== EMAIL BODY BUILDERS =====================

    private String buildVerificationBody(String verifyLink) {
        return """
            Xin chao!

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
        String verifyLink = frontendUrl + "/verify-email?token=" + token;
        String subject = "Tourista Studio - Xac thuc tai khoan cua ban";
        String body = buildVerificationBody(verifyLink);
        sendEmail(toEmail, subject, body);
    }

    @Async("emailExecutor")
    public void sendPasswordResetEmail(String toEmail, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        String subject = "Tourista Studio - Dat lai mat khau";
        String body = buildPasswordResetBody(resetLink);
        sendEmail(toEmail, subject, body);
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

        String subject = String.format("Tourista Studio - Xac nhan yeu cau dat %s #%s",
                "HOTEL".equals(bookingType) ? "khach san" : "tour", bookingCode);
        String body = buildBookingCreatedBody(bookingCode, bookingType, serviceName, serviceSubtitle,
                checkIn, checkOut, adults, children, roomsOrSlots, totalAmount, currency);
        sendEmail(toEmail, subject, body);
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

        String subject = String.format("Tourista Studio - Thanh toan thanh cong cho %s #%s",
                "HOTEL".equals(bookingType) ? "khach san" : "tour", bookingCode);
        String body = buildBookingConfirmedBody(bookingCode, bookingType, serviceName, serviceSubtitle,
                checkIn, checkOut, adults, children, roomsOrSlots, totalAmount, currency,
                paymentMethod, transactionNo);
        sendEmail(toEmail, subject, body);
    }

    @Async("emailExecutor")
    public void sendBookingCancelledEmail(
            String toEmail,
            String bookingCode,
            String bookingType,
            String serviceName,
            String cancelReason) {

        String subject = String.format("Tourista Studio - Booking #%s da bi huy", bookingCode);
        String body = buildBookingCancelledBody(bookingCode, bookingType, serviceName, cancelReason);
        sendEmail(toEmail, subject, body);
    }
}
