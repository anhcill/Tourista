package vn.tourista.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTourBookingResponse {

    private Long bookingId;
    private String bookingCode;
    private String status;
    private BigDecimal totalAmount;
    private String currency;

    private Long tourId;
    private String tourTitle;
    private Long departureId;
    private LocalDate departureDate;
    private Integer adults;
    private Integer children;

    private LocalDateTime createdAt;

    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private String promoCode;
}
