package vn.tourista.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import vn.tourista.dto.response.ChatMessageResponse;
import vn.tourista.dto.response.TourCardItem;
import vn.tourista.entity.ChatMessage;
import vn.tourista.entity.Tour;
import vn.tourista.repository.TourImageRepository;
import vn.tourista.repository.TourRepository;
import vn.tourista.service.ChatService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

/**
 * Tour Recommendation Flow - xử lý luồng gợi ý tour với 15 scenarios
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiTourRecommendationFlowService {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final TourRepository tourRepository;
    private final TourImageRepository tourImageRepository;
    private final ObjectMapper objectMapper;

    // ============================================================
    // 15 SCENARIOS - Map scenario ID → prompt text
    // ============================================================
    
    private static final Map<String, ScenarioConfig> SCENARIOS = new LinkedHashMap<>();
    
    static {
        // 1. Nghỉ biển
        SCENARIOS.put("beach", new ScenarioConfig(
                "beach", "🏖️", "Nghỉ biển thư giãn",
                "Mình sẽ tìm tour biển cho bạn! Cho mình biết thêm:",
                "tour biển", "Nghỉ dưỡng, tắm biển, hải sản"
        ));
        
        // 2. Khám phá núi rừng
        SCENARIOS.put("mountain", new ScenarioConfig(
                "mountain", "🏔️", "Khám phá núi rừng",
                "Mình sẽ tìm tour núi rừng cho bạn!",
                "tour núi rừng", "Leo núi, trekking, cắm trại"
        ));
        
        // 3. Tuần trăng mật
        SCENARIOS.put("romantic", new ScenarioConfig(
                "romantic", "💑", "Tuần trăng mật",
                "Chúc mừng hai bạn! Mình sẽ tìm tour lãng mạn!",
                "tour lãng mạn", "Cảnh đẹp, riêng tư, sang trọng"
        ));
        
        // 4. Gia đình có trẻ em
        SCENARIOS.put("family", new ScenarioConfig(
                "family", "👨‍👩‍👧", "Gia đình có trẻ em",
                "Mình sẽ tìm tour phù hợp cho cả gia đình!",
                "tour gia đình", "Vui chơi, an toàn, có chỗ nghỉ ngơi"
        ));
        
        // 5. Tiết kiệm
        SCENARIOS.put("budget", new ScenarioConfig(
                "budget", "💸", "Ngân sách tiết kiệm",
                "Mình sẽ tìm tour giá tốt nhất cho bạn!",
                "tour giá rẻ", "Tiết kiệm, vẫn đầy đủ trải nghiệm"
        ));
        
        // 6. City break cuối tuần
        SCENARIOS.put("city", new ScenarioConfig(
                "city", "🏙️", "City break cuối tuần",
                "Mình sẽ tìm tour ngắn ngày cho bạn!",
                "tour city break", "Khám phá thành phố, 2-3 ngày"
        ));
        
        // 7. Khám phá ẩm thực
        SCENARIOS.put("food", new ScenarioConfig(
                "food", "🍜", "Khám phá ẩm thực",
                "Mình sẽ tìm tour ẩm thực đặc sắc!",
                "tour ẩm thực", "Món ngon địa phương, chợ, ăn uống"
        ));
        
        // 8. Mạo hiểm
        SCENARIOS.put("adventure", new ScenarioConfig(
                "adventure", "🚁", "Mạo hiểm",
                "Mình sẽ tìm tour phiêu lưu cho bạn!",
                "tour mạo hiểm", "Kayak, lặn, đu dây, zipline"
        ));
        
        // 9. Văn hóa - lịch sử
        SCENARIOS.put("culture", new ScenarioConfig(
                "culture", "🏛️", "Văn hóa & Lịch sử",
                "Mình sẽ tìm tour văn hóa cho bạn!",
                "tour văn hóa", "Di tích, bảo tàng, lễ hội"
        ));
        
        // 10. Wellness & Spa
        SCENARIOS.put("wellness", new ScenarioConfig(
                "wellness", "🧘", "Wellness & Spa",
                "Mình sẽ tìm tour wellness cho bạn!",
                "tour wellness", "Spa, yoga, thiền, nghỉ dưỡng"
        ));
        
        // 11. Du lịch xanh
        SCENARIOS.put("eco", new ScenarioConfig(
                "eco", "🌿", "Du lịch xanh",
                "Mình sẽ tìm tour sinh thái cho bạn!",
                "tour sinh thái", "Thiên nhiên, bảo tồn, trekking"
        ));
        
        // 12. Golf
        SCENARIOS.put("golf", new ScenarioConfig(
                "golf", "⛳", "Golf",
                "Mình sẽ tìm tour golf cho bạn!",
                "tour golf", "Sân golf, kết hợp nghỉ dưỡng"
        ));
        
        // 13. Du lịch mạo hiểm biển
        SCENARIOS.put("diving", new ScenarioConfig(
                "diving", "🤿", "Lặn biển & Snorkeling",
                "Mình sẽ tìm tour lặn biển cho bạn!",
                "tour lặn biển", "Lặn, snorkeling, san hô"
        ));
        
        // 14. Festival & Events
        SCENARIOS.put("festival", new ScenarioConfig(
                "festival", "🎉", "Festival & Sự kiện",
                "Mình sẽ tìm tour festival cho bạn!",
                "tour festival", "Lễ hội, sự kiện đặc biệt"
        ));
        
        // 15. Cross-vietnam (đi nhiều thành phố)
        SCENARIOS.put("cross", new ScenarioConfig(
                "cross", "🗺️", "Cross-Vietnam (Nhiều thành phố)",
                "Mình sẽ tìm tour đi nhiều nơi cho bạn!",
                "tour cross-vietnam", "Nhiều điểm đến, khám phá toàn diện"
        ));
    }

    /**
     * Start tour recommendation flow
     */
    public void start(Long conversationId, String inputText, String clientEmail) {
        String scenarioId = detectScenario(inputText);
        Integer budgetVnd = parseBudget(inputText);
        Integer travelers = parseTravelers(inputText);
        String city = parseCity(inputText);

        if (scenarioId != null && budgetVnd != null && travelers != null) {
            // Direct recommendation
            pushBotText(conversationId, clientEmail, "🗺️ Mình đang tìm tour...");
            pushTourCards(conversationId, clientEmail, scenarioId, budgetVnd, travelers, city);
        } else if (scenarioId != null) {
            // Start scenario flow
            pushScenarioChoice(conversationId, clientEmail, scenarioId);
        } else {
            // Show all scenarios
            pushScenarioChoice(conversationId, clientEmail, null);
        }
    }

    /**
     * Continue flow after user picks scenario
     */
    public void continueFlow(Long conversationId, String inputText, String canonical, String clientEmail) {
        // Cancel
        if (isCancelIntent(canonical)) {
            pushBotText(conversationId, clientEmail, "✅ Đã dừng tư vấn tour. Khi cần, nhắn **gợi ý tour** nhé!");
            return;
        }

        // Check for scenario selection
        String scenarioId = detectScenario(inputText);
        if (scenarioId != null) {
            Integer budgetVnd = parseBudget(inputText);
            Integer travelers = parseTravelers(inputText);
            if (budgetVnd != null && travelers != null) {
                pushBotText(conversationId, clientEmail, "🗺️ Mình đang tìm tour...");
                pushTourCards(conversationId, clientEmail, scenarioId, budgetVnd, travelers, null);
                return;
            }
        }

        // Ask for missing info
        Integer budgetVnd = parseBudget(inputText);
        Integer travelers = parseTravelers(inputText);
        String city = parseCity(inputText);

        if (budgetVnd == null) {
            pushBotText(conversationId, clientEmail, "💰 Ngân sách của bạn là bao nhiêu? Ví dụ: **10 triệu cho 2 người**");
            return;
        }
        if (travelers == null) {
            pushBotText(conversationId, clientEmail, "👥 Có bao nhiêu người đi? Ví dụ: **2 người**, **cả gia đình 4 người**");
            return;
        }

        pushBotText(conversationId, clientEmail, "🗺️ Mình đang tìm tour...");
        pushTourCards(conversationId, clientEmail, null, budgetVnd, travelers, city);
    }

    // ============================================================
    // PRIVATE: Push Methods
    // ============================================================

    private void pushScenarioChoice(Long conversationId, String clientEmail, String highlightScenario) {
        try {
            StringBuilder json = new StringBuilder();
            json.append("{\n");
            json.append("  \"question\": \"Bạn muốn chuyến đi kiểu nào? 🌟\",\n");
            json.append("  \"subtitle\": \"Chọn một kịch bản — mình sẽ gợi ý tour phù hợp!\",\n");
            json.append("  \"choices\": [\n");

            int i = 0;
            for (Map.Entry<String, ScenarioConfig> entry : SCENARIOS.entrySet()) {
                ScenarioConfig cfg = entry.getValue();
                String payload = "gợi ý " + cfg.tourType + " ngân sách 8 triệu cho 2 người";
                
                if (highlightScenario != null && highlightScenario.equals(entry.getKey())) {
                    payload = "gợi ý " + cfg.tourType + " cho 2 người";
                }

                json.append("    {");
                json.append("\"id\": \"").append(entry.getKey()).append("\", ");
                json.append("\"emoji\": \"").append(cfg.emoji).append("\", ");
                json.append("\"label\": \"").append(cfg.label).append("\", ");
                json.append("\"payload\": \"").append(payload).append("\"");
                json.append("}");
                if (++i < SCENARIOS.size()) json.append(",");
                json.append("\n");
            }

            json.append("  ]\n");
            json.append("}");

            ChatMessage saved = chatService.saveBotMessage(
                    conversationId, "🌟 Bạn muốn chuyến đi kiểu nào?",
                    ChatMessage.ContentType.SCENARIO_CHOICE, json.toString());
            messagingTemplate.convertAndSendToUser(clientEmail, "/queue/messages", ChatMessageResponse.from(saved));
        } catch (Exception e) {
            log.error("Lỗi push scenario choice", e);
            pushBotText(conversationId, clientEmail, "💬 Bạn cho mình biết **ngân sách** và **số người** để gợi ý tour nhé!");
        }
    }

    private void pushTourCards(Long conversationId, String clientEmail, String scenarioId,
                             Integer budgetVnd, Integer travelers, String city) {
        if (budgetVnd == null || travelers == null || travelers <= 0) {
            pushBotText(conversationId, clientEmail, "👥 Mình chưa đủ thông tin. Gửi: **10 triệu cho 2 người** nhé.");
            return;
        }

        BigDecimal perPerson = BigDecimal.valueOf(budgetVnd)
                .divide(BigDecimal.valueOf(travelers), 0, java.math.RoundingMode.DOWN);

        if (perPerson.compareTo(BigDecimal.valueOf(400_000)) < 0) {
            pushBotText(conversationId, clientEmail, "💰 Ngân sách hơi thấp. Thử tăng lên (ví dụ **6-8 triệu cho 2 người**) nhé!");
            return;
        }

        // Query tours
        List<Long> ids = tourRepository.findBotRecommendedTourIds(
                travelers, perPerson, city, null, LocalDate.now(), PageRequest.of(0, 3));

        if (ids.isEmpty()) {
            String msg = "🔍 Ngân sách **" + formatVnd(budgetVnd) + "** cho **" + travelers + " người** hiện chưa có tour phù hợp.\n\n" +
                    "Bạn có thể thử:\n- Tăng ngân sách thêm 20%\n- Hoặc nhắn **xóa lọc** để tìm rộng hơn";
            pushBotText(conversationId, clientEmail, msg);
            return;
        }

        List<TourCardItem> cards = buildTourCards(ids);
        String intro = "📍 Mình tìm được **" + cards.size() + " tour** phù hợp ngân sách **" + formatVnd(budgetVnd)
                + "** cho **" + travelers + " người** 👇";
        pushBotText(conversationId, clientEmail, intro);
        pushTourCardsMessage(conversationId, clientEmail, cards);
        pushBotText(conversationId, clientEmail, "💡 Muốn lọc thêm? Nhắn: **Đà Nẵng 3 ngày** hoặc **xóa lọc**.");
    }

    private List<TourCardItem> buildTourCards(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return List.of();

        Map<Long, String> imageMap = new HashMap<>();
        List<Object[]> imageRows = tourImageRepository.findCoverImagesByTourIds(ids);
        for (Object[] row : imageRows) {
            if (row != null && row.length > 1 && row[0] != null && row[1] != null) {
                imageMap.put(((Number) row[0]).longValue(), (String) row[1]);
            }
        }

        List<TourCardItem> cards = new ArrayList<>();
        for (Long id : ids) {
            Optional<Tour> opt = tourRepository.findById(id);
            if (opt.isEmpty()) continue;
            Tour tour = opt.get();
            if (!Boolean.TRUE.equals(tour.getIsActive())) continue;

            cards.add(TourCardItem.builder()
                    .id(tour.getId())
                    .title(tour.getTitle())
                    .slug(tour.getSlug())
                    .cityVi(tour.getCity() != null ? tour.getCity().getNameVi() : "Việt Nam")
                    .durationDays(tour.getDurationDays())
                    .durationNights(tour.getDurationNights())
                    .pricePerAdult(tour.getPricePerAdult())
                    .avgRating(tour.getAvgRating())
                    .reviewCount(tour.getReviewCount())
                    .imageUrl(imageMap.get(id))
                    .build());
        }
        return cards;
    }

    private void pushTourCardsMessage(Long conversationId, String clientEmail, List<TourCardItem> cards) {
        try {
            String json = objectMapper.writeValueAsString(cards);
            ChatMessage saved = chatService.saveBotMessage(
                    conversationId, "🗺️ Danh sách tour gợi ý",
                    ChatMessage.ContentType.TOUR_CARDS, json);
            messagingTemplate.convertAndSendToUser(clientEmail, "/queue/messages", ChatMessageResponse.from(saved));
        } catch (Exception e) {
            log.error("Lỗi push tour cards", e);
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
    // PRIVATE: Scenario Detection
    // ============================================================

    private String detectScenario(String input) {
        if (input == null) return null;
        String lower = input.toLowerCase();

        // Beach
        if (containsAny(lower, List.of("biển", "bãi biển", "tắm biển", "beach", "sea", "nghỉ biển"))) {
            return "beach";
        }
        // Mountain
        if (containsAny(lower, List.of("núi", "rừng", "trekking", "leo núi", "mountain", "cắm trại", "camping"))) {
            return "mountain";
        }
        // Romantic
        if (containsAny(lower, List.of("lãng mạn", "tuần trăng mật", "honeymoon", "yên tĩnh", "riêng tư", "couple"))) {
            return "romantic";
        }
        // Family
        if (containsAny(lower, List.of("gia đình", "family", "trẻ em", "con nhỏ", "cả nhà", "đông người"))) {
            return "family";
        }
        // Budget
        if (containsAny(lower, List.of("tiết kiệm", "rẻ", "budget", "cheap", "ít tiền", "tiết kiệm"))) {
            return "budget";
        }
        // City
        if (containsAny(lower, List.of("city", "thành phố", "cuối tuần", "weekend", "ngắn ngày"))) {
            return "city";
        }
        // Food
        if (containsAny(lower, List.of("ẩm thực", "ăn uống", "món ngon", "food", "gastronomy", "hải sản"))) {
            return "food";
        }
        // Adventure
        if (containsAny(lower, List.of("mạo hiểm", "adventure", "phiêu lưu", "extreme", "zip", "đu dây"))) {
            return "adventure";
        }
        // Culture
        if (containsAny(lower, List.of("văn hóa", "lịch sử", "culture", "history", "di tích", "bảo tàng", "museum"))) {
            return "culture";
        }
        // Wellness
        if (containsAny(lower, List.of("wellness", "spa", "yoga", "thiền", "massage", "thư giãn", "nghỉ dưỡng"))) {
            return "wellness";
        }
        // Eco
        if (containsAny(lower, List.of("xanh", "eco", "sinh thái", "ecology", "bảo tồn", "nature"))) {
            return "eco";
        }
        // Golf
        if (containsAny(lower, List.of("golf", "sân golf"))) {
            return "golf";
        }
        // Diving
        if (containsAny(lower, List.of("lặn", "diving", "snorkeling", "san hô", "biển sâu"))) {
            return "diving";
        }
        // Festival
        if (containsAny(lower, List.of("festival", "lễ hội", "sự kiện", "event", " Noel", "Tết", "pháo hoa"))) {
            return "festival";
        }
        // Cross-vietnam
        if (containsAny(lower, List.of("cross", "nhiều nơi", "nhiều thành phố", "từ bắc vào nam", "toàn quốc"))) {
            return "cross";
        }

        return null;
    }

    private boolean containsAny(String text, List<String> keywords) {
        if (text == null || text.isBlank() || keywords == null) return false;
        for (String kw : keywords) {
            if (text.contains(kw)) return true;
        }
        return false;
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

    private boolean isCancelIntent(String canonical) {
        if (canonical == null) return false;
        return canonical.contains("dung") || canonical.contains("thoi") ||
                canonical.contains("thoat") || canonical.contains("cancel") ||
                canonical.contains("huy") || canonical.contains("exit");
    }

    private String formatVnd(long amount) {
        return String.format(Locale.US, "%,d", amount).replace(',', '.') + " VND";
    }

    // ============================================================
    // INNER CLASS: Scenario Config
    // ============================================================
    
    private record ScenarioConfig(
            String id,
            String emoji,
            String label,
            String greeting,
            String tourType,
            String description
    ) {}
}
