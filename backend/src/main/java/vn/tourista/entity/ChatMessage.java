package vn.tourista.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Bảng chat_messages: lưu từng tin nhắn trong một phiên chat
 * - sender_id = NULL nghĩa là tin nhắn do BOT sinh ra
 * - content_type = BOOKING_DETAILS: metadata chứa JSON lịch trình đầy đủ
 */
@Entity
@Table(name = "chat_messages", indexes = {
        @Index(name = "idx_msg_conversation", columnList = "conversation_id"),
        @Index(name = "idx_msg_created", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    // NULL nếu tin nhắn do BOT tạo ra
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id")
    private User sender;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false, length = 30)
    @Builder.Default
    private ContentType contentType = ContentType.TEXT;

    // Text hoặc URL ảnh (content_type = TEXT / IMAGE)
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    // JSON payload đầy đủ khi content_type = BOOKING_DETAILS
    // Chứa: bookingCode, status, tourTitle, itinerary[], includes, excludes...
    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    // false = chưa đọc, true = đã đọc
    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public enum ContentType {
        TEXT,
        IMAGE,
        BOOKING_DETAILS,  // Bot trả về thông tin booking đầy đủ dạng Rich Card
        TOUR_CARDS,       // Bot trả về danh sách tour gợi ý dạng Card có CTA
        SCENARIO_CHOICE,  // Bot đưa ra kịch bản để user chọn (beach, mountain...)
        FAQ_MENU,         // Bot đưa ra menu FAQ nhanh để user chọn
        SYSTEM_LOG,        // Tin nhắn hệ thống: "Cuộc trò chuyện đã bắt đầu"
        AI_TEXT,           // Trả lời từ AI chatbot (xử lý câu hỏi tự do)
        TYPING             // Typing indicator — frontend hiện "đang nhắn..."
    }
}
