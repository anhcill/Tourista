package vn.tourista.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity lưu trữ metadata về một phiên hội thoại với Bot.
 *
 * Mỗi phiên BOT conversation có một record ConversationSession duy nhất.
 * Entity này phục vụ việc:
 * - Theo dõi thời gian bắt đầu / hoạt động cuối của phiên
 * - Lưu context summary để Gemini có thể đọc nhanh thay vì query nhiều ChatMessage
 * - Phân biệt "fresh" vs "continued" conversation cho Gemini prompt
 */
@Entity
@Table(name = "conversation_sessions", indexes = {
        @Index(name = "idx_session_conversation", columnList = "conversation_id", unique = true),
        @Index(name = "idx_session_updated", columnList = "updated_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationSession {

    private static final int CONTEXT_SUMMARY_MAX_LENGTH = 2000;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", nullable = false, unique = true)
    private Conversation conversation;

    @Column(name = "session_started_at", nullable = false)
    private LocalDateTime sessionStartedAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Context summary — tóm tắt ngắn gọn nội dung hội thoại gần nhất.
     * Được cập nhật mỗi khi có tin nhắn mới (gói gọn 8-10 tin nhắn gần nhất).
     * Dùng làm quick context cho Gemini thay vì phải query nhiều ChatMessage.
     */
    @Column(name = "context_summary", columnDefinition = "TEXT")
    private String contextSummary;

    /**
     * Số lượng tin nhắn trong phiên (dùng để phân biệt "fresh" vs "in-progress").
     */
    @Column(name = "message_count", nullable = false)
    @Builder.Default
    private Integer messageCount = 0;

    /**
     * Tag đánh dấu trạng thái hội thoại hiện tại.
     * Ví dụ: "GREETING", "BOOKING_LOOKUP", "RECOMMENDATION_SLOT_FILLING", "FAQ", "CLOSED"
     */
    @Column(name = "current_intent_tag", length = 50)
    private String currentIntentTag;

    /**
     * TTL context — nếu phiên không hoạt động quá lâu (24h), context coi như expired.
     */
    @Column(name = "last_context_at")
    private LocalDateTime lastContextAt;

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.sessionStartedAt == null) {
            this.sessionStartedAt = now;
        }
        this.updatedAt = now;
        if (this.messageCount == null) {
            this.messageCount = 0;
        }
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Cập nhật context summary mà không vượt giới hạn độ dài.
     */
    public void appendToContextSummary(String newContent) {
        if (newContent == null || newContent.isBlank()) {
            return;
        }
        String current = this.contextSummary != null ? this.contextSummary : "";
        String appended = current.isEmpty() ? newContent : current + "\n" + newContent;
        if (appended.length() > CONTEXT_SUMMARY_MAX_LENGTH) {
            appended = appended.substring(appended.length() - CONTEXT_SUMMARY_MAX_LENGTH);
        }
        this.contextSummary = appended;
        this.lastContextAt = LocalDateTime.now();
    }

    /**
     * Kiểm tra context có bị expired không (24h không hoạt động).
     */
    public boolean isContextExpired() {
        if (lastContextAt == null) {
            return true;
        }
        return lastContextAt.isBefore(LocalDateTime.now().minusHours(24));
    }

    public void incrementMessageCount() {
        this.messageCount = (this.messageCount == null ? 0 : this.messageCount) + 1;
    }
}
