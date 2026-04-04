package vn.tourista.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HotelDetailResponse {

    private Long id;
    private String name;
    private String address;
    private String city;
    private Integer starRating;
    private BigDecimal avgRating;
    private Integer reviewCount;
    private String coverImage;
    private String description;
    private LocalTime checkInTime;
    private LocalTime checkOutTime;
    private List<RoomTypeItem> roomTypes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RoomTypeItem {
        private Long id;
        private String name;
        private Integer capacity;
        private BigDecimal basePricePerNight;
        private String description;
        private Integer totalRooms;
        private List<String> amenities;
    }
}
