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
public class CreateComboBookingResponse {

    private Long bookingId;
    private Long comboId;
    private String bookingCode;
    private String guestName;
    private String guestEmail;
    private LocalDate bookingDate;
    private Integer guestCount;
    private Integer nights;
    private BigDecimal totalAmount;
    private String paymentStatus;
    private String paymentMethod;
    private String paymentUrl;
    private LocalDateTime createdAt;
    private String message;
}
