package vn.tourista.controller;

import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import vn.tourista.dto.response.ChatMessageResponse;
import vn.tourista.entity.ChatMessage;
import vn.tourista.entity.Conversation;
import vn.tourista.repository.ConversationRepository;
import vn.tourista.service.BotService;
import vn.tourista.service.ChatService;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;

/**
 * Controller xử lý tin nhắn real-time qua WebSocket STOMP.
 *
 * Client gửi tin đến: /app/chat.send
 * Server push tin về cho người nhận: /user/{email}/queue/messages
 */
@Controller
@RequiredArgsConstructor
@Slf4j
public class MessageController {

    private final ChatService chatService;
    private final BotService botService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ConversationRepository conversationRepository;

    /**
     * Nhận tin nhắn từ client và phân phối:
     * - type = BOT → gọi BotService xử lý async (tra cứu booking hoặc FAQ)
     * - type = P2P → lưu DB, push đến người nhận qua /user/{email}/queue/messages
     */
    @MessageMapping("/chat.send")
    @Transactional
    public void handleChatMessage(@Payload SendMessagePayload payload, Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            log.warn("Blocked /chat.send because principal is missing. payloadConversationId={}",
                    payload != null ? payload.getConversationId() : null);
            return;
        }

        if (payload == null || payload.getConversationId() == null || payload.getContent() == null
                || payload.getContent().isBlank()) {
            log.warn("Ignored invalid /chat.send payload from sender={}. conversationId={}, contentBlank={}",
                    principal.getName(),
                    payload != null ? payload.getConversationId() : null,
                    payload == null || payload.getContent() == null || payload.getContent().isBlank());
            return;
        }

        String senderEmail = principal.getName();

        try {
            // 1. Lưu tin nhắn của người gửi vào DB
            ChatMessage saved = chatService.saveUserMessage(
                    payload.getConversationId(),
                    senderEmail,
                    payload.getContent());

            ChatMessageResponse response = ChatMessageResponse.from(saved);

            // 2. Lấy thông tin conversation để biết dest (eager fetch để tránh LazyInitializationException)
            Conversation conv = conversationRepository.findByIdWithUsers(payload.getConversationId())
                    .orElseThrow(() -> new RuntimeException("Conversation không tồn tại"));

            // 3. Push tin ngay về cho NGƯỜI GỬI (UI update tức thì, không cần chờ Bot)
            messagingTemplate.convertAndSendToUser(senderEmail, "/queue/messages", response);

            // 4. Phân luồng xử lý tiếp theo
            if (conv.getType() == Conversation.ConversationType.BOT) {
                // Bot xử lý async: nhận diện mã TRS-... hoặc FAQ fallback
                // BotService tự push response về /user/{senderEmail}/queue/messages sau khi
                // xong
                botService.handleBotMessage(conv.getId(), payload.getContent(), senderEmail);

            } else {
                // P2P: push đến người còn lại trong conversation
                String recipientEmail = resolvePeerEmail(conv, senderEmail);
                if (recipientEmail != null) {
                    messagingTemplate.convertAndSendToUser(recipientEmail, "/queue/messages", response);
                }
            }
        } catch (Exception ex) {
            log.error("Failed to process /chat.send. sender={}, conversationId={}",
                    senderEmail,
                    payload.getConversationId(),
                    ex);

            messagingTemplate.convertAndSendToUser(
                    senderEmail,
                    "/queue/messages",
                    ChatMessageResponse.builder()
                            .conversationId(payload.getConversationId())
                            .contentType(ChatMessage.ContentType.SYSTEM_LOG.name())
                            .content("He thong chat tam thoi bi gian doan. Ban vui long gui lai tin nhan sau vai giay.")
                            .build());
        }
    }

    /**
     * Xác định email của đối phương trong conversation.
     */
    private String resolvePeerEmail(Conversation conv, String senderEmail) {
        String clientEmail = conv.getClient() != null ? conv.getClient().getEmail() : null;
        String partnerEmail = conv.getPartner() != null ? conv.getPartner().getEmail() : null;
        if (senderEmail.equals(clientEmail))
            return partnerEmail;
        if (senderEmail.equals(partnerEmail))
            return clientEmail;
        return null;
    }

    /**
     * Payload gửi từ WebSocket client:
     * { "conversationId": 1, "content": "Cho mình xem booking TRS-20260325-934D6D"
     * }
     */
    @Data
    public static class SendMessagePayload {
        private Long conversationId;
        private String content;
    }
}
