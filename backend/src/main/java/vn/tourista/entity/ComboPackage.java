package vn.tourista.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "combo_packages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComboPackage {

    public enum ComboType {
        HOTEL_PLUS_TOUR,
        MULTI_HOTEL,
        MULTI_TOUR,
        HOTEL_AIRPORT_TRANSFER,
        TOUR_BUNDLE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Lob
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "combo_type", nullable = false, length = 30)
    private ComboType comboType;

    @Column(name = "hotel_id")
    private Long hotelId;

    @Column(name = "tour_id")
    private Long tourId;

    @Column(name = "second_hotel_id")
    private Long secondHotelId;

    @Column(name = "second_tour_id")
    private Long secondTourId;

    @Column(name = "valid_from", nullable = false)
    private LocalDate validFrom;

    @Column(name = "valid_until", nullable = false)
    private LocalDate validUntil;

    @Column(name = "total_slots", nullable = false)
    private Integer totalSlots;

    @Column(name = "remaining_slots", nullable = false)
    private Integer remainingSlots;

    @Column(name = "original_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal originalPrice;

    @Column(name = "combo_price", nullable = false, precision = 14, scale = 2)
    private BigDecimal comboPrice;

    @Column(name = "savings_amount", precision = 14, scale = 2)
    private BigDecimal savingsAmount;

    @Column(name = "savings_percent")
    private Integer savingsPercent;

    @Column(name = "is_featured", nullable = false)
    @Builder.Default
    private Boolean isFeatured = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        recalculateSavings();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        recalculateSavings();
    }

    private void recalculateSavings() {
        if (originalPrice != null && comboPrice != null
                && originalPrice.compareTo(BigDecimal.ZERO) > 0
                && comboPrice.compareTo(originalPrice) < 0) {
            savingsAmount = originalPrice.subtract(comboPrice);
            savingsPercent = savingsAmount
                    .multiply(BigDecimal.valueOf(100))
                    .divide(originalPrice, 0, RoundingMode.HALF_UP)
                    .intValue();
        }
    }
}
