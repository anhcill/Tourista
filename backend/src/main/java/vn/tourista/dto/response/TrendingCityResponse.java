package vn.tourista.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrendingCityResponse {
    private Long id;
    private String nameVi;
    private String nameEn;
    private String countryFlag;
    private String countryName;
    private Integer hotelCount;
    private Integer tourCount;
    private Double avgHotelPrice;
    private Double avgRating;
    private String coverImage;
    private String description;
    private String topHotelName;
    private Double topHotelRating;
}
