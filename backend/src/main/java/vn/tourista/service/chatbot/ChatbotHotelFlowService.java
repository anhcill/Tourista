package vn.tourista.service.chatbot;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import vn.tourista.dto.response.ChatMessageResponse;
import vn.tourista.dto.response.HotelCardItem;
import vn.tourista.entity.ChatMessage;
import vn.tourista.entity.Hotel;
import vn.tourista.repository.HotelRepository;
import vn.tourista.service.ChatService;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service xử lý luồng gợi ý khách sạn với slot-filling.
 *
 * Luồng:
 * 1. User bắt đầu: "tìm khách sạn" → bot hỏi city + budget + guests
 * 2. User trả lời → bot query DB, push hotel cards
 * 3. User refine: "Đà Nẵng 4 sao" → bot lọc thêm
 * 4. User cancel: "dừng" → bot clear state
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatbotHotelFlowService {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final HotelRepository hotelRepository;
    private final ObjectMapper objectMapper;
    private final ChatbotNlpService nlpService;

    /**
     * Xử lý luồng gợi ý hotel khi user bắt đầu.
     */
    public void startHotelRecommendation(Long conversationId, String inputText, String clientEmail) {
        Integer budgetVnd = nlpService.parseBudgetVnd(inputText);
        ChatbotNlpService.CityAlias city = nlpService.parseCityAlias(inputText.toLowerCase());
        Integer travelers = nlpService.parseTravelers(inputText, true);

        String cityQuery = city != null ? city.queryValue() : null;
        String cityDisplay = city != null ? city.displayValue() : null;

        if (cityQuery != null && budgetVnd != null) {
            pushBotText(conversationId, clientEmail, "✨ Mình đang tìm khách sạn phù hợp...");
            pushHotelCards(conversationId, clientEmail, cityQuery, cityDisplay, budgetVnd, travelers);
            return;
        }

        pushHotelPrompt(conversationId, clientEmail, cityQuery, budgetVnd);
    }

    /**
     * Xử lý continuation của luồng gợi ý hotel.
     */
    public void continueHotelRecommendation(Long conversationId, String inputText,
                                           String canonicalInput, String clientEmail) {
        if (nlpService.isCancelRecommendationIntent(canonicalInput)) {
            pushBotText(conversationId, clientEmail,
                    "✅ Mình đã dừng tư vấn khách sạn. Khi cần gợi ý lại, bạn chỉ cần nhắn: **tìm khách sạn**.");
            return;
        }

        Integer budgetVnd = nlpService.parseBudgetVnd(inputText);
        ChatbotNlpService.CityAlias city = nlpService.parseCityAlias(canonicalInput);
        Integer travelers = nlpService.parseTravelers(inputText, true);

        String cityQuery = city != null ? city.queryValue() : null;
        String cityDisplay = city != null ? city.displayValue() : null;

        if (cityQuery != null && budgetVnd != null) {
            pushBotText(conversationId, clientEmail, "✨ Mình đang tìm khách sạn phù hợp...");
            pushHotelCards(conversationId, clientEmail, cityQuery, cityDisplay, budgetVnd, travelers);
            return;
        }

        if (cityQuery == null) {
            pushBotText(conversationId, clientEmail,
                    "📍 Bạn muốn tìm khách sạn ở thành phố nào?\n" +
                            "Ví dụ: **khách sạn Đà Nẵng**, **hotel Nha Trang**");
            return;
        }

        if (budgetVnd == null) {
            pushBotText(conversationId, clientEmail,
                    "💰 Bạn muốn tìm khách sạn trong tầm giá nào?\n" +
                            "Ví dụ: **dưới 1 triệu**, **5 triệu**, **10tr/đêm**");
            return;
        }
    }

    /**
     * Push hotel hot (featured).
     */
    public void pushHotHotels(Long conversationId, String clientEmail) {
        List<Long> ids = hotelRepository.findBotFeaturedHotelIds(3);
        if (ids.isEmpty()) {
            ids = hotelRepository.findBotTrendingHotelIds(3);
        }
        if (ids.isEmpty()) {
            pushBotText(conversationId, clientEmail,
                    "🏨 Hiện tại chưa có khách sạn nổi bật nào. Bạn có thể nhắn **tìm khách sạn** kèm địa điểm để mình tìm nhé!");
            return;
        }
        List<HotelCardItem> cards = buildHotelCards(ids);
        pushBotText(conversationId, clientEmail, "🏨 **Khách sạn nổi bật nhất** — được đánh giá cao nhất! 👇");
        pushHotelCardsMessage(conversationId, clientEmail, cards);
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private void pushHotelPrompt(Long conversationId, String clientEmail,
                                 String cityQuery, Integer budgetVnd) {
        try {
            String promptJson = """
                    {
                      "question": "Bạn cần gì ở chỗ ở? 🏨",
                      "subtitle": "Mình sẽ tìm khách sạn phù hợp cho bạn!",
                      "choices": [
                        { "id": "budget_hotel",  "emoji": "💸", "label": "Tiết kiệm",      "payload": "tìm khách sạn dưới 500k" },
                        { "id": "mid_hotel",     "emoji": "⭐", "label": "Trung bình",      "payload": "tìm khách sạn 500k-1.5tr" },
                        { "id": "luxury_hotel",  "emoji": "👑", "label": "Cao cấp",        "payload": "tìm khách sạn 5 sao" },
                        { "id": "family_hotel",  "emoji": "👨‍👩‍👧", "label": "Gia đình",       "payload": "tìm khách sạn gia đình" },
                        { "id": "beach_hotel",   "emoji": "🏖️", "label": "Gần biển",        "payload": "tìm khách sạn gần biển" },
                        { "id": "city_hotel",    "emoji": "🏙️", "label": "Trung tâm",       "payload": "tìm khách sạn trung tâm" }
                      ]
                    }
                    """;

            ChatMessage saved = chatService.saveBotMessage(
                    conversationId,
                    sanitize("🏨 Bạn cần gì ở chỗ ở?"),
                    ChatMessage.ContentType.HOTEL_PROMPT,
                    sanitize(promptJson));

            messagingTemplate.convertAndSendToUser(
                    clientEmail, "/queue/messages", ChatMessageResponse.from(saved));

        } catch (Exception e) {
            log.error("HotelRecommendationFlowService: Lỗi khi push hotel prompt. conversationId={}", conversationId, e);
            pushBotText(conversationId, clientEmail,
                    "🏨 Bạn cho mình biết **địa điểm** và **ngân sách** để mình gợi ý khách sạn nhé!");
        }
    }

    private void pushHotelCards(Long conversationId, String clientEmail,
                                String cityQuery, String cityDisplay,
                                Integer budgetVnd, Integer travelers) {
        if (budgetVnd == null || budgetVnd <= 0) {
            pushBotText(conversationId, clientEmail,
                    "💰 Mình chưa đọc được ngân sách. Bạn thử nhập lại theo dạng: **dưới 1 triệu**, **5 triệu/đêm** nhé.");
            return;
        }

        BigDecimal maxPricePerNight = BigDecimal.valueOf(budgetVnd);

        List<Long> ids = hotelRepository.findBotRecommendedHotelIds(
                cityQuery, maxPricePerNight, null, BigDecimal.ZERO, 3);

        if (ids.isEmpty()) {
            String noResultMsg = "🔍 Ngân sách **" + formatVnd(budgetVnd) + "/đêm**" +
                    (cityDisplay != null ? " tại **" + cityDisplay + "**" : "") +
                    " hiện chưa có khách sạn phù hợp.\n\n" +
                    "Bạn có thể thử:\n" +
                    "- Tăng ngân sách thêm 20-30%\n" +
                    "- Hoặc đổi địa điểm khác";
            pushBotText(conversationId, clientEmail, noResultMsg);
            return;
        }

        List<HotelCardItem> cards = buildHotelCards(ids);
        String intro = "🏨 Mình tìm được **" + cards.size() + " khách sạn** trong tầm **" + formatVnd(budgetVnd) + "/đêm**"
                + (cityDisplay != null ? " tại **" + cityDisplay + "**" : "")
                + " 👇";
        pushBotText(conversationId, clientEmail, intro);

        pushHotelCardsMessage(conversationId, clientEmail, cards);

        pushBotText(conversationId, clientEmail,
                "💡 Muốn lọc thêm? Nhắn: **5 sao**, **khách sạn gia đình**, hoặc **xóa lọc** để tìm lại.");
    }

    private List<HotelCardItem> buildHotelCards(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }

        Map<Long, Hotel> hotelMap = new HashMap<>();
        for (Hotel h : hotelRepository.findAllById(ids)) {
            hotelMap.put(h.getId(), h);
        }

        Map<Long, String> imageMap = new HashMap<>();
        List<Object[]> imageRows = hotelRepository.findCoverImagesByHotelIds(ids);
        for (Object[] row : imageRows) {
            if (row != null && row.length > 1 && row[0] != null && row[1] != null) {
                imageMap.put(((Number) row[0]).longValue(), (String) row[1]);
            }
        }

        List<HotelCardItem> cards = new ArrayList<>();
        for (Long id : ids) {
            Hotel hotel = hotelMap.get(id);
            if (hotel == null || !Boolean.TRUE.equals(hotel.getIsActive())) {
                continue;
            }

            String imageUrl = imageMap.get(id);
            String cityVi = hotel.getCity() != null ? hotel.getCity().getNameVi() : "";

            BigDecimal minPrice = hotelRepository.findMinBasePriceByHotelId(id);

            cards.add(HotelCardItem.builder()
                    .id(hotel.getId())
                    .name(hotel.getName())
                    .slug(hotel.getSlug())
                    .cityVi(cityVi)
                    .address(hotel.getAddress())
                    .starRating(hotel.getStarRating())
                    .avgRating(hotel.getAvgRating())
                    .reviewCount(hotel.getReviewCount())
                    .minPricePerNight(minPrice)
                    .imageUrl(imageUrl)
                    .build());
        }
        return cards;
    }

    private void pushHotelCardsMessage(Long conversationId, String clientEmail, List<HotelCardItem> cards) {
        try {
            String metadataJson = objectMapper.writeValueAsString(cards);
            ChatMessage saved = chatService.saveBotMessage(
                    conversationId,
                    sanitize("🏨 Danh sách khách sạn gợi ý"),
                    ChatMessage.ContentType.HOTEL_CARDS,
                    sanitize(metadataJson));
            messagingTemplate.convertAndSendToUser(
                    clientEmail, "/queue/messages", ChatMessageResponse.from(saved));
        } catch (Exception e) {
            log.error("HotelRecommendationFlowService: Lỗi khi push hotel cards. conversationId={}", conversationId, e);
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
            log.error("HotelRecommendationFlowService: Lỗi khi push bot text tới {}", clientEmail, e);
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

    private String formatVnd(long amount) {
        return String.format(Locale.US, "%,d", amount).replace(',', '.') + " VND";
    }
}
