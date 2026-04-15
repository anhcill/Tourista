package vn.tourista.dto.response.admin;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Value
@Builder
public class AdminPromotionItemResponse {
    Long id;
    String code;
    String name;
    String description;
    String type;
    BigDecimal value;
    BigDecimal minOrderAmount;
    BigDecimal maxDiscountAmount;
    Integer usageLimit;
    Integer usedCount;
    String appliesTo;
    LocalDateTime startAt;
    LocalDateTime endAt;
    Boolean isActive;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}