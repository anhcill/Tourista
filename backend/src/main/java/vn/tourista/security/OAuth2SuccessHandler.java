package vn.tourista.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import vn.tourista.entity.User;
import vn.tourista.service.AuthService;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

// Xử lý sau khi Google OAuth2 login thành công
// Tạo JWT token và redirect về frontend kèm token
@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(OAuth2SuccessHandler.class);

    @Autowired
    private AuthService authService;

    @Autowired
    private OAuth2LoginCodeStore oAuth2LoginCodeStore;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication)
            throws IOException {

        try {
            // Lấy thông tin user từ Google
            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
            String email = oAuth2User.getAttribute("email");
            String name = oAuth2User.getAttribute("name");
            String avatarUrl = oAuth2User.getAttribute("picture");
            String googleId = oAuth2User.getAttribute("sub"); // Google unique ID

            log.info("OAuth2 login success for email: {}", email);

            // Service xử lý: tìm user hoặc tạo mới nếu lần đầu đăng nhập bằng Google
            User user = authService.processOAuth2User(email, name, avatarUrl, googleId);

            // Kiểm tra null safety
            if (user == null) {
                log.error("OAuth2 user processing returned null for email: {}", email);
                redirectToError(request, response, "Không thể xử lý tài khoản Google");
                return;
            }
            if (user.getRole() == null) {
                log.error("OAuth2 user {} has null role — role USER may not exist in DB", email);
                redirectToError(request, response, "Tài khoản không có quyền truy cập (role bị thiếu)");
                return;
            }

            // Tạo JWT tokens
            var authResponse = authService.generateTokensForUser(user);

            // Phát hành one-time code ngắn hạn để frontend đổi lấy token qua API
            String exchangeCode = oAuth2LoginCodeStore.issueCode(authResponse);

            // Redirect về frontend chỉ mang code, không mang token
            String redirectUrl = String.format(
                    "%s/oauth2/callback?code=%s",
                    frontendUrl,
                    URLEncoder.encode(exchangeCode, StandardCharsets.UTF_8));

            log.info("Redirecting OAuth2 user {} to frontend with exchange code", email);
            getRedirectStrategy().sendRedirect(request, response, redirectUrl);

        } catch (Exception ex) {
            log.error("OAuth2 authentication success handler failed", ex);
            redirectToError(request, response, "Đăng nhập Google thất bại: " + ex.getMessage());
        }
    }

    private void redirectToError(HttpServletRequest request, HttpServletResponse response, String message) throws IOException {
        String encoded = URLEncoder.encode(message, StandardCharsets.UTF_8);
        String url = frontendUrl + "/login?error=" + encoded;
        getRedirectStrategy().sendRedirect(request, response, url);
    }
}
