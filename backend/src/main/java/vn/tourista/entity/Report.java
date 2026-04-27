package vn.tourista.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Bang reports: user/partner bao cao van de hoac yeu cau ho tro admin.
 * - User knieu nai partner → tao report
 * - Partner bao cao user vi pham → tao report
 * - Bat cu ben deu co the yeu cau ho tro admin
 */
@Entity
@Table(name = "reports", indexes = {
        @Index(name = "idx_report_reporter", columnList = "reporter_id"),
        @Index(name = "idx_report_status", columnList = "status"),
        @Index(name = "idx_report_created", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Nguoi gui bao cao
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;

    // Nguoi bi bao cao (co the la null neu chi la yeu cau ho tro)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_user_id")
    private User reportedUser;

    // Cuoc tro chuyen lien quan (neu co)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id")
    private Conversation conversation;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 30)
    private ReportType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ReportStatus status = ReportStatus.PENDING;

    @Column(name = "reason", columnDefinition = "TEXT", nullable = false)
    private String reason;

    // Ghi chu cua admin sau khi xu ly
    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public enum ReportType {
        // Khach hang khieu nai doi tac
        USER_COMPLAINT_PARTNER,
        // Dong tac bao cao khach hang vi pham
        PARTNER_REPORT_USER,
        // Yeu cau ho tro tu user
        USER_REQUEST_SUPPORT,
        // Yeu cau ho tro tu partner
        PARTNER_REQUEST_SUPPORT,
        // Bao cao noi dung khong phu hop
        CONTENT_VIOLATION,
        // Khieu nai thanh toan
        PAYMENT_ISSUE
    }

    public enum ReportStatus {
        PENDING,
        REVIEWING,
        RESOLVED,
        REJECTED
    }
}
