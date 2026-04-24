package vn.tourista.service.impl;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import vn.tourista.dto.request.ForgotPasswordRequest;
import vn.tourista.dto.request.LoginRequest;
import vn.tourista.dto.request.RefreshTokenRequest;
import vn.tourista.dto.request.ResetPasswordRequest;
import vn.tourista.dto.request.RegisterRequest;
import vn.tourista.dto.response.AuthResponse;
import vn.tourista.entity.*;
import vn.tourista.exception.*;
import vn.tourista.repository.*;
import vn.tourista.security.JwtUtil;
import vn.tourista.service.AuthService;
import vn.tourista.service.BrevoEmailService;

import java.time.LocalDateTime;
import java.util.UUID;

// Toàn bộ business logic xác thực nằm ở đây
// Controller chỉ gọi các method này, không có logic gì trong controller
@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    @Autowired private UserRepository userRepository;
    @Autowired private RoleRepository roleRepository;
    @Autowired private RefreshTokenRepository refreshTokenRepository;
    @Autowired private EmailVerificationTokenRepository emailTokenRepository;
    @Autowired private LoginAttemptRepository loginAttemptRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private BrevoEmailService emailService;

    @Value("${app.auth.max-failed-attempts}") private int maxFailedAttempts;
    @Value("${app.auth.lock-duration-minutes}") private int lockDurationMinutes;
    @Value("${app.jwt.refresh-token-expiry-days}") private int refreshTokenExpiryDays;

    // ================================================================
    // ĐĂNG KÝ
    // ================================================================
    @Override
    public AuthResponse register(RegisterRequest request) {

        // 1. Kiểm tra confirmPassword
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Mật khẩu xác nhận không khớp");
        }

        // 2. Kiểm tra email đã dùng chưa
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email đã được đăng ký");
        }

        // 3. Lấy role USER mặc định
        Role userRole = roleRepository.findByName("USER")
                .orElseThrow(() -> new RuntimeException("Role USER không tồn tại trong DB"));

        // 4. Tạo user mới, hash password bằng BCrypt
        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(userRole)
                .authProvider(User.AuthProvider.LOCAL)
                .isEmailVerified(false)
                .build();

        User savedUser = userRepository.save(user);

        // 5. Tạo token xác thực email (hết hạn sau 24 giờ)
        String verifyToken = UUID.randomUUID().toString();
        EmailVerificationToken emailToken = EmailVerificationToken.builder()
                .user(savedUser)
                .token(verifyToken)
                .type(EmailVerificationToken.TokenType.VERIFY_EMAIL)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();
        emailTokenRepository.save(emailToken);

        // 6. Gửi email xác thực
        emailService.sendVerificationEmail(savedUser.getEmail(), verifyToken);

        // 7. Trả về thông báo thành công (chưa login — cần verify email trước)
        return AuthResponse.builder()
                .user(buildUserInfo(savedUser))
                .build();
    }

    // ================================================================
    // XÁC THỰC EMAIL
    // ================================================================
    @Override
    public void verifyEmail(String token) {

        // 1. Tìm token trong DB
        EmailVerificationToken verifyToken = emailTokenRepository.findByToken(token)
                .orElseThrow(() -> new InvalidTokenException("Link xác thực không hợp lệ"));

        // 2. Kiểm tra đã dùng chưa
        if (verifyToken.getUsed()) {
            throw new InvalidTokenException("Link xác thực đã được sử dụng");
        }

        // 3. Kiểm tra còn hạn không
        if (verifyToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidTokenException("Link xác thực đã hết hạn. Vui lòng đăng ký lại.");
        }

        // 4. Kích hoạt tài khoản
        User user = verifyToken.getUser();
        user.setIsEmailVerified(true);
        user.setEmailVerifiedAt(LocalDateTime.now());
        userRepository.save(user);

        // 5. Đánh dấu token đã dùng
        verifyToken.setUsed(true);
        emailTokenRepository.save(verifyToken);
    }

    // ================================================================
    // QUEN MAT KHAU
    // ================================================================
    @Override
    public void forgotPassword(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);

        // Khong tiet lo email co ton tai hay khong
        if (user == null) {
            return;
        }

        // Tai khoan Google khong dat lai mat khau LOCAL
        if (user.getAuthProvider() == User.AuthProvider.GOOGLE) {
            return;
        }

        String resetTokenValue = UUID.randomUUID().toString();
        EmailVerificationToken resetToken = EmailVerificationToken.builder()
                .user(user)
                .token(resetTokenValue)
                .type(EmailVerificationToken.TokenType.RESET_PASSWORD)
                .expiresAt(LocalDateTime.now().plusHours(1))
                .build();

        emailTokenRepository.save(resetToken);
        emailService.sendPasswordResetEmail(user.getEmail(), resetTokenValue);
    }

    // ================================================================
    // DAT LAI MAT KHAU
    // ================================================================
    @Override
    public void resetPassword(ResetPasswordRequest request) {
        EmailVerificationToken resetToken = emailTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new InvalidTokenException("Link dat lai mat khau khong hop le"));

        if (resetToken.getType() != EmailVerificationToken.TokenType.RESET_PASSWORD) {
            throw new InvalidTokenException("Token khong dung cho thao tac dat lai mat khau");
        }

        if (Boolean.TRUE.equals(resetToken.getUsed())) {
            throw new InvalidTokenException("Link dat lai mat khau da duoc su dung");
        }

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidTokenException("Link dat lai mat khau da het han");
        }

        User user = resetToken.getUser();
        if (user.getAuthProvider() == User.AuthProvider.GOOGLE) {
            throw new IllegalArgumentException("Tai khoan nay dang nhap bang Google, khong co mat khau LOCAL");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setFailedAttempts(0);
        user.setLockedUntil(null);
        if (user.getStatus() == User.UserStatus.LOCKED) {
            user.setStatus(User.UserStatus.ACTIVE);
        }
        userRepository.save(user);

        refreshTokenRepository.revokeAllByUser(user);

        resetToken.setUsed(true);
        emailTokenRepository.save(resetToken);
    }

    // ================================================================
    // ĐĂNG NHẬP
    // ================================================================
    @Override
    public AuthResponse login(LoginRequest request, String ipAddress, String userAgent) {

        // 1. Tìm user theo email
        User user = userRepository.findByEmail(request.getEmail()).orElse(null);

        // 2. Không tìm thấy user → log + throw 401
        if (user == null) {
            logAttempt(request.getEmail(), ipAddress, userAgent, false, "USER_NOT_FOUND");
            throw new InvalidCredentialsException("Email hoặc mật khẩu không đúng");
        }

        // 3. Kiểm tra tài khoản có bị khóa không
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(LocalDateTime.now())) {
            logAttempt(request.getEmail(), ipAddress, userAgent, false, "ACCOUNT_LOCKED");
            throw new AccountLockedException(
                "Tài khoản bị khóa do đăng nhập sai quá nhiều lần",
                user.getLockedUntil()
            );
        }

        // 4. Nếu thời gian khóa đã qua → tự động mở khóa
        if (user.getLockedUntil() != null && user.getLockedUntil().isBefore(LocalDateTime.now())) {
            user.setStatus(User.UserStatus.ACTIVE);
            user.setFailedAttempts(0);
            user.setLockedUntil(null);
        }

        // 5. Kiểm tra đây có phải tài khoản LOCAL không (Google account không có password)
        if (user.getAuthProvider() == User.AuthProvider.GOOGLE) {
            throw new InvalidCredentialsException("Tài khoản này đăng nhập bằng Google. Vui lòng dùng nút 'Đăng nhập với Google'.");
        }

        // 6. So sánh password
        boolean passwordCorrect = passwordEncoder.matches(request.getPassword(), user.getPasswordHash());

        if (!passwordCorrect) {
            // Tăng số lần sai
            int attempts = user.getFailedAttempts() + 1;
            user.setFailedAttempts(attempts);

            // Đủ số lần sai → khóa tài khoản
            if (attempts >= maxFailedAttempts) {
                user.setStatus(User.UserStatus.LOCKED);
                user.setLockedUntil(LocalDateTime.now().plusMinutes(lockDurationMinutes));
                userRepository.save(user);
                logAttempt(request.getEmail(), ipAddress, userAgent, false, "WRONG_PASSWORD");
                throw new AccountLockedException(
                    "Đăng nhập sai " + maxFailedAttempts + " lần. Tài khoản bị khóa " + lockDurationMinutes + " phút.",
                    user.getLockedUntil()
                );
            }

            userRepository.save(user);
            logAttempt(request.getEmail(), ipAddress, userAgent, false, "WRONG_PASSWORD");
            throw new InvalidCredentialsException("Email hoặc mật khẩu không đúng");
        }

        // 7. Kiểm tra đã verify email chưa
        if (!user.getIsEmailVerified()) {
            logAttempt(request.getEmail(), ipAddress, userAgent, false, "EMAIL_NOT_VERIFIED");
            throw new EmailNotVerifiedException("Vui lòng xác thực email trước khi đăng nhập");
        }

        // 8. Đăng nhập thành công → reset failed attempts + cập nhật last login
        user.setFailedAttempts(0);
        user.setLockedUntil(null);
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // 9. Log thành công
        logAttempt(request.getEmail(), ipAddress, userAgent, true, null);

        // 10. Tạo và trả về tokens
        return generateTokensForUser(user);
    }

    // ================================================================
    // REFRESH TOKEN
    // ================================================================
    @Override
    public AuthResponse refresh(RefreshTokenRequest request) {

        // 1. Tìm refresh token trong DB
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new InvalidTokenException("Refresh token không hợp lệ"));

        // 2. Kiểm tra đã bị revoke chưa
        if (refreshToken.getRevoked()) {
            throw new InvalidTokenException("Refresh token đã bị thu hồi");
        }

        // 3. Kiểm tra còn hạn không
        if (refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidTokenException("Refresh token đã hết hạn. Vui lòng đăng nhập lại.");
        }

        // 4. Tạo access token mới (refresh token vẫn giữ nguyên)
        User user = refreshToken.getUser();
        String newAccessToken = jwtUtil.generateAccessToken(user.getEmail(), user.getRole().getName());

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(jwtUtil.getExpiresInSeconds())
                .user(buildUserInfo(user))
                .build();
    }

    // ================================================================
    // LOGOUT
    // ================================================================
    @Override
    public void logout(RefreshTokenRequest request) {

        // Tìm và revoke refresh token
        RefreshToken refreshToken = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new InvalidTokenException("Refresh token không hợp lệ"));

        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);
    }

    // ================================================================
    // GOOGLE OAUTH2: Tìm hoặc tạo user mới
    // ================================================================
    @Override
    public User processOAuth2User(String email, String name, String avatarUrl, String googleId) {

        // Tìm user theo Google ID trước
        return userRepository.findByProviderIdAndAuthProvider(googleId, User.AuthProvider.GOOGLE)
                .orElseGet(() -> {
                    // Tìm theo email
                    return userRepository.findByEmail(email)
                            .orElseGet(() -> {
                                // Lần đầu đăng nhập Google → tạo user mới
                                Role userRole = roleRepository.findByName("USER")
                                        .orElseThrow(() -> new RuntimeException("Role USER không tồn tại"));

                                User newUser = User.builder()
                                        .email(email)
                                        .fullName(name)
                                        .avatarUrl(avatarUrl)
                                        .role(userRole)
                                        .authProvider(User.AuthProvider.GOOGLE)
                                        .providerId(googleId)
                                        .passwordHash(null) // Google user không có password — null vì không dùng LOCAL auth
                                        .isEmailVerified(true) // Google đã verify email rồi
                                        .build();

                                return userRepository.save(newUser);
                            });
                });
    }

    // ================================================================
    // TẠO TOKENS CHO USER (dùng sau OAuth2 hoặc login)
    // ================================================================
    @Override
    public AuthResponse generateTokensForUser(User user) {

        // Tạo access token JWT
        String accessToken = jwtUtil.generateAccessToken(user.getEmail(), user.getRole().getName());

        // Tạo refresh token (UUID ngẫu nhiên) và lưu vào DB
        String refreshTokenValue = UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(refreshTokenValue)
                .expiresAt(LocalDateTime.now().plusDays(refreshTokenExpiryDays))
                .build();
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .tokenType("Bearer")
                .expiresIn(jwtUtil.getExpiresInSeconds())
                .user(buildUserInfo(user))
                .build();
    }

    // ================================================================
    // PRIVATE HELPERS
    // ================================================================

    // Tạo UserInfo cho response (không trả password)
    private AuthResponse.UserInfo buildUserInfo(User user) {
        return AuthResponse.UserInfo.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole() != null ? user.getRole().getName() : null)
                .avatarUrl(user.getAvatarUrl())
                .isEmailVerified(user.getIsEmailVerified())
                .build();
    }

    // Ghi log mỗi lần login attempt
    private void logAttempt(String email, String ipAddress, String userAgent,
                             boolean success, String failureReason) {
        LoginAttempt attempt = LoginAttempt.builder()
                .email(email)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .success(success)
                .failureReason(failureReason)
                .build();
        loginAttemptRepository.save(attempt);
    }
}
