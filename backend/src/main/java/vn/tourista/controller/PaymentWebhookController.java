package vn.tourista.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.tourista.entity.Booking;
import vn.tourista.entity.BookingHotelDetail;
import vn.tourista.entity.BookingTourDetail;
import vn.tourista.repository.BookingHotelDetailRepository;
import vn.tourista.repository.BookingRepository;
import vn.tourista.repository.BookingTourDetailRepository;
import vn.tourista.service.EmailService;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * Xử lý IPN (Instant Payment Notification) từ MoMo và ZaloPay.
 * Endpoint này phải là public (không yêu cầu authentication).
 */
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PaymentWebhookController {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final BookingRepository bookingRepository;
    private final BookingHotelDetailRepository bookingHotelDetailRepository;
    private final BookingTourDetailRepository bookingTourDetailRepository;
    private final EmailService emailService;

    // ==================== MoMo IPN Webhook ====================

    /**
     * MoMo gọi endpoint này khi thanh toán thành công.
     * Tham số MoMo gửi: partnerCode, orderId, requestId, amount, orderInfo,
     *                    orderType, transId, resultCode, message, responseTime,
     *                    amount, payType, extraData, signature
     */
    @PostMapping("/momo/ipn")
    public ResponseEntity<Map<String, Object>> momoIpn(@RequestBody Map<String, String> payload) {
        log.info("MoMo IPN received: orderId={}, resultCode={}", payload.get("orderId"), payload.get("resultCode"));

        try {
            String resultCode = payload.get("resultCode");
            String orderId = payload.get("orderId");

            if (orderId == null || orderId.isBlank()) {
                log.warn("MoMo IPN: missing orderId");
                return ResponseEntity.ok(Map.of("status", "fail", "code", "99"));
            }

            // Chỉ xử lý khi resultCode = 0 (thành công)
            if (!"0".equals(resultCode)) {
                log.info("MoMo IPN: payment failed for orderId={}, resultCode={}", orderId, resultCode);
                return ResponseEntity.ok(Map.of("status", "fail", "code", resultCode));
            }

            String bookingCode = normalizePaymentRef(orderId);
            String confirmed = confirmBooking(bookingCode, "MOMO", payload.get("transId"));

            if ("0".equals(confirmed)) {
                return ResponseEntity.ok(Map.of("status", "success", "code", "0"));
            } else {
                return ResponseEntity.ok(Map.of("status", "fail", "code", confirmed));
            }
        } catch (Exception e) {
            log.error("MoMo IPN error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status", "error", "code", "99", "message", e.getMessage()));
        }
    }

    @PostMapping("/momo/create")
    public ResponseEntity<Map<String, Object>> createMoMoPayment(@RequestBody Map<String, String> payload) {
        log.info("MoMo payment create request for booking: {}", payload.get("bookingCode"));
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                .body(Map.of(
                        "error", "MoMo chua duoc cau hinh. Vui long su dung VNPay.",
                        "suggestion", "Su dung phuong thuc VNPay de thanh toan."));
    }

    // ==================== ZaloPay IPN Webhook ====================

    /**
     * ZaloPay gọi endpoint này khi thanh toán thành công.
     * Tham số ZaloPay gửi: appid, apptransid, appuser, amount, apptime,
     *                       embeddata, status, channel, coordinationid, signature
     */
    @PostMapping("/zalopay/ipn")
    public ResponseEntity<Map<String, Object>> zalopayIpn(@RequestBody Map<String, String> payload) {
        log.info("ZaloPay IPN received: appTransId={}, status={}", payload.get("apptransid"), payload.get("status"));

        try {
            String status = payload.get("status");
            String appTransId = payload.get("apptransid");

            if (appTransId == null || appTransId.isBlank()) {
                log.warn("ZaloPay IPN: missing apptransid");
                return ResponseEntity.ok(Map.of("return_code", 0, "return_message", "missing apptransid"));
            }

            // status = 1 means success
            if (!"1".equals(status)) {
                log.info("ZaloPay IPN: payment failed for appTransId={}, status={}", appTransId, status);
                return ResponseEntity.ok(Map.of("return_code", 0, "return_message", "payment status = " + status));
            }

            String bookingCode = normalizePaymentRef(appTransId);
            String confirmed = confirmBooking(bookingCode, "ZALOPAY", appTransId);
            if ("0".equals(confirmed)) {
                return ResponseEntity.ok(Map.of("return_code", 1, "return_message", "Success"));
            } else {
                return ResponseEntity.ok(Map.of("return_code", 0, "return_message", confirmed));
            }
        } catch (Exception e) {
            log.error("ZaloPay IPN error: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("return_code", 0, "return_message", e.getMessage()));
        }
    }

    @PostMapping("/zalopay/create")
    public ResponseEntity<Map<String, Object>> createZaloPayPayment(@RequestBody Map<String, String> payload) {
        log.info("ZaloPay payment create request for booking: {}", payload.get("bookingCode"));
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                .body(Map.of(
                        "error", "ZaloPay chua duoc cau hinh. Vui long su dung VNPay.",
                        "suggestion", "Su dung phuong thuc VNPay de thanh toan."));
    }

    // ==================== Confirm Booking Logic ====================

    /**
     * Cập nhật trạng thái booking khi nhận IPN thanh toán thành công.
     *
     * @param bookingCode      Mã booking (format: TRS-YYYYMMDD-XXXXX)
     * @param paymentMethod    Tên phương thức: "MOMO", "ZALOPAY"
     * @param transactionNo    Số giao dịch từ cổng thanh toán
     * @return "0" = success, error code otherwise
     */
    private String confirmBooking(String bookingCode, String paymentMethod, String transactionNo) {
        // 1. Tìm booking
        Booking booking = bookingRepository.findByBookingCodeIgnoreCase(bookingCode).orElse(null);
        if (booking == null) {
            log.warn("Booking not found for code: {}", bookingCode);
            return "01"; // Order not found
        }

        // 2. Kiểm tra trạng thái hiện tại
        if (booking.getStatus() == Booking.BookingStatus.CONFIRMED
                || booking.getStatus() == Booking.BookingStatus.COMPLETED
                || booking.getStatus() == Booking.BookingStatus.CHECKED_IN) {
            log.info("Booking {} already confirmed, skipping duplicate IPN", booking.getBookingCode());
            return "0"; // Already processed, treat as success
        }

        // 3. Cập nhật trạng thái
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        booking.setConfirmedAt(LocalDateTime.now());
        booking.setCancelReason(null);
        bookingRepository.save(booking);

        // 4. Gửi email xác nhận thanh toán
        sendBookingConfirmationEmail(booking, paymentMethod, transactionNo);

        log.info("Booking {} confirmed via {} IPN", bookingCode, paymentMethod);
        return "0";
    }

    private String normalizePaymentRef(String paymentRef) {
        if (paymentRef == null) return "";
        paymentRef = paymentRef.trim();
        // Nếu đã là booking code format TRS-YYYYMMDD-XXXXX
        if (paymentRef.matches("TRS-\\d{8}-\\d{5}")) {
            return paymentRef;
        }
        // Ngược lại trả về nguyên — MoMo/ZaloPay orderId thường là bookingCode
        return paymentRef;
    }

    private void sendBookingConfirmationEmail(Booking booking, String paymentMethod, String transactionNo) {
        try {
            String bookingType = booking.getBookingType() != null ? booking.getBookingType().name() : "HOTEL";
            String serviceName = "";
            String serviceSubtitle = "";
            String checkIn = "";
            String checkOut = "";
            int adults = 0;
            int children = 0;
            int roomsOrSlots = 0;

            if (bookingType.equals("HOTEL")) {
                BookingHotelDetail detail = bookingHotelDetailRepository.findByBooking(booking).orElse(null);
                if (detail != null) {
                    serviceName = detail.getHotelName();
                    serviceSubtitle = "Phòng: " + detail.getRoomTypeName();
                    checkIn = detail.getCheckInDate() != null ? detail.getCheckInDate().format(DATE_FMT) : "";
                    checkOut = detail.getCheckOutDate() != null ? detail.getCheckOutDate().format(DATE_FMT) : "";
                    adults = detail.getAdults() != null ? detail.getAdults() : 0;
                    children = detail.getChildren() != null ? detail.getChildren() : 0;
                    roomsOrSlots = detail.getNumRooms() != null ? detail.getNumRooms() : 0;
                }
            } else {
                BookingTourDetail detail = bookingTourDetailRepository.findByBooking(booking).orElse(null);
                if (detail != null) {
                    serviceName = detail.getTourTitle();
                    serviceSubtitle = "Khởi hành: " + (detail.getDepartureDate() != null ? detail.getDepartureDate().format(DATE_FMT) : "");
                    checkIn = detail.getDepartureDate() != null ? detail.getDepartureDate().format(DATE_FMT) : "";
                    checkOut = "";
                    adults = detail.getNumAdults() != null ? detail.getNumAdults() : 0;
                    children = detail.getNumChildren() != null ? detail.getNumChildren() : 0;
                    roomsOrSlots = adults + children;
                }
            }

            emailService.sendBookingConfirmedEmail(
                    booking.getGuestEmail(),
                    booking.getBookingCode(),
                    bookingType,
                    serviceName,
                    serviceSubtitle,
                    checkIn,
                    checkOut,
                    adults,
                    children,
                    roomsOrSlots,
                    booking.getTotalAmount(),
                    booking.getCurrency(),
                    paymentMethod,
                    transactionNo != null ? transactionNo : "N/A");
        } catch (Exception e) {
            log.error("Failed to send confirmation email for booking {}: {}", booking.getBookingCode(), e.getMessage());
        }
    }
}
