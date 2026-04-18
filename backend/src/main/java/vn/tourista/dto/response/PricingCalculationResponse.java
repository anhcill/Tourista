package vn.tourista.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PricingCalculationResponse {

    private Long entityId;
    private String entityType;
    private BigDecimal basePrice;
    private BigDecimal finalPrice;
    private BigDecimal totalDiscount;
    private BigDecimal discountPercent;
    private boolean hasDynamicPricing;
    private List<AppliedRuleInfo> appliedRules;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AppliedRuleInfo {
        private Long ruleId;
        private String name;
        private String description;
        private BigDecimal adjustmentPercent;
        private String reason;
    }
}
