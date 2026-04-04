package vn.tourista.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TourSummaryResponse {

    private Long id;
    private String title;
    private String slug;
    private String city;
    private String categoryName;
    private Integer durationDays;
    private Integer durationNights;
    private String difficulty;
    private BigDecimal avgRating;
    private Integer reviewCount;
    private String coverImage;
    private BigDecimal pricePerAdult;
    private BigDecimal pricePerChild;
    private LocalDate nearestDepartureDate;
    private Integer availableSlots;
}
