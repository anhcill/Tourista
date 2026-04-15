package vn.tourista.dto.response.admin;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Value
@Builder
public class AdminBookingItemResponse {
    Long id;
    String bookingCode;
    String bookingType;
    String guestName;
    String guestEmail;
    String serviceName;
    String serviceCity;
    LocalDate startDate;
    LocalDate endDate;
    String status;
    String paymentStatus;
    BigDecimal totalAmount;
    String currency;
    LocalDateTime createdAt;
    String note;
}