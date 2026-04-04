package vn.tourista.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TourDetailResponse {

    private Long id;
    private String title;
    private String slug;
    private String city;
    private String categoryName;
    private String description;
    private List<String> highlights;
    private List<String> includes;
    private List<String> excludes;
    private Integer durationDays;
    private Integer durationNights;
    private String difficulty;
    private Integer maxGroupSize;
    private Integer minGroupSize;
    private BigDecimal avgRating;
    private Integer reviewCount;
    private String coverImage;
    private List<String> images;
    private BigDecimal pricePerAdult;
    private BigDecimal pricePerChild;
    private List<TourItineraryItem> itinerary;
    private List<TourDepartureItem> departures;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TourItineraryItem {
        private Integer dayNumber;
        private String title;
        private String description;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TourDepartureItem {
        private Long departureId;
        private LocalDate departureDate;
        private Integer availableSlots;
        private BigDecimal priceOverride;
    }
}
