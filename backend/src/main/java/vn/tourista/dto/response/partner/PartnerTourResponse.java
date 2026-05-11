package vn.tourista.dto.response.partner;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartnerTourResponse {
    private Long id;
    private Integer categoryId;
    private Integer cityId;
    private String title;
    private String city;
    private String description;
    private String highlights;
    private String includes;
    private String excludes;
    private Integer durationDays;
    private Integer durationNights;
    private Integer maxGroupSize;
    private Integer minGroupSize;
    private String difficulty;
    private BigDecimal pricePerAdult;
    private BigDecimal pricePerChild;
    private BigDecimal avgRating;
    private Integer reviewCount;
    private Boolean isActive;
    private String adminStatus;
    private Integer totalBookings;
    private BigDecimal totalRevenue;
    private List<String> imageUrls;
    private String coverImage;
    private List<ItineraryItem> itineraryItems;
    private List<DepartureItem> departureDates;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ItineraryItem {
        private Long id;
        private Integer dayNumber;
        private String title;
        private String description;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DepartureItem {
        private Long id;
        private LocalDate departureDate;
        private Integer availableSlots;
        private BigDecimal priceOverride;
    }
}
