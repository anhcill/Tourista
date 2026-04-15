package vn.tourista.dto.response.admin;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Value
@Builder
public class AdminHotelItemResponse {
    Long id;
    String name;
    String city;
    String address;
    Integer starRating;
    BigDecimal avgRating;
    Integer reviewCount;
    String hostName;
    String hostEmail;
    String status;
    Boolean isActive;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}