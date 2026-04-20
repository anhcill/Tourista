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
public class PartnerTourResponse {
    private Long id;
    private String title;
    private String city;
    private Integer durationDays;
    private BigDecimal pricePerAdult;
    private BigDecimal avgRating;
    private Integer reviewCount;
    private Boolean isActive;
    private Integer totalBookings;
    private BigDecimal totalRevenue;
}
