package vn.tourista.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

// Gửi email — cấu hình SMTP trong application.yml
@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    // Gửi email xác thực khi đăng ký
    public void sendVerificationEmail(String toEmail, String token) {
        String verifyLink = frontendUrl + "/verify-email?token=" + token;

        System.out.println("==================================================");
        System.out.println("TESTING: Verification Link: " + verifyLink);
        System.out.println("==================================================");

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("Tourista - Xác thực tài khoản của bạn");
            message.setText(
                "Xin chào!\n\n" +
                "Cảm ơn bạn đã đăng ký tài khoản Tourista.\n\n" +
                "Vui lòng click vào link bên dưới để xác thực email:\n" +
                verifyLink + "\n\n" +
                "Link có hiệu lực trong 24 giờ.\n\n" +
                "Nếu bạn không đăng ký tài khoản này, vui lòng bỏ qua email này.\n\n" +
                "Trân trọng,\n" +
                "Đội ngũ Tourista"
            );
            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Warning: Could not send email. " + e.getMessage());
        }
    }

    // Gửi email reset mật khẩu
    public void sendPasswordResetEmail(String toEmail, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Tourista - Đặt lại mật khẩu");
        message.setText(
            "Bạn đã yêu cầu đặt lại mật khẩu.\n\n" +
            "Click vào link bên dưới để tạo mật khẩu mới:\n" +
            resetLink + "\n\n" +
            "Link có hiệu lực trong 1 giờ.\n\n" +
            "Nếu bạn không yêu cầu, vui lòng bỏ qua email này.\n\n" +
            "Trân trọng,\n" +
            "Đội ngũ Tourista"
        );

        mailSender.send(message);
    }
}
