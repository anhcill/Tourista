package vn.tourista.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.tourista.dto.request.CreateVnpayPaymentRequest;
import vn.tourista.dto.response.CreateVnpayPaymentResponse;
import vn.tourista.dto.response.VnpayReturnResponse;
import vn.tourista.entity.Booking;
import vn.tourista.entity.BookingHotelDetail;
import vn.tourista.entity.BookingTourDetail;
import vn.tourista.repository.BookingHotelDetailRepository;
import vn.tourista.repository.BookingRepository;
import vn.tourista.repository.BookingTourDetailRepository;
import vn.tourista.service.EmailService;
import vn.tourista.service.VnpayService;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.TreeMap;

@Service
@Transactional
public class VnpayServiceImpl implements VnpayService {

    private static final String VERSION = "2.1.0";
    private static final String COMMAND = "pay";
    private static final String CURR_CODE = "VND";
    private static final String DEFAULT_ORDER_TYPE = "other";
    private static final String DEFAULT_LOCALE = "vn";
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter VNPAY_TIME = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final java.time.ZoneId VN_ZONE = java.time.ZoneId.of("Asia/Ho_Chi_Minh");

    private final BookingRepository bookingRepository;
    private final BookingHotelDetailRepository bookingHotelDetailRepository;
    private final BookingTourDetailRepository bookingTourDetailRepository;
    private final EmailService emailService;

    @Value("${app.vnpay.tmn-code:}")
    private String tmnCode;

    @Value("${app.vnpay.hash-secret:}")
    private String hashSecret;

    @Value("${app.vnpay.pay-url:https://sandbox.vnpayment.vn/paymentv2/vpcpay.html}")
    private String payUrl;

    @Value("${app.vnpay.return-url:http://localhost:3000/payments/vnpay/return}")
    private String configuredReturnUrl;

    @Value("${app.vnpay.order-type:other}")
    private String orderType;

    @Value("${app.vnpay.locale:vn}")
    private String locale;

    public VnpayServiceImpl(BookingRepository bookingRepository,
            BookingHotelDetailRepository bookingHotelDetailRepository,
            BookingTourDetailRepository bookingTourDetailRepository,
            EmailService emailService) {
        this.bookingRepository = bookingRepository;
        this.bookingHotelDetailRepository = bookingHotelDetailRepository;
        this.bookingTourDetailRepository = bookingTourDetailRepository;
        this.emailService = emailService;
    }

    @Override
    public CreateVnpayPaymentResponse createPaymentUrl(String userEmail, String clientIp,
            CreateVnpayPaymentRequest request) {
        ensureConfigured();

        Booking booking = resolveBookingForPayment(request);

        String bookingOwnerEmail = booking.getUser() != null ? booking.getUser().getEmail() : null;
        if (bookingOwnerEmail == null || userEmail == null || !bookingOwnerEmail.equalsIgnoreCase(userEmail)) {
            throw new NoSuchElementException("Không tìm thấy booking của tài khoản hiện tại");
        }

        if (booking.getStatus() == Booking.BookingStatus.CONFIRMED
                || booking.getStatus() == Booking.BookingStatus.COMPLETED
                || booking.getStatus() == Booking.BookingStatus.CHECKED_IN) {
            throw new IllegalArgumentException("Booking đã được thanh toán hoặc xác nhận");
        }

        long amount = booking.getTotalAmount().multiply(BigDecimal.valueOf(100)).longValue();
        if (amount <= 0) {
            throw new IllegalArgumentException("Số tiền thanh toán không hợp lệ");
        }

        LocalDateTime now = LocalDateTime.now(VN_ZONE);
        LocalDateTime expiresAt = now.plusMinutes(15);

        Map<String, String> vnpParams = new HashMap<>();
        vnpParams.put("vnp_Version", VERSION);
        vnpParams.put("vnp_Command", COMMAND);
        vnpParams.put("vnp_TmnCode", tmnCode);
        vnpParams.put("vnp_Amount", String.valueOf(amount));
        vnpParams.put("vnp_CurrCode", CURR_CODE);
        vnpParams.put("vnp_TxnRef", booking.getBookingCode());
        vnpParams.put("vnp_OrderInfo", "Thanh toan dat phong " + booking.getBookingCode());
        vnpParams.put("vnp_OrderType", valueOrDefault(orderType, DEFAULT_ORDER_TYPE));
        vnpParams.put("vnp_Locale", valueOrDefault(locale, DEFAULT_LOCALE));
        vnpParams.put("vnp_ReturnUrl", valueOrDefault(request.getReturnUrl(), configuredReturnUrl));
        vnpParams.put("vnp_IpAddr", normalizeClientIp(clientIp));
        vnpParams.put("vnp_CreateDate", now.format(VNPAY_TIME));
        vnpParams.put("vnp_ExpireDate", expiresAt.format(VNPAY_TIME));

        if (request.getBankCode() != null && !request.getBankCode().isBlank()) {
            vnpParams.put("vnp_BankCode", request.getBankCode().trim());
        }

        String query = buildQuery(vnpParams);
        String secureHash = hmacSha512(hashSecret, query);
        String paymentUrl = payUrl + "?" + query + "&vnp_SecureHash=" + secureHash;

        return CreateVnpayPaymentResponse.builder()
                .bookingCode(booking.getBookingCode())
                .paymentUrl(paymentUrl)
                .provider("VNPAY")
                .expiresAt(expiresAt)
                .build();
    }

