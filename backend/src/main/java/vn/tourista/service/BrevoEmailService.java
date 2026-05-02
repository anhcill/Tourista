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
import java.time.LocalDate;
import java.util.List;

/**
 * Email service using Brevo (Sendinblue) API.
 * All emails use rich HTML templates with Vietnamese content.
 * Free: 300 emails/day — no domain verification required.
 */
@Service
@Slf4j
public class BrevoEmailService {

    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${app.email.from:noreply@tourista.vn}")
    private String fromEmail;

    @Value("${app.email.from-name:Tourista Studio}")
    private String fromName;

    @Value("${app.email.brevo-api-key:}")
    private String brevoApiKey;

    // ==================== CORE SEND METHOD ====================

    private boolean sendHtmlEmail(String toEmail, String subject, String htmlContent) {
        if (brevoApiKey == null || brevoApiKey.isBlank()) {
            log.warn("BREVO_API_KEY not configured. Email to {} skipped.", toEmail);
            return false;
        }

        try {
            String jsonBody = String.format("""
                {
                    "sender": {"name": "%s", "email": "%s"},
                    "to": [{"email": "%s"}],
                    "subject": "%s",
                    "htmlContent": "%s"
                }
                """,
                escapeJson(fromName),
                escapeJson(fromEmail),
                escapeJson(toEmail),
                escapeJson(subject),
                escapeJson(htmlContent)
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BREVO_API_URL))
                    .header("api-key", brevoApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();

            if (status >= 200 && status < 300) {
                log.info("Email sent to {} successfully (status {})", toEmail, status);
                return true;
            } else {
                log.error("Brevo API error {}: {}", status, response.body());
                return false;
            }
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
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

    // ==================== HTML TEMPLATE BASE ====================

    private String baseTemplate(String title, String content, String ctaLink, String ctaText) {
        String cta = ctaLink != null && ctaText != null
                ? String.format("""
                    <tr>
                        <td style="padding: 30px 0; text-align: center;">
                            <a href="%s" style="display: inline-block; background: #FF6B35; color: #fff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">%s</a>
                        </td>
                    </tr>
                    """, ctaLink, ctaText) : "";

        return String.format("""
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>%s</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Segoe UI', Arial, sans-serif;">
                <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 30px 15px;">
                    <tr>
                        <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">

                                <!-- HEADER -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #FF6B35, #FF8F5C); padding: 30px 40px; text-align: center;">
                                        <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 700;">🏨 Tourista Studio</h1>
                                        <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Du lịch trải nghiệm — Đặt phòng thông minh</p>
                                    </td>
                                </tr>

                                <!-- CONTENT -->
                                <tr>
                                    <td style="padding: 35px 40px;">
                                        %s
                                    </td>
                                </tr>

                                <!-- CTA BUTTON -->
                                %s

                                <!-- FOOTER -->
                                <tr>
                                    <td style="background-color: #f8f8f8; padding: 25px 40px; text-align: center; border-top: 1px solid #eee;">
                                        <p style="margin: 0 0 6px; color: #888; font-size: 13px;">📧 %s</p>
                                        <p style="margin: 0 0 6px; color: #888; font-size: 13px;">📞 028 1234 5678</p>
                                        <p style="margin: 0; color: #aaa; font-size: 12px;">© %d Tourista Studio. Mọi quyền được bảo lưu.</p>
                                    </td>
                                </tr>

                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """,
            escapeHtml(title),
            content,
            cta,
            fromEmail,
            LocalDate.now().getYear()
        );
    }

    private String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private String highlightBox(String title, String content, String bgColor) {
        return String.format("""
            <table width="100%%" cellpadding="0" cellspacing="0" style="margin: 20px 0; background: %s; border-radius: 10px; overflow: hidden;">
                <tr>
                    <td style="padding: 20px 25px;">
                        <p style="margin: 0 0 8px; color: %s; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">%s</p>
                        %s
                    </td>
                </tr>
            </table>
            """, bgColor, "#333", title, content);
    }

    // ==================== 1. EMAIL XÁC THỰC TÀI KHOẢN ====================

    @Async("emailExecutor")
    public void sendVerificationEmail(String toEmail, String token) {
        String verifyLink = frontendUrl + "/verify-email?token=" + token;
        String subject = "Tourista Studio — Xác thực tài khoản của bạn";

        String content = String.format("""
            <h2 style="margin: 0 0 20px; color: #333; font-size: 24px;">Xin chào!</h2>
            <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.7;">
                Cảm ơn bạn đã đăng ký <strong>Tourista Studio</strong> — nền tảng đặt phòng khách sạn và tour du lịch hàng đầu Việt Nam.
            </p>
            <p style="margin: 0 0 25px; color: #555; font-size: 15px; line-height: 1.7;">
                Vui lòng nhấn nút bên dưới để <strong>xác thực email</strong> và kích hoạt tài khoản của bạn.
            </p>
            %s
            <p style="margin: 20px 0 0; color: #888; font-size: 13px; line-height: 1.6;">
                Link có hiệu lực trong <strong>24 giờ</strong>.<br>
                Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email — tài khoản sẽ không được tạo.
            </p>
            """,
            highlightBox("⏰ Thời hạn xác thực", "<p style=\"margin:0; color:#555; font-size:14px;\">Link hết hạn sau <strong>24 giờ</strong> kể từ khi nhận email này.</p>", "#FFF8F4")
        );

        sendHtmlEmail(toEmail, subject, baseTemplate(subject, content, verifyLink, "Xác thực email ngay"));
    }

    // ==================== 2. EMAIL CHÀO MỪNG (sau khi verify) ====================

    @Async("emailExecutor")
    public void sendWelcomeEmail(String toEmail, String userName) {
        String subject = "Chào mừng bạn đến với Tourista Studio! 🎉";

        String content = String.format("""
            <h2 style="margin: 0 0 20px; color: #333; font-size: 24px;">Xin chào%s!</h2>
            <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.7;">
                Chúc mừng bạn đã xác thực thành công! Tài khoản của bạn đã được kích hoạt và sẵn sàng sử dụng.
            </p>
            <p style="margin: 0 0 25px; color: #555; font-size: 15px; line-height: 1.7;">
                <strong>Tourista Studio</strong> mang đến cho bạn:
            </p>
            <ul style="margin: 0 0 25px; padding-left: 20px; color: #555; font-size: 15px; line-height: 2;">
                <li>🏨 <strong>Hơn 500+ khách sạn</strong> tại 63 tỉnh thành Việt Nam</li>
                <li>🚌 <strong>Tour du lịch</strong> đa dạng từ budget đến premium</li>
                <li>💳 <strong>Thanh toán dễ dàng</strong> qua VNPay, MoMo, ZaloPay</li>
                <li>🔒 <strong>Bảo mật tuyệt đối</strong> — hoàn tiền nếu hủy đúng chính sách</li>
                <li>📱 <strong>Hỗ trợ 24/7</strong> qua chat và hotline</li>
            </ul>
            %s
            """,
            userName != null && !userName.isBlank() ? ", " + escapeHtml(userName) : "",
            highlightBox("🎁 Ưu đãi dành cho bạn", "<p style=\"margin:0; color:#555; font-size:14px;\">Giảm <strong>10%%</strong> cho đặt phòng đầu tiên. Sử dụng mã: <strong style=\"color:#FF6B35;\">WELCOME10</strong></p>", "#F0FFF4")
        );

        sendHtmlEmail(toEmail, subject,
            baseTemplate(subject, content, frontendUrl + "/hotels", "Khám phá ngay"));
    }

    // ==================== 3. EMAIL ĐẶT LẠI MẬT KHẨU ====================

    @Async("emailExecutor")
    public void sendPasswordResetEmail(String toEmail, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        String subject = "Tourista Studio — Đặt lại mật khẩu của bạn";

        String content = String.format("""
            <h2 style="margin: 0 0 20px; color: #333; font-size: 24px;">Yêu cầu đặt lại mật khẩu</h2>
            <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.7;">
                Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>Tourista Studio</strong> của bạn.
            </p>
            <p style="margin: 0 0 25px; color: #555; font-size: 15px; line-height: 1.7;">
                Nhấn nút bên dưới để tạo mật khẩu mới. Sau khi đặt lại, mật khẩu cũ sẽ không còn hoạt động.
            </p>
            %s
            <p style="margin: 20px 0 0; color: #e74c3c; font-size: 13px; line-height: 1.6;">
                ⚠️ <strong>Bảo mật:</strong> Nếu bạn không yêu cầu đặt lại mật khẩu, có thể ai đó đang cố truy cập tài khoản của bạn. Vui lòng bỏ qua email này hoặc liên hệ hỗ trợ ngay.
            </p>
            """,
            highlightBox("⏰ Link có hiệu lực trong", "<p style=\"margin:0; color:#555; font-size:14px;\"><strong>1 giờ</strong> kể từ khi nhận email này. Sau đó, bạn cần yêu cầu lại.</p>", "#FFF8F4")
        );

        sendHtmlEmail(toEmail, subject, baseTemplate(subject, content, resetLink, "Đặt lại mật khẩu"));
    }

    // ==================== 4. EMAIL XÁC NHẬN BOOKING (chờ thanh toán) ====================

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

        String subject = String.format("Tourista Studio — Yêu cầu đặt %s #%s (Chờ thanh toán)",
                "HOTEL".equals(bookingType) ? "khách sạn" : "tour", bookingCode);

        String guestInfo = adults + " người lớn" + (children > 0 ? ", " + children + " trẻ em" : "");
        String dateInfo = "HOTEL".equals(bookingType)
                ? ("<strong>Nhận phòng:</strong> " + checkIn + "<br><strong>Trả phòng:</strong> " + checkOut)
                : ("<strong>Khởi hành:</strong> " + checkIn);
        String roomInfo = "HOTEL".equals(bookingType)
                ? ("<strong>Phòng:</strong> " + serviceSubtitle + "<br><strong>Số phòng:</strong> " + roomsOrSlots)
                : ("<strong>Số chỗ:</strong> " + roomsOrSlots);
        String serviceLabel = "HOTEL".equals(bookingType) ? "khách sạn" : "tour";

        String content = String.format("""
            <h2 style="margin: 0 0 20px; color: #333; font-size: 24px;">Yêu cầu đặt %s đã được tiếp nhận!</h2>
            <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.7;">
                Cảm ơn bạn đã đặt qua <strong>Tourista Studio</strong>. Chúng tôi đã tiếp nhận yêu cầu của bạn và đang chờ thanh toán để xác nhận.
            </p>
            %s
            %s
            %s
            %s
            %s
            %s
            <p style="margin: 25px 0 0; color: #e74c3c; font-size: 14px; line-height: 1.7; background: #fff3f3; border-left: 4px solid #e74c3c; padding: 15px 20px; border-radius: 6px;">
                ⏰ <strong>Lưu ý:</strong> Vui lòng thanh toán trong vòng <strong>15 phút</strong> để xác nhận đặt phòng. Quá thời hạn, hệ thống sẽ tự động hủy đơn.
            </p>
            <p style="margin: 15px 0 0; color: #666; font-size: 13px; line-height: 1.7;">
                Hiện tại đơn của bạn đang ở trạng thái <strong style="color:#f59e0b">CHỜ THANH TOÁN</strong>. Đơn sẽ được xác nhận ngay khi thanh toán thành công qua VNPay.
            </p>
            """,
            serviceLabel,
            highlightBox("📋 Mã booking", "<p style=\"margin:0; font-size:20px; font-weight:700; color:#FF6B35; letter-spacing:1px;\">" + bookingCode + "</p>", "#FFF8F4"),
            highlightBox("🏨 " + ("HOTEL".equals(bookingType) ? "Khách sạn" : "Tour"),
                "<p style=\"margin:0; color:#333; font-size:15px; font-weight:600;\">" + serviceName + "</p><p style=\"margin:4px 0 0; color:#777; font-size:13px;\">" + serviceSubtitle + "</p>", "#f9f9f9"),
            highlightBox("📅 Thông tin ngày", "<p style=\"margin:0; color:#333; font-size:14px; line-height:1.8;\">" + dateInfo + "</p>", "#f9f9f9"),
            highlightBox("👥 Số khách", "<p style=\"margin:0; color:#333; font-size:14px;\">" + guestInfo + "</p>", "#f9f9f9"),
            highlightBox("🚪 " + ("HOTEL".equals(bookingType) ? "Phòng" : "Chỗ"),
                "<p style=\"margin:0; color:#333; font-size:14px; line-height:1.8;\">" + roomInfo + "</p>", "#f9f9f9"),
            highlightBox("💰 Tổng cộng",
                "<p style=\"margin:0; font-size:22px; font-weight:700; color:#FF6B35;\">" + totalAmount.toPlainString() + " " + currency + "</p><p style=\"margin:4px 0 0; color:#888; font-size:12px;\">Chưa thanh toán — vui lòng thanh toán để xác nhận</p>", "#FFF8F4")
        );

        sendHtmlEmail(toEmail, subject, baseTemplate(subject, content, frontendUrl + "/profile/bookings", "Thanh toán ngay"));
    }

    // ==================== 5. EMAIL THANH TOÁN THÀNH CÔNG ====================

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

        String subject = String.format("Tourista Studio — Thanh toán thành công cho %s #%s",
                "HOTEL".equals(bookingType) ? "khách sạn" : "tour", bookingCode);

        String guestInfo = adults + " người lớn" + (children > 0 ? ", " + children + " trẻ em" : "");
        String dateInfo = "HOTEL".equals(bookingType)
                ? ("<strong>Nhận phòng:</strong> " + checkIn + "<br><strong>Trả phòng:</strong> " + checkOut)
                : ("<strong>Khởi hành:</strong> " + checkIn);
        String serviceLabel = "HOTEL".equals(bookingType) ? "khách sạn" : "tour";

        String content = String.format("""
            <h2 style="margin: 0 0 20px; color: #333; font-size: 24px;">Thanh toán thành công! 🎉</h2>
            <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.7;">
                Cảm ơn bạn! Thanh toán cho <strong>%s #%s</strong> đã được xác nhận thành công. Chúng tôi đã gửi xác nhận đến đối tác và bạn có thể nhận phòng / khởi hành theo đúng lịch trình.
            </p>
            %s
            %s
            %s
            %s
            %s
            %s
            <p style="margin: 25px 0 0; color: #27ae60; font-size: 14px; line-height: 1.7; background: #f0fff4; border-left: 4px solid #27ae60; padding: 15px 20px; border-radius: 6px;">
                ✅ <strong>Đã xác nhận!</strong> Vui lòng giữ mã booking <strong>%s</strong> để đối chiếu khi nhận phòng hoặc khởi hành. Mã giao dịch: <strong>%s</strong>.
            </p>
            """,
            serviceLabel, bookingCode,
            highlightBox("📋 Mã booking", "<p style=\"margin:0; font-size:20px; font-weight:700; color:#27ae60; letter-spacing:1px;\">" + bookingCode + "</p>", "#F0FFF4"),
            highlightBox("🏨 " + ("HOTEL".equals(bookingType) ? "Khách sạn" : "Tour"),
                "<p style=\"margin:0; color:#333; font-size:15px; font-weight:600;\">" + serviceName + "</p><p style=\"margin:4px 0 0; color:#777; font-size:13px;\">" + serviceSubtitle + "</p>", "#f9f9f9"),
            highlightBox("📅 Thông tin ngày", "<p style=\"margin:0; color:#333; font-size:14px; line-height:1.8;\">" + dateInfo + "</p>", "#f9f9f9"),
            highlightBox("👥 Số khách", "<p style=\"margin:0; color:#333; font-size:14px;\">" + guestInfo + "</p>", "#f9f9f9"),
            highlightBox("💳 Thanh toán",
                "<p style=\"margin:0; color:#333; font-size:14px;\"><strong>Phương thức:</strong> " + paymentMethod + "</p><p style=\"margin:4px 0 0; color:#333; font-size:14px;\"><strong>Mã giao dịch:</strong> " + transactionNo + "</p>", "#f9f9f9"),
            highlightBox("💰 Đã thanh toán",
                "<p style=\"margin:0; font-size:22px; font-weight:700; color:#27ae60;\">" + totalAmount.toPlainString() + " " + currency + "</p>", "#F0FFF4"),
            bookingCode, transactionNo
        );

        sendHtmlEmail(toEmail, subject, baseTemplate(subject, content, frontendUrl + "/profile/bookings", "Xem chi tiết booking"));
    }

