package vn.tourista.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity lưu trạng thái slot-filling của phiên gợi ý tour.
 *
 * Thay thế cho ConcurrentHashMap<Long, RecommendationState> trong BotService.
 * Giúp conversation context tồn tại qua server restart và multi-instance deployment.
 *
 * TTL: 20 phút không hoạt động → tự động xóa (cleanup job hoặc lazy check).
 */
@Entity
@Table(name = "session_recommendation_states", indexes = {
        @Index(name = "idx_rec_conv", columnList = "conversation_id", unique = true),
        @Index(name = "idx_rec_updated", columnList = "updated_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionRecommendationState {

    private static final int TIMEOUT_MINUTES = 20;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false, unique = true)
    private Conversation conversation;

    @Column(name = "budget_vnd")
    private Integer budgetVnd;

    @Column(name = "travelers")
    private Integer travelers;

    @Column(name = "city_query", length = 100)
    private String cityQuery;

    @Column(name = "city_display", length = 100)
    private String cityDisplay;

    @Column(name = "max_duration_days")
    private Integer maxDurationDays;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isExpired() {
        return updatedAt.isBefore(LocalDateTime.now().minusMinutes(TIMEOUT_MINUTES));
    }
}
