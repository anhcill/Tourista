package vn.tourista.dto.response.partner;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartnerHotelResponse {
    private Long id;
    private String name;
    private String city;
    private Integer starRating;
    private BigDecimal avgRating;
    private Integer reviewCount;
    private Boolean isActive;
    private String adminStatus;
    private Integer totalBookings;
    private BigDecimal totalRevenue;
}