    // ==================== 5b. EMAIL CẬP NHẬT BOOKING ====================

    @Async("emailExecutor")
    public void sendBookingUpdatedEmail(
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

        String subject = String.format("Tourista Studio — Thông tin booking #%s đã được cập nhật", bookingCode);
        String guestInfo = adults + " người lớn" + (children > 0 ? ", " + children + " trẻ em" : "");
        String dateInfo = "HOTEL".equals(bookingType)
                ? ("<strong>Nhận phòng:</strong> " + checkIn + "<br><strong>Trả phòng:</strong> " + checkOut)
                : ("<strong>Khởi hành:</strong> " + checkIn);
        String roomInfo = "HOTEL".equals(bookingType)
                ? ("<strong>Phòng:</strong> " + serviceSubtitle + "<br><strong>Số phòng:</strong> " + roomsOrSlots)
                : ("<strong>Số chỗ:</strong> " + roomsOrSlots);
        String serviceLabel = "HOTEL".equals(bookingType) ? "khách sạn" : "tour";

        String content = String.format("""
            <h2 style="margin: 0 0 20px; color: #333; font-size: 24px;">Thông tin booking đã được cập nhật</h2>
            <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.7;">
                Thông tin đặt %s <strong>#%s</strong> của bạn đã được cập nhật. Vui lòng kiểm tra lại các thông tin bên dưới.
            </p>
            %s
            %s
            %s
            %s
            %s
            %s
            <p style="margin: 25px 0 0; color: #0f7fb6; font-size: 14px; line-height: 1.7; background: #f0f9ff; border-left: 4px solid #0f7fb6; padding: 15px 20px; border-radius: 6px;">
                ℹ️ <strong>Đã cập nhật:</strong> Nếu có thay đổi về giá, tổng số tiền đã được điều chỉnh tự động.
            </p>
            """,
            serviceLabel, bookingCode,
            highlightBox("📋 Mã booking", "<p style=\"margin:0; font-size:20px; font-weight:700; color:#0f7fb6; letter-spacing:1px;\">" + bookingCode + "</p>", "#f0f9ff"),
            highlightBox("🏨 " + ("HOTEL".equals(bookingType) ? "Khách sạn" : "Tour"),
                "<p style=\"margin:0; color:#333; font-size:15px; font-weight:600;\">" + serviceName + "</p><p style=\"margin:4px 0 0; color:#777; font-size:13px;\">" + serviceSubtitle + "</p>", "#f9f9f9"),
            highlightBox("📅 Thông tin ngày", "<p style=\"margin:0; color:#333; font-size:14px; line-height:1.8;\">" + dateInfo + "</p>", "#f9f9f9"),
            highlightBox("👥 Số khách", "<p style=\"margin:0; color:#333; font-size:14px;\">" + guestInfo + "</p>", "#f9f9f9"),
            highlightBox("🚪 " + ("HOTEL".equals(bookingType) ? "Phòng" : "Chỗ"),
                "<p style=\"margin:0; color:#333; font-size:14px; line-height:1.8;\">" + roomInfo + "</p>", "#f9f9f9"),
            highlightBox("💰 Tổng cộng",
                "<p style=\"margin:0; font-size:22px; font-weight:700; color:#0f7fb6;\">" + totalAmount.toPlainString() + " " + currency + "</p><p style=\"margin:4px 0 0; color:#888; font-size:12px;\">Đã cập nhật theo thông tin mới</p>", "#f0f9ff")
        );

        sendHtmlEmail(toEmail, subject, baseTemplate(subject, content, frontendUrl + "/profile/bookings", "Xem chi tiết booking"));
    }

