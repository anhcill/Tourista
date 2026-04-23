package vn.tourista.dto.response;

import java.math.BigDecimal;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HotelPriceResponse {

    private Long hotelId;
    private String hotelName;
    private List<RoomPrice> rooms;
    private BigDecimal minPriceFrom;
    private BigDecimal maxPriceFrom;
    private String priceNote;
    private long generatedAtMs;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoomPrice {
        private Long roomTypeId;
        private String name;
        private String bedType;
        private BigDecimal basePrice;
        private BigDecimal currentPrice;
        private BigDecimal priceVariance;
        private String variancePercent;
        private Boolean isOnSale;
    }
}
