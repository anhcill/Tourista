package vn.tourista.dto.response;

import lombok.*;
import vn.tourista.entity.Promotion;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PromotionResponse {
    private Long id;
    private String code;
    private String name;
    private String description;
    private String discountType;
    private BigDecimal discountValue;
    private BigDecimal minOrderAmount;
    private BigDecimal maxDiscountAmount;
    private String appliesTo;
    private LocalDateTime validFrom;
    private LocalDateTime validUntil;
    private Boolean isActive;

    public static PromotionResponse from(Promotion promo) {
        if (promo == null) return null;
        return PromotionResponse.builder()
                .id(promo.getId())
                .code(promo.getCode())
                .name(promo.getName())
                .description(promo.getDescription())
                .discountType(promo.getDiscountType() != null ? promo.getDiscountType().name() : null)
                .discountValue(promo.getDiscountValue())
                .minOrderAmount(promo.getMinOrderAmount())
                .maxDiscountAmount(promo.getMaxDiscountAmount())
                .appliesTo(promo.getAppliesTo() != null ? promo.getAppliesTo().name() : null)
                .validFrom(promo.getValidFrom())
                .validUntil(promo.getValidUntil())
                .isActive(promo.getIsActive())
                .build();
    }
}
