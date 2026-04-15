package vn.tourista.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;
import vn.tourista.entity.ChatMessage;
import vn.tourista.entity.Conversation;

import java.time.LocalDateTime;

/**
 * DTO trả về thông tin một hội thoại trong danh sách Inbox
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ConversationResponse {

    private Long id;
    private String type;         // BOT / P2P_TOUR / P2P_HOTEL

    // Thông tin đối phương (từ góc nhìn của user đang login)
    private Long partnerId;
    private String partnerName;
    private String partnerAvatar;

    // Thông tin tham chiếu dịch vụ
    private Long referenceId;
    private Long bookingId;
    private String bookingCode;

    // Tin nhắn cuối để hiển thị snippet
    private String lastMessageSnippet;
    private String lastMessageType;
    private LocalDateTime lastMessageAt;

    // Số tin chưa đọc
    private long unreadCount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ConversationResponse from(Conversation conv, boolean viewingAsClient,
                                             String lastSnippet, String lastType,
                                             LocalDateTime lastAt, long unread) {
        ConversationResponseBuilder builder = ConversationResponse.builder()
                .id(conv.getId())
                .type(conv.getType().name())
                .referenceId(conv.getReferenceId())
                .lastMessageSnippet(lastSnippet)
                .lastMessageType(lastType)
                .lastMessageAt(lastAt)
                .unreadCount(unread)
                .createdAt(conv.getCreatedAt())
                .updatedAt(conv.getUpdatedAt());

        // Nếu type = BOT, đối phương là "Hỗ trợ Tourista"
        if (conv.getType() == Conversation.ConversationType.BOT) {
            builder.partnerName("Hỗ trợ Tourista 🤖");
        } else {
            // Partner của người đang xem là đối phương
            var other = viewingAsClient ? conv.getPartner() : conv.getClient();
            if (other != null) {
                builder.partnerId(other.getId())
                        .partnerName(other.getFullName())
                        .partnerAvatar(other.getAvatarUrl());
            }
        }

        if (conv.getBooking() != null) {
            builder.bookingId(conv.getBooking().getId())
                    .bookingCode(conv.getBooking().getBookingCode());
        }

        return builder.build();
    }
}