    @Override
    public Map<String, String> handleIpn(Map<String, String> vnpParams) {
        ensureConfigured();
        if (!isValidSignature(vnpParams)) {
            return response("97", "Invalid checksum");
        }

        String txnRef = vnpParams.get("vnp_TxnRef");
        if (txnRef == null || txnRef.isBlank()) {
            return response("01", "Order not found");
        }

        Booking booking = bookingRepository.findByBookingCode(txnRef)
                .orElse(null);
        if (booking == null) {
            return response("01", "Order not found");
        }

        if (booking.getStatus() == Booking.BookingStatus.CONFIRMED
                || booking.getStatus() == Booking.BookingStatus.COMPLETED
                || booking.getStatus() == Booking.BookingStatus.CHECKED_IN) {
            return response("02", "Order already confirmed");
        }

        long expectedAmount = booking.getTotalAmount().multiply(BigDecimal.valueOf(100)).longValue();
        long callbackAmount = parseLong(vnpParams.get("vnp_Amount"));
        if (expectedAmount != callbackAmount) {
            return response("04", "Invalid amount");
        }

        String responseCode = vnpParams.get("vnp_ResponseCode");
        String transactionStatus = vnpParams.get("vnp_TransactionStatus");

        if ("00".equals(responseCode) && "00".equals(transactionStatus)) {
            booking.setStatus(Booking.BookingStatus.CONFIRMED);
            booking.setConfirmedAt(LocalDateTime.now());
            bookingRepository.save(booking);

            // Gửi email xác nhận thanh toán thành công
            String transactionNo = vnpParams.getOrDefault("vnp_TransactionNo", "N/A");
            sendBookingConfirmationEmail(booking, "VNPAY", transactionNo);
            return response("00", "Confirm Success");
        }

        return response("00", "Received but payment failed");
    }

    @Override
    public VnpayReturnResponse parseReturn(Map<String, String> vnpParams) {
        boolean valid = isValidSignature(vnpParams);
        String bookingCode = valueOrDefault(vnpParams.get("vnp_TxnRef"), "");
        String responseCode = valueOrDefault(vnpParams.get("vnp_ResponseCode"), "");
        String transactionStatus = valueOrDefault(vnpParams.get("vnp_TransactionStatus"), "");
        String transactionNo = valueOrDefault(vnpParams.get("vnp_TransactionNo"), "");
        String amountRaw = valueOrDefault(vnpParams.get("vnp_Amount"), "0");

        boolean success = valid && "00".equals(responseCode) && "00".equals(transactionStatus);

        Booking booking = null;
        if (!bookingCode.isBlank()) {
            booking = bookingRepository.findByBookingCode(bookingCode).orElse(null);
        }

        return VnpayReturnResponse.builder()
                .validSignature(valid)
                .success(success)
                .bookingCode(bookingCode)
                .bookingStatus(booking != null && booking.getStatus() != null ? booking.getStatus().name() : null)
                .responseCode(responseCode)
                .transactionStatus(transactionStatus)
                .transactionNo(transactionNo)
                .amount(formatAmount(amountRaw))
                .message(buildReturnMessage(valid, responseCode, transactionStatus))
                .build();
    }

