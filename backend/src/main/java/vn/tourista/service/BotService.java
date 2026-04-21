package vn.tourista.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import jakarta.annotation.PostConstruct;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.tourista.dto.response.BotBookingResponse;
import vn.tourista.dto.response.ChatMessageResponse;
import vn.tourista.dto.response.TourCardItem;
import vn.tourista.entity.*;
import vn.tourista.repository.*;

import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service xử lý logic Chatbot tự động.
 *
 * Luồng 1 — Tra cứu Booking:
 * Phát hiện mã TRS-YYYYMMDD-XXXXXX trong tin nhắn
 * → query DB lấy toàn bộ thông tin
 * → trả về Rich Card (BOOKING_DETAILS) cho Frontend render Timeline
 *
 * Luồng 2 — FAQ cứng (Fallback):
 * Không tìm thấy mã → khớp keyword → trả lời hướng dẫn thường gặp
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BotService {
    // Regex khớp format bookingCode thực tế: TRS-YYYYMMDD-XXXXXX
    private static final Pattern BOOKING_CODE_PATTERN = Pattern.compile("\\bTRS-\\d{8}-[A-Z0-9]{6}\\b",
            Pattern.CASE_INSENSITIVE);
    private static final String FAQ_RESOURCE = "chatbot-faq.json";
    private static final String DEFAULT_FAQ_ANSWER = "Xin loi, minh chua hieu ro yeu cau cua ban.\n\n" +
            "Ban co the thu:\n" +
            "- Tra cuu booking: gui ma TRS-YYYYMMDD-XXXXXX\n" +
            "- Hoi ve: huy/hoan tien, thanh toan, lien he ho tro\n\n" +
            "Neu can gap nguoi that, hay nhan vao chat voi Chu Tour/Hotel tu trang chi tiet.";
    private static final Pattern BUDGET_MILLION_PATTERN = Pattern.compile(
            "(\\d+(?:[\\.,]\\d+)?)\\s*(tr|trieu|triệu|m)\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern BUDGET_THOUSAND_PATTERN = Pattern.compile(
            "(\\d+(?:[\\.,]\\d+)?)\\s*(k|nghin|nghìn)\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern BUDGET_RAW_PATTERN = Pattern.compile(
            "\\b(\\d{1,3}(?:[\\.,]\\d{3}){1,3}|\\d{6,11})\\b");
    private static final Pattern TRAVELERS_PATTERN = Pattern.compile(
            "\\b(\\d{1,2})\\s*(nguoi|người|khach|khách|adult|adults)\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern GROUP_PATTERN = Pattern.compile(
            "\\b(nhom|nhóm|team)\\s*(\\d{1,2})\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern TRAVELERS_FOR_PATTERN = Pattern.compile(
            "\\bcho\\s*(\\d{1,2})\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern PAX_PATTERN = Pattern.compile(
            "\\b(\\d{1,2})\\s*(pax|person|persons)\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern DURATION_PATTERN = Pattern.compile(
            "\\b(\\d{1,2})\\s*(ngay|ngày|dem|đêm)\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern DURATION_TRIP_PATTERN = Pattern.compile(
            "\\b(\\d{1,2})\\s*n\\s*\\d{1,2}\\s*[đd]\\b",
            Pattern.CASE_INSENSITIVE);
    private static final long RECOMMENDATION_STATE_TIMEOUT_MINUTES = 20;
    private static final int RECOMMENDATION_HISTORY_SCAN_LIMIT = 20;
    private static final int AI_CONTEXT_HISTORY_LIMIT = 8;
    private static final List<CityAlias> CITY_ALIASES = List.of(
            new CityAlias("da nang", "Da Nang", List.of("da nang", "đà nẵng")),
            new CityAlias("da lat", "Da Lat", List.of("da lat", "đà lạt")),
            new CityAlias("phu quoc", "Phu Quoc", List.of("phu quoc", "phú quốc")),
            new CityAlias("nha trang", "Nha Trang", List.of("nha trang", "nha trang")),
            new CityAlias("ha noi", "Ha Noi", List.of("ha noi", "hà nội")),
            new CityAlias("sapa", "Sa Pa", List.of("sapa", "sa pa")),
            new CityAlias("hue", "Hue", List.of("hue", "huế")),
            new CityAlias("hoi an", "Hoi An", List.of("hoi an", "hội an")));

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final BookingRepository bookingRepository;
    private final BookingTourDetailRepository tourDetailRepository;
    private final BookingHotelDetailRepository hotelDetailRepository;
    private final TourItineraryRepository tourItineraryRepository;
    private final TourRepository tourRepository;
    private final TourImageRepository tourImageRepository;
    private final ConversationRepository conversationRepository;
    private final ConversationSessionRepository conversationSessionRepository;
    private final SessionRecommendationStateRepository recommendationStateRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ObjectMapper objectMapper;
    private final TourRecommendationService tourRecommendationService;
    private volatile List<FaqRule> faqRules = List.of();
    private volatile String defaultFaqAnswer = DEFAULT_FAQ_ANSWER;
    private final ThreadLocal<String> currentConversationContext = new ThreadLocal<>();

    @PostConstruct
    void loadFaqRules() {
        List<FaqRule> loadedRules = new ArrayList<>();
        try (InputStream stream = new ClassPathResource(FAQ_RESOURCE).getInputStream()) {
            FaqConfig config = objectMapper.readValue(stream, FaqConfig.class);
            if (config != null) {
                if (config.defaultAnswer() != null && !config.defaultAnswer().isBlank()) {
                    defaultFaqAnswer = config.defaultAnswer();
                }

                if (config.rules() != null) {
                    for (FaqItem item : config.rules()) {
                        if (item == null || item.answer() == null || item.answer().isBlank()) {
                            continue;
                        }

                        List<String> keywords = new ArrayList<>();
                        if (item.keywords() != null) {
                            for (String keyword : item.keywords()) {
                                if (keyword == null || keyword.isBlank()) {
                                    continue;
                                }
                                keywords.add(keyword.toLowerCase().trim());
                            }
                        }

                        if (!keywords.isEmpty()) {
                            loadedRules.add(new FaqRule(List.copyOf(keywords), item.answer().trim()));
                        }
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("BotService: cannot load FAQ config from {}. Falling back to built-in rules.", FAQ_RESOURCE, ex);
        }

        if (loadedRules.isEmpty()) {
            loadedRules = buildFallbackFaqRules();
        }

        faqRules = List.copyOf(loadedRules);
        log.info("BotService: loaded {} FAQ rules", faqRules.size());
    }

    /**
     * Entry point: xử lý tin nhắn gửi vào Bot conversation.
     * Chạy async để không block WebSocket thread.
     */
    @Async("botTaskExecutor")
    @Transactional
    public void handleBotMessage(Long conversationId, String inputText, String clientEmail) {
        try {
            String upperInput = inputText.toUpperCase();
            Matcher matcher = BOOKING_CODE_PATTERN.matcher(upperInput);
            String normalizedInput = normalizeInput(inputText);
            String canonicalInput = canonicalize(normalizedInput);

            if (matcher.find()) {
                String code = matcher.group().toUpperCase();
                processBookingLookup(conversationId, code, clientEmail);
            } else if (isHotTourIntent(canonicalInput)) {
                pushHotTours(conversationId, clientEmail);
            } else {
                if (!hasActiveRecommendation(conversationId)
                        && isRecommendationFollowUpIntent(inputText, canonicalInput)) {
                    restoreRecommendationStateFromHistory(conversationId);
                }

                if (hasActiveRecommendation(conversationId)) {
                    processRecommendationFlow(conversationId, inputText, canonicalInput, clientEmail);
                } else if (isRecommendationIntent(canonicalInput)) {
                    startRecommendationFlow(conversationId, inputText, clientEmail);
        } else {
            String context = currentConversationContext.get();
            processFaqFallback(conversationId, inputText, clientEmail, context);
        }
            }
        } catch (Exception ex) {
            log.error("BotService: Unexpected error while handling bot message. conversationId={}, clientEmail={}",
                    conversationId,
                    clientEmail,
                    ex);
            pushBotText(conversationId, clientEmail,
                    "⚠️ Hệ thống đang bận, bạn vui lòng thử lại sau ít phút.");
        } finally {
            String recentCtx = buildRecentConversationContext(conversationId);
            currentConversationContext.set(recentCtx);
            updateConversationSession(conversationId, recentCtx);
        }
    }

    // =====================================================================
    // LUỒNG 1: TRA CỨU BOOKING
    // =====================================================================

    private void processBookingLookup(Long conversationId, String bookingCode, String clientEmail) {
        // Bước 1: Tìm booking theo mã
        Optional<Booking> bookingOpt = bookingRepository.findByBookingCodeIgnoreCase(bookingCode);

        if (bookingOpt.isEmpty()) {
            pushBotText(conversationId, clientEmail,
                    "❌ Mình không tìm thấy mã đặt chỗ **" + bookingCode + "**.\n\n" +
                            "Vui lòng kiểm tra lại mã trong email xác nhận hoặc mục **Lịch sử Booking** trên tài khoản của bạn.");
            return;
        }

        Booking booking = bookingOpt.get();

        // Bước 2: Bảo mật — chỉ chủ booking mới được xem
        // Dùng query theo email để tránh LazyInitialization trên booking.user trong
        // luồng async
        boolean ownedByRequester = bookingRepository
                .findByBookingCodeAndUser_Email(booking.getBookingCode(), clientEmail)
                .isPresent();

        if (!ownedByRequester) {
            pushBotText(conversationId, clientEmail,
                    "🔒 Bạn không có quyền xem thông tin mã đặt chỗ này.\n\n" +
                            "Mỗi booking chỉ có thể tra cứu bởi người đặt. Nếu bạn cho rằng đây là nhầm lẫn, hãy liên hệ hỗ trợ.");
            return;
        }

        // Bước 3: Build response theo loại booking
        try {
            BotBookingResponse response;
            if (booking.getBookingType() == Booking.BookingType.TOUR) {
                response = buildTourResponse(booking);
            } else {
                response = buildHotelResponse(booking);
            }

            // Serialize thành JSON string để lưu vào metadata
            String metadataJson = objectMapper.writeValueAsString(response);

            // Lưu vào DB và push WebSocket
            ChatMessage saved = chatService.saveBotMessage(
                    conversationId,
                    sanitizeForStorage("✅ Đây là thông tin chi tiết đặt chỗ của bạn 👇"),
                    ChatMessage.ContentType.BOOKING_DETAILS,
                    metadataJson);

            // Push tới client
            messagingTemplate.convertAndSendToUser(
                    clientEmail,
                    "/queue/messages",
                    ChatMessageResponse.from(saved));

        } catch (Exception e) {
            log.error("BotService: Lỗi khi build booking response cho mã {}", bookingCode, e);
            pushBotText(conversationId, clientEmail,
                    "⚠️ Hệ thống gặp lỗi khi tải thông tin booking. Vui lòng thử lại sau.");
        }
    }

    private BotBookingResponse buildTourResponse(Booking booking) {
        // Lấy BookingTourDetail (thông tin chi tiết chuyến đi)
        BookingTourDetail detail = tourDetailRepository.findByBooking(booking)
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy chi tiết tour cho booking " + booking.getBookingCode()));

        Tour tour = detail.getTour();
        User operator = tour.getOperator();

        // Lấy lịch trình từng ngày
        List<TourItinerary> itineraries = tourItineraryRepository
                .findByTour_IdOrderByDayNumberAscIdAsc(tour.getId());

        List<BotBookingResponse.ItineraryDay> itineraryDays = itineraries.stream()
                .map(it -> BotBookingResponse.ItineraryDay.builder()
                        .day(it.getDayNumber())
                        .title(it.getTitle())
                        .description(it.getDescription())
                        .build())
                .toList();

        // Build partner info (chủ tour)
        BotBookingResponse.PartnerInfo partnerInfo = null;
        if (operator != null) {
            partnerInfo = BotBookingResponse.PartnerInfo.builder()
                    .id(operator.getId())
                    .name(operator.getFullName())
                    .avatar(operator.getAvatarUrl())
                    .phone(operator.getPhone())
                    .build();
        }

        return BotBookingResponse.builder()
                .bookingCode(booking.getBookingCode())
                .bookingType("TOUR")
                .status(booking.getStatus().name())
                .totalAmount(booking.getTotalAmount())
                .currency(booking.getCurrency())
                .specialRequests(booking.getSpecialRequests())
                .partner(partnerInfo)
                // Tour-specific fields
                .tourTitle(detail.getTourTitle())
                .departureDate(detail.getDepartureDate())
                .durationDays(tour.getDurationDays())
                .durationNights(tour.getDurationNights())
                .numAdults(detail.getNumAdults())
                .numChildren(detail.getNumChildren())
                .pricePerAdult(detail.getPricePerAdult())
                .pricePerChild(detail.getPricePerChild())
                .includes(tour.getIncludes())
                .excludes(tour.getExcludes())
                .highlights(tour.getHighlights())
                .itinerary(itineraryDays)
                .build();
    }

    private BotBookingResponse buildHotelResponse(Booking booking) {
        // Lấy BookingHotelDetail
        BookingHotelDetail detail = hotelDetailRepository.findByBooking(booking)
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy chi tiết hotel cho booking " + booking.getBookingCode()));

        Hotel hotel = detail.getHotel();
        User owner = hotel.getOwner();

        // Build partner info (chủ khách sạn)
        BotBookingResponse.PartnerInfo partnerInfo = null;
        if (owner != null) {
            partnerInfo = BotBookingResponse.PartnerInfo.builder()
                    .id(owner.getId())
                    .name(owner.getFullName())
                    .avatar(owner.getAvatarUrl())
                    .phone(owner.getPhone())
                    .build();
        }

        return BotBookingResponse.builder()
                .bookingCode(booking.getBookingCode())
                .bookingType("HOTEL")
                .status(booking.getStatus().name())
                .totalAmount(booking.getTotalAmount())
                .currency(booking.getCurrency())
                .specialRequests(booking.getSpecialRequests())
                .partner(partnerInfo)
                // Hotel-specific fields
                .hotelName(detail.getHotelName())
                .hotelAddress(hotel.getAddress())
                .roomTypeName(detail.getRoomTypeName())
                .checkInDate(detail.getCheckInDate())
                .checkOutDate(detail.getCheckOutDate())
                .nights(detail.getNights())
                .numRooms(detail.getNumRooms())
                .adults(detail.getAdults())
                .children(detail.getChildren())
                .pricePerNight(detail.getPricePerNight())
                .checkInTime(hotel.getCheckInTime() != null ? hotel.getCheckInTime().toString() : null)
                .checkOutTime(hotel.getCheckOutTime() != null ? hotel.getCheckOutTime().toString() : null)
                .build();
    }

    // =====================================================================
    // LUONG 2: GOI Y TOUR DA BUOC (ngan sach + so nguoi)
    // =====================================================================

    private void startRecommendationFlow(Long conversationId, String inputText, String clientEmail) {
        String canonicalInput = canonicalize(normalizeInput(inputText));
        Integer budgetVnd = parseBudgetVnd(inputText);
        Integer travelers = parseTravelers(inputText, false);
        CityAlias city = parseCityAlias(canonicalInput);
        Integer maxDurationDays = parseMaxDurationDays(inputText);

        RecommendationState state = new RecommendationState(
                budgetVnd,
                travelers,
                city != null ? city.queryValue() : null,
                city != null ? city.displayValue() : null,
                maxDurationDays,
                LocalDateTime.now());

        if (budgetVnd != null && travelers != null) {
            saveRecommendationState(conversationId, state);
            pushBotText(conversationId, clientEmail, "✨ Mình đang tìm tour phù hợp...");
            pushTourCards(conversationId, clientEmail, state);
            return;
        }

        saveRecommendationState(conversationId, state);
        pushScenarioChoice(conversationId, clientEmail);
    }

    private void processRecommendationFlow(Long conversationId, String inputText, String canonicalInput,
            String clientEmail) {
        if (containsAny(canonicalInput, List.of("dung", "thoi", "thoat", "exit", "cancel", "huy"))) {
            recommendationStateRepository.deleteByConversationId(conversationId);
            pushBotText(conversationId, clientEmail,
                    "✅ Mình đã dừng phiên tư vấn tour. Khi cần gợi ý lại, bạn chỉ cần nhắn: **gợi ý tour**.");
            return;
        }

        RecommendationState state = loadRecommendationState(conversationId);
        if (state == null) {
            startRecommendationFlow(conversationId, inputText, clientEmail);
            return;
        }

        Integer budgetVnd = state.budgetVnd();
        Integer travelers = state.travelers();
        String cityQuery = state.cityQuery();
        String cityDisplay = state.cityDisplay();
        Integer maxDurationDays = state.maxDurationDays();

        if (budgetVnd == null) {
            budgetVnd = parseBudgetVnd(inputText);
        }

        if (travelers == null) {
            travelers = parseTravelers(inputText, true);
        }

        CityAlias city = parseCityAlias(canonicalInput);
        if (city != null) {
            cityQuery = city.queryValue();
            cityDisplay = city.displayValue();
        }

        Integer parsedDuration = parseMaxDurationDays(inputText);
        if (parsedDuration != null) {
            maxDurationDays = parsedDuration;
        }

        if (containsAny(canonicalInput, List.of("xoa loc", "bo loc", "reset loc"))) {
            cityQuery = null;
            cityDisplay = null;
            maxDurationDays = null;
        }

        if (budgetVnd == null) {
            RecommendationState updated = new RecommendationState(
                    null,
                    travelers,
                    cityQuery,
                    cityDisplay,
                    maxDurationDays,
                    LocalDateTime.now());
            saveRecommendationState(conversationId, updated);
            pushBotText(conversationId, clientEmail,
                    "💰 Mình chưa đọc được ngân sách. Bạn thử nhập lại theo dạng:\n" +
                            "**8tr**, **10 triệu**, **12000000 VND** nhé.");
            return;
        }

        if (travelers == null) {
            RecommendationState updated = new RecommendationState(
                    budgetVnd,
                    null,
                    cityQuery,
                    cityDisplay,
                    maxDurationDays,
                    LocalDateTime.now());
            saveRecommendationState(conversationId, updated);
            pushBotText(conversationId, clientEmail,
                    "👥 Cảm ơn! Bạn cho mình xin **số người đi** (ví dụ: **2 người**, **4 người**) nhé.");
            return;
        }

        RecommendationState updatedState = new RecommendationState(
                budgetVnd,
                travelers,
                cityQuery,
                cityDisplay,
                maxDurationDays,
                LocalDateTime.now());
        saveRecommendationState(conversationId, updatedState);
        pushBotText(conversationId, clientEmail, "✨ Mình đang tìm tour phù hợp...");
        pushTourCards(conversationId, clientEmail, updatedState);
    }

    // =====================================================================
    // TOUR CARDS — push Rich Card TOUR_CARDS thay về text thuần
    // =====================================================================

    /**
     * Gử i SCENARIO_CHOICE card: bot đưa ra 6 kịch bản để user chọn.
     * Frontend render thành grid nút, khi click tự động gửi payload như tin nhắn.
     */
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
                    sanitizeForStorage("🌟 Bạn muốn chuyến đi kiểu nào?"),
                    ChatMessage.ContentType.SCENARIO_CHOICE,
                    sanitizeForStorage(scenarioJson));

            messagingTemplate.convertAndSendToUser(
                    clientEmail, "/queue/messages", ChatMessageResponse.from(saved));

        } catch (Exception e) {
            log.error("BotService: Lỗi khi push scenario choice. conversationId={}", conversationId, e);
            pushBotText(conversationId, clientEmail,
                    "💬 Bạn cho mình biết **ngân sách** và **số người đi** để mình gợi ý tour nhé!");
        }
    }

    /**
     * Query tour, build TourCardItem list, push message ContentType.TOUR_CARDS.
     */
    private void pushTourCards(Long conversationId, String clientEmail, RecommendationState state) {
        Integer budgetVnd = state.budgetVnd();
        Integer travelers = state.travelers();
        String cityQuery = state.cityQuery();
        String cityDisplay = state.cityDisplay();
        Integer maxDurationDays = state.maxDurationDays();

        if (budgetVnd == null || travelers == null || travelers <= 0) {
            pushBotText(conversationId, clientEmail,
                    "👥 Mình chưa đủ thông tin. Bạn gửi theo mẫu: **ngân sách 10tr cho 2 người** nhé.");
            return;
        }

        BigDecimal perPerson = BigDecimal.valueOf(budgetVnd)
                .divide(BigDecimal.valueOf(travelers), 0, RoundingMode.DOWN);

        if (perPerson.compareTo(BigDecimal.valueOf(400_000)) < 0) {
            pushBotText(conversationId, clientEmail,
                    "💰 Ngân sách hiện tại hơi thấp để tìm được tour chất lượng.\n" +
                            "Bạn thử tăng lên (ví dụ **6-8tr cho 2 người**) nhé! 😊");
            return;
        }

        List<Long> ids = tourRepository.findBotRecommendedTourIds(
                travelers, perPerson, cityQuery, maxDurationDays,
                LocalDate.now(), PageRequest.of(0, 3));

        if (ids.isEmpty()) {
            String altSuggestion = tourRecommendationService.suggestAlternativeDestinations(
                    cityDisplay, budgetVnd, travelers);
            String noResultMsg = "🔍 Ngân sách **" + formatVnd(budgetVnd) + "** cho **" + travelers + " người**" +
                    (cityDisplay != null ? " tại **" + cityDisplay + "**" : "") +
                    " hiện chưa có tour phù hợp.\n\n" +
                    altSuggestion;
            pushBotText(conversationId, clientEmail, noResultMsg);
            return;
        }

        List<TourCardItem> cards = buildTourCards(ids);
        if (cards.isEmpty()) {
            pushBotText(conversationId, clientEmail,
                    "🔍 Mình tạm thời chưa tìm thấy tour phù hợp. Bạn thử điều chỉnh ngân sách hoặc số người nhé.");
            return;
        }

        // Push text giới thiệu
        String intro = "📍 Mình tìm được **" + cards.size() + " tour** phù hợp ngân sách **" + formatVnd(budgetVnd)
                + "** cho **" + travelers + " người**"
                + (cityDisplay != null ? " tại **" + cityDisplay + "**" : "")
                + " 👇";
        pushBotText(conversationId, clientEmail, intro);

        // Push TOUR_CARDS
        pushTourCardsMessage(conversationId, clientEmail, cards);

        // Gợi ý tinh chỉnh
        pushBotText(conversationId, clientEmail,
                "💡 Muốn lọc thêm? Nhắn: **Lọc Đà Nẵng 3 ngày** hoặc **xóa lọc** để tìm lại.");
    }

    /**
     * Push tour hot (is_featured, active, có slot) — dùng cho intent "tour hot".
     */
    private void pushHotTours(Long conversationId, String clientEmail) {
        List<Long> ids = tourRepository.findHotTourIds(LocalDate.now(), PageRequest.of(0, 3));
        if (ids.isEmpty()) {
            pushBotText(conversationId, clientEmail,
                    "🔥 Hiện tại chưa có tour nổi bật nào. Bạn có thể nhắn **gợi ý tour** với ngân sách cụ thể để mình tìm nhé!");
            return;
        }
        List<TourCardItem> cards = buildTourCards(ids);
        pushBotText(conversationId, clientEmail, "🔥 **Top tour hot nhất hiện tại** — đang được đặt nhiều nhất! 👇");
        pushTourCardsMessage(conversationId, clientEmail, cards);
    }

    /** Build danh sách TourCardItem từ list ID, kèm ảnh bìa. */
    private List<TourCardItem> buildTourCards(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }

        // Batch fetch all tours in one query
        Map<Long, Tour> tourMap = new HashMap<>();
        for (Tour t : tourRepository.findAllById(ids)) {
            tourMap.put(t.getId(), t);
        }

        // Batch fetch all cover images in one query (fix N+1)
        Map<Long, String> imageMap = new HashMap<>();
        List<Object[]> imageRows = tourImageRepository.findCoverImagesByTourIds(ids);
        for (Object[] row : imageRows) {
            if (row != null && row.length > 1 && row[0] != null && row[1] != null) {
                imageMap.put(((Number) row[0]).longValue(), (String) row[1]);
            }
        }

        List<TourCardItem> cards = new ArrayList<>();
        for (Long id : ids) {
            Tour tour = tourMap.get(id);
            if (tour == null || !Boolean.TRUE.equals(tour.getIsActive()))
                continue;

            String coverUrl = imageMap.get(id);
            String cityVi = tour.getCity() != null ? tour.getCity().getNameVi() : "Việt Nam";

            cards.add(TourCardItem.builder()
                    .id(tour.getId())
                    .title(tour.getTitle())
                    .slug(tour.getSlug())
                    .cityVi(cityVi)
                    .durationDays(tour.getDurationDays())
                    .durationNights(tour.getDurationNights())
                    .pricePerAdult(tour.getPricePerAdult())
                    .avgRating(tour.getAvgRating())
                    .reviewCount(tour.getReviewCount())
                    .imageUrl(coverUrl)
                    .build());
        }
        return cards;
    }

    /** Serialize TourCardItem list thành JSON và push message TOUR_CARDS. */
    private void pushTourCardsMessage(Long conversationId, String clientEmail, List<TourCardItem> cards) {
        try {
            String metadataJson = objectMapper.writeValueAsString(cards);
            ChatMessage saved = chatService.saveBotMessage(
                    conversationId,
                    sanitizeForStorage("🏗️ Danh sách tour gợi ý"),
                    ChatMessage.ContentType.TOUR_CARDS,
                    sanitizeForStorage(metadataJson));
            messagingTemplate.convertAndSendToUser(
                    clientEmail, "/queue/messages", ChatMessageResponse.from(saved));
        } catch (Exception e) {
            log.error("BotService: Lỗi khi push tour cards. conversationId={}", conversationId, e);
        }
    }

    private boolean hasActiveRecommendation(Long conversationId) {
        RecommendationState state = loadRecommendationState(conversationId);
        if (state == null) {
            return false;
        }

        if (state.updatedAt().isBefore(LocalDateTime.now().minusMinutes(RECOMMENDATION_STATE_TIMEOUT_MINUTES))) {
            recommendationStateRepository.deleteByConversationId(conversationId);
            return false;
        }

        return true;
    }

    private boolean isRecommendationIntent(String canonicalInput) {
        boolean hasSuggestIntent = containsAny(canonicalInput,
                List.of("goi y", "goi i", "tu van", "de xuat", "suggest"));
        boolean hasTourContext = containsAny(canonicalInput,
                List.of("tour", "du lich", "lich trinh", "di dau", "bien", "nghi duong"));
        boolean directBudgetIntent = containsAny(canonicalInput,
                List.of("ngan sach", "bao nhieu nguoi", "cho 2", "cho 3", "cho 4"));
        boolean directRefineIntent = containsAny(canonicalInput,
                List.of("loc", "diem den", "so ngay"));

        return (hasSuggestIntent && hasTourContext) || directBudgetIntent || (directRefineIntent && hasTourContext);
    }

    private boolean isRecommendationFollowUpIntent(String inputText, String canonicalInput) {
        boolean hasRefineKeyword = containsAny(canonicalInput,
                List.of("loc", "xoa loc", "bo loc", "reset loc", "diem den", "so ngay", "ngay", "dem"));
        boolean hasCityHint = parseCityAlias(canonicalInput) != null;
        boolean hasDurationHint = parseMaxDurationDays(inputText) != null;

        return hasRefineKeyword || hasCityHint || hasDurationHint;
    }

    private void restoreRecommendationStateFromHistory(Long conversationId) {
        if (hasActiveRecommendation(conversationId)) {
            return;
        }

        Conversation conversation = conversationRepository.findById(conversationId).orElse(null);
        if (conversation == null) {
            return;
        }

        Page<ChatMessage> page = chatMessageRepository.findByConversationOrderByCreatedAtDesc(
                conversation,
                PageRequest.of(0, RECOMMENDATION_HISTORY_SCAN_LIMIT));

        if (page.isEmpty()) {
            return;
        }

        List<ChatMessage> chronological = new ArrayList<>(page.getContent());
        Collections.reverse(chronological);

        Integer budgetVnd = null;
        Integer travelers = null;
        String cityQuery = null;
        String cityDisplay = null;
        Integer maxDurationDays = null;

        for (ChatMessage message : chronological) {
            if (message.getSender() == null) {
                continue;
            }

            String content = message.getContent();
            if (content == null || content.isBlank()) {
                continue;
            }

            String canonical = canonicalize(normalizeInput(content));

            Integer parsedBudget = parseBudgetVnd(content);
            if (parsedBudget != null) {
                budgetVnd = parsedBudget;
            }

            Integer parsedTravelers = parseTravelers(content, true);
            if (parsedTravelers != null) {
                travelers = parsedTravelers;
            }

            CityAlias parsedCity = parseCityAlias(canonical);
            if (parsedCity != null) {
                cityQuery = parsedCity.queryValue();
                cityDisplay = parsedCity.displayValue();
            }

            Integer parsedDuration = parseMaxDurationDays(content);
            if (parsedDuration != null) {
                maxDurationDays = parsedDuration;
            }

            if (containsAny(canonical, List.of("xoa loc", "bo loc", "reset loc"))) {
                cityQuery = null;
                cityDisplay = null;
                maxDurationDays = null;
            }
        }

        if (budgetVnd == null && travelers == null && cityQuery == null && maxDurationDays == null) {
            return;
        }

        recommendationStateRepository.deleteByConversationId(conversationId);
        RecommendationState restored = new RecommendationState(
                budgetVnd,
                travelers,
                cityQuery,
                cityDisplay,
                maxDurationDays,
                LocalDateTime.now());
        saveRecommendationState(conversationId, restored);
    }

    private boolean isHotTourIntent(String canonicalInput) {
        return containsAny(canonicalInput, List.of(
                "tour hot", "tour noi bat", "pho bien", "bestseller",
                "nhieu nguoi dat", "top tour", "tours hot"));
    }

    private Integer parseBudgetVnd(String inputText) {
        if (inputText == null || inputText.isBlank()) {
            return null;
        }

        Matcher millionMatcher = BUDGET_MILLION_PATTERN.matcher(inputText);
        if (millionMatcher.find()) {
            Double value = parseDecimalToken(millionMatcher.group(1));
            if (value == null) {
                return null;
            }
            long budget = Math.round(value * 1_000_000L);
            return normalizeBudgetValue(budget);
        }

        Matcher thousandMatcher = BUDGET_THOUSAND_PATTERN.matcher(inputText);
        if (thousandMatcher.find()) {
            Double value = parseDecimalToken(thousandMatcher.group(1));
            if (value == null) {
                return null;
            }
            long budget = Math.round(value * 1_000L);
            return normalizeBudgetValue(budget);
        }

        Matcher rawMatcher = BUDGET_RAW_PATTERN.matcher(inputText);
        if (rawMatcher.find()) {
            String digits = rawMatcher.group(1).replaceAll("[^0-9]", "");
            if (!digits.isBlank()) {
                try {
                    long budget = Long.parseLong(digits);
                    return normalizeBudgetValue(budget);
                } catch (NumberFormatException ignored) {
                    return null;
                }
            }
        }

        return null;
    }

    private Integer parseTravelers(String inputText, boolean allowLooseNumber) {
        if (inputText == null || inputText.isBlank()) {
            return null;
        }

        Matcher travelersMatcher = TRAVELERS_PATTERN.matcher(inputText);
        if (travelersMatcher.find()) {
            return normalizeTravelersValue(travelersMatcher.group(1));
        }

        Matcher groupMatcher = GROUP_PATTERN.matcher(inputText);
        if (groupMatcher.find()) {
            return normalizeTravelersValue(groupMatcher.group(2));
        }

        Matcher forMatcher = TRAVELERS_FOR_PATTERN.matcher(inputText);
        if (forMatcher.find()) {
            return normalizeTravelersValue(forMatcher.group(1));
        }

        Matcher paxMatcher = PAX_PATTERN.matcher(inputText);
        if (paxMatcher.find()) {
            return normalizeTravelersValue(paxMatcher.group(1));
        }

        if (allowLooseNumber) {
            String trimmed = inputText.trim();
            if (trimmed.matches("\\d{1,2}")) {
                return normalizeTravelersValue(trimmed);
            }
        }

        return null;
    }

    private Integer parseMaxDurationDays(String inputText) {
        if (inputText == null || inputText.isBlank()) {
            return null;
        }

        Matcher tripMatcher = DURATION_TRIP_PATTERN.matcher(inputText);
        if (tripMatcher.find()) {
            return normalizeDurationValue(tripMatcher.group(1));
        }

        Matcher durationMatcher = DURATION_PATTERN.matcher(inputText);
        if (durationMatcher.find()) {
            return normalizeDurationValue(durationMatcher.group(1));
        }

        return null;
    }

    private Integer normalizeDurationValue(String raw) {
        try {
            int value = Integer.parseInt(raw);
            if (value < 1 || value > 14) {
                return null;
            }
            return value;
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private CityAlias parseCityAlias(String canonicalInput) {
        if (canonicalInput == null || canonicalInput.isBlank()) {
            return null;
        }

        for (CityAlias cityAlias : CITY_ALIASES) {
            List<String> canonicalKeywords = cityAlias.keywords().stream()
                    .map(this::canonicalize)
                    .toList();
            if (containsAny(canonicalInput, canonicalKeywords)) {
                return cityAlias;
            }
        }

        return null;
    }

    private Integer normalizeTravelersValue(String raw) {
        try {
            int value = Integer.parseInt(raw);
            if (value < 1 || value > 20) {
                return null;
            }
            return value;
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private Integer normalizeBudgetValue(long budget) {
        if (budget < 300_000L || budget > 1_500_000_000L) {
            return null;
        }
        return (int) budget;
    }

    private Double parseDecimalToken(String raw) {
        try {
            String normalized = raw.trim().replace(" ", "");
            if (normalized.contains(",") && normalized.contains(".")) {
                normalized = normalized.replace(".", "").replace(",", ".");
            } else if (normalized.contains(",")) {
                normalized = normalized.replace(",", ".");
            }
            return Double.parseDouble(normalized);
        } catch (Exception ex) {
            return null;
        }
    }

    private String formatVnd(long amount) {
        return String.format(Locale.US, "%,d", amount).replace(',', '.') + " VND";
    }

    // =====================================================================
    // LUONG 2: FAQ fallback (data-driven)
    // =====================================================================

    private void processFaqFallback(Long conversationId, String inputText, String clientEmail, String conversationContext) {
        String lower = normalizeInput(inputText);
        String canonical = canonicalize(lower);
        String answer = null;

        // Bước 1: Tìm trong FAQ rules trước
        for (FaqRule rule : faqRules) {
            List<String> canonicalKeywords = rule.keywords().stream()
                    .map(this::canonicalize)
                    .toList();
            if (containsAny(canonical, canonicalKeywords)) {
                answer = rule.answer();
                break;
            }
        }

        // Bước 2: Nếu không khớp FAQ nào → hiển thị menu FAQ nhanh
        if (answer == null || answer.isBlank()) {
            pushFaqMenu(conversationId, clientEmail, inputText);
            return;
        }

        pushBotText(conversationId, clientEmail, answer);
    }

    /**
     * Push FAQ menu với các nút bấm nhanh thay vì text.
     */
    private void pushFaqMenu(Long conversationId, String clientEmail, String userInput) {
        try {
            // Phân tích input để gợi ý relevant
            String suggestion = "";
            String canonical = canonicalize(normalizeInput(userInput));
            
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
                      "title": "🤔 Mình có thể giúp bạn什么呢?",
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
                    sanitizeForStorage("🤔 Bạn cần mình giúp gì?"),
                    ChatMessage.ContentType.FAQ_MENU,
                    sanitizeForStorage(faqJson));

            messagingTemplate.convertAndSendToUser(
                    clientEmail, "/queue/messages", ChatMessageResponse.from(saved));

        } catch (Exception e) {
            log.error("BotService: Lỗi khi push FAQ menu. conversationId={}", conversationId, e);
            pushBotText(conversationId, clientEmail, defaultFaqAnswer);
        }
    }

    // =====================================================================
    // HELPERS
    // =====================================================================

    /**
     * Lưu tin nhắn TEXT của Bot vào DB và push WebSocket về client.
     */
    private void pushBotText(Long conversationId, String clientEmail, String text) {
        try {
            ChatMessage saved = chatService.saveBotMessage(
                    conversationId,
                    sanitizeForStorage(text),
                    ChatMessage.ContentType.TEXT,
                    null);
            messagingTemplate.convertAndSendToUser(
                    clientEmail,
                    "/queue/messages",
                    ChatMessageResponse.from(saved));
        } catch (Exception e) {
            log.error("BotService: Lỗi khi push bot text tới {}", clientEmail, e);
        }
    }

    /** Helper kiem tra text co chua bat ky keyword nao khong */
    private boolean containsAny(String text, List<String> keywords) {
        if (text == null || text.isBlank() || keywords == null || keywords.isEmpty()) {
            return false;
        }

        for (String kw : keywords) {
            if (text.contains(kw))
                return true;
        }
        return false;
    }

    private String normalizeInput(String text) {
        if (text == null) {
            return "";
        }
        return text.toLowerCase().trim();
    }

    private String canonicalize(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }

        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .toLowerCase();

        return normalized.replaceAll("\\s+", " ").trim();
    }

    private String buildRecentConversationContext(Long conversationId) {
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

            String role = message.getSender() == null ? "Tro ly" : "Khach";
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

    private List<FaqRule> buildFallbackFaqRules() {
        return List.of(
                new FaqRule(
                        List.of("huy", "cancel", "hoan tien", "refund", "hủy", "hoàn tiền"),
                        "📋 **Chinh sach huy & hoan tien Tourista Studio:**\n\n" +
                                "• Huy truoc 7 ngay: Hoan 100% tien coc\n" +
                                "• Huy truoc 3-6 ngay: Hoan 50% tong tien\n" +
                                "• Huy trong 3 ngay: Co the phat sinh phi theo dieu kien doi tac\n\n" +
                                "Vao Tai khoan > Lich su Booking de thao tac nhanh."),
                new FaqRule(
                        List.of("thanh toan", "payment", "vnpay", "chuyen khoan", "trả tiền", "thanh toán"),
                        "💳 **Thanh toan tren Tourista Studio:**\n\n" +
                                "• VNPay: ATM noi dia, Visa/Mastercard, QR\n" +
                                "• Chuyen khoan: co huong dan qua email sau khi dat\n\n" +
                                "Neu thanh toan loi, gui ma booking cho support@tourista.vn de duoc xu ly nhanh."),
                new FaqRule(
                        List.of("tra cuu", "xem booking", "ma dat", "đặt chỗ", "lịch trình", "tour cua toi"),
                        "🔍 **Tra cuu booking:**\n\n" +
                                "Gui ma dat cho minh theo dinh dang **TRS-YYYYMMDD-XXXXXX** de xem chi tiet lich trinh."),
                new FaqRule(
                        List.of("lien he", "hotline", "email", "ho tro", "support", "hỗ trợ"),
                        "📞 **Lien he ho tro Tourista Studio:**\n\n" +
                                "• Hotline: 1900 xxxx (7:00 - 22:00)\n" +
                                "• Email: support@tourista.vn\n" +
                                "• Chat voi chu tour/hotel tai trang chi tiet dich vu."),
                new FaqRule(
                        List.of("chao", "hello", "hi", "xin chao", "xin chào"),
                        "👋 Chao ban! Minh la tro ly Tourista Studio.\n\n" +
                                "Minh co the giup ban tra cuu booking, giai dap chinh sach va ket noi doi tac du lich."));
    }

    /**
     * Một số DB MySQL cũ dùng utf8mb3 không lưu được ký tự Supplementary Plane.
     * Loại bỏ nhóm ký tự này để tránh DataIntegrityViolation → rollback-only trong
     * luồng async.
     */
    private String sanitizeForStorage(String text) {
        if (text == null) {
            return null;
        }
        return text.replaceAll("[\\x{10000}-\\x{10FFFF}]", "");
    }

    // =====================================================================
    // CONVERSATION CONTEXT PERSISTENCE (Phase 3.1.2)
    // =====================================================================

    /**
     * Lưu trạng thái slot-filling vào DB.
     * Upsert: update nếu đã tồn tại, insert nếu chưa.
     */
    private void saveRecommendationState(Long conversationId, RecommendationState state) {
        SessionRecommendationState entity = recommendationStateRepository
                .findByConversationId(conversationId)
                .orElseGet(() -> {
                    Conversation conv = conversationRepository.findById(conversationId)
                            .orElse(null);
                    if (conv == null) return null;
                    return SessionRecommendationState.builder()
                            .conversation(conv)
                            .build();
                });

        if (entity == null) return;

        entity.setBudgetVnd(state.budgetVnd());
        entity.setTravelers(state.travelers());
        entity.setCityQuery(state.cityQuery());
        entity.setCityDisplay(state.cityDisplay());
        entity.setMaxDurationDays(state.maxDurationDays());
        recommendationStateRepository.save(entity);
    }

    /**
     * Load trạng thái slot-filling từ DB.
     * Trả về null nếu không tìm thấy hoặc đã expired.
     */
    private RecommendationState loadRecommendationState(Long conversationId) {
        return recommendationStateRepository.findByConversationId(conversationId)
                .filter(e -> !e.isExpired())
                .map(e -> new RecommendationState(
                        e.getBudgetVnd(),
                        e.getTravelers(),
                        e.getCityQuery(),
                        e.getCityDisplay(),
                        e.getMaxDurationDays(),
                        e.getUpdatedAt()))
                .orElse(null);
    }

    /**
     * Cập nhật context summary của phiên vào ConversationSession.
     * Được gọi sau mỗi tin nhắn bot để Gemini có thể đọc nhanh thay vì query nhiều ChatMessage.
     */
    private void updateConversationSession(Long conversationId, String recentContext) {
        try {
            Conversation conv = conversationRepository.findById(conversationId).orElse(null);
            if (conv == null) return;

            ConversationSession session = conversationSessionRepository
                    .findByConversation(conv)
                    .orElseGet(() -> ConversationSession.builder()
                            .conversation(conv)
                            .sessionStartedAt(LocalDateTime.now())
                            .messageCount(0)
                            .build());

            session.incrementMessageCount();
            if (recentContext != null && !recentContext.isBlank()) {
                session.appendToContextSummary(recentContext);
            }
            conversationSessionRepository.save(session);
        } catch (Exception ex) {
            log.debug("BotService: Khong the cap nhat conversation session context — {}", ex.getMessage());
        }
    }

    private record FaqConfig(List<FaqItem> rules, String defaultAnswer) {
    }

    private record FaqItem(List<String> keywords, String answer) {
    }

    private record FaqRule(List<String> keywords, String answer) {
    }

    private record RecommendationState(
            Integer budgetVnd,
            Integer travelers,
            String cityQuery,
            String cityDisplay,
            Integer maxDurationDays,
            LocalDateTime updatedAt) {
    }

    private record CityAlias(String queryValue, String displayValue, List<String> keywords) {
    }
}
