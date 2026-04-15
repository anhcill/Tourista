package vn.tourista.dto.response.admin;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Value
@Builder
public class AdminTourItemResponse {
    Long id;
    String title;
    String city;
    String location;
    Integer durationDays;
    BigDecimal priceFrom;
    String operatorName;
    String operatorEmail;
    String status;
    Boolean isActive;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}