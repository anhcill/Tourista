package vn.tourista.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.tourista.dto.request.CreateVnpayPaymentRequest;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.CreateVnpayPaymentResponse;
import vn.tourista.dto.response.VnpayReturnResponse;
import vn.tourista.service.VnpayService;

import java.util.Map;

@RestController
@RequestMapping("/api/payments/vnpay")
public class PaymentController {

    private final VnpayService vnpayService;

    public PaymentController(VnpayService vnpayService) {
        this.vnpayService = vnpayService;
    }

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<CreateVnpayPaymentResponse>> createVnpayPayment(
            @Valid @RequestBody CreateVnpayPaymentRequest request,
            Authentication authentication,
            HttpServletRequest httpServletRequest) {

        String clientIp = resolveClientIp(httpServletRequest);
        CreateVnpayPaymentResponse data = vnpayService.createPaymentUrl(authentication.getName(), clientIp, request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tạo URL thanh toán VNPAY thành công", data));
    }

    @GetMapping("/return")
    public ResponseEntity<ApiResponse<VnpayReturnResponse>> vnpayReturn(@RequestParam Map<String, String> params) {
        VnpayReturnResponse data = vnpayService.parseReturn(params);
        return ResponseEntity.ok(ApiResponse.ok("Xử lý callback VNPAY thành công", data));
    }

    @GetMapping("/ipn")
    public Map<String, String> vnpayIpn(@RequestParam Map<String, String> params) {
        return vnpayService.handleIpn(params);
    }

    private String resolveClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp.trim();
        }
        return request.getRemoteAddr();
    }
}
