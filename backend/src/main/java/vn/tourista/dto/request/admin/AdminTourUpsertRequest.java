package vn.tourista.dto.request.admin;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
public class AdminTourUpsertRequest {

    @NotNull(message = "CategoryId khong duoc de trong")
    private Integer categoryId;

    @NotNull(message = "CityId khong duoc de trong")
    private Integer cityId;

    private Long operatorId;

    @NotBlank(message = "Title khong duoc de trong")
    @Size(max = 250, message = "Title toi da 250 ky tu")
    private String title;

    @Size(max = 5000, message = "Description toi da 5000 ky tu")
    private String description;

    @Size(max = 3000, message = "Highlights toi da 3000 ky tu")
    private String highlights;

    @Size(max = 2000, message = "Includes toi da 2000 ky tu")
    private String includes;

    @Size(max = 2000, message = "Excludes toi da 2000 ky tu")
    private String excludes;

    @NotNull(message = "DurationDays khong duoc de trong")
    @Min(value = 1, message = "DurationDays it nhat la 1")
    private Integer durationDays;

    private Integer durationNights;

    @NotNull(message = "MaxGroupSize khong duoc de trong")
    @Min(value = 1, message = "MaxGroupSize it nhat la 1")
    private Integer maxGroupSize;

    @NotNull(message = "MinGroupSize khong duoc de trong")
    private Integer minGroupSize;

    @NotBlank(message = "Difficulty khong duoc de trong")
    private String difficulty;

    @NotNull(message = "PricePerAdult khong duoc de trong")
    @DecimalMin(value = "0.01", message = "PricePerAdult phai lon hon 0")
    private BigDecimal pricePerAdult;

    private BigDecimal pricePerChild;

    private Boolean isFeatured;

    private Boolean isActive;

    private Boolean isTrending;

    @JsonAlias({ "imageUrls" })
    private List<String> imageUrls;

    @JsonAlias({ "itineraryItems" })
    private List<ItineraryRequest> itineraryItems;

    @JsonAlias({ "departureDates" })
    private List<DepartureRequest> departureDates;

    private String status;

    @NotBlank(message = "Reason khong duoc de trong")
    @Size(max = 500, message = "Reason toi da 500 ky tu")
    private String reason;

    @Getter
    @Setter
    public static class ItineraryRequest {
        private Long id;

        @NotNull(message = "DayNumber khong duoc de trong")
        @Min(value = 1, message = "DayNumber it nhat la 1")
        private Integer dayNumber;

        @NotBlank(message = "Itinerary title khong duoc de trong")
        @Size(max = 200, message = "Itinerary title toi da 200 ky tu")
        private String title;

        @Size(max = 2000, message = "Itinerary description toi da 2000 ky tu")
        private String description;
    }

    @Getter
    @Setter
    public static class DepartureRequest {
        @NotNull(message = "DepartureDate khong duoc de trong")
        private java.time.LocalDate departureDate;

        @NotNull(message = "AvailableSlots khong duoc de trong")
        @Min(value = 1, message = "AvailableSlots it nhat la 1")
        private Integer availableSlots;

        private BigDecimal priceOverride;
    }
}
