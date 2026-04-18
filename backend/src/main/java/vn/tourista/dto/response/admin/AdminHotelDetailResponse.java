package vn.tourista.dto.response.admin;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Value
@Builder
public class AdminHotelDetailResponse {
    Long id;
    Integer cityId;
    String cityName;
    Long ownerId;
    String ownerName;
    String ownerEmail;
    String name;
    String slug;
    String description;
    String address;
    BigDecimal latitude;
    BigDecimal longitude;
    Integer starRating;
    BigDecimal avgRating;
    Integer reviewCount;
    LocalTime checkInTime;
    LocalTime checkOutTime;
    String phone;
    String email;
    String website;
    Boolean isFeatured;
    Boolean isTrending;
    Boolean isActive;
    String status;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
    List<String> imageUrls;
    List<String> amenityNames;
    List<RoomTypeDetail> roomTypes;

    @Value
    @Builder
    public static class RoomTypeDetail {
        Long id;
        String name;
        String description;
        Integer maxAdults;
        Integer maxChildren;
        String bedType;
        BigDecimal areaSqm;
        BigDecimal basePricePerNight;
        Integer totalRooms;
        Boolean isActive;
        List<String> imageUrls;
    }
}
