package vn.tourista.dto.response.admin;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminComboItemResponse {

    private Long id;
    private String name;
    private String description;
    private String imageUrl;
    private String comboType;
    private Long hotelId;
    private String hotelName;
    private Long tourId;
    private String tourName;
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
    private LocalDateTime updatedAt;
}
