package vn.tourista.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "pricing_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PricingRule {

    public enum RuleType {
        DAY_OF_WEEK,
        SEASON,
        LAST_MINUTE,
        EARLY_BIRD,
        GROUP_SIZE
    }

    public enum Season {
        PEAK,
        REGULAR,
        OFF
    }

    public enum TargetType {
        HOTEL,
        TOUR
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false)
    private TargetType targetType;

    @Column(name = "hotel_id")
    private Long hotelId;

    @Column(name = "tour_id")
    private Long tourId;

    @Enumerated(EnumType.STRING)
    @Column(name = "rule_type", nullable = false)
    private RuleType ruleType;

    @Enumerated(EnumType.STRING)
    @Column(name = "season")
    private Season season;

    @Column(name = "day_of_week")
    private Integer dayOfWeek;

    @Column(name = "advance_days_min")
    private Integer advanceDaysMin;

    @Column(name = "advance_days_max")
    private Integer advanceDaysMax;

    @Column(name = "slots_remaining_max")
    private Integer slotsRemainingMax;

    @Column(name = "adjustment_percent", nullable = false, precision = 5, scale = 2)
    private BigDecimal adjustmentPercent;

    @Column(name = "min_pax")
    private Integer minPax;

    @Column(name = "max_pax")
    private Integer maxPax;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "priority", nullable = false)
    private Integer priority;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isActive == null) isActive = true;
        if (priority == null) priority = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
