package vn.tourista.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import vn.tourista.entity.User;
import vn.tourista.service.AuthService;

import java.io.IOException;

// Xử lý sau khi Google OAuth2 login thành công
// Tạo JWT token và redirect về frontend kèm token
@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private AuthService authService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication)
            throws IOException {

        // Lấy thông tin user từ Google
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email     = oAuth2User.getAttribute("email");
        String name      = oAuth2User.getAttribute("name");
        String avatarUrl = oAuth2User.getAttribute("picture");
        String googleId  = oAuth2User.getAttribute("sub"); // Google unique ID

        // Service xử lý: tìm user hoặc tạo mới nếu lần đầu đăng nhập bằng Google
        User user = authService.processOAuth2User(email, name, avatarUrl, googleId);

        // Tạo JWT tokens
        var authResponse = authService.generateTokensForUser(user);

        // Redirect về frontend kèm access token + refresh token trong query params
        // Frontend sẽ lưu token vào localStorage và điều hướng user
        String redirectUrl = String.format(
            "%s/oauth2/callback?accessToken=%s&refreshToken=%s",
            frontendUrl,
            authResponse.getAccessToken(),
            authResponse.getRefreshToken()
        );

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}
