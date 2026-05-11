package vn.tourista.dto.response.partner;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartnerHotelResponse {
    private Long id;
    private Integer cityId;
    private String name;
    private String city;
    private String address;
    private Integer starRating;
    private String description;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String checkInTime;
    private String checkOutTime;
    private String phone;
    private String email;
    private String website;
    private BigDecimal avgRating;
    private Integer reviewCount;
    private Boolean isActive;
    private String adminStatus;
    private Integer totalBookings;
    private BigDecimal totalRevenue;
    private List<String> imageUrls;
}
