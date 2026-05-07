package vn.tourista.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Bảng conversations: đại diện cho một phiên chat
 * - BOT: khách chat với bot tự động
 * - P2P_TOUR: khách chat với chủ Tour
 * - P2P_HOTEL: khách chat với chủ Khách sạn
 */
@Entity
@Table(name = "conversations", indexes = {
        @Index(name = "idx_conv_client", columnList = "client_id"),
        @Index(name = "idx_conv_partner", columnList = "partner_id"),
        @Index(name = "idx_conv_updated", columnList = "updated_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 10)
    private ConversationType type;

    // Khách hàng (nullable cho anonymous user)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private User client;

    // Chủ tour/hotel (NULL nếu type = BOT)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partner_id")
    private User partner;

    // ID của Tour hoặc Hotel liên quan (để partner tra cứu nhanh)
    @Column(name = "reference_id")
    private Long referenceId;

    // Booking liên quan — tự populate khi chat từ trang Lịch sử Booking
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id")
    private Booking booking;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // updated_at cập nhật mỗi khi có tin nhắn mới (để sort danh sách chat)
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

    public enum ConversationType {
        BOT,
        P2P_TOUR,
        P2P_HOTEL
    }
}