    // ==================== 6. EMAIL HỦY BOOKING ====================

    @Async("emailExecutor")
    public void sendBookingCancelledEmail(
            String toEmail,
            String bookingCode,
            String bookingType,
            String serviceName,
            String cancelReason) {

        String subject = String.format("Tourista Studio — Booking #%s đã bị hủy", bookingCode);
        String serviceLabel = "HOTEL".equals(bookingType) ? "khách sạn" : "tour";

        String content = String.format("""
            <h2 style="margin: 0 0 20px; color: #333; font-size: 24px;">Yêu cầu đặt %s đã bị hủy</h2>
            <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.7;">
                Booking <strong>#%s</strong> cho <strong>%s</strong> đã được hủy thành công.
            </p>
            %s
            <p style="margin: 20px 0 0; color: #555; font-size: 14px; line-height: 1.7;">
                Nếu bạn đã thanh toán, vui lòng liên hệ bộ phận hỗ trợ qua email <strong>hotro@tourista.vn</strong> hoặc hotline <strong>028 1234 5678</strong> để được hoàn tiền theo chính sách.
            </p>
            <p style="margin: 20px 0 0; color: #555; font-size: 14px; line-height: 1.7;">
                Bạn có thể đặt lại chuyến đi mới tại Tourista Studio bất cứ lúc nào.
            </p>
            """,
            serviceLabel,
            bookingCode, serviceName,
            cancelReason != null && !cancelReason.isBlank()
                ? highlightBox("📝 Lý do hủy", "<p style=\"margin:0; color:#555; font-size:14px;\">" + cancelReason + "</p>", "#FFF5F5")
                : ""
        );

        sendHtmlEmail(toEmail, subject, baseTemplate(subject, content,
            frontendUrl + "/hotels", "Đặt lại ngay"));
    }

