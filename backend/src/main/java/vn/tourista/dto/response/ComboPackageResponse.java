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
public class ComboPackageResponse {

    private Long id;
    private String name;
    private String description;
    private String imageUrl;
    private String comboType;
    private Long hotelId;
    private String hotelName;
    private String hotelImageUrl;
    private Integer hotelStars;
    private Long tourId;
    private String tourName;
    private String tourImageUrl;
    private Integer tourDays;
    private Long secondHotelId;
    private String secondHotelName;
    private Long secondTourId;
    private String secondTourName;
    private LocalDate validFrom;
    private LocalDate validUntil;
    private Integer totalSlots;
    private Integer remainingSlots;
    private BigDecimal originalPrice;
    private BigDecimal comboPrice;
    private BigDecimal savingsAmount;
    private Integer savingsPercent;
    private Boolean isFeatured;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
