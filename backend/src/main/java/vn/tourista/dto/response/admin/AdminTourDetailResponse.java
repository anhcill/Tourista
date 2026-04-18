package vn.tourista.dto.response.admin;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Value
@Builder
public class AdminTourDetailResponse {
    Long id;
    Long categoryId;
    String categoryName;
    Long cityId;
    String cityName;
    Long operatorId;
    String operatorName;
    String operatorEmail;
    String title;
    String slug;
    String description;
    String highlights;
    String includes;
    String excludes;
    Integer durationDays;
    Integer durationNights;
    Integer maxGroupSize;
    Integer minGroupSize;
    String difficulty;
    BigDecimal pricePerAdult;
    BigDecimal pricePerChild;
    BigDecimal avgRating;
    Integer reviewCount;
    Boolean isFeatured;
    Boolean isTrending;
    Boolean isActive;
    String status;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    List<String> imageUrls;
    List<ItineraryDetail> itinerary;
    List<DepartureDetail> departures;

    @Value
    @Builder
    public static class ItineraryDetail {
        Long id;
        Integer dayNumber;
        String title;
        String description;
    }

    @Value
    @Builder
    public static class DepartureDetail {
        Long id;
        java.time.LocalDate departureDate;
        Integer availableSlots;
        BigDecimal priceOverride;
    }
}
