package vn.tourista.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import vn.tourista.dto.response.ChatMessageResponse;
import vn.tourista.dto.response.HotelCardItem;
import vn.tourista.dto.response.TourCardItem;
import vn.tourista.entity.ChatMessage;
import vn.tourista.entity.Hotel;
import vn.tourista.repository.CityRepository;
import vn.tourista.repository.HotelRepository;
import vn.tourista.repository.TourImageRepository;
import vn.tourista.repository.TourRepository;
import vn.tourista.service.ChatService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * AI Recommendation Service - xử lý tour & hotel recommendations
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiRecommendationService {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final TourRepository tourRepository;
    private final TourImageRepository tourImageRepository;
    private final HotelRepository hotelRepository;
    private final CityRepository cityRepository;
    private final ObjectMapper objectMapper;
    private final AiCoreService aiCore;

    // ----- Intent Detection -----

    public boolean isRecommendationIntent(String canonicalInput) {
        boolean hasSuggestIntent = containsAny(canonicalInput,
                List.of("goi y", "goi i", "tu van", "de xuat", "suggest", "tim tour", "du lich"));
        boolean hasTourContext = containsAny(canonicalInput,
                List.of("tour", "du lich", "di dau", "bien", "nghi duong"));
        return hasSuggestIntent || hasTourContext;
    }

    public boolean isHotelIntent(String canonicalInput) {
        return containsAny(canonicalInput,
                List.of("khach san", "hotel", "noi that", "nghi duong", "cho o", "noi nghi", "tim khach san"));
    }

    public boolean isHotTourIntent(String canonicalInput) {
        return containsAny(canonicalInput, List.of(
                "tour hot", "tour noi bat", "pho bien", "bestseller", "nhieu nguoi dat", "top tour"));
    }

    public boolean isCancelIntent(String canonicalInput) {
        return containsAny(canonicalInput, List.of("dung", "thoi", "thoat", "exit", "cancel", "huy"));
    }

    // ----- Recommendation Handlers -----

    public void handleRecommendation(Long conversationId, String inputText, String clientEmail) {
        Integer budgetVnd = parseBudgetVnd(inputText);
        Integer travelers = parseTravelers(inputText);
        String city = parseCity(inputText);
        Integer days = parseDuration(inputText);

        if (budgetVnd != null && travelers != null) {
            pushBotText(conversationId, clientEmail, "✨ Mình đang tìm tour phù hợp...");
            pushTourCards(conversationId, clientEmail, budgetVnd, travelers, city, days);
        } else {
            pushScenarioChoice(conversationId, clientEmail);
        }
    }

    public void handleHotelRecommendation(Long conversationId, String inputText, String clientEmail) {
        Integer budgetVnd = parseBudgetVnd(inputText);
        String city = parseCity(inputText);

        if (city != null && budgetVnd != null) {
            pushBotText(conversationId, clientEmail, "🏨 Mình đang tìm khách sạn...");
            pushHotelCards(conversationId, clientEmail, city, budgetVnd);
        } else {
            pushHotelPrompt(conversationId, clientEmail);
        }
    }

    // ----- Context Building -----

    public String buildDbContext(String inputText, String canonical) {
        StringBuilder ctx = new StringBuilder();

        // Cities
        try {
            List<Object[]> cities = cityRepository.findTrendingCities(5);
            if (cities != null && !cities.isEmpty()) {
                ctx.append("Các thành phố du lịch phổ biến: ");
                for (int i = 0; i < Math.min(5, cities.size()); i++) {
                    Object[] row = cities.get(i);
                    if (i > 0) ctx.append("; ");
                    ctx.append(row[1]).append("/").append(row[2])
                            .append(" (").append(row[3]).append(" khách sạn, ").append(row[4]).append(" tour)");
                }
                ctx.append(".\n");
            }
        } catch (Exception e) {
            log.debug("Could not load cities: {}", e.getMessage());
        }

        // Tours
        if (containsAny(canonical, List.of("tour", "du lich", "di dau", "goi y"))) {
            try {
                List<Long> tourIds = tourRepository.findActiveTourIds(PageRequest.of(0, 5));
                if (tourIds != null && !tourIds.isEmpty()) {
                    ctx.append("Tour đang hoạt động: ");
                    for (int i = 0; i < tourIds.size(); i++) {
                        var t = tourRepository.findById(tourIds.get(i)).orElse(null);
                        if (t != null) {
                            if (i > 0) ctx.append("; ");
                            ctx.append("- \"").append(t.getTitle()).append("\" giá từ ")
                                    .append(formatVnd(t.getPricePerAdult().longValue())).append("/người lớn");
                            if (t.getAvgRating() != null && t.getAvgRating().compareTo(BigDecimal.ZERO) > 0) {
                                ctx.append(", rating ").append(t.getAvgRating()).append("★");
                            }
                        }
                    }
                    ctx.append(".\n");
                }
            } catch (Exception e) {
                log.debug("Could not load tours: {}", e.getMessage());
            }
        }

        // Hotels
        if (containsAny(canonical, List.of("khach san", "hotel", "noi nghi"))) {
            try {
                String detectedCity = parseCity(canonical);
                if (detectedCity != null) {
                    List<Object[]> hotels = hotelRepository.findPopularHotelsByCityEn(detectedCity, 3);
                    if (hotels != null && !hotels.isEmpty()) {
                        ctx.append("Khách sạn nổi bật: ");
                        for (int i = 0; i < hotels.size(); i++) {
                            Object[] row = hotels.get(i);
                            if (i > 0) ctx.append("; ");
                            ctx.append("- \"").append(row[1]).append("\" (").append(row[2]).append("★)")
                                    .append(", rating ").append(row[4]).append("★");
                        }
                        ctx.append(".\n");
                    }
                }
            } catch (Exception e) {
                log.debug("Could not load hotels: {}", e.getMessage());
            }
        }

        if (ctx.isEmpty()) {
            return "Hệ thống Tourista Studio có tour du lịch và khách sạn tại nhiều thành phố Việt Nam.";
        }
        return ctx.toString();
    }

    // ----- Private: Tour Cards -----

    private void pushScenarioChoice(Long conversationId, String clientEmail) {
        try {
            String scenarioJson = """
                    {
                      "question": "Bạn muốn chuyến đi kiểu nào? 🌟",
                      "subtitle": "Chọn một kịch bản — mình sẽ gợi ý tour phù hợp!",
                      "choices": [
                        {"id": "beach",    "emoji": "🏖️", "label": "Nghỉ biển thư giãn",     "payload": "gợi ý tour biển ngân sách 8tr"},
                        {"id": "mountain", "emoji": "🏔️", "label": "Khám phá núi rừng",        "payload": "gợi ý tour núi ngân sách 6tr"},
                        {"id": "romantic", "emoji": "👑", "label": "Tuần trăng mật",           "payload": "gợi ý tour tuần trăng mật ngân sách 15tr cho 2 người"},
                        {"id": "family",   "emoji": "👨‍👩‍👧", "label": "Gia đình có trẻ em",        "payload": "gợi ý tour gia đình ngân sách 12tr cho 4 người"},
                        {"id": "budget",   "emoji": "💸", "label": "Ngân sách tiết kiệm",       "payload": "gợi ý tour giá rẻ ngân sách 4tr cho 2 người"},
                        {"id": "city",     "emoji": "🏙️", "label": "City break cuối tuần",       "payload": "gợi ý city tour 2 ngày ngân sách 5tr cho 2 người"},
                        {"id": "food",     "emoji": "🍜", "label": "Khám phá ẩm thực",          "payload": "gợi ý tour ẩm thực ngân sách 7tr"},
                        {"id": "adventure","emoji": "🚁", "label": "Mạo hiểm",                   "payload": "gợi ý tour mạo hiểm ngân sách 10tr"}
                      ]
                    }
                    """;

            ChatMessage saved = chatService.saveBotMessage(
                    conversationId, "🌟 Bạn muốn chuyến đi kiểu nào?",
                    ChatMessage.ContentType.SCENARIO_CHOICE, scenarioJson);
            messagingTemplate.convertAndSendToUser(clientEmail, "/queue/messages", ChatMessageResponse.from(saved));
        } catch (Exception e) {
            log.error("Lỗi khi push scenario choice", e);
            pushBotText(conversationId, clientEmail, "💬 Bạn cho mình biết **ngân sách** và **số người** để mình gợi ý tour nhé!");
        }
    }

    private void pushTourCards(Long conversationId, String clientEmail,
                             Integer budgetVnd, Integer travelers, String city, Integer days) {
        if (budgetVnd == null || travelers == null || travelers <= 0) {
            pushBotText(conversationId, clientEmail, "👥 Mình chưa đủ thông tin. Gửi: **ngân sách 10tr cho 2 người** nhé.");
            return;
        }

        BigDecimal perPerson = BigDecimal.valueOf(budgetVnd)
                .divide(BigDecimal.valueOf(travelers), 0, java.math.RoundingMode.DOWN);

        if (perPerson.compareTo(BigDecimal.valueOf(400_000)) < 0) {
            pushBotText(conversationId, clientEmail, "💰 Ngân sách hơi thấp. Thử tăng lên (ví dụ **6-8tr cho 2 người**) nhé!");
            return;
        }

        List<Long> ids = tourRepository.findBotRecommendedTourIds(
                travelers, perPerson, city, days, LocalDate.now(), PageRequest.of(0, 3));

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
            tourRepository.findById(id).ifPresent(tour -> {
                if (Boolean.TRUE.equals(tour.getIsActive())) {
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
            });
        }
        return cards;
    }

    private void pushTourCardsMessage(Long conversationId, String clientEmail, List<TourCardItem> cards) {
        try {
            String json = objectMapper.writeValueAsString(cards);
            ChatMessage saved = chatService.saveBotMessage(
                    conversationId, "🏗️ Danh sách tour gợi ý",
                    ChatMessage.ContentType.TOUR_CARDS, json);
            messagingTemplate.convertAndSendToUser(clientEmail, "/queue/messages", ChatMessageResponse.from(saved));
        } catch (Exception e) {
            log.error("Lỗi khi push tour cards", e);
        }
    }

    // ----- Private: Hotel Cards -----

    private void pushHotelPrompt(Long conversationId, String clientEmail) {
        try {
            String promptJson = """
                    {
                      "question": "Bạn cần gì ở chỗ ở? 🏨",
                      "subtitle": "Mình sẽ tìm khách sạn phù hợp!",
                      "choices": [
                        {"id": "budget_hotel",  "emoji": "💸", "label": "Tiết kiệm",    "payload": "tìm khách sạn dưới 500k"},
                        {"id": "mid_hotel",     "emoji": "⭐", "label": "Trung bình",    "payload": "tìm khách sạn 500k-1.5tr"},
                        {"id": "luxury_hotel",  "emoji": "👑", "label": "Cao cấp",      "payload": "tìm khách sạn 5 sao"},
                        {"id": "family_hotel",  "emoji": "👨‍👩‍👧", "label": "Gia đình",      "payload": "tìm khách sạn gia đình"},
                        {"id": "beach_hotel",   "emoji": "🏖️", "label": "Gần biển",      "payload": "tìm khách sạn gần biển"},
                        {"id": "city_hotel",    "emoji": "🏙️", "label": "Trung tâm",     "payload": "tìm khách sạn trung tâm"}
                      ]
                    }
                    """;

            ChatMessage saved = chatService.saveBotMessage(
                    conversationId, "🏨 Bạn cần gì ở chỗ ở?",
                    ChatMessage.ContentType.HOTEL_PROMPT, promptJson);
            messagingTemplate.convertAndSendToUser(clientEmail, "/queue/messages", ChatMessageResponse.from(saved));
        } catch (Exception e) {
            log.error("Lỗi khi push hotel prompt", e);
            pushBotText(conversationId, clientEmail, "🏨 Bạn cho mình biết **địa điểm** và **ngân sách** để gợi ý khách sạn nhé!");
        }
    }

    private void pushHotelCards(Long conversationId, String clientEmail, String city, Integer budgetVnd) {
        BigDecimal maxPrice = BigDecimal.valueOf(budgetVnd);
        List<Long> ids = hotelRepository.findBotRecommendedHotelIds(city, maxPrice, null, BigDecimal.ZERO, 3);

        if (ids.isEmpty()) {
            String msg = "🔍 Ngân sách **" + formatVnd(budgetVnd) + "/đêm** tại **" + city + "** hiện chưa có khách sạn phù hợp.\n\n" +
                    "Thử tăng ngân sách thêm 20-30% nhé!";
            pushBotText(conversationId, clientEmail, msg);
            return;
        }

        List<HotelCardItem> cards = buildHotelCards(ids);
        String intro = "🏨 Mình tìm được **" + cards.size() + " khách sạn** trong tầm **" + formatVnd(budgetVnd) + "/đêm** tại **" + city + "** 👇";
        pushBotText(conversationId, clientEmail, intro);
        pushHotelCardsMessage(conversationId, clientEmail, cards);
        pushBotText(conversationId, clientEmail, "💡 Muốn lọc thêm? Nhắn: **5 sao** hoặc **xóa lọc**.");
    }

    private List<HotelCardItem> buildHotelCards(List<Long> ids) {
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
            hotelRepository.findById(id).ifPresent(hotel -> {
                if (Boolean.TRUE.equals(hotel.getIsActive())) {
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
            });
        }
        return cards;
    }

    private void pushHotelCardsMessage(Long conversationId, String clientEmail, List<HotelCardItem> cards) {
        try {
            String json = objectMapper.writeValueAsString(cards);
            ChatMessage saved = chatService.saveBotMessage(
                    conversationId, "🏨 Danh sách khách sạn gợi ý",
                    ChatMessage.ContentType.HOTEL_CARDS, json);
            messagingTemplate.convertAndSendToUser(clientEmail, "/queue/messages", ChatMessageResponse.from(saved));
        } catch (Exception e) {
            log.error("Lỗi khi push hotel cards", e);
        }
    }

    // ----- Private: NLP Parsing -----

    private static final Pattern BUDGET_PATTERN = Pattern.compile(
            "(\\d+(?:[\\.,]\\d+)?)\\s*(tr|trieu|triệu|m)\\b", Pattern.CASE_INSENSITIVE);

    private Integer parseBudgetVnd(String text) {
        if (text == null) return null;
        Matcher m = BUDGET_PATTERN.matcher(text);
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
        Pattern p = Pattern.compile("\\b(\\d{1,2})\\s*(nguoi|người|khach|khách)\\b", Pattern.CASE_INSENSITIVE);
        Matcher m = p.matcher(text);
        if (m.find()) {
            try {
                int val = Integer.parseInt(m.group(1));
                return (val >= 1 && val <= 20) ? val : null;
            } catch (Exception ignored) {}
        }
        // "một người", "tôi đi một mình"
        if (text.contains("một người") || text.contains("mình") || text.contains("tôi đi")) {
            return 1;
        }
        return null;
    }

    private String parseCity(String text) {
        if (text == null) return null;
        List<String[]> cities = List.of(
                new String[]{"da nang", "Da Nang"},
                new String[]{"ha noi", "Ha Noi"},
                new String[]{"nha trang", "Nha Trang"},
                new String[]{"phu quoc", "Phu Quoc"},
                new String[]{"da lat", "Da Lat"},
                new String[]{"sapa", "Sa Pa"},
                new String[]{"hue", "Hue"},
                new String[]{"hoi an", "Hoi An"}
        );
        String lower = text.toLowerCase();
        for (String[] c : cities) {
            if (lower.contains(c[0])) return c[1];
        }
        return null;
    }

    private Integer parseDuration(String text) {
        if (text == null) return null;
        Pattern p = Pattern.compile("\\b(\\d{1,2})\\s*(ngay|ngày|dem|đêm)\\b", Pattern.CASE_INSENSITIVE);
        Matcher m = p.matcher(text);
        if (m.find()) {
            try {
                int val = Integer.parseInt(m.group(1));
                return (val >= 1 && val <= 14) ? val : null;
            } catch (Exception ignored) {}
        }
        return null;
    }

    // ----- Private: Utilities -----

    void pushBotText(Long conversationId, String clientEmail, String text) {
        try {
            ChatMessage saved = chatService.saveBotMessage(
                    conversationId, text, ChatMessage.ContentType.TEXT, null);
            messagingTemplate.convertAndSendToUser(clientEmail, "/queue/messages", ChatMessageResponse.from(saved));
        } catch (Exception e) {
            log.error("Lỗi khi push bot text", e);
        }
    }

    private boolean containsAny(String text, List<String> keywords) {
        if (text == null || text.isBlank() || keywords == null) return false;
        for (String kw : keywords) {
            if (text.contains(kw)) return true;
        }
        return false;
    }

    private String formatVnd(long amount) {
        return String.format(Locale.US, "%,d", amount).replace(',', '.') + " VND";
    }
}