    // ==================== 7. EMAIL NHẮC TRƯỚC CHECK-IN / KHỞI HÀNH ====================

    @Async("emailExecutor")
    public void sendReminderEmail(
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

        String subject = String.format("Tourista Studio — Nhắc nhở: %s của bạn sắp bắt đầu! ⏰",
                "HOTEL".equals(bookingType) ? "Nhận phòng" : "Khởi hành");

        String guestInfo = adults + " người lớn" + (children > 0 ? ", " + children + " trẻ em" : "");
        String dateInfo = "HOTEL".equals(bookingType)
                ? ("<strong>Nhận phòng:</strong> " + checkIn + "<br><strong>Trả phòng:</strong> " + checkOut)
                : ("<strong>Khởi hành:</strong> " + checkIn);
        String actionLabel = "HOTEL".equals(bookingType) ? "Nhận phòng" : "Khởi hành";

        String content = String.format("""
            <h2 style="margin: 0 0 20px; color: #333; font-size: 24px;">Nhắc nhở: %s vào ngày mai! 🗓️</h2>
            <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.7;">
                Chuyến đi của bạn sắp bắt đầu! Hãy kiểm tra lại thông tin và chuẩn bị để có một hành trình tuyệt vời.
            </p>
            %s
            %s
            %s
            %s
            %s
            <p style="margin: 25px 0 0; color: #FF6B35; font-size: 14px; line-height: 1.7; background: #FFF8F4; border-left: 4px solid #FF6B35; padding: 15px 20px; border-radius: 6px;">
                📌 <strong>Lưu ý:</strong> Vui lòng mang theo <strong>mã booking #%s</strong> và <strong>CMND/CCCD</strong> khi nhận phòng hoặc lên xe. Nếu cần hỗ trợ, liên hệ hotline <strong>028 1234 5678</strong>.
            </p>
            """,
            actionLabel,
            highlightBox("📋 Mã booking", "<p style=\"margin:0; font-size:18px; font-weight:700; color:#FF6B35; letter-spacing:1px;\">" + bookingCode + "</p>", "#FFF8F4"),
            highlightBox("🏨 " + ("HOTEL".equals(bookingType) ? "Khách sạn" : "Tour"),
                "<p style=\"margin:0; color:#333; font-size:15px; font-weight:600;\">" + serviceName + "</p><p style=\"margin:4px 0 0; color:#777; font-size:13px;\">" + serviceSubtitle + "</p>", "#f9f9f9"),
            highlightBox("📅 " + actionLabel, "<p style=\"margin:0; color:#333; font-size:14px; line-height:1.8;\">" + dateInfo + "</p>", "#f9f9f9"),
            highlightBox("👥 Số khách", "<p style=\"margin:0; color:#333; font-size:14px;\">" + guestInfo + "</p>", "#f9f9f9"),
            highlightBox("💰 Đã thanh toán",
                "<p style=\"margin:0; font-size:18px; font-weight:700; color:#27ae60;\">" + totalAmount.toPlainString() + " " + currency + "</p>", "#F0FFF4"),
            bookingCode
        );

        sendHtmlEmail(toEmail, subject, baseTemplate(subject, content, frontendUrl + "/profile/bookings", "Xem chi tiết booking"));
    }

