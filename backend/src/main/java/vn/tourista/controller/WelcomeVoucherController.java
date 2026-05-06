package vn.tourista.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.WelcomeVoucherResponse;
import vn.tourista.entity.User;
import vn.tourista.service.WelcomeVoucherService;

import java.util.Map;

/**
 * API cho welcome voucher (500K cho chuyến đi đầu tiên).
 * Endpoint public: lấy thông tin voucher (ai cũng gọi được)
 * Endpoint authenticated: claim voucher (chỉ user đã login)
 */
@RestController
@RequestMapping("/api/welcome-voucher")
@RequiredArgsConstructor
public class WelcomeVoucherController {

    private final WelcomeVoucherService welcomeVoucherService;

    /**
     * GET /api/welcome-voucher
     * Lấy thông tin welcome voucher (public — không cần login).
     * Trả về: có voucher hay không, mã code, và thông tin hiển thị.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<WelcomeVoucherResponse>> getWelcomeVoucher(
            @AuthenticationPrincipal User user) {
        WelcomeVoucherResponse response = welcomeVoucherService.getWelcomeVoucher(user);
        return ResponseEntity.ok(ApiResponse.ok("Lấy thông tin voucher thành công", response));
    }

    /**
     * POST /api/welcome-voucher/claim
     * User đã login claim voucher về tài khoản.
     * Voucher sẽ được gửi kèm trong AuthResponse lần sau (hoặc lưu vào bảng riêng).
     */
    @PostMapping("/claim")
    public ResponseEntity<ApiResponse<WelcomeVoucherResponse>> claimWelcomeVoucher(
            @AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401)
                    .body(ApiResponse.error("Vui lòng đăng nhập để nhận voucher."));
        }

        WelcomeVoucherResponse response = welcomeVoucherService.claimVoucher(user);
        if (response == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Bạn đã nhận voucher này rồi hoặc voucher đã hết hiệu lực."));
        }

        return ResponseEntity.ok(ApiResponse.ok("Nhận voucher thành công! Mã WELCOME500K đã được lưu vào tài khoản.", response));
    }
}
