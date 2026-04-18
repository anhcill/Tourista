package vn.tourista.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import vn.tourista.entity.PricingRule;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PricingRuleRequest {

    private PricingRule.TargetType targetType;
    private Long hotelId;
    private Long tourId;

    @NotNull(message = "Rule type is required")
    private PricingRule.RuleType ruleType;

    private PricingRule.Season season;
    private Integer dayOfWeek;

    @Min(value = 0, message = "Min advance days cannot be negative")
    private Integer advanceDaysMin;

    @Min(value = 0, message = "Max advance days cannot be negative")
    private Integer advanceDaysMax;

    @Min(value = 1, message = "Min slots remaining must be at least 1")
    private Integer slotsRemainingMax;

    @NotNull(message = "Adjustment percent is required")
    @DecimalMin(value = "-50.00", message = "Adjustment cannot be less than -50%")
    @DecimalMax(value = "200.00", message = "Adjustment cannot exceed 200%")
    private BigDecimal adjustmentPercent;

    @Min(value = 1, message = "Min pax must be at least 1")
    private Integer minPax;

    @Min(value = 1, message = "Max pax must be at least 1")
    private Integer maxPax;

    @NotBlank(message = "Name is required")
    @Size(max = 200, message = "Name cannot exceed 200 characters")
    private String name;

    @Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;

    @Min(value = 0, message = "Priority cannot be negative")
    private Integer priority;

    private Boolean isActive;
    private java.time.LocalDateTime startDate;
    private java.time.LocalDateTime endDate;
}
