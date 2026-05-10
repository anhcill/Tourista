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
import vn.tourista.service.ai.LocationUnderstandingService;

import java.util.regex.Pattern;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Service xử lý luồng AI chatbot — trả lời câu hỏi tự do bằng AI.
 *
 * Luồng:
 * 1. Gọi AI với DB context và lịch sử hội thoại (tự nhiên, không FAQ gò bó)
 * 2. Nếu AI lỗi → fallback menu với gợi ý tự nhiên
 * Các luồng khác (Gợi ý tour, khách sạn, tra cứu booking...) vẫn hoạt động bình thường.
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
    private final LocationUnderstandingService locationService;
    private final ChatMessageRepository chatMessageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationSessionRepository conversationSessionRepository;
    private final ObjectMapper objectMapper;

    /**
     * Xử lý câu hỏi tự do của user — luôn gọi AI để trả lời tự nhiên.
     * Không qua FAQ fast-path, giữ nguyên các luồng khác (tour/hotel/booking lookup).
     */
    public void processAiChatbot(Long conversationId, String inputText, String clientEmail,
                                 String conversationContext) {
        // Bước 1: Push typing indicator để frontend hiện "đang nhắn..."
        pushTypingIndicator(conversationId, clientEmail);

        // Bước 2: Query dữ liệu thật từ DB để AI có context chính xác
        String canonical = nlpService.normalize(nlpService.canonicalize(normalizeInput(inputText)));
        String dbContext = tourQueryService.buildDbContextForChatbot(inputText, canonical);

        // Bước 3: Gọi AI trực tiếp, không qua FAQ
        String aiResponse = aiService.askChatbot(inputText, conversationContext, dbContext);

        if (aiResponse != null && !aiResponse.isBlank()) {
            // AI trả lời thành công
            ChatMessage saved = chatService.saveBotMessage(
                    conversationId,
                    sanitize(aiResponse),
                    ChatMessage.ContentType.AI_TEXT,
                    null);
            messagingTemplate.convertAndSendToUser(
                    clientEmail, "/queue/messages", ChatMessageResponse.from(saved));
        } else {
            // AI lỗi → fallback menu gợi ý tự nhiên
            pushNaturalFallbackMenu(conversationId, clientEmail, inputText);
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
     * Push fallback menu tự nhiên khi AI lỗi.
     */
    public void pushNaturalFallbackMenu(Long conversationId, String clientEmail, String userInput) {
        try {
            String reply = "Hmm, mình chưa hiểu ý bạn lắm 😅. Bạn có thể thử hỏi theo cách khác, hoặc chọn một trong các chủ đề dưới đây nhé!";

            String fallbackJson = """
                    {
                      "title": "🤖 Bạn cần mình giúp gì nào?",
                      "subtitle": "Mình có thể hỗ trợ bạn nhiều thứ lắm!",
                      "items": [
                        { "id": "act_tour",     "emoji": "🗺️",  "label": "Gợi ý Tour",         "payload": "gợi ý tour du lịch cho tôi" },
                        { "id": "act_hotel",    "emoji": "🏨",  "label": "Tìm Khách sạn",       "payload": "tìm khách sạn cho tôi" },
                        { "id": "faq_booking",  "emoji": "🔍",  "label": "Tra cứu Booking",       "payload": "tra cứu booking của tôi" },
                        { "id": "faq_huy",       "emoji": "❌",  "label": "Hủy / Hoàn tiền",      "payload": "chính sách hủy và hoàn tiền" },
                        { "id": "faq_tt",        "emoji": "💳",  "label": "Thanh toán",           "payload": "cách thanh toán" },
                        { "id": "faq_lienhe",    "emoji": "📞",  "label": "Liên hệ hỗ trợ",      "payload": "liên hệ hỗ trợ" }
                      ]
                    }
                    """;

            ChatMessage saved = chatService.saveBotMessage(
                    conversationId,
                    sanitize(reply),
                    ChatMessage.ContentType.FAQ_MENU,
                    sanitize(fallbackJson));

            messagingTemplate.convertAndSendToUser(
                    clientEmail, "/queue/messages", ChatMessageResponse.from(saved));

        } catch (Exception e) {
            log.error("AiChatbotService: Lỗi khi push fallback menu. conversationId={}", conversationId, e);
            pushBotText(conversationId, clientEmail,
                    "Xin lỗi bạn, mình đang gặp chút sự cố. Bạn thử hỏi lại sau nhé!");
        }
    }

    /**
     * Xây dựng context từ lịch sử hội thoại gần đây.
     * Chỉ lấy tin nhắn trong vòng SESSION_TIMEOUT_MINUTES phút gần nhất
     * để tránh AI nhớ context cũ không liên quan.
     */
    private static final int SESSION_TIMEOUT_MINUTES = 30;

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

        // Chỉ giữ tin nhắn trong vòng SESSION_TIMEOUT_MINUTES phút gần nhất
        java.time.LocalDateTime cutoff = java.time.LocalDateTime.now()
                .minusMinutes(SESSION_TIMEOUT_MINUTES);

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

            // Bỏ qua tin nhắn cũ hơn SESSION_TIMEOUT_MINUTES phút
            if (message.getCreatedAt() != null && message.getCreatedAt().isBefore(cutoff)) {
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

    private boolean containsWeatherKeyword(String text) {
        if (text == null) return false;
        String lower = text.toLowerCase();
        return lower.contains("thời tiết") || lower.contains("thoi tiet") ||
               lower.contains("mùa") || lower.contains("mua") ||
               lower.contains("nhiệt độ") || lower.contains("nhiet do") ||
               lower.contains("trời") || lower.contains("troi") ||
               lower.contains("có gì") || lower.contains("co gi") ||
               lower.contains("món ngon") || lower.contains("mon ngon") ||
               lower.contains("đặc sản") || lower.contains("dac san") ||
               lower.contains("ăn ngon") || lower.contains("an ngon") ||
               lower.contains("nhà hàng") || lower.contains("nha hang");
    }
}