    // ==================== 8. EMAIL CẢM ƠN SAU CHUYẾN ĐI ====================

    @Async("emailExecutor")
    public void sendThankYouEmail(
            String toEmail,
            String bookingCode,
            String bookingType,
            String serviceName,
            String checkIn,
            String checkOut,
            int adults,
            int children,
            BigDecimal totalAmount,
            String currency) {

        String subject = "Tourista Studio — Cảm ơn bạn đã đồng hành cùng chúng tôi! 🌟";

        String content = String.format("""
            <h2 style="margin: 0 0 20px; color: #333; font-size: 24px;">Cảm ơn bạn đã sử dụng Tourista Studio! 🙏</h2>
            <p style="margin: 0 0 20px; color: #555; font-size: 15px; line-height: 1.7;">
                Chuyến đi của bạn đến <strong>%s</strong> đã kết thúc. Chúng tôi hy vọng bạn đã có những trải nghiệm tuyệt vời!
            </p>
            %s
            %s
            %s
            <p style="margin: 25px 0 20px; color: #555; font-size: 15px; line-height: 1.7;">
                Chúng tôi rất mong muốn được đồng hành cùng bạn trong những chuyến đi tiếp theo. Hãy để lại đánh giá để giúp cộng đồng du lịch có thêm lựa chọn tốt hơn nhé!
            </p>
            %s
            """,
            serviceName,
            highlightBox("📋 Mã booking", "<p style=\"margin:0; font-size:16px; font-weight:700; color:#888; letter-spacing:1px;\">" + bookingCode + "</p>", "#f9f9f9"),
            highlightBox("🏨 " + ("HOTEL".equals(bookingType) ? "Khách sạn" : "Tour"),
                "<p style=\"margin:0; color:#333; font-size:15px; font-weight:600;\">" + serviceName + "</p>", "#f9f9f9"),
            highlightBox("📅 Thời gian",
                "<p style=\"margin:0; color:#333; font-size:14px; line-height:1.8;\">" + ("HOTEL".equals(bookingType) ? "<strong>Nhận phòng:</strong> " + checkIn + "<br><strong>Trả phòng:</strong> " + checkOut : "<strong>Khởi hành:</strong> " + checkIn) + "</p>", "#f9f9f9"),
            highlightBox("🎁 Ưu đãi cho chuyến đi tiếp theo",
                "<p style=\"margin:0; color:#555; font-size:14px;\">Giảm <strong>8%%</strong> cho đặt tiếp theo. Mã: <strong style=\"color:#FF6B35;\">BACK5</strong></p>", "#F0FFF4")
        );

        sendHtmlEmail(toEmail, subject, baseTemplate(subject, content, frontendUrl + "/hotels", "Đặt chuyến mới"));
    }

