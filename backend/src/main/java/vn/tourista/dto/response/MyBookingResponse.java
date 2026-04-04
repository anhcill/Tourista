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
public class MyBookingResponse {

    private Long bookingId;
    private String bookingCode;
    private String bookingType;
    private String status;
    private BigDecimal totalAmount;
    private String currency;

    private Long hotelId;
    private String hotelName;
    private Long roomTypeId;
    private String roomTypeName;

    private LocalDate checkIn;
    private LocalDate checkOut;
    private Integer nights;
    private Integer rooms;
    private Integer adults;
    private Integer children;

    private Long tourId;
    private String tourTitle;
    private Long departureId;
    private LocalDate departureDate;

    private LocalDateTime createdAt;
}
