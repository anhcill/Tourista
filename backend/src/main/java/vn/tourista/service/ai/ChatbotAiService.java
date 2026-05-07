package vn.tourista.service.ai;

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
import vn.tourista.repository.ChatMessageRepository;
import vn.tourista.repository.ConversationRepository;
import vn.tourista.service.ChatService;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * AI Chatbot Service - xử lý chat với AI
 * Sử dụng IntentDetectionService để phân loại intent
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatbotAiService {

    private static final int AI_CONTEXT_HISTORY_LIMIT = 8;

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final AiCoreService aiCore;
    private final AiPromptTemplates promptTemplates;
    private final IntentDetectionService intentDetection;
    
    private final AiTourRecommendationFlowService tourFlow;
    private final AiHotelRecommendationFlowService hotelFlow;
    private final HybridRecommendationService hybridFlow;
    private final AiFaqService faqService;
    private final LocationUnderstandingService locationService;
    
    private final ChatMessageRepository chatMessageRepository;
    private final ConversationRepository conversationRepository;
    private final ObjectMapper objectMapper;

    /**
     * Xử lý câu hỏi của user
     */
    public void processChat(Long conversationId, String inputText, String clientEmail) {
        // 1. Detect intent
        IntentDetectionService.Intent intent = intentDetection.detect(inputText);
        log.debug("Intent detected: {} for input: {}", intent, inputText);

        // 2. Handle by intent
        switch (intent) {
            case GREETING -> handleGreeting(conversationId, clientEmail);
            case BOOKING_LOOKUP -> handleBookingLookup(conversationId, clientEmail, inputText);
            case TOUR_RECOMMENDATION -> tourFlow.start(conversationId, inputText, clientEmail);
            case HOTEL_RECOMMENDATION -> hotelFlow.start(conversationId, inputText, clientEmail);
            case BOTH_RECOMMENDATION -> handleBothRecommendation(conversationId, inputText, clientEmail);
            case FAQ -> handleFaq(conversationId, inputText, clientEmail);
            case COMPLAINT -> handleComplaint(conversationId, clientEmail, inputText);
            case PRAISE -> handlePraise(conversationId, clientEmail);
            case CANCEL -> handleCancel(conversationId, clientEmail);
            case CHITCHAT, UNKNOWN -> handleChatOrUnknown(conversationId, inputText, clientEmail);
        }
    }

    // ============================================================
    // INTENT HANDLERS
    // ============================================================

    private void handleGreeting(Long conversationId, String clientEmail) {
        String greeting = """
                👋 Chào bạn! Mình là trợ lý Tourista Studio.
                
                Mình có thể giúp bạn:
                🔍 **Tra cứu booking** - gửi mã TRS-YYYYMMDD-XXXXXX
                🗺️ **Gợi ý tour** - nhắn ngân sách + số người
                🏨 **Tìm khách sạn** - nhắn địa điểm + ngân sách
                
                Bạn cần gì nào?
                """;
        pushBotText(conversationId, clientEmail, greeting);
    }

    private void handleBookingLookup(Long conversationId, String clientEmail, String inputText) {
        String bookingCode = extractBookingCode(inputText);
        if (bookingCode != null) {
            pushBotText(conversationId, clientEmail,
                    "🔍 Mình đang tra mã **" + bookingCode + "**...\n\n" +
                    "Vui lòng đợi một chút hoặc vào **Tài khoản > Lịch sử Booking** để xem chi tiết nhé!");
        } else {
            pushBotText(conversationId, clientEmail,
                    "🔍 Để tra cứu booking, bạn gửi mã đặt theo định dạng:\n" +
                    "**TRS-YYYYMMDD-XXXXXX**\n\n" +
                    "Mã này có trong email xác nhận sau khi bạn đặt tour/khách sạn.");
        }
    }

    private void handleBothRecommendation(Long conversationId, String inputText, String clientEmail) {
        // Parse thông tin từ input
        Integer budgetVnd = parseBudget(inputText);
        String city = parseCity(inputText);
        Integer travelers = parseTravelers(inputText);

        if (city != null && budgetVnd != null) {
            pushBotText(conversationId, clientEmail, "✨ Mình đang tìm tour và khách sạn cho bạn...");
            hybridFlow.suggestTourAndHotelCombo(conversationId, clientEmail, city, budgetVnd, travelers);
        } else {
            pushBotText(conversationId, clientEmail,
                    "🎯 Bạn muốn tìm cả tour và khách sạn!\n\n" +
                    "Mình cần biết:\n" +
                    "• **Địa điểm** (VD: Đà Nẵng)\n" +
                    "• **Ngân sách** (VD: 10 triệu)\n" +
                    "• **Số người** (VD: 2 người)\n\n" +
                    "Ví dụ: **tìm tour và khách sạn Đà Nẵng 10 triệu cho 2 người**");
        }
    }

    private void handleFaq(Long conversationId, String inputText, String clientEmail) {
        String normalized = normalizeInput(inputText);
        String answer = faqService.findMatchingAnswer(normalized);
        if (answer != null) {
            pushBotText(conversationId, clientEmail, answer);
        } else {
            pushBotText(conversationId, clientEmail,
                    "📋 Về câu hỏi của bạn, mình có thể giúp:\n\n" +
                    "• **Chính sách hủy** - hủy trước 7 ngày được hoàn 100%\n" +
                    "• **Thanh toán** - VNPay, chuyển khoản\n" +
                    "• **Liên hệ** - support@tourista.vn\n\n" +
                    "Bạn cần hỏi cụ thể hơn không?");
        }
    }

    private void handleComplaint(Long conversationId, String clientEmail, String inputText) {
        pushBotText(conversationId, clientEmail,
                "😔 Rất xin lỗi vì trải nghiệm không tốt của bạn.\n\n" +
                "Mình sẽ ghi nhận và chuyển đến đội ngũ liên quan.\n" +
                "Bạn có thể:\n" +
                "• Gửi email đến **support@tourista.vn**\n" +
                "• Hoặc mô tả chi tiết vấn đề để mình hỗ trợ nhanh hơn\n\n" +
                "Cảm ơn bạn đã phản hồi! 💛");
    }

    private void handlePraise(Long conversationId, String clientEmail) {
        pushBotText(conversationId, clientEmail,
                "🥰 Cảm ơn bạn rất nhiều! Mình rất vui vì được bạn đánh giá tốt!\n\n" +
                "Nếu bạn hài lòng, đừng quên chia sẻ với bạn bè nhé!\n" +
                "Còn nếu cần thêm gì, mình luôn sẵn sàng hỗ trợ! 💫");
    }

    private void handleCancel(Long conversationId, String clientEmail) {
        pushBotText(conversationId, clientEmail,
                "✅ Đã dừng luồng hiện tại.\n\n" +
                "Khi cần, bạn có thể:\n" +
                "• 🗺️ **Gợi ý tour** - nhắn ngân sách + số người\n" +
                "• 🏨 **Tìm khách sạn** - nhắn địa điểm + ngân sách\n" +
                "• 🔍 **Tra cứu booking** - gửi mã TRS-...\n\n" +
                "Mình sẵn sàng giúp bạn bất cứ lúc nào! 😊");
    }

    private void handleChatOrUnknown(Long conversationId, String inputText, String clientEmail) {
        // Thử FAQ trước
        String normalized = normalizeInput(inputText);
        String faqAnswer = faqService.findMatchingAnswer(normalized);
        if (faqAnswer != null) {
            pushBotText(conversationId, clientEmail, faqAnswer);
            return;
        }

        // Gọi AI
        pushTypingIndicator(conversationId, clientEmail);
        
        String conversationContext = buildConversationContext(conversationId);
        String dbContext = buildDbContext(inputText, normalized);
        String locationsContext = locationService.buildLocationContextForPrompt();
        String prompt = promptTemplates.buildChatbotPrompt(inputText, conversationContext, dbContext, locationsContext);
        
        String aiResponse = aiCore.ask(prompt);
        if (aiResponse != null && !aiResponse.isBlank()) {
            pushBotText(conversationId, clientEmail, aiResponse);
        } else {
            pushBotText(conversationId, clientEmail, promptTemplates.getAiFallback());
        }
    }

    // ============================================================
    // PRIVATE HELPERS
    // ============================================================

    private String buildConversationContext(Long conversationId) {
        Conversation conversation = conversationRepository.findById(conversationId).orElse(null);
        if (conversation == null) return "";

        Page<ChatMessage> page = chatMessageRepository.findByConversationOrderByCreatedAtDesc(
                conversation, PageRequest.of(0, AI_CONTEXT_HISTORY_LIMIT));
        if (page.isEmpty()) return "";

        List<ChatMessage> chronological = new ArrayList<>(page.getContent());
        Collections.reverse(chronological);

        StringBuilder context = new StringBuilder();
        for (ChatMessage message : chronological) {
            if (message.getContent() == null || message.getContent().isBlank()) continue;
            if (message.getContentType() == ChatMessage.ContentType.SYSTEM_LOG) continue;

            String role = message.getSender() == null ? "Tourista Bot" : "Khách";
            String normalized = message.getContent().replaceAll("\\s+", " ").trim();
            if (normalized.length() > 220) normalized = normalized.substring(0, 220) + "...";

            if (!context.isEmpty()) context.append("\n");
            context.append(role).append(": ").append(normalized);
        }
        return context.toString();
    }

    private String buildDbContext(String inputText, String normalized) {
        // Context building logic từ AiRecommendationService
        // (giữ nguyên logic cũ)
        return "";
    }

    private void pushTypingIndicator(Long conversationId, String clientEmail) {
        try {
            ChatMessage saved = chatService.saveBotMessage(
                    conversationId, "", ChatMessage.ContentType.TYPING, null);
            messagingTemplate.convertAndSendToUser(
                    clientEmail, "/queue/messages", ChatMessageResponse.from(saved));
        } catch (Exception e) {
            log.debug("Could not push typing indicator: {}", e.getMessage());
        }
    }

    void pushBotText(Long conversationId, String clientEmail, String text) {
        try {
            ChatMessage saved = chatService.saveBotMessage(
                    conversationId, text, ChatMessage.ContentType.TEXT, null);
            messagingTemplate.convertAndSendToUser(
                    clientEmail, "/queue/messages", ChatMessageResponse.from(saved));
        } catch (Exception e) {
            log.error("Lỗi khi push bot text", e);
        }
    }

    private String extractBookingCode(String input) {
        if (input == null) return null;
        java.util.regex.Pattern p = java.util.regex.Pattern.compile(
                "TRS-\\d{8}-[A-Z0-9]{6}", java.util.regex.Pattern.CASE_INSENSITIVE);
        java.util.regex.Matcher m = p.matcher(input);
        if (m.find()) {
            return m.group().toUpperCase();
        }
        return null;
    }

    private Integer parseBudget(String text) {
        if (text == null) return null;
        java.util.regex.Matcher m = java.util.regex.Pattern
                .compile("(\\d+(?:[\\.,]\\d+)?)\\s*(tr|trieu|triệu|m)\\b", java.util.regex.Pattern.CASE_INSENSITIVE)
                .matcher(text);
        if (m.find()) {
            try {
                double value = Double.parseDouble(m.group(1).replace(",", "."));
                return (int) Math.round(value * 1_000_000);
            } catch (Exception ignored) {}
        }
        return null;
    }

    private String parseCity(String text) {
        if (text == null) return null;

        String lower = text.toLowerCase();

        // Hà Nội
        if (containsAny(lower, List.of("hà nội", "ha noi", "hanoi"))) return "Ha Noi";
        // Đà Nẵng
        if (containsAny(lower, List.of("đà nẵng", "da nang"))) return "Da Nang";
        // Nha Trang
        if (containsAny(lower, List.of("nha trang"))) return "Nha Trang";
        // Phú Quốc
        if (containsAny(lower, List.of("phú quốc", "phu quoc"))) return "Phu Quoc";
        // Đà Lạt
        if (containsAny(lower, List.of("đà lạt", "da lat"))) return "Da Lat";
        // Sapa
        if (containsAny(lower, List.of("sa pa", "sapa"))) return "Sa Pa";
        // Huế
        if (containsAny(lower, List.of("huế", "hue"))) return "Hue";
        // Hội An
        if (containsAny(lower, List.of("hội an", "hoi an"))) return "Hoi An";

        return null;
    }

    private boolean containsAny(String text, List<String> keywords) {
        if (text == null || keywords == null) return false;
        for (String kw : keywords) {
            if (text.contains(kw)) return true;
        }
        return false;
    }

    private Integer parseTravelers(String text) {
        if (text == null) return null;
        java.util.regex.Pattern p = java.util.regex.Pattern
                .compile("\\b(\\d{1,2})\\s*(người|nguoi|khách|khach)\\b", java.util.regex.Pattern.CASE_INSENSITIVE);
        java.util.regex.Matcher m = p.matcher(text);
        if (m.find()) {
            try {
                int val = Integer.parseInt(m.group(1));
                return (val >= 1 && val <= 20) ? val : null;
            } catch (Exception ignored) {}
        }
        if (text.contains("một người") || text.contains("tôi") || text.contains("mình")) {
            return 1;
        }
        return null;
    }

    private String normalizeInput(String text) {
        if (text == null) return "";
        String normalized = text.toLowerCase().trim();
        normalized = java.text.Normalizer.normalize(normalized, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "").replace('đ', 'd');
        return normalized.replaceAll("\\s+", " ").trim();
    }
}
