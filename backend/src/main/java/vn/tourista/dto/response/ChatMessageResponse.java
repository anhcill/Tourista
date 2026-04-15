package vn.tourista.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;
import vn.tourista.entity.ChatMessage;

import java.time.LocalDateTime;

/**
 * DTO trả về một tin nhắn trong khung chat
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChatMessageResponse {

    private Long id;
    private Long conversationId;

    // null nghĩa là BOT gửi
    private Long senderId;
    private String senderName;
    private String senderAvatar;

    private String contentType; // TEXT / IMAGE / BOOKING_DETAILS / SYSTEM_LOG
    private String content;

    // Chứa JSON đầy đủ khi contentType = BOOKING_DETAILS
    // Frontend parse để render BookingItineraryCard
    private String metadata;

    private Boolean isRead;
    private LocalDateTime createdAt;

    public static ChatMessageResponse from(ChatMessage msg) {
        ChatMessageResponseBuilder builder = ChatMessageResponse.builder()
                .id(msg.getId())
                .conversationId(msg.getConversation().getId())
                .contentType(msg.getContentType().name())
                .content(msg.getContent())
                .metadata(msg.getMetadata())
                .isRead(msg.getIsRead())
                .createdAt(msg.getCreatedAt());

        if (msg.getSender() != null) {
            builder.senderId(msg.getSender().getId())
                    .senderName(msg.getSender().getFullName())
                    .senderAvatar(msg.getSender().getAvatarUrl());
        }

        return builder.build();
    }
}