    private Booking resolveBookingForPayment(CreateVnpayPaymentRequest request) {
        if (request.getBookingId() != null) {
            return bookingRepository.findById(request.getBookingId())
                    .orElseThrow(() -> new NoSuchElementException("Không tìm thấy booking theo bookingId"));
        }

        if (request.getBookingCode() == null || request.getBookingCode().isBlank()) {
            throw new IllegalArgumentException("Thiếu mã booking để tạo thanh toán");
        }

        String bookingCode = request.getBookingCode().trim();
        return bookingRepository.findByBookingCodeIgnoreCase(bookingCode)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy booking với mã: " + bookingCode));
    }

    private String buildReturnMessage(boolean validSignature, String responseCode, String transactionStatus) {
        if (!validSignature) {
            return "Chữ ký callback không hợp lệ";
        }
        if ("00".equals(responseCode) && "00".equals(transactionStatus)) {
            return "Thanh toán thành công";
        }
        return "Thanh toán chưa thành công hoặc đã bị hủy";
    }

    private boolean isValidSignature(Map<String, String> vnpParams) {
        String callbackHash = vnpParams.get("vnp_SecureHash");
        if (callbackHash == null || callbackHash.isBlank()) {
            return false;
        }

        Map<String, String> cloned = new HashMap<>(vnpParams);
        cloned.remove("vnp_SecureHash");
        cloned.remove("vnp_SecureHashType");

        String signedData = buildQuery(cloned);
        String calculatedHash = hmacSha512(hashSecret, signedData);
        return calculatedHash.equalsIgnoreCase(callbackHash);
    }

    private String buildQuery(Map<String, String> params) {
        TreeMap<String, String> sorted = new TreeMap<>(params);
        StringBuilder sb = new StringBuilder();

        for (Map.Entry<String, String> entry : sorted.entrySet()) {
            String key = entry.getKey();
            String value = entry.getValue();
            if (value == null || value.isBlank()) {
                continue;
            }
            if (sb.length() > 0) {
                sb.append('&');
            }
            sb.append(key)
                    .append('=')
                    .append(urlEncode(value));
        }

        return sb.toString();
    }

    private String hmacSha512(String secret, String data) {
        try {
            Mac hmac = Mac.getInstance("HmacSHA512");
            SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            hmac.init(keySpec);
            byte[] bytes = hmac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hash = new StringBuilder();
            for (byte b : bytes) {
                hash.append(String.format("%02x", b));
            }
            return hash.toString();
        } catch (Exception ex) {
            throw new IllegalStateException("Không thể tạo chữ ký VNPAY", ex);
        }
    }

    private String urlEncode(String input) {
        return URLEncoder.encode(input, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private String valueOrDefault(String value, String fallback) {
        if (value != null && !value.isBlank()) {
            return value.trim();
        }
        return fallback;
    }

    private String normalizeClientIp(String clientIp) {
        if (clientIp == null || clientIp.isBlank()) {
            return "127.0.0.1";
        }
        if (clientIp.contains(",")) {
            List<String> parts = List.of(clientIp.split(","));
            return parts.get(0).trim();
        }
        return clientIp.trim();
    }

    private long parseLong(String value) {
        try {
            return Long.parseLong(value == null ? "0" : value);
        } catch (NumberFormatException ex) {
            return -1;
        }
    }

    private String formatAmount(String amountRaw) {
        long raw = parseLong(amountRaw);
        if (raw < 0) {
            return "0";
        }
        return String.valueOf(raw / 100);
    }

    private Map<String, String> response(String code, String message) {
        Map<String, String> result = new HashMap<>();
        result.put("RspCode", code);
        result.put("Message", message);
        return result;
    }

    private void ensureConfigured() {
        if (tmnCode == null || tmnCode.isBlank() || hashSecret == null || hashSecret.isBlank()) {
            throw new IllegalStateException("VNPAY chưa được cấu hình đầy đủ (tmn-code/hash-secret)");
        }
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
                    checkIn = detail.getCheckInDate().format(DATE_FMT);
                    checkOut = detail.getCheckOutDate().format(DATE_FMT);
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
            // Log lỗi nhưng không throw — email thất bại không được phép break payment flow
        }
    }
}
