package vn.tourista.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.tourista.dto.request.LoginRequest;
import vn.tourista.dto.request.RefreshTokenRequest;
import vn.tourista.dto.request.RegisterRequest;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.AuthResponse;
import vn.tourista.service.AuthService;

// Controller KHÔNG xử lý logic.
// Nhiệm vụ duy nhất: nhận request → gọi service → trả response.
// Mọi lỗi được GlobalExceptionHandler xử lý tự động.
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    // ================================================================
    // POST /api/auth/register — Đăng ký tài khoản
    // ================================================================
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest request) {
        AuthResponse data = authService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản.", data));
    }

    // ================================================================
    // GET /api/auth/verify-email?token=xxx — Xác thực email
    // ================================================================
    @GetMapping("/verify-email")
    public ResponseEntity<ApiResponse<?>> verifyEmail(@RequestParam String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok(ApiResponse.ok("Xác thực email thành công. Bạn có thể đăng nhập ngay bây giờ."));
    }

    // ================================================================
    // POST /api/auth/login — Đăng nhập
    // ================================================================
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        // Lấy IP và user agent để ghi log — logic xử lý hoàn toàn trong service
        String ipAddress = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");

        AuthResponse data = authService.login(request, ipAddress, userAgent);
        return ResponseEntity.ok(ApiResponse.ok("Đăng nhập thành công", data));
    }

    // ================================================================
    // POST /api/auth/refresh — Lấy access token mới
    // ================================================================
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse data = authService.refresh(request);
        return ResponseEntity.ok(ApiResponse.ok("Token đã được làm mới", data));
    }

    // ================================================================
    // POST /api/auth/logout — Đăng xuất
    // ================================================================
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<?>> logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request);
        return ResponseEntity.ok(ApiResponse.ok("Đăng xuất thành công"));
    }

    // ================================================================
    // Lấy IP client (hỗ trợ qua proxy)
    // ================================================================
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
