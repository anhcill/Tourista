package vn.tourista.service.chatbot;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import vn.tourista.dto.response.ChatMessageResponse;
import vn.tourista.dto.response.TourCardItem;
import vn.tourista.entity.ChatMessage;
import vn.tourista.service.ChatService;

import java.util.List;
import java.util.Locale;

/**
 * Service xử lý luồng gợi ý tour với slot-filling.
 *
 * Luồng:
 * 1. User bắt đầu: "gợi ý tour" → bot hỏi budget + travelers
 * 2. User trả lời: "8tr cho 2 người" → bot query DB, push tour cards
 * 3. User refine: "Đà Nẵng 3 ngày" → bot lọc thêm
 * 4. User cancel: "dừng" → bot clear state, quay lại bình thường
 *
 * Gợi ý điểm đến thay thế khi không tìm được tour phù hợp.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TourRecommendationFlowService {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final TourRecommendationQueryService tourQueryService;
    private final RecommendationStateService stateService;
    private final ObjectMapper objectMapper;

    /**
     * Xử lý luồng gợi ý tour khi user bắt đầu.
     */
    public void startRecommendation(Long conversationId, String inputText, String clientEmail) {
        Integer budgetVnd = stateService.getNlpService().parseBudgetVnd(inputText);
        Integer travelers = stateService.getNlpService().parseTravelers(inputText, false);
        ChatbotNlpService.CityAlias city = stateService.getNlpService().parseCityAlias(
                normalize(inputText));
        Integer maxDurationDays = stateService.getNlpService().parseMaxDurationDays(inputText);

        RecommendationStateService.RecommendationState state = stateService.createState(
                budgetVnd, travelers,
                city != null ? city.queryValue() : null,
                city != null ? city.displayValue() : null,
                maxDurationDays);

        if (budgetVnd != null && travelers != null) {
            stateService.saveState(conversationId, state);
            pushBotText(conversationId, clientEmail, "✨ Mình đang tìm tour phù hợp...");
            pushTourCards(conversationId, clientEmail, state);
            return;
        }

        stateService.saveState(conversationId, state);
        pushScenarioChoice(conversationId, clientEmail);
    }

    /**
     * Xử lý continuation của luồng gợi ý tour (khi đã có state).
     */
    public void continueRecommendation(Long conversationId, String inputText, String canonicalInput,
                                     String clientEmail) {
        RecommendationStateService.RecommendationState currentState = stateService.loadState(conversationId);
        if (currentState == null) {
            startRecommendation(conversationId, inputText, clientEmail);
            return;
        }

        Integer budgetVnd = currentState.budgetVnd();
        Integer travelers = currentState.travelers();
        String cityQuery = currentState.cityQuery();
        String cityDisplay = currentState.cityDisplay();
        Integer maxDurationDays = currentState.maxDurationDays();

        if (stateService.getNlpService().isCancelRecommendationIntent(canonicalInput)) {
            stateService.clearState(conversationId);
            pushBotText(conversationId, clientEmail,
                    "✅ Mình đã dừng phiên tư vấn tour. Khi cần gợi ý lại, bạn chỉ cần nhắn: **gợi ý tour**.");
            return;
        }

        // Parse giá trị mới
        if (budgetVnd == null) {
            budgetVnd = stateService.getNlpService().parseBudgetVnd(inputText);
        }
        if (travelers == null) {
            travelers = stateService.getNlpService().parseTravelers(inputText, true);
        }
        ChatbotNlpService.CityAlias city = stateService.getNlpService().parseCityAlias(canonicalInput);
        if (city != null) {
            cityQuery = city.queryValue();
            cityDisplay = city.displayValue();
        }
        Integer parsedDuration = stateService.getNlpService().parseMaxDurationDays(inputText);
        if (parsedDuration != null) {
            maxDurationDays = parsedDuration;
        }
        if (stateService.getNlpService().isResetFilterIntent(canonicalInput)) {
            cityQuery = null;
            cityDisplay = null;
            maxDurationDays = null;
        }

        // Hỏi budget nếu chưa có
        if (budgetVnd == null) {
            RecommendationStateService.RecommendationState updated = stateService.createState(
                    null, travelers, cityQuery, cityDisplay, maxDurationDays);
            stateService.saveState(conversationId, updated);
            pushBotText(conversationId, clientEmail,
                    "💰 Mình chưa đọc được ngân sách. Bạn thử nhập lại theo dạng:\n" +
                            "**8tr**, **10 triệu**, **12000000 VND** nhé.");
            return;
        }

        // Hỏi travelers nếu chưa có
        if (travelers == null) {
            RecommendationStateService.RecommendationState updated = stateService.createState(
                    budgetVnd, null, cityQuery, cityDisplay, maxDurationDays);
            stateService.saveState(conversationId, updated);
            pushBotText(conversationId, clientEmail,
                    "👥 Cảm ơn! Bạn cho mình xin **số người đi** (ví dụ: **2 người**, **4 người**) nhé.");
            return;
        }

        RecommendationStateService.RecommendationState updatedState = stateService.createState(
                budgetVnd, travelers, cityQuery, cityDisplay, maxDurationDays);
        stateService.saveState(conversationId, updatedState);
        pushBotText(conversationId, clientEmail, "✨ Mình đang tìm tour phù hợp...");
        pushTourCards(conversationId, clientEmail, updatedState);
    }

    /**
     * Push tour hot (is_featured, active, có slot).
     */
    public void pushHotTours(Long conversationId, String clientEmail) {
        List<Long> ids = tourQueryService.findHotTourIds(
                org.springframework.data.domain.PageRequest.of(0, 3));
        if (ids.isEmpty()) {
            pushBotText(conversationId, clientEmail,
                    "🔥 Hiện tại chưa có tour nổi bật nào. Bạn có thể nhắn **gợi ý tour** với ngân sách cụ thể để mình tìm nhé!");
            return;
        }
        List<TourCardItem> cards = tourQueryService.buildTourCards(ids);
        pushBotText(conversationId, clientEmail, "🔥 **Top tour hot nhất hiện tại** — đang được đặt nhiều nhất! 👇");
        pushTourCardsMessage(conversationId, clientEmail, cards);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private void pushScenarioChoice(Long conversationId, String clientEmail) {
        try {
            String scenarioJson = """
                    {
                      "question": "Bạn muốn chuyến đi kiểu nào? 🌟",
                      "subtitle": "Chọn một kịch bản — mình sẽ gợi ý tour phù hợp ngay!",
                      "choices": [
                        { "id": "beach",    "emoji": "🏖️", "label": "Nghỉ biển thư giãn",      "payload": "gợi ý tour biển ngân sách 8tr" },
                        { "id": "mountain", "emoji": "🏔️", "label": "Khám phá núi rừng",         "payload": "gợi ý tour núi ngân sách 6tr" },
                        { "id": "romantic", "emoji": "👑", "label": "Tuần trăng mật",             "payload": "gợi ý tour tuần trăng mật ngân sách 15tr cho 2 người" },
                        { "id": "family",   "emoji": "👨‍👩‍👧", "label": "Gia đình có trẻ em",         "payload": "gợi ý tour gia đình ngân sách 12tr cho 4 người" },
                        { "id": "budget",   "emoji": "💸", "label": "Ngân sách tiết kiệm",      "payload": "gợi ý tour giá rẻ ngân sách 4tr cho 2 người" },
                        { "id": "city",     "emoji": "🏙️", "label": "City break cuối tuần",      "payload": "gợi ý city tour 2 ngày ngân sách 5tr cho 2 người" }
                      ]
                    }
                    """;

            ChatMessage saved = chatService.saveBotMessage(
                    conversationId,
                    sanitize("🌟 Bạn muốn chuyến đi kiểu nào?"),
                    ChatMessage.ContentType.SCENARIO_CHOICE,
                    sanitize(scenarioJson));

            messagingTemplate.convertAndSendToUser(
                    clientEmail, "/queue/messages", ChatMessageResponse.from(saved));

        } catch (Exception e) {
            log.error("TourRecommendationFlowService: Lỗi khi push scenario choice. conversationId={}", conversationId, e);
            pushBotText(conversationId, clientEmail,
                    "💬 Bạn cho mình biết **ngân sách** và **số người đi** để mình gợi ý tour nhé!");
        }
    }

    private void pushTourCards(Long conversationId, String clientEmail,
                              RecommendationStateService.RecommendationState state) {
        Integer budgetVnd = state.budgetVnd();
        Integer travelers = state.travelers();
        String cityDisplay = state.cityDisplay();
        Integer maxDurationDays = state.maxDurationDays();

        if (budgetVnd == null || travelers == null || travelers <= 0) {
            pushBotText(conversationId, clientEmail,
                    "👥 Mình chưa đủ thông tin. Bạn gửi theo mẫu: **ngân sách 10tr cho 2 người** nhé.");
            return;
        }

        java.math.BigDecimal perPerson = java.math.BigDecimal.valueOf(budgetVnd)
                .divide(java.math.BigDecimal.valueOf(travelers), 0, java.math.RoundingMode.DOWN);

        if (perPerson.compareTo(java.math.BigDecimal.valueOf(400_000)) < 0) {
            pushBotText(conversationId, clientEmail,
                    "💰 Ngân sách hiện tại hơi thấp để tìm được tour chất lượng.\n" +
                            "Bạn thử tăng lên (ví dụ **6-8tr cho 2 người**) nhé! 😊");
            return;
        }

        List<Long> ids = tourQueryService.findRecommendedTourIds(
                travelers, perPerson, state.cityQuery(), maxDurationDays,
                java.time.LocalDate.now(), org.springframework.data.domain.PageRequest.of(0, 3));

        if (ids.isEmpty()) {
            String altSuggestion = tourQueryService.suggestAlternativeDestinations(cityDisplay, budgetVnd, travelers);
            String noResultMsg = "🔍 Ngân sách **" + formatVnd(budgetVnd) + "** cho **" + travelers + " người**" +
                    (cityDisplay != null ? " tại **" + cityDisplay + "**" : "") +
                    " hiện chưa có tour phù hợp.\n\n" +
                    altSuggestion;
            pushBotText(conversationId, clientEmail, noResultMsg);
            return;
        }

        List<TourCardItem> cards = tourQueryService.buildTourCards(ids);
        if (cards.isEmpty()) {
            pushBotText(conversationId, clientEmail,
                    "🔍 Mình tạm thời chưa tìm thấy tour phù hợp. Bạn thử điều chỉnh ngân sách hoặc số người nhé.");
            return;
        }

        String intro = "📍 Mình tìm được **" + cards.size() + " tour** phù hợp ngân sách **" + formatVnd(budgetVnd)
                + "** cho **" + travelers + " người**"
                + (cityDisplay != null ? " tại **" + cityDisplay + "**" : "")
                + " 👇";
        pushBotText(conversationId, clientEmail, intro);

        pushTourCardsMessage(conversationId, clientEmail, cards);

        pushBotText(conversationId, clientEmail,
                "💡 Muốn lọc thêm? Nhắn: **Lọc Đà Nẵng 3 ngày** hoặc **xóa lọc** để tìm lại.");
    }

    private void pushTourCardsMessage(Long conversationId, String clientEmail, List<TourCardItem> cards) {
        try {
            String metadataJson = objectMapper.writeValueAsString(cards);
            ChatMessage saved = chatService.saveBotMessage(
                    conversationId,
                    sanitize("🏗️ Danh sách tour gợi ý"),
                    ChatMessage.ContentType.TOUR_CARDS,
                    sanitize(metadataJson));
            messagingTemplate.convertAndSendToUser(
                    clientEmail, "/queue/messages", ChatMessageResponse.from(saved));
        } catch (Exception e) {
            log.error("TourRecommendationFlowService: Lỗi khi push tour cards. conversationId={}", conversationId, e);
        }
    }

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
            log.error("TourRecommendationFlowService: Lỗi khi push bot text tới {}", clientEmail, e);
        }
    }

    private String normalize(String text) {
        return text == null ? "" : text.toLowerCase().trim();
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

    private String formatVnd(long amount) {
        return String.format(Locale.US, "%,d", amount).replace(',', '.') + " VND";
    }
}
