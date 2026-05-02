package vn.tourista.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {

    public enum TargetType {
        HOTEL,
        TOUR
    }

    public enum ModerationStatus {
        PENDING,
        APPROVED,
        REJECTED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "booking_id")
    private Long bookingId;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false)
    private TargetType targetType;

    @Column(name = "target_id", nullable = false)
    private Long targetId;

    @Column(name = "overall_rating", nullable = false)
    private Integer overallRating;

    @Column(name = "title", length = 200)
    private String title;

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;

    @Column(name = "cleanliness")
    private Integer cleanliness;

    @Column(name = "location")
    private Integer location;

    @Column(name = "service")
    private Integer service;

    @Column(name = "value_for_money")
    private Integer valueForMoney;

    @Column(name = "guide_quality")
    private Integer guideQuality;

    @Column(name = "organization")
    private Integer organization;

    @Column(name = "is_verified", nullable = false)
    private Boolean isVerified;

    @Column(name = "is_published", nullable = false)
    private Boolean isPublished;

    @Enumerated(EnumType.STRING)
    @Column(name = "moderation_status", length = 20)
    private ModerationStatus moderationStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "admin_status", nullable = false, length = 20)
    private AdminStatus adminStatus;

    @Column(name = "rejection_reason", length = 255)
    private String rejectionReason;

    @Column(name = "helpful_count", nullable = false)
    private Integer helpfulCount;

    @Column(name = "admin_reply", columnDefinition = "TEXT")
    private String adminReply;

    @Column(name = "admin_replied_at")
    private LocalDateTime adminRepliedAt;

    @Column(name = "partner_id")
    private Long partnerId;

    @Column(name = "partner_reply", columnDefinition = "TEXT")
    private String partnerReply;

    @Column(name = "partner_replied_at")
    private LocalDateTime partnerRepliedAt;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public enum AdminStatus {
        PENDING,
        APPROVED,
        REJECTED
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (adminStatus == null) adminStatus = AdminStatus.PENDING;
        if (moderationStatus == null) moderationStatus = ModerationStatus.PENDING;
        if (isPublished == null) isPublished = true;
        if (isVerified == null) isVerified = false;
        if (helpfulCount == null) helpfulCount = 0;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
