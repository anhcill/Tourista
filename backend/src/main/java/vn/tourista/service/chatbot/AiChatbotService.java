package vn.tourista.service.chatbot;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import vn.tourista.dto.response.ChatMessageResponse;
import vn.tourista.entity.ChatMessage;
import vn.tourista.entity.Conversation;
import vn.tourista.entity.ConversationSession;
import vn.tourista.repository.ChatMessageRepository;
import vn.tourista.repository.ConversationRepository;
import vn.tourista.repository.ConversationSessionRepository;
import vn.tourista.service.AiService;
import vn.tourista.service.ChatService;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Service xử lý luồng AI chatbot — trả lời câu hỏi tự do bằng AI.
 *
 * Luồng:
 * 1. Gọi ChatbotFaqService để tìm FAQ rule (fast path)
 * 2. Nếu không khớp → gọi AI với DB context
 * 3. Nếu AI lỗi → fallback về FAQ menu
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiChatbotService {

    private static final int AI_CONTEXT_HISTORY_LIMIT = 8;

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatbotFaqService faqService;
    private final ChatbotNlpService nlpService;
    private final TourRecommendationQueryService tourQueryService;
    private final AiService aiService;
    private final ChatMessageRepository chatMessageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationSessionRepository conversationSessionRepository;
    private final ObjectMapper objectMapper;

    /**
     * Xử lý câu hỏi tự do của user.
     * Priority: FAQ rules → AI chatbot with DB context.
     */
    public void processAiChatbot(Long conversationId, String inputText, String clientEmail,
                                 String conversationContext) {
        String canonical = nlpService.normalize(nlpService.canonicalize(normalizeInput(inputText)));

        // Bước 1: Thử FAQ rules trước (fast path)
        String faqAnswer = faqService.findMatchingAnswer(canonical);
        if (faqAnswer != null) {
            pushBotText(conversationId, clientEmail, faqAnswer);
            return;
        }

        // Bước 2: Không khớp rule → gọi AI với DB context
        pushTypingIndicator(conversationId, clientEmail);

        // Query dữ liệu thật từ DB
        String dbContext = tourQueryService.buildDbContextForChatbot(inputText, canonical);

        // Gọi AI
        String aiResponse = aiService.askChatbot(inputText, conversationContext, dbContext);

        if (aiResponse != null && !aiResponse.isBlank()) {
            ChatMessage saved = chatService.saveBotMessage(
                    conversationId,
                    sanitize(aiResponse),
                    ChatMessage.ContentType.AI_TEXT,
                    null);
            messagingTemplate.convertAndSendToUser(
                    clientEmail, "/queue/messages", ChatMessageResponse.from(saved));
        } else {
            // AI lỗi → fallback về FAQ menu
            pushFaqMenu(conversationId, clientEmail, inputText);
        }
    }

    /**
     * Push typing indicator để frontend hiện "đang nhắn...".
     */
    public void pushTypingIndicator(Long conversationId, String clientEmail) {
        try {
            ChatMessage saved = chatService.saveBotMessage(
                    conversationId,
                    "",
                    ChatMessage.ContentType.TYPING,
                    null);
            messagingTemplate.convertAndSendToUser(
                    clientEmail, "/queue/messages", ChatMessageResponse.from(saved));
        } catch (Exception e) {
            log.debug("AiChatbotService: Could not push typing indicator: {}", e.getMessage());
        }
    }

    /**
     * Push FAQ menu với các nút bấm nhanh thay vì text.
     */
    public void pushFaqMenu(Long conversationId, String clientEmail, String userInput) {
        try {
            String suggestion = "";
            String canonical = nlpService.canonicalize(normalizeInput(userInput));

            if (containsAny(canonical, List.of("thoi tiet", "mua", "bien", "nong", "lanh", "mua vang"))) {
                suggestion = "Bạn có thể hỏi về thời tiết tại điểm đến cụ thể nhé!";
            } else if (containsAny(canonical, List.of("visa", "passport", "ho chieu", "giay to", "thu tuc"))) {
                suggestion = "Mình gợi ý bạn liên hệ đại sứ quán để cập nhật thông tin mới nhất.";
            } else if (containsAny(canonical, List.of("an uong", "am thuc", "mon ngon", "dac san", "nha hang"))) {
                suggestion = "Mỗi điểm đến có món ăn đặc trưng riêng, bạn muốn hỏi về nơi nào?";
            } else if (containsAny(canonical, List.of("cho", "mua sam", "qua", "bung tac"))) {
                suggestion = "Bạn muốn tìm địa điểm shopping ở thành phố nào?";
            } else {
                suggestion = "Mình không chắc về câu hỏi này, bạn thử chọn một trong các chủ đề bên dưới nhé!";
            }

            String faqJson = """
                    {
                      "title": "🤔 Mình có thể giúp gì?",
                      "subtitle": "%s",
                      "items": [
                        { "id": "faq_huy",     "emoji": "❌", "label": "Hủy/Hoàn tiền",        "payload": "chính sách hủy và hoàn tiền" },
                        { "id": "faq_tt",      "emoji": "💳", "label": "Thanh toán",           "payload": "thanh toán" },
                        { "id": "faq_booking",  "emoji": "🔍", "label": "Tra cứu Booking",       "payload": "tra cứu booking" },
                        { "id": "faq_tour",     "emoji": "🗺️", "label": "Gợi ý Tour",          "payload": "gợi ý tour" },
                        { "id": "faq_lienhe",   "emoji": "📞", "label": "Liên hệ hỗ trợ",      "payload": "liên hệ hỗ trợ" },
                        { "id": "faq_ttbd",     "emoji": "🌤️", "label": "Thời tiết du lịch",   "payload": "thời tiết du lịch" }
                      ]
                    }
                    """.formatted(suggestion);

            ChatMessage saved = chatService.saveBotMessage(
                    conversationId,
                    sanitize("🤔 Bạn cần mình giúp gì?"),
                    ChatMessage.ContentType.FAQ_MENU,
                    sanitize(faqJson));

            messagingTemplate.convertAndSendToUser(
                    clientEmail, "/queue/messages", ChatMessageResponse.from(saved));

        } catch (Exception e) {
            log.error("AiChatbotService: Lỗi khi push FAQ menu. conversationId={}", conversationId, e);
            pushBotText(conversationId, clientEmail, faqService.getDefaultAnswer());
        }
    }

    /**
     * Xây dựng context từ lịch sử hội thoại gần đây.
     */
    public String buildConversationContext(Long conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId).orElse(null);
        if (conversation == null) {
            return "";
        }

        Page<ChatMessage> page = chatMessageRepository.findByConversationOrderByCreatedAtDesc(
                conversation,
                PageRequest.of(0, AI_CONTEXT_HISTORY_LIMIT));

        if (page.isEmpty()) {
            return "";
        }

        List<ChatMessage> chronological = new ArrayList<>(page.getContent());
        Collections.reverse(chronological);

        StringBuilder context = new StringBuilder();
        for (ChatMessage message : chronological) {
            if (message.getContent() == null || message.getContent().isBlank()) {
                continue;
            }

            if (message.getContentType() == ChatMessage.ContentType.SYSTEM_LOG) {
                continue;
            }

            String role = message.getSender() == null ? "Tourista Bot" : "Khách";
            String normalized = message.getContent().replaceAll("\\s+", " ").trim();
            if (normalized.length() > 220) {
                normalized = normalized.substring(0, 220) + "...";
            }

            if (!context.isEmpty()) {
                context.append("\n");
            }
            context.append(role).append(": ").append(normalized);
        }

        return context.toString();
    }

    /**
     * Cập nhật context summary của phiên vào ConversationSession.
     */
    public void updateConversationSession(Long conversationId, String recentContext) {
        try {
            Conversation conv = conversationRepository.findById(conversationId).orElse(null);
            if (conv == null) return;

            var session = conversationSessionRepository
                    .findByConversation(conv)
                    .orElseGet(() -> ConversationSession.builder()
                            .conversation(conv)
                            .sessionStartedAt(java.time.LocalDateTime.now())
                            .messageCount(0)
                            .build());

            session.incrementMessageCount();
            if (recentContext != null && !recentContext.isBlank()) {
                session.appendToContextSummary(recentContext);
            }
            conversationSessionRepository.save(session);
        } catch (Exception ex) {
            log.debug("AiChatbotService: Khong the cap nhat conversation session context — {}", ex.getMessage());
        }
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private void pushBotText(Long conversationId, String clientEmail, String text) {
        try {
            ChatMessage saved = chatService.saveBotMessage(
                    conversationId,
                    sanitize(text),
                    ChatMessage.ContentType.TEXT,
                    null);
            messagingTemplate.convertAndSendToUser(
                    clientEmail, "/queue/messages", ChatMessageResponse.from(saved));
        } catch (Exception e) {
            log.error("AiChatbotService: Lỗi khi push bot text tới {}", clientEmail, e);
        }
    }

    private String normalizeInput(String text) {
        return text == null ? "" : text.toLowerCase().trim();
    }

    private String canonicalize(String text) {
        if (text == null || text.isBlank()) return "";
        String normalized = java.text.Normalizer.normalize(text, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .toLowerCase();
        return normalized.replaceAll("\\s+", " ").trim();
    }

    private String sanitize(String text) {
        if (text == null) return null;
        return text
                .replaceAll("[\\x{10000}-\\x{10FFFF}]", "")
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private boolean containsAny(String text, List<String> keywords) {
        if (text == null || text.isBlank() || keywords == null || keywords.isEmpty()) {
            return false;
        }
        for (String kw : keywords) {
            if (text.contains(kw)) return true;
        }
        return false;
    }
}
