package vn.tourista.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HotelSummaryResponse {

    private Long id;
    private String name;
    private String address;
    private String city;
    private Integer starRating;
    private BigDecimal avgRating;
    private Integer reviewCount;
    private String coverImage;
    private BigDecimal minPricePerNight;
    private Integer availableRoomTypes;
    private Integer availableRooms;
}
