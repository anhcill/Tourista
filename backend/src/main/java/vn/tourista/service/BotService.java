package vn.tourista.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.tourista.dto.response.BotBookingResponse;
import vn.tourista.dto.response.ChatMessageResponse;
import vn.tourista.entity.ChatMessage;
import vn.tourista.entity.Conversation;
import vn.tourista.repository.*;
import vn.tourista.service.chatbot.*;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * BotService — Entry point orchestrator cho chatbot.
 *
 * Tách từ BotService.java gốc (1436 dòng) thành các service chuyên biệt:
 * - ChatbotFaqService: FAQ loading & matching
 * - BookingLookupService: Tra cứu booking theo mã
 * - RecommendationStateService: Slot-filling state management
 * - TourRecommendationFlowService: Luồng gợi ý tour
 * - TourRecommendationQueryService: Query tour từ DB
 * - AiChatbotService: AI chatbot với DB context
 * - ChatbotNlpService: NLP utilities (regex, parsing)
 *
 * BotService chỉ làm: điều phối luồng + push tin nhắn.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BotService {

    private static final int RECOMMENDATION_HISTORY_SCAN_LIMIT = 20;

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final BookingRepository bookingRepository;
    private final ConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ObjectMapper objectMapper;

    // NEW: Chuyên biệt hóa
    private final ChatbotFaqService faqService;
    private final BookingLookupService bookingLookupService;
    private final RecommendationStateService recommendationStateService;
    private final ChatbotTourFlowService tourRecommendationFlowService;
    private final AiChatbotService aiChatbotService;
    private final ChatbotNlpService nlpService;

    /**
     * Entry point: xử lý tin nhắn gửi vào Bot conversation.
     * Chạy async để không block WebSocket thread.
     */
    @Async("botTaskExecutor")
    @Transactional
    public void handleBotMessage(Long conversationId, String inputText, String clientEmail) {
        String previousContext = aiChatbotService.buildConversationContext(conversationId);

        try {
            String canonicalInput = nlpService.canonicalize(nlpService.normalize(inputText));

            // Luồng 1: Booking lookup (khớp mã TRS-YYYYMMDD-XXXXXX)
            if (nlpService.containsBookingCode(inputText)) {
                String code = nlpService.extractBookingCode(inputText);
                if (code != null) {
                    processBookingLookup(conversationId, code, clientEmail);
                    return;
                }
            }

            // Luồng 2: Tour hot
            if (nlpService.isHotTourIntent(canonicalInput)) {
                tourRecommendationFlowService.pushHotTours(conversationId, clientEmail);
                return;
            }

            // Luồng 3: Recommendation flow
            if (!recommendationStateService.hasActiveRecommendation(conversationId)
                    && nlpService.isRecommendationFollowUpIntent(inputText, canonicalInput)) {
                restoreRecommendationStateFromHistory(conversationId);
            }

            if (recommendationStateService.hasActiveRecommendation(conversationId)) {
                tourRecommendationFlowService.continueRecommendation(conversationId, inputText, canonicalInput, clientEmail);
            } else if (nlpService.isRecommendationIntent(canonicalInput)) {
                tourRecommendationFlowService.startRecommendation(conversationId, inputText, clientEmail);
            } else {
                // Luồng 4: AI chatbot
                aiChatbotService.processAiChatbot(conversationId, inputText, clientEmail, previousContext);
            }
        } catch (Exception ex) {
            log.error("BotService: Unexpected error while handling bot message. conversationId={}, clientEmail={}",
                    conversationId, clientEmail, ex);
            pushBotText(conversationId, clientEmail,
                    "⚠️ Hệ thống đang bận, bạn vui lòng thử lại sau ít phút.");
        } finally {
            String recentCtx = aiChatbotService.buildConversationContext(conversationId);
            aiChatbotService.updateConversationSession(conversationId, recentCtx);
        }
    }

    // ── Luồng 1: Booking Lookup ──────────────────────────────────────────────

    private void processBookingLookup(Long conversationId, String bookingCode, String clientEmail) {
        BookingLookupService.LookupResult result = bookingLookupService.lookupBooking(bookingCode, clientEmail);

        if (result.isNotFound()) {
            pushBotText(conversationId, clientEmail,
                    "❌ Mình không tìm thấy mã đặt chỗ **" + bookingCode + "**.\n\n" +
                            "Vui lòng kiểm tra lại mã trong email xác nhận hoặc mục **Lịch sử Booking** trên tài khoản của bạn.");
            return;
        }

        if (result.isForbidden()) {
            pushBotText(conversationId, clientEmail,
                    "🔒 Bạn không có quyền xem thông tin mã đặt chỗ này.\n\n" +
                            "Mỗi booking chỉ có thể tra cứu bởi người đặt. Nếu bạn cho rằng đây là nhầm lẫn, hãy liên hệ hỗ trợ.");
            return;
        }

        if (result.isError()) {
            pushBotText(conversationId, clientEmail, "⚠️ " + result.errorMessage());
            return;
        }

        try {
            BotBookingResponse response = result.response();
            String metadataJson = objectMapper.writeValueAsString(response);

            ChatMessage saved = chatService.saveBotMessage(
                    conversationId,
                    sanitize("✅ Đây là thông tin chi tiết đặt chỗ của bạn 👇"),
                    ChatMessage.ContentType.BOOKING_DETAILS,
                    metadataJson);

            messagingTemplate.convertAndSendToUser(
                    clientEmail, "/queue/messages", ChatMessageResponse.from(saved));
        } catch (Exception e) {
            log.error("BotService: Lỗi khi build booking response cho mã {}", bookingCode, e);
            pushBotText(conversationId, clientEmail,
                    "⚠️ Hệ thống gặp lỗi khi tải thông tin booking. Vui lòng thử lại sau.");
        }
    }

    // ── Recommendation state recovery ─────────────────────────────────────────

    private void restoreRecommendationStateFromHistory(Long conversationId) {
        if (recommendationStateService.hasActiveRecommendation(conversationId)) {
            return;
        }

        Conversation conversation = conversationRepository.findById(conversationId).orElse(null);
        if (conversation == null) return;

        Page<ChatMessage> page = chatMessageRepository.findByConversationOrderByCreatedAtDesc(
                conversation, PageRequest.of(0, RECOMMENDATION_HISTORY_SCAN_LIMIT));

        if (page.isEmpty()) return;

        List<ChatMessage> chronological = new ArrayList<>(page.getContent());
        Collections.reverse(chronological);

        Integer budgetVnd = null;
        Integer travelers = null;
        String cityQuery = null;
        String cityDisplay = null;
        Integer maxDurationDays = null;

        for (ChatMessage message : chronological) {
            if (message.getSender() == null) continue;
            String content = message.getContent();
            if (content == null || content.isBlank()) continue;

            String canonical = nlpService.canonicalize(nlpService.normalize(content));

            Integer parsedBudget = nlpService.parseBudgetVnd(content);
            if (parsedBudget != null) budgetVnd = parsedBudget;

            Integer parsedTravelers = nlpService.parseTravelers(content, true);
            if (parsedTravelers != null) travelers = parsedTravelers;

            ChatbotNlpService.CityAlias parsedCity = nlpService.parseCityAlias(canonical);
            if (parsedCity != null) {
                cityQuery = parsedCity.queryValue();
                cityDisplay = parsedCity.displayValue();
            }

            Integer parsedDuration = nlpService.parseMaxDurationDays(content);
            if (parsedDuration != null) maxDurationDays = parsedDuration;

            if (nlpService.isResetFilterIntent(canonical)) {
                cityQuery = null;
                cityDisplay = null;
                maxDurationDays = null;
            }
        }

        if (budgetVnd == null && travelers == null && cityQuery == null && maxDurationDays == null) {
            return;
        }

        recommendationStateService.clearState(conversationId);
        RecommendationStateService.RecommendationState restored =
                recommendationStateService.createState(budgetVnd, travelers, cityQuery, cityDisplay, maxDurationDays);
        recommendationStateService.saveState(conversationId, restored);
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
            log.error("BotService: Lỗi khi push bot text tới {}", clientEmail, e);
        }
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
}
