package vn.tourista.service.ai;

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

/**
 * Hotel Recommendation Flow - xử lý luồng gợi ý khách sạn
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiHotelRecommendationFlowService {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final HotelRepository hotelRepository;
    private final ObjectMapper objectMapper;
    private final LocationUnderstandingService locationService;

    /**
     * Bắt đầu hotel recommendation
     */
    public void start(Long conversationId, String inputText, String clientEmail) {
        Integer budgetVnd = parseBudget(inputText);
        String city = parseCity(inputText);
        Integer guests = parseGuests(inputText);
        Integer starRating = parseStarRating(inputText);

        if (city != null && budgetVnd != null) {
            pushBotText(conversationId, clientEmail, "🏨 Mình đang tìm khách sạn...");
            pushCards(conversationId, clientEmail, city, budgetVnd, starRating);
        } else {
            pushPrompt(conversationId, clientEmail);
        }
    }

    /**
     * Tiếp tục hotel recommendation
     */
    public void continueFlow(Long conversationId, String inputText, String canonical, String clientEmail) {
        // Cancel intent
        if (isCancelIntent(canonical)) {
            pushBotText(conversationId, clientEmail, "✅ Đã dừng tư vấn khách sạn. Khi cần, nhắn **tìm khách sạn** nhé!");
            return;
        }

        Integer budgetVnd = parseBudget(inputText);
        String city = parseCity(inputText);
        Integer starRating = parseStarRating(inputText);

        if (city != null && budgetVnd != null) {
            pushBotText(conversationId, clientEmail, "🏨 Mình đang tìm khách sạn...");
            pushCards(conversationId, clientEmail, city, budgetVnd, starRating);
            return;
        }

        if (city == null) {
            pushBotText(conversationId, clientEmail, "📍 Bạn muốn tìm khách sạn ở đâu? Ví dụ: **khách sạn Đà Nẵng**");
            return;
        }

        if (budgetVnd == null) {
            pushBotText(conversationId, clientEmail, "💰 Ngân sách của bạn là bao nhiêu? Ví dụ: **dưới 1 triệu**, **5 triệu/đêm**");
            return;
        }
    }

    /**
     * Gợi ý khách sạn hot (featured)
     */
    public void pushHotHotels(Long conversationId, String clientEmail) {
        List<Long> ids = hotelRepository.findBotFeaturedHotelIds(3);
        if (ids.isEmpty()) {
            ids = hotelRepository.findBotTrendingHotelIds(3);
        }
        if (ids.isEmpty()) {
            pushBotText(conversationId, clientEmail, "🏨 Hiện chưa có khách sạn nổi bật. Thử nhắn **tìm khách sạn** kèm địa điểm nhé!");
            return;
        }
        
        List<HotelCardItem> cards = buildCards(ids);
        pushBotText(conversationId, clientEmail, "🏨 **Khách sạn nổi bật** — được đánh giá cao nhất! 👇");
        pushCardsMessage(conversationId, clientEmail, cards);
    }

    // ============================================================
    // PRIVATE: Push Methods
    // ============================================================

    private void pushPrompt(Long conversationId, String clientEmail) {
        try {
            String json = """
                    {
                      "question": "Bạn cần gì ở chỗ ở? 🏨",
                      "subtitle": "Mình sẽ tìm khách sạn phù hợp!",
                      "choices": [
                        {"id": "budget",  "emoji": "💸", "label": "Tiết kiệm",    "payload": "tìm khách sạn dưới 500k"},
                        {"id": "mid",     "emoji": "⭐", "label": "Trung bình",    "payload": "tìm khách sạn 500k-1.5tr"},
                        {"id": "luxury",  "emoji": "👑", "label": "Cao cấp",      "payload": "tìm khách sạn 5 sao"},
                        {"id": "family",  "emoji": "👨‍👩‍👧", "label": "Gia đình",      "payload": "tìm khách sạn gia đình"},
                        {"id": "beach",   "emoji": "🏖️", "label": "Gần biển",      "payload": "tìm khách sạn gần biển"},
                        {"id": "city",    "emoji": "🏙️", "label": "Trung tâm",     "payload": "tìm khách sạn trung tâm"}
                      ]
                    }
                    """;

            ChatMessage saved = chatService.saveBotMessage(
                    conversationId, "🏨 Bạn cần gì ở chỗ ở?",
                    ChatMessage.ContentType.HOTEL_PROMPT, json);
            messagingTemplate.convertAndSendToUser(clientEmail, "/queue/messages", ChatMessageResponse.from(saved));
        } catch (Exception e) {
            log.error("Lỗi push hotel prompt", e);
            pushBotText(conversationId, clientEmail, "🏨 Bạn cho mình biết **địa điểm** và **ngân sách** để gợi ý khách sạn nhé!");
        }
    }

    private void pushCards(Long conversationId, String clientEmail, String city, Integer budgetVnd, Integer starRating) {
        if (budgetVnd == null || budgetVnd <= 0) {
            pushBotText(conversationId, clientEmail, "💰 Mình chưa đọc được ngân sách. Thử nhập: **dưới 1 triệu** nhé!");
            return;
        }

        BigDecimal maxPrice = BigDecimal.valueOf(budgetVnd);
        List<Long> ids = hotelRepository.findBotRecommendedHotelIds(city, maxPrice, starRating, BigDecimal.ZERO, 3);

        if (ids.isEmpty()) {
            String msg = "🔍 Ngân sách **" + formatVnd(budgetVnd) + "/đêm** tại **" + city + "** hiện chưa có khách sạn phù hợp.\n\n" +
                    "Thử:\n- Tăng ngân sách thêm 20-30%\n- Hoặc đổi địa điểm khác";
            pushBotText(conversationId, clientEmail, msg);
            return;
        }

        List<HotelCardItem> cards = buildCards(ids);
        String intro = "🏨 Mình tìm được **" + cards.size() + " khách sạn** trong tầm **" + formatVnd(budgetVnd) 
                + "/đêm** tại **" + city + "** 👇";
        pushBotText(conversationId, clientEmail, intro);
        pushCardsMessage(conversationId, clientEmail, cards);
        pushBotText(conversationId, clientEmail, "💡 Muốn lọc thêm? Nhắn: **5 sao**, **khách sạn gia đình**, hoặc **xóa lọc**.");
    }

    private List<HotelCardItem> buildCards(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return List.of();

        Map<Long, String> imageMap = new HashMap<>();
        List<Object[]> imageRows = hotelRepository.findCoverImagesByHotelIds(ids);
        for (Object[] row : imageRows) {
            if (row != null && row.length > 1 && row[0] != null && row[1] != null) {
                imageMap.put(((Number) row[0]).longValue(), (String) row[1]);
            }
        }

        List<HotelCardItem> cards = new ArrayList<>();
        for (Long id : ids) {
            Optional<Hotel> opt = hotelRepository.findById(id);
            if (opt.isEmpty()) continue;
            Hotel hotel = opt.get();
            if (!Boolean.TRUE.equals(hotel.getIsActive())) continue;

            BigDecimal minPrice = hotelRepository.findMinBasePriceByHotelId(id);
            cards.add(HotelCardItem.builder()
                    .id(hotel.getId())
                    .name(hotel.getName())
                    .slug(hotel.getSlug())
                    .cityVi(hotel.getCity() != null ? hotel.getCity().getNameVi() : "")
                    .address(hotel.getAddress())
                    .starRating(hotel.getStarRating())
                    .avgRating(hotel.getAvgRating())
                    .reviewCount(hotel.getReviewCount())
                    .minPricePerNight(minPrice)
                    .imageUrl(imageMap.get(id))
                    .build());
        }
        return cards;
    }

    private void pushCardsMessage(Long conversationId, String clientEmail, List<HotelCardItem> cards) {
        try {
            String json = objectMapper.writeValueAsString(cards);
            ChatMessage saved = chatService.saveBotMessage(
                    conversationId, "🏨 Danh sách khách sạn gợi ý",
                    ChatMessage.ContentType.HOTEL_CARDS, json);
            messagingTemplate.convertAndSendToUser(clientEmail, "/queue/messages", ChatMessageResponse.from(saved));
        } catch (Exception e) {
            log.error("Lỗi push hotel cards", e);
        }
    }

    private void pushBotText(Long conversationId, String clientEmail, String text) {
        try {
            ChatMessage saved = chatService.saveBotMessage(
                    conversationId, text, ChatMessage.ContentType.TEXT, null);
            messagingTemplate.convertAndSendToUser(clientEmail, "/queue/messages", ChatMessageResponse.from(saved));
        } catch (Exception e) {
            log.error("Lỗi push bot text", e);
        }
    }

    // ============================================================
    // PRIVATE: NLP Parsing
    // ============================================================

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

        // Dùng LocationUnderstandingService để parse location
        String cityCode = locationService.parseLocation(text);
        if (cityCode != null) {
            return cityCode;
        }

        // Fallback: thử parse thủ công nếu service chưa load
        String lower = text.toLowerCase();

        // Hà Nội
        if (containsAny(lower, List.of("hà nội", "ha noi", "ha-noi", "hanoi"))) return "Ha Noi";
        // Đà Nẵng
        if (containsAny(lower, List.of("đà nẵng", "da nang", "da-nang"))) return "Da Nang";
        // Nha Trang
        if (containsAny(lower, List.of("nha trang", "nha-trang", "khánh hòa"))) return "Nha Trang";
        // Phú Quốc
        if (containsAny(lower, List.of("phú quốc", "phu quoc", "phu-quoc", "đảo phú quốc"))) return "Phu Quoc";
        // Đà Lạt
        if (containsAny(lower, List.of("đà lạt", "da lat", "da-lat", "lâm đồng"))) return "Da Lat";
        // Sapa
        if (containsAny(lower, List.of("sa pa", "sapa", "sa-pa"))) return "Sa Pa";
        // Huế
        if (containsAny(lower, List.of("huế", "hue"))) return "Hue";
        // Hội An
        if (containsAny(lower, List.of("hội an", "hoi an", "hoi-an"))) return "Hoi An";
        // Vũng Tàu
        if (containsAny(lower, List.of("vũng tàu", "vung tau", "vung-tau"))) return "Vung Tau";
        // Cần Thơ
        if (containsAny(lower, List.of("cần thơ", "can tho", "can-tho"))) return "Can Tho";
        // HCM
        if (containsAny(lower, List.of("tp hcm", "hồ chí minh", "ho chi minh", "tphcm"))) return "Ho Chi Minh";

        return null;
    }

    private boolean containsAny(String text, List<String> keywords) {
        if (text == null || keywords == null) return false;
        for (String kw : keywords) {
            if (text.contains(kw)) return true;
        }
        return false;
    }

    private Integer parseGuests(String text) {
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
        return null;
    }

    private Integer parseStarRating(String text) {
        if (text == null) return null;
        java.util.regex.Pattern p = java.util.regex.Pattern
                .compile("(\\d)\\s*(sao|★|star)\\b", java.util.regex.Pattern.CASE_INSENSITIVE);
        java.util.regex.Matcher m = p.matcher(text);
        if (m.find()) {
            try {
                int val = Integer.parseInt(m.group(1));
                return (val >= 1 && val <= 5) ? val : null;
            } catch (Exception ignored) {}
        }
        return null;
    }

    private boolean isCancelIntent(String canonical) {
        if (canonical == null) return false;
        return canonical.contains("dung") || canonical.contains("thoi") || 
               canonical.contains("thoat") || canonical.contains("cancel") ||
               canonical.contains("huy") || canonical.contains("exit");
    }

    private String formatVnd(long amount) {
        return String.format(Locale.US, "%,d", amount).replace(',', '.') + " VND";
    }
}
