package vn.tourista.dto.request;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CsvHotelRow {

    private String title;
    private String category;
    private String address;
    private String openHours;
    private String website;
    private String phone;
    private String plusCode;
    private Integer reviewCount;
    private BigDecimal reviewRating;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String placeId;
    private String descriptions;
    private String thumbnail;
    private String priceRange;
    private String completeAddress;
    private String about;
    private String images;
}
