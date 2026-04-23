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
import java.time.LocalTime;
import java.util.List;

@Getter
@Setter
public class AdminHotelUpsertRequest {

    @NotNull(message = "CityId khong duoc de trong")
    private Integer cityId;

    private Long ownerId;

    @NotBlank(message = "Name khong duoc de trong")
    @Size(max = 200, message = "Name toi da 200 ky tu")
    private String name;

    @Size(max = 2000, message = "Description toi da 2000 ky tu")
    private String description;

    @NotBlank(message = "Address khong duoc de trong")
    @Size(max = 300, message = "Address toi da 300 ky tu")
    private String address;

    private BigDecimal latitude;

    private BigDecimal longitude;

    @NotNull(message = "StarRating khong duoc de trong")
    @Min(value = 1, message = "StarRating tu 1 den 5")
    @Max(value = 5, message = "StarRating tu 1 den 5")
    private Integer starRating;

    @JsonAlias({ "checkInTime" })
    private LocalTime checkInTime;

    @JsonAlias({ "checkOutTime" })
    private LocalTime checkOutTime;

    @Size(max = 20, message = "Phone toi da 20 ky tu")
    private String phone;

    @Size(max = 150, message = "Email toi da 150 ky tu")
    private String email;

    @Size(max = 300, message = "Website toi da 300 ky tu")
    private String website;

    private Boolean isFeatured;

    private Boolean isTrending;

    private Boolean isActive;

    @JsonAlias({ "amenityIds" })
    private List<Integer> amenityIds;

    @JsonAlias({ "imageUrls" })
    private List<String> imageUrls;

    private String coverImage;

    @JsonAlias({ "roomTypes" })
    private List<RoomTypeRequest> roomTypes;

    private String status;

    @NotBlank(message = "Reason khong duoc de trong")
    @Size(max = 500, message = "Reason toi da 500 ky tu")
    private String reason;

    @Getter
    @Setter
    public static class RoomTypeRequest {
        private Long id;

        @NotBlank(message = "RoomType name khong duoc de trong")
        @Size(max = 100, message = "RoomType name toi da 100 ky tu")
        private String name;

        @Size(max = 2000, message = "RoomType description toi da 2000 ky tu")
        private String description;

        @NotNull(message = "MaxAdults khong duoc de trong")
        @Min(value = 1, message = "MaxAdults it nhat la 1")
        private Integer maxAdults;

        @NotNull(message = "MaxChildren khong duoc de trong")
        private Integer maxChildren;

        @Size(max = 50, message = "BedType toi da 50 ky tu")
        private String bedType;

        private BigDecimal areaSqm;

        @NotNull(message = "BasePricePerNight khong duoc de trong")
        @DecimalMin(value = "0.01", message = "BasePricePerNight phai lon hon 0")
        private BigDecimal basePricePerNight;

        @NotNull(message = "TotalRooms khong duoc de trong")
        @Min(value = 1, message = "TotalRooms it nhat la 1")
        private Integer totalRooms;

        private Boolean isActive;

        @JsonAlias({ "imageUrls" })
        private List<String> imageUrls;
    }
}