    // ==================== 9. EMAIL KHUYẾN MÃI / NEWSLETTER ====================

    /**
     * Gửi email khuyến mãi / newsletter đến nhiều người cùng lúc.
     * Sử dụng Brevo batch send.
     *
     * @param recipients Danh sách email nhận
     * @param subject    Tiêu đề email
     * @param title      Tiêu đề chính (VD: "Mùa hè sôi động — Giảm 30%")
     * @param subtitle   Phụ đề (VD: "Áp dụng cho tất cả khách sạn 3-5 sao")
     * @param body       Nội dung HTML tùy chỉnh
     * @param ctaLink    Link CTA
     * @param ctaText    Text nút CTA
     */
    @Async("emailExecutor")
    public void sendPromotionEmail(
            List<String> recipients,
            String subject,
            String title,
            String subtitle,
            String body,
            String ctaLink,
            String ctaText) {

        if (recipients == null || recipients.isEmpty()) {
            log.warn("No recipients for promotion email: {}", subject);
            return;
        }

        String content = String.format("""
            <h2 style="margin: 0 0 15px; color: #333; font-size: 26px;">%s</h2>
            <p style="margin: 0 0 25px; color: #777; font-size: 15px;">%s</p>
            %s
            """,
            escapeHtml(title),
            escapeHtml(subtitle),
            body != null ? body : ""
        );

        String html = baseTemplate(subject, content, ctaLink, ctaText);

        try {
            var recipientList = recipients.stream()
                    .map(email -> "{\"email\": \"" + escapeJson(email) + "\"}")
                    .toList();
            String jsonBody = String.format("""
                {
                    "sender": {"name": "%s", "email": "%s"},
                    "to": %s,
                    "subject": "%s",
                    "htmlContent": "%s"
                }
                """,
                escapeJson(fromName),
                escapeJson(fromEmail),
                recipientList,
                escapeJson(subject),
                escapeJson(html)
            );

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(BREVO_API_URL))
                    .header("api-key", brevoApiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            int status = response.statusCode();

            if (status >= 200 && status < 300) {
                log.info("Promotion email sent to {} recipients successfully", recipients.size());
            } else {
                log.error("Failed to send promotion email: {} - {}", status, response.body());
            }
        } catch (Exception e) {
            log.error("Failed to send promotion email: {}", e.getMessage());
        }
    }
}
