package vn.tourista.dto.response.partner;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartnerBookingResponse {
    private Long id;
    private String bookingCode;
    private String serviceType;
    private String serviceName;
    private String guestName;
    private String guestEmail;
    private String status;
    private String paymentStatus;
    private BigDecimal totalAmount;
    private String currency;
    private LocalDateTime checkIn;
    private LocalDateTime checkOut;
    private LocalDateTime createdAt;
    private LocalDateTime confirmedAt;
    private LocalDateTime cancelledAt;
}
