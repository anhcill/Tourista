package vn.tourista.service;

import vn.tourista.dto.request.LoginRequest;
import vn.tourista.dto.request.ForgotPasswordRequest;
import vn.tourista.dto.request.RefreshTokenRequest;
import vn.tourista.dto.request.ResetPasswordRequest;
import vn.tourista.dto.request.RegisterRequest;
import vn.tourista.dto.response.AuthResponse;
import vn.tourista.entity.User;

// Interface định nghĩa các hành động xác thực
// Toàn bộ logic thực thi ở AuthServiceImpl
public interface AuthService {

    // Đăng ký tài khoản thường
    AuthResponse register(RegisterRequest request);

    // Xác thực email sau khi nhấn link
    void verifyEmail(String token);

    // Gửi link đặt lại mật khẩu qua email
    void forgotPassword(ForgotPasswordRequest request);

    // Đặt lại mật khẩu bằng token đã gửi qua email
    void resetPassword(ResetPasswordRequest request);

    // Đăng nhập thường (email + password)
    AuthResponse login(LoginRequest request, String ipAddress, String userAgent);

    // Cấp lại access token mới bằng refresh token
    AuthResponse refresh(RefreshTokenRequest request);

    // Đăng xuất: revoke refresh token
    void logout(RefreshTokenRequest request);

    // Xử lý user sau Google OAuth2 (tìm hoặc tạo mới)
    User processOAuth2User(String email, String name, String avatarUrl, String googleId);

    // Tạo JWT tokens cho 1 user (dùng sau OAuth2)
    AuthResponse generateTokensForUser(User user);
}
