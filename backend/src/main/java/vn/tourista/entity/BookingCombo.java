package vn.tourista.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "booking_combos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingCombo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "combo_package_id", nullable = false)
    private ComboPackage comboPackage;

    @Column(name = "guest_name", nullable = false, length = 100)
    private String guestName;

    @Column(name = "guest_email", nullable = false, length = 100)
    private String guestEmail;

    @Column(name = "guest_phone", length = 20)
    private String guestPhone;

    @Column(name = "booking_date", nullable = false)
    private LocalDate bookingDate;

    @Column(name = "guest_count", nullable = false)
    @Builder.Default
    private Integer guestCount = 1;

    @Column(name = "nights", nullable = false)
    @Builder.Default
    private Integer nights = 1;

    @Column(name = "total_amount", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "payment_status", nullable = false, length = 20)
    @Builder.Default
    private String paymentStatus = "PENDING";

    @Column(name = "payment_method", length = 30)
    private String paymentMethod;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
