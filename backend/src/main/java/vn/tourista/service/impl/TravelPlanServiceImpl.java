package vn.tourista.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.tourista.dto.request.TravelPlanRequest;
import vn.tourista.dto.response.TravelPlanResponse;
import vn.tourista.service.AiService;
import vn.tourista.service.TravelPlanService;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * TravelPlanService — CORE ENGINE + AI LAYER.
 *
 * ARCHITECTURE:
 * ┌──────────────────────────────────────────────────────────┐
 * │ 1. CORE ENGINE (rule-based, no AI)                     │
 * │    - buildRuleBasedPlan(): phân tích yêu cầu, tạo     │
 * │      lịch trình có cấu trúc JSON                       │
 * │    - Hoạt động độc lập, không cần API key             │
 * │    - Data địa điểm VN có sẵn (10 thành phố)          │
 * └──────────────────────────────────────────────────────────┘
 *                          ↓
 * ┌──────────────────────────────────────────────────────────┐
 * │ 2. AI LAYER (AiService / Beeknoee)                     │
 * │    - rewritePlanToNaturalProse(): viết lại văn phong   │
 * │      tự nhiên, thân thiện từ plan của CORE            │
 * │    - suggestFollowUpQuestions(): gợi ý câu hỏi tiếp    │
 * │    - Graceful fallback: nếu AI lỗi → vẫn trả plan    │
 * └──────────────────────────────────────────────────────────┘
 *
 * OUTPUT: TravelPlanResponse
 *   - plan JSON: dayPlans, activities, packingList (từ CORE)
 *   - rewrittenProse: văn phong tự nhiên (từ AI)
 *   - aiSuggestions: gợi ý câu hỏi tiếp theo (từ AI)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TravelPlanServiceImpl implements TravelPlanService {

    private static final Map<String, DestinationData> DESTINATION_DATA = buildDestinationData();

    private final AiService aiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // ===== ENTRY POINT =========================================================

    @Override
    public TravelPlanResponse generatePlan(TravelPlanRequest request) {
        long totalDays = calculateDays(request);
        if (totalDays <= 0) totalDays = 3;

        String destination = nullSafe(request.getDestination());
        String budget = request.getBudget() != null ? request.getBudget().toUpperCase() : "TRUNGBINH";
        String tripType = request.getTripType() != null ? request.getTripType().toUpperCase() : "RELAX";
        String interests = nullSafe(request.getInterests());
        DestinationData destData = findBestMatch(destination);

        TravelPlanResponse plan;

        if (destData == null) {
            // Không có trong DB → nhờ AI tạo lịch trình riêng cho địa điểm này
            log.info("TravelPlanService: Destination '{}' not in DB, using AI generation", destination);
            plan = buildAiOnlyPlan(request, totalDays, destination, budget, tripType, interests);
        } else {
            // Có trong DB → dùng CORE ENGINE (nhanh, chính xác)
            plan = buildRuleBasedPlan(request, totalDays, destData, budget, tripType, interests);

            // AI viết lại văn phong tự nhiên (song song)
            String dayPlansJson = serializeDayPlans(plan);
            String rewrittenProse = aiService.rewritePlanToNaturalProse(
                    plan.getSummary() != null ? plan.getSummary() : "",
                    dayPlansJson
            );
            if (rewrittenProse != null && !rewrittenProse.isBlank()) {
                plan.setRewrittenProse(rewrittenProse);
            }
        }

        // AI gợi ý câu hỏi tiếp theo
        List<String> suggestions = aiService.suggestFollowUpQuestions(
                plan.getSummary() != null ? plan.getSummary() : "",
                budget,
                tripType
        );
        if (suggestions != null && !suggestions.isEmpty()) {
            plan.setAiSuggestions(suggestions);
        }

        log.info("TravelPlanService: Generated plan for destination={}, days={}, hasActivities={}",
                destination, totalDays,
                plan.getDayPlans() != null ? plan.getDayPlans().stream()
                        .mapToInt(dp -> dp.getActivities() != null ? dp.getActivities().size() : 0).sum() : 0);

        return plan;
    }

    /**
     * Khi địa điểm không có trong database, nhờ AI tạo lịch trình riêng.
     */
    private TravelPlanResponse buildAiOnlyPlan(
            TravelPlanRequest request, long totalDays,
            String destination, String budget, String tripType, String interests) {

        int adults = request.getAdults() != null ? request.getAdults() : 2;
        int children = request.getChildren() != null ? request.getChildren() : 0;

        String budgetLabel = switch (budget) {
            case "THAP", "THAP_" -> "tiết kiệm (dưới 2 triệu/người)";
            case "CAO", "CAO_" -> "cao cấp (trên 10 triệu/người)";
            default -> "trung bình (2-10 triệu/người)";
        };

        String tripLabel = switch (tripType) {
            case "ADVENTURE" -> "phiêu lưu, mạo hiểm";
            case "ROMANTIC" -> "lãng mạn, cặp đôi";
            case "FAMILY" -> "gia đình có trẻ em";
            case "BUSINESS" -> "công tác kết hợp khám phá";
            default -> "nghỉ dưỡng, thư giãn";
        };

        LocalDate checkIn = parseDate(request.getCheckIn(), LocalDate.now());
        String dateStr = checkIn.format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

        String season = getVietnameseSeason();
        String interestsNote = interests != null && !interests.isBlank()
                ? "Sở thích: " + interests : "";

        String prompt = """
                Bạn là chuyên gia lập lịch trình du lịch Việt Nam. Hãy tạo lịch trình chi tiết cho chuyến đi.

                THÔNG TIN CHUYẾN ĐI:
                - Địa điểm: %s
                - Thời gian: %d ngày %d đêm
                - Ngày bắt đầu: %s (mùa: %s)
                - Ngân sách: %s
                - Phong cách: %s
                - Số người: %d người lớn%s
                %s

                YÊU CẦU:
                - Tạo lịch trình chi tiết từng ngày với thời gian cụ thể (7:00 → 21:00)
                - Mỗi ngày có 3-5 hoạt động cụ thể gắn với %s (địa điểm, món ăn, trải nghiệm thực tế)
                - Mỗi hoạt động gồm: thời gian, tên hoạt động, mô tả ngắn, địa điểm cụ thể, chi phí ước tính (VND)
                - Thêm mẹo thực tế cho từng hoạt động
                - Đưa ra danh sách đồ dùng cần mang theo
                - Ghi chú thời tiết và mẹo địa phương

                Trả lời theo format JSON:
                {
                  "destination": "tên địa điểm",
                  "tripDuration": "X ngày Y đêm",
                  "totalDays": X,
                  "totalBudget": tổng chi phí,
                  "summary": "tóm tắt 1-2 câu",
                  "dayPlans": [
                    {
                      "day": 1,
                      "date": "dd/MM/yyyy",
                      "title": "Tiêu đề ngày",
                      "activities": [
                        {
                          "time": "07:00",
                          "title": "Tên hoạt động",
                          "description": "Mô tả",
                          "type": "sight_seeing|food|accommodation|shopping|transport",
                          "location": "Địa điểm cụ thể",
                          "estimatedCost": số VND,
                          "tips": "Mẹo"
                        }
                      ]
                    }
                  ],
                  "packingList": ["đồ 1", "đồ 2"],
                  "weatherNote": "ghi chú thời tiết",
                  "localTips": "mẹo địa phương"
                }

                Chỉ trả lời JSON, không thêm giải thích gì khác.
                """.formatted(
                destination, totalDays, totalDays - 1, dateStr, season,
                budgetLabel, tripLabel,
                adults, children > 0 ? " và " + children + " trẻ em" : "",
                interestsNote,
                destination
        );

        String jsonResponse = aiService.ask(prompt);
        if (jsonResponse != null && !jsonResponse.isBlank()) {
            try {
                TravelPlanResponse aiPlan = objectMapper.readValue(jsonResponse, TravelPlanResponse.class);
                if (aiPlan != null && aiPlan.getDayPlans() != null && !aiPlan.getDayPlans().isEmpty()) {
                    if (aiPlan.getDestination() == null || aiPlan.getDestination().isBlank()) {
                        aiPlan.setDestination(destination);
                    }
                    log.info("TravelPlanService: AI generated plan with {} days for unknown destination '{}'",
                            aiPlan.getDayPlans().size(), destination);
                    return aiPlan;
                }
            } catch (Exception ex) {
                log.warn("TravelPlanService: Failed to parse AI plan JSON for '{}' — {}", destination, ex.getMessage());
            }
        }

        // AI cũng thất bại → fallback generic
        log.warn("TravelPlanService: AI generation failed for '{}', falling back to generic", destination);
        return buildFallbackGenericPlan(request, totalDays, destination, budget, tripType, interests);
    }

    private String getVietnameseSeason() {
        int month = java.time.LocalDate.now().getMonthValue();
        if (month >= 3 && month <= 5) return "Hè / Nắng nóng";
        if (month >= 6 && month <= 8) return "Hè nóng / Mưa mùa hạ";
        if (month >= 9 && month <= 11) return "Thu / Đông đầu";
        return "Đông / Lạnh";
    }

    private TravelPlanResponse buildFallbackGenericPlan(
            TravelPlanRequest request, long totalDays,
            String destination, String budget, String tripType, String interests) {

        LocalDate checkIn = parseDate(request.getCheckIn(), LocalDate.now());
        List<TravelPlanResponse.DayPlan> dayPlans = new ArrayList<>();
        for (int d = 0; d < totalDays; d++) {
            LocalDate date = checkIn.plusDays(d);
            dayPlans.add(TravelPlanResponse.DayPlan.builder()
                    .day(d + 1)
                    .date(date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                    .title("Ngày " + (d + 1) + " — Khám phá " + destination)
                    .activities(List.of(
                            TravelPlanResponse.Activity.builder()
                                    .time("08:00").title("Khám phá " + destination)
                                    .description("Bắt đầu ngày mới tại " + destination + ". Tìm hiểu các địa điểm nổi tiếng.")
                                    .type("sight_seeing").location(destination).estimatedCost(0).tips("Hỏi người địa phương để được gợi ý tốt nhất.").build(),
                            TravelPlanResponse.Activity.builder()
                                    .time("12:00").title("Thưởng thức ẩm thực địa phương")
                                    .description("Tìm và thưởng thức các món ngon đặc trưng của vùng.")
                                    .type("food").location(destination).estimatedCost(200000).tips("Hỏi khách sạn hoặc người địa phương quán ngon gần đó.").build(),
                            TravelPlanResponse.Activity.builder()
                                    .time("15:00").title("Tham quan danh lam thắng cảnh")
                                    .description("Khám phá các điểm du lịch nổi tiếng tại " + destination + ".")
                                    .type("sight_seeing").location(destination).estimatedCost(100000).tips("Mua vé online để tiết kiệm thời gian.").build(),
                            TravelPlanResponse.Activity.builder()
                                    .time("19:00").title("Trải nghiệm ẩm thực đêm")
                                    .description("Dạo phố đêm, thưởng thức đặc sản và đặc sản địa phương.")
                                    .type("food").location(destination).estimatedCost(250000).tips("Đi theo nhóm sẽ an toàn và vui hơn.").build()
                    ))
                    .build());
        }

        int totalBudget = dayPlans.stream()
                .flatMap(dp -> dp.getActivities().stream())
                .mapToInt(a -> a.getEstimatedCost() != null ? a.getEstimatedCost() : 0)
                .sum();

        return TravelPlanResponse.builder()
                .destination(destination)
                .tripDuration(formatDuration(totalDays))
                .totalDays((int) totalDays)
                .totalBudget(totalBudget)
                .summary("Chuyến đi " + totalDays + " ngày đến " + destination + " — lịch trình chi tiết đang được cập nhật. Hãy liên hệ để biết thêm thông tin.")
                .dayPlans(dayPlans)
                .packingList(List.of("CMND/CCCD", "Điện thoại & sạc", "Tiền mặt", "Kem chống nắng", "Thuốc cá nhân"))
                .weatherNote("Nên mang theo kem chống nắng và áo mưa nhẹ.")
                .localTips("Nên thuê xe máy để di chuyển linh hoạt, giá khoảng 100-150k/ngày.")
                .currency("VND")
                .build();
    }

    private long calculateDays(TravelPlanRequest request) {
        LocalDate checkIn = parseDate(request.getCheckIn(), LocalDate.now());
        LocalDate checkOut = parseDate(request.getCheckOut(), checkIn.plusDays(3));
        return Math.max(1, ChronoUnit.DAYS.between(checkIn, checkOut));
    }

    private String serializeDayPlans(TravelPlanResponse plan) {
        try {
            List<Map<String, Object>> days = new ArrayList<>();
            for (TravelPlanResponse.DayPlan dp : plan.getDayPlans()) {
                Map<String, Object> dayMap = new LinkedHashMap<>();
                dayMap.put("day", dp.getDay());
                dayMap.put("title", dp.getTitle());
                List<Map<String, Object>> activities = new ArrayList<>();
                for (TravelPlanResponse.Activity act : dp.getActivities()) {
                    Map<String, Object> actMap = new LinkedHashMap<>();
                    actMap.put("time", act.getTime());
                    actMap.put("title", act.getTitle());
                    actMap.put("description", act.getDescription());
                    actMap.put("type", act.getType());
                    actMap.put("location", act.getLocation());
                    actMap.put("estimatedCost", act.getEstimatedCost());
                    actMap.put("tips", act.getTips());
                    activities.add(actMap);
                }
                dayMap.put("activities", activities);
                days.add(dayMap);
            }
            return objectMapper.writeValueAsString(days);
        } catch (Exception ex) {
            log.warn("serializeDayPlans failed — {}", ex.getMessage());
            return "";
        }
    }

    // ===== CORE ENGINE — RULE-BASED PLAN BUILDER ==============================

    private TravelPlanResponse buildRuleBasedPlan(TravelPlanRequest request, long totalDays,
            DestinationData destData, String budget, String tripType, String interests) {
        String destination = nullSafe(request.getDestination());
        LocalDate checkIn = parseDate(request.getCheckIn(), LocalDate.now());

        List<TravelPlanResponse.DayPlan> dayPlans = new ArrayList<>();

        for (int d = 0; d < totalDays; d++) {
            LocalDate date = checkIn.plusDays(d);
            List<TravelPlanResponse.Activity> activities = buildDayActivities(
                    destData, d, (int) totalDays, budget, tripType, interests
            );
            dayPlans.add(TravelPlanResponse.DayPlan.builder()
                    .day(d + 1)
                    .date(date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                    .title(buildDayTitle(destData, d, (int) totalDays, tripType))
                    .activities(activities)
                    .build());
        }

        String summary = buildSummary(destination, totalDays, budget, tripType, request);
        List<String> packingList = buildPackingList(budget, tripType);
        String weatherNote = destData != null ? destData.weatherNote : "Nên mang theo kem chống nắng và áo mưa nhẹ.";
        String localTips = destData != null ? destData.localTip : "Nên thuê xe máy để di chuyển linh hoạt, giá khoảng 100-150k/ngày.";

        int totalBudget = dayPlans.stream()
                .flatMap(dp -> dp.getActivities().stream())
                .mapToInt(a -> a.getEstimatedCost() != null ? a.getEstimatedCost() : 0)
                .sum();

        return TravelPlanResponse.builder()
                .destination(destination)
                .tripDuration(formatDuration(totalDays))
                .totalDays((int) totalDays)
                .totalBudget(totalBudget)
                .summary(summary)
                .dayPlans(dayPlans)
                .packingList(packingList)
                .weatherNote(weatherNote)
                .localTips(localTips)
                .currency("VND")
                .build();
    }

    private List<TravelPlanResponse.Activity> buildDayActivities(
            DestinationData dest, int dayIndex, int totalDays,
            String budget, String tripType, String interests) {

        List<ActivityTemplate> templates = dest != null ? dest.activities : getDefaultActivities();
        List<ActivityTemplate> selected = selectActivities(templates, dayIndex, totalDays, tripType, interests);

        double costMultiplier = switch (budget) {
            case "THAP", "THAP_" -> 0.6;
            case "CAO", "CAO_" -> 2.0;
            default -> 1.0;
        };

        List<TravelPlanResponse.Activity> result = new ArrayList<>();
        String[] times = {"07:00", "09:30", "12:00", "14:30", "18:00"};

        for (int i = 0; i < selected.size() && i < 5; i++) {
            ActivityTemplate tpl = selected.get(i);
            int cost = (int) (tpl.baseCost * costMultiplier);
            String location = tpl.location;
            if (dest != null && "{dest}".equals(location)) {
                location = dest.name;
            }

            result.add(TravelPlanResponse.Activity.builder()
                    .time(times[i])
                    .title(tpl.title)
                    .description(tpl.description)
                    .type(tpl.type)
                    .location(location)
                    .estimatedCost(cost)
                    .tips(tpl.tip)
                    .build());
        }

        return result;
    }

    private List<ActivityTemplate> selectActivities(
            List<ActivityTemplate> all, int dayIndex, int totalDays,
            String tripType, String interests) {

        List<ActivityTemplate> picked = new ArrayList<>();
        Set<String> pickedTitles = new HashSet<>();

        if (dayIndex == 0) {
            addUnique(picked, pickedTitles, findByType(all, "accommodation"));
            addUnique(picked, pickedTitles, findByType(all, "sight_seeing"));
            addUnique(picked, pickedTitles, findByType(all, "food"));
        } else if (dayIndex < totalDays - 1) {
            addUnique(picked, pickedTitles, findByType(all, "sight_seeing"));
            addUnique(picked, pickedTitles, findByType(all, "food"));
            addUnique(picked, pickedTitles, findByType(all, "sight_seeing"));
            addUnique(picked, pickedTitles, findByType(all, "shopping"));
        } else {
            addUnique(picked, pickedTitles, findByType(all, "sight_seeing"));
            addUnique(picked, pickedTitles, findByType(all, "food"));
            addUnique(picked, pickedTitles, findByType(all, "transport"));
        }

        if ("ADVENTURE".equals(tripType) || (interests != null && interests.toLowerCase().contains("mạo hiểm"))) {
            ActivityTemplate adventure = findByType(all, "sight_seeing");
            if (adventure != null && !pickedTitles.contains(adventure.title)) {
                picked.add(1, adventure);
                pickedTitles.add(adventure.title);
            }
        }
        if ("ROMANTIC".equals(tripType) || (interests != null && interests.toLowerCase().contains("lãng mạn"))) {
            ActivityTemplate romantic = new ActivityTemplate(
                    "Café view đẹp hoặc bãi biển hoàng hôn",
                    "Tận hưởng khoảnh khắc yên bình cùng người thân.",
                    "food", "{dest}", 150000,
                    "Chọn quán có tầm nhìn ra biển hoặc núi."
            );
            picked.add(2, romantic);
            pickedTitles.add(romantic.title);
        }
        if ("FAMILY".equals(tripType) || (interests != null && interests.toLowerCase().contains("gia đình"))) {
            ActivityTemplate family = new ActivityTemplate(
                    "Khu vui chơi / công viên / bãi biển an toàn",
                    "Thời gian vui chơi cùng gia đình, phù hợp trẻ em.",
                    "sight_seeing", "{dest}", 300000,
                    "Mang theo đồ bơi, kem chống nắng cho bé."
            );
            picked.add(1, family);
            pickedTitles.add(family.title);
        }

        return picked;
    }

    private void addUnique(List<ActivityTemplate> list, Set<String> titles, ActivityTemplate tpl) {
        if (tpl != null && !titles.contains(tpl.title)) {
            list.add(tpl);
            titles.add(tpl.title);
        }
    }

    private String buildDayTitle(DestinationData dest, int dayIndex, int totalDays, String tripType) {
        String destName = dest != null ? dest.name : "điểm đến";
        if (dayIndex == 0) return "Ngày 1 — Đến " + destName + " & Khám phá";
        if (dayIndex == totalDays - 1) return "Ngày " + (dayIndex + 1) + " — Lễ hội / Mua sắm & Về";
        return switch (tripType) {
            case "ADVENTURE" -> "Ngày " + (dayIndex + 1) + " — Trải nghiệm mạo hiểm & Khám phá";
            case "ROMANTIC" -> "Ngày " + (dayIndex + 1) + " — Khám phá lãng mạn";
            case "FAMILY" -> "Ngày " + (dayIndex + 1) + " — Vui chơi cùng gia đình";
            case "BUSINESS" -> "Ngày " + (dayIndex + 1) + " — Công tác & Khám phá";
            default -> "Ngày " + (dayIndex + 1) + " — Khám phá " + destName;
        };
    }

    private String buildSummary(String destination, long totalDays, String budget, String tripType, TravelPlanRequest request) {
        int adults = request.getAdults() != null ? request.getAdults() : 2;
        int children = request.getChildren() != null ? request.getChildren() : 0;
        String tripLabel = switch (tripType) {
            case "ADVENTURE" -> "phiêu lưu";
            case "ROMANTIC" -> "lãng mạn";
            case "FAMILY" -> "gia đình";
            case "BUSINESS" -> "công tác";
            default -> "nghỉ dưỡng";
        };
        String budgetLabel = switch (budget) {
            case "THAP", "THAP_" -> "tiết kiệm";
            case "CAO", "CAO_" -> "cao cấp";
            default -> "vừa phải";
        };

        return String.format(
                "Chuyến đi %d ngày %d đêm đến %s theo phong cách %s, phù hợp với %d người lớn%s, ngân sách %s. "
                + "Hành trình được thiết kế để bạn tận hưởng trọn vẹn vẻ đẹp và văn hóa của %s.",
                totalDays, totalDays - 1,
                nullSafe(destination),
                tripLabel,
                adults,
                children > 0 ? " và " + children + " trẻ em" : "",
                budgetLabel,
                nullSafe(destination)
        );
    }

    private List<String> buildPackingList(String budget, String tripType) {
        List<String> base = new ArrayList<>(Arrays.asList(
                "CMND/CCCD hoặc Passport",
                "Điện thoại & sạc dự phòng",
                "Tiền mặt & thẻ ngân hàng",
                "Kem chống nắng",
                "Thuốc cá nhân (nếu có)"
        ));

        if ("ADVENTURE".equals(tripType)) {
            base.addAll(Arrays.asList("Giày thể thao / giày leo núi", "Balo chống nước", "Áo khoác nhẹ"));
        }
        if ("FAMILY".equals(tripType)) {
            base.addAll(Arrays.asList("Đồ bơi cho cả nhà", "Kem chống nắng trẻ em", "Đồ ăn nhẹ cho bé"));
        }
        if ("CAO".equals(budget) || "CAO_".equals(budget)) {
            base.addAll(Arrays.asList("Vest / đồ sang trọng (nếu cần)", "Máy ảnh du lịch"));
        }
        if (tripType.contains("BEACH") || tripType.contains("BIỂN")) {
            base.addAll(Arrays.asList("Kính bơi", "Nón rộng vành", "Sandal chống trượt"));
        }
        return base;
    }

    // ===== DESTINATION MATCHING ===============================================

    private DestinationData findBestMatch(String destination) {
        if (destination == null || destination.isBlank()) return null;
        String d = destination.toLowerCase().trim();

        // 1. Exact/contains match (priority: longest match wins)
        DestinationData best = null;
        int bestLen = 0;
        for (Map.Entry<String, DestinationData> entry : DESTINATION_DATA.entrySet()) {
            String key = entry.getKey().toLowerCase();
            if (d.contains(key) || key.contains(d)) {
                if (key.length() >= bestLen) {
                    best = entry.getValue();
                    bestLen = key.length();
                }
            }
        }
        if (best != null) return best;

        // 2. Keyword aliases — extract neighborhood/area and find parent city
        String[] parts = d.split("[,\\s]+");
        for (String part : parts) {
            part = part.trim();
            if (part.length() < 3) continue;
            for (Map.Entry<String, DestinationData> entry : DESTINATION_DATA.entrySet()) {
                String key = entry.getKey().toLowerCase();
                if (key.contains(part) || part.contains(key)) {
                    return entry.getValue();
                }
            }
        }

        // 3. Fuzzy match: if user typed a partial name like "nam" match "hà nội" via common aliases
        for (Map.Entry<String, DestinationData> entry : DESTINATION_DATA.entrySet()) {
            String key = entry.getKey();
            // "ha noi" / "hanoi" / "hn" — Hà Nội
            if ((d.contains("hà nội") || d.contains("hanoi") || d.contains("hn "))
                    && (key.contains("hà nội") || key.contains("hanoi"))) {
                return entry.getValue();
            }
            // "sg" / "sai gon" / "tphcm" — HCM
            if ((d.contains("sg") || d.contains("sài gòn") || d.contains("sai gon") || d.contains("tphcm"))
                    && (key.contains("sài gòn") || key.contains("sài gòn"))) {
                return entry.getValue();
            }
            // "dn" / "da nang" — Đà Nẵng
            if ((d.contains("đà nẵng") || d.contains("da nang") || d.contains("dn "))
                    && key.contains("đà nẵng")) {
                return entry.getValue();
            }
        }

        return null;
    }

    private static Map<String, DestinationData> buildDestinationData() {
        Map<String, DestinationData> map = new LinkedHashMap<>();

        map.put("đà nẵng", new DestinationData("Đà Nẵng", "Tháng 2–4 và tháng 8–10: thời tiết mát mẻ, ít mưa.",
                "Đà Nẵng nổi tiếng với cầu Rồng, Bà Nà Hills, Ngũ Hành Sơn và bãi biển Mỹ Khê. "
                        + "Nên đặt phòng gần bãi biển để tiện di chuyển.",
                Arrays.asList(
                        new ActivityTemplate("Check-in khách sạn & nghỉ ngơi", "Nhận phòng, gửi hành lý, nghỉ ngơi sau chuyến đi.", "accommodation", "Đà Nẵng", 50000, "Mang theo mã booking và CMND/CCCD."),
                        new ActivityTemplate("Cầu Rồng — ngắm tượng rồng & pháo hoa", "Dạo bộ cầu Rồng, chụp ảnh với tượng rồng vàng, ngắm pháo hoa vào cuối tuần.", "sight_seeing", "Cầu Rồng Đà Nẵng", 0, "Cầu Rồng bật pháo hoa vào tối thứ Bảy & CN hàng tuần, bắt đầu 21h."),
                        new ActivityTemplate("Bãi biển Mỹ Khê", "Tắm biển, tắm nắng, chơi Jet Ski hoặc dù bơi.", "sight_seeing", "Bãi Biển Mỹ Khê", 50000, "Thuê ô & ghế ngồi khoảng 30-50k/người."),
                        new ActivityTemplate("Bún chả cá & bánh tráng thịt heo", "Thưởng thức đặc sản Đà Nẵng: bún chả cá, bánh tráng cuốn thịt heo, mì Quảng.", "food", "Phố ẩm thực Đà Nẵng", 150000, "Hỏi người địa phương quán ngon — giá hợp lý, chất lượng."),
                        new ActivityTemplate("Bà Nà Hills — Fantasy Park & Cầu Vàng", "Trải nghiệm công viên giải trí trong nhà lớn nhất Đông Nam Á, check-in Cầu Vàng huyền thoại.", "sight_seeing", "Bà Nà Hills", 750000, "Mua vé combo online để tiết kiệm 20-30%. Mang áo khoác vì Bà Nà lạnh quanh năm."),
                        new ActivityTemplate("Hải sản tươi sống Bãi Bắp", "Thưởng thức hải sản tươi sống: tôm hùm, cua, ghẹ, cá nướng ngay tại bãi biển.", "food", "Bãi Bắp", 500000, "Chọn quán có niêm giá, hỏi giá trước khi gọi."),
                        new ActivityTemplate("Mua quà lưu niệm & đặc sản miền Trung", "Mua mực một nắng, nước mắm Phú Quốc, bánh tổ ong, trà đường ống hinh làm quà.", "shopping", "Chợ Hàn", 200000, "Mặc cả nhẹ ở chợ, mua nhiều thì giảm thêm được 10-20%.")
                )));

        map.put("hội an", new DestinationData("Hội An", "Tháng 2–4: thời tiết đẹp, không nắng gắt. Tránh tháng 10–11 vì ngập lụt.",
                "Hội An nổi tiếng phố cổ lung linh về đêm với đèn lồng. "
                        + "Vé vào phố cổ 80k/người (miễn phí nếu mua vé Cù Lao Chàm).",
                Arrays.asList(
                        new ActivityTemplate("Check-in & khám phá phố cổ", "Nhận phòng, dạo phố cổ Hội An, check-in với đèn lồng rực rỡ.", "accommodation", "Hội An", 50000, "Phố cổ đẹp nhất về đêm — 19h-21h."),
                        new ActivityTemplate("Chùa Cầu & Hội Quán Phúc Kiến", "Tham quan biểu tượng Hội An, chụp ảnh với kiến trúc độc đáo.", "sight_seeing", "Chùa Cầu", 80000, "Muộn chiều đến để ngắm hoàng hôn và đèn lồng bật sáng."),
                        new ActivityTemplate("Bánh mì Phượng & Cao lầu", "Thưởng thức bánh mì Phượng nổi tiếng thế giới, cao lầu, hoành thánh, bún thịt nướng.", "food", "Phố ẩm thực Hội An", 100000, "Bánh mì Phượng đông — có thể chờ 30-45 phút. Đặt trước online."),
                        new ActivityTemplate("Cycling / xích lô quanh phố cổ", "Trải nghiệm xích lô hoặc thuê xe đạp, khám phá các ngõ hẻm yên tĩnh.", "sight_seeing", "Phố Cổ Hội An", 150000, "Thuê xe đạp 30-50k/ngày tại các homestay."),
                        new ActivityTemplate("Lặn ngắm san hô Cù Lao Chàm", "Đến Cù Lao Chàm — KDL sinh thái biển, lặn ngắm san hô, tắm biển hoang sơ.", "sight_seeing", "Cù Lao Chàm", 400000, "Book tour đi Cano từ cảng Cửa Đại, bao ăn trưa và đồ lặn."),
                        new ActivityTemplate("Lẩu cá matrix & đặc sản Hội An", "Bữa tối với lẩu cá matrix, bún bò Huế, gỏi cuốn tôm thịt.", "food", "Nhà hàng ven sông Hội An", 350000, "Nhà hàng bên sông có view đẹp, giá cao hơn chút — ngồi trong quán tiết kiệm hơn."),
                        new ActivityTemplate("Mua quà & thổi đèn lồng", "Mua đèn lồng, nón lá, túi vải, trà thảo mộc, mực một nắng.", "shopping", "Phố Cổ Hội An", 200000, "Mặc cả ở cửa hàng nhỏ, chợ đêm — giảm được 15-25%.")
                )));

        map.put("nha trang", new DestinationData("Nha Trang", "Tháng 3–9: biển trong xanh, ít mưa. Tháng 11–12 có bão.",
                "Nha Trang là thiên đường biển đảo với nhiều KDL sinh thái. "
                        + "Nên đặt khách sạn view biển để tận hưởng.",
                Arrays.asList(
                        new ActivityTemplate("Check-in & dạo biển Nha Trang", "Nhận phòng, dạo bãi biển Nha Trang, ngắm cảnh bình minh hoặc hoàng hôn.", "accommodation", "Nha Trang", 50000, "Biển đẹp nhất sáng sớm, tránh nắng gắt trưa."),
                        new ActivityTemplate("Vinpearl Land — Công viên chủ đề", "Trải nghiệm công viên nước, thủy cung SeaWorld, khu trò chơi cảm giác mạnh.", "sight_seeing", "Vinpearl Land Nha Trang", 900000, "Mua vé combo Vinpearl + cáp treo online — tiết kiệm 15%."),
                        new ActivityTemplate("Hải sản tươi sống & bún chả Nha Trang", "Thưởng thức hải sản tươi sống: tôm, cua, ghẹ, cá hồi, bún chả Nha Trang.", "food", "Chợ Đầm Nha Trang", 400000, "Chợ Đầm bán buổi sáng sớm — hải sản tươi nhất, giá mềm hơn nhà hàng."),
                        new ActivityTemplate("Khu du lịch Yến Island (Thạch Sanh)", "Tham quan vịnh Nha Trang từ trên cao, check-in cầu gỗ, vườn hoa.", "sight_seeing", "Yến Island", 300000, "Thuê Cano hoặc book tour tổng hợp bao trọn."),
                        new ActivityTemplate("I-Resort / Tháp Bà — Trị liệu bùn khoáng", "Trải nghiệm tắm bùn khoáng nóng và ngâm suối khoáng nóng tự nhiên.", "sight_seeing", "I-Resort Nha Trang", 400000, "Nên đặt combo bùn khoáng + suối khoáng — tiết kiệm 20%."),
                        new ActivityTemplate("Hòn Tằm — Bãi biển riêng & lặn ngắm san hô", "Đến đảo Hòn Tằm — bãi biển riêng, lặn ống thở, chèo Kayak.", "sight_seeing", "Hòn Tằm", 500000, "Tour combo từ bến cảng Nha Trang bao ăn trưa buffet."),
                        new ActivityTemplate("Mua đặc sản Nha Trang: khô, nước mắm, rong biển", "Mua quà: khô gà lá chanh, rong biển Nha Trang, nước mắm Ca Ro, nem chả Nha Trang.", "shopping", "Chợ Nha Trang", 250000, "Mua ở chợ hoặc cửa hàng đặc sản — tránh mua ở khu du lịch giá cao.")
                )));

        map.put("phú quốc", new DestinationData("Phú Quốc", "Tháng 11–3: mùa khô, biển đẹp nhất. Tránh tháng 5–10 (mùa mưa).",
                "Phú Quốc là đảo ngọc với nhiều bãi biển đẹp, Vinpearl Safari và thị trấn hoa Đêm Phú Quốc.",
                Arrays.asList(
                        new ActivityTemplate("Check-in khách sạn view biển & nghỉ ngơi", "Nhận phòng, thư giãn ngay tại bãi biển khách sạn.", "accommodation", "Phú Quốc", 50000, "Khách sạn gần Bãi Sao sẽ yên tĩnh và đẹp hơn."),
                        new ActivityTemplate("Vinpearl Safari — Vườn thú bán hoang dã", "Khám phá Safari lớn nhất Việt Nam với hơn 3.000 động vật.", "sight_seeing", "Vinpearl Safari Phú Quốc", 850000, "Mua vé online trước — rẻ hơn 10-15%. Nên đi buổi sáng sớm."),
                        new ActivityTemplate("Grand World & Cầu Tình Yêu", "Check-in Grand World — khu phức hợp giải trí hiện đại, chụp ảnh Cầu Tình Yêu.", "sight_seeing", "Grand World Phú Quốc", 200000, "Vào cổng miễn phí, một số khu vực chụp ảnh tính phí."),
                        new ActivityTemplate("Hải sản Bãi Dài & vịnh Phú Quốc", "Thưởng thức ghẹ, tôm hùm, cá mú nướng tỏi bên bãi biển.", "food", "Bãi Dài", 600000, "Chọn quán có view đẹp nhưng hỏi giá trước — tránh bị \"du lịch\"."),
                        new ActivityTemplate("Cáp treo Hòn Thơm — Vinpearl Land", "Trải nghiệm cáp treo vượt biển dài nhất thế giới (7.9km), đến Vinpearl Land.", "sight_seeing", "Hòn Thơm", 900000, "Cáp treo đẹp nhất sáng sớm, tránh đông. Combo vé online rẻ hơn."),
                        new ActivityTemplate("Bãi Sao — Bãi biển đẹp nhất Phú Quốc", "Tắm biển Bãi Sao với cát trắng mịn, nước trong xanh. Chèo thuyền kayak.", "sight_seeing", "Bãi Sao", 100000, "Không có dịch vụ cho thuê — tự mang theo hoặc book tour. Nắng rất gắt 11h-14h."),
                        new ActivityTemplate("Mua đặc sản: nước mắm, tiêu, sim ruột đào, rượu vang nho", "Mua nước mắm Phú Quốc AOC, tiêu đen Bình Hòa, sim khô, rượu vang nho Nam Roi.", "shopping", "Chợ đêm Phú Quốc", 300000, "Chợ đêm Dương Đông bán 18h-23h — mặc cả nhẹ vào cuối ngày.")
                )));

        map.put("sài gòn", new DestinationData("TP. Hồ Chí Minh", "Quanh năm nóng ấm, tháng 5–11 mùa mưa (mưa ngắn).",
                "Sài Gòn sôi động với ẩm thực đa dạng, Landmark 81, phố Tây Bùi Viện.",
                Arrays.asList(
                        new ActivityTemplate("Check-in khách sạn quận 1 & Dinh Độc Lập", "Nhận phòng, tham quan Dinh Độc Lập — biểu tượng lịch sử Sài Gòn.", "accommodation", "Quận 1, TP.HCM", 50000, "Quận 1 là trung tâm — đi bộ hoặc Grab là đủ."),
                        new ActivityTemplate("Landmark 81 — Tòa nhà cao nhất Việt Nam", "Ngắm toàn cảnh Sài Gòn từ tầng 79, shopping tại Vincom Center.", "sight_seeing", "Landmark 81", 200000, "Mua vé lên tầng 79 online để tránh xếp hàng."),
                        new ActivityTemplate("Bún thịt nướng & bánh mì Sài Gòn", "Thưởng thức bánh mì thịt nướng, bún gà nước, cơm tấm, hủ tiếu Nam Vang.", "food", "Quận 1 / Phố ẩm thực", 100000, "Bánh mì Bếp Thành, Bún bò Huế Saigoneer, Cơm tấm Kiều Giang — nổi tiếng Sài Gòn."),
                        new ActivityTemplate("Nhà thờ Đức Bà & Bưu điện TT Sài Gòn", "Check-in kiến trúc Pháp cổ ngay trung tâm quận 1.", "sight_seeing", "Quận 1, TP.HCM", 0, "Chụp ảnh đẹp nhất buổi sáng hoặc chiều tà."),
                        new ActivityTemplate("Khu du lịch Củ Chi — Địa đạo & Rừng ngập nước", "Trải nghiệm địa đạo Củ Chi, chèo xuồng qua rừng ngập nước, ăn cơm gà xã ướt.", "sight_seeing", "Củ Chi, TP.HCM", 450000, "Cách trung tâm 70km — nên đi tour trọn gói bao xe và ăn trưa."),
                        new ActivityTemplate("Phố Tây Bùi Viện — ẩm thực đường phố", "Dạo phố Tây Bùi Viện, uống bia Sài Gòn, ăn hải sản giá sinh viên.", "food", "Phố Bùi Viện", 300000, "Khu vực Bùi Viện đông đúc từ 18h-23h — giá hơi cao hơn bình thường."),
                        new ActivityTemplate("Mua quà: áo dài, nón lá, cà phê, socola Việt Nam", "Mua cà phê Việt (Trung Nguyên, Highlands), socola Marou, áo dài, nón lá làm quà.", "shopping", "Saigon Square / Ben Thanh", 250000, "Ben Thanh đông — mặc cả 30-40% giá niêm yết.")
                )));

        map.put("hà nội", new DestinationData("Hà Nội", "Tháng 9–11 & tháng 3–4: thời tiết đẹp nhất, mát mẻ.",
                "Hà Nội cổ kính với phố cổ, hồ Hoàn Kiếm, ẩm thực đường phố phong phú.",
                Arrays.asList(
                        new ActivityTemplate("Check-in khách sạn phố cổ & Hồ Hoàn Kiếm", "Nhận phòng, dạo Hồ Hoàn Kiếm, check-in Tháp Rùa & cầu Thê Húc.", "accommodation", "Phố Cổ Hà Nội", 50000, "Hồ Hoàn Kiếm đẹp nhất buổi tối khi đèn lồng sáng."),
                        new ActivityTemplate("Phố cổ Hà Nội — Không gian văn hóa", "Khám phá 36 phố phường, chụp ảnh kiến trúc Pháp, mua sắm đồ lưu niệm.", "sight_seeing", "Phố Cổ Hà Nội", 0, "Phố Hàng Đào, Hàng Bạc, Hàng Bè nổi tiếng nhất."),
                        new ActivityTemplate("Bún chả Hàng Ascarb & phở Hàng Bò", "Thưởng thức bún chả Hà Nội, phở bò, bún thang, bánh cuốn nóng.", "food", "Phố cổ Hà Nội", 100000, "Bún chả Hàng Ascarb (Lý Quốc Sư) nổi tiếng nhất — đông lắm, đi sớm 11h."),
                        new ActivityTemplate("Văn Miếu Quốc Tử Giám & Nhà sàn Hồ Chủ tịch", "Tham quan Văn Miếu — biểu tượng giáo dục Việt Nam, thăm Nhà sàn Bác Hồ.", "sight_seeing", "Văn Miếu, Đống Đa, Hà Nội", 30000, "Miễn phí Văn Miếu. Nhà sàn Bác Hồ cách đó 2km."),
                        new ActivityTemplate("Quán cà phê rooftop ngắm thành phố", "Ngồi cafe trứng nổi tiếng, cafe sữa đá, hoặc rooftop view phố cổ.", "food", "Hàng Hành / Lương Ngọc Quyến", 80000, "Cà phê Giảng, Cà phê Lương, The Note Coffee — view đẹp, giá mềm."),
                        new ActivityTemplate("Lăng Bác Hồ & Văn Miếu (sáng hôm sau)", "Tham quan Lăng Chủ tịch Hồ Chí Minh (sáng thứ Ba–CN), Văn Miếu, Tháp Rùa.", "sight_seeing", "Quảng trường Ba Đình", 30000, "Lăng Bác đóng cửa sáng thứ 3-6 hàng tuần. Mặc lịch sự."),
                        new ActivityTemplate("Mua quà: bánh gai, ô mai, cà phê, nón cối, tranh đồng", "Mua bánh gai Như Xuân, ô mai Hàng Đặng, cà phê Trung Nguyên, nón cối, tranh đồng mỹ nghệ.", "shopping", "Chợ Đồng Xuân / Phố cổ", 200000, "Chợ Đồng Xuân bán sỉ và lẻ — mặc cả thoải mái.")
                )));

        map.put("huế", new DestinationData("Huế", "Tháng 2–4: thời tiết mát mẻ, không nắng gắt. Tháng 10–12 có lũ.",
                "Huế thanh bình với cố đô, chùa Thiên Mụ, ẩm thực cung đình và đặc sản bún hến.",
                Arrays.asList(
                        new ActivityTemplate("Check-in & khám phá Đại Nội Huế", "Nhận phòng, tham quan Kinh thành Huế — di sản UNESCO.", "accommodation", "Huế", 50000, "Vé Kinh thành Huế: 150k/người. Mua vé combo cổng Ngọ Môn + Điện Thái Hòa."),
                        new ActivityTemplate("Chùa Thiên Mụ & Tháp Phước Duyên", "Tham quan ngôi chùa cổ nhất Huế, check-in Tháp Phước Duyên bên sông Hương.", "sight_seeing", "Chùa Thiên Mụ", 50000, "Sáng sớm đến để tránh đông và nắng nóng."),
                        new ActivityTemplate("Bún hến, bún bò Huế, cơm hến", "Thưởng thức ẩm thực cung đình Huế: bún bò, bún hến, cơm hến, bánh ép.", "food", "Phố ẩm thực Huế", 80000, "Hẻm Trần Hưng Đạo có nhiều quán ngon, giá sinh viên."),
                        new ActivityTemplate("Lăng Minh Mạng & lăng Khải Định", "Tham quan 2 trong số các lăng tẩm hoàng gia Huế — kiến trúc độc đáo.", "sight_seeing", "Lăng Minh Mạng", 150000, "Nên thuê xe máy hoặc grab để di chuyển giữa các lăng."),
                        new ActivityTemplate("Sông Hương & Thành Nội buổi chiều", "Dạo thuyền trên sông Hương, ngắm hoàng hôn, nghe ca Huế.", "sight_seeing", "Sông Hương", 200000, "Thuê thuyền tại bến Thương Bạc — mặc cả nhẹ, tránh đi tàu du lịch giá cao."),
                        new ActivityTemplate("Đi bộ cầu ngói Trường Tiền & chợ Đông Ba", "Check-in cầu Trường Tiền lung linh về đêm, khám chợ Đông Ba mua đặc sản.", "sight_seeing", "Cầu Trường Tiền", 50000, "Chợ Đông Ba bán sáng sớm — đặc sản Huế: tré, nem chua, bánh bèo."),
                        new ActivityTemplate("Mua quà: nón Huế, tranh thêu, nem chua, trà Sa Tế", "Mua nón bài thơ Huế, tranh thêu tay, nem chua, trà Sa Tế, kẹo cốm.", "shopping", "Chợ Đông Ba / Phố thương mại", 200000, "Nón Huế chính hãng ở Hàn Mặc Tử — giá 100-200k.")
                )));

        map.put("đà lạt", new DestinationData("Đà Lạt", "Tháng 11–3: hoa Anh Đào nở. Quanh năm mát mẻ 15-24°C.",
                "Đà Lạt thơ mộng với thung lũng Tình Yêu, hồ Xuân Hương, vườn hoa, cà phê view đồi.",
                Arrays.asList(
                        new ActivityTemplate("Check-in & dạo Hồ Xuân Hương", "Nhận phòng, dạo quanh Hồ Xuân Hương, ngắm hoa, chụp ảnh.", "accommodation", "Đà Lạt", 50000, "Sáng sớm hoặc chiều tà Hồ Xuân Hương đẹp và mát nhất."),
                        new ActivityTemplate("Thung lũng Tình Yêu & Đồi Mộng Mơ", "Tham quan thung lũng Tình Yêu, Đồi Mộng Mơ với cảnh đẹp thơ mộng.", "sight_seeing", "Thung Lũng Tình Yêu", 250000, "Thuê xe máy đi — đường núi quanh co, cẩn thận khi lái."),
                        new ActivityTemplate("Cơm niêu, bánh tráng nướng, café sữa đá Đà Lạt", "Thưởng thức cơm niêu nóng hổi, bánh tráng nướng, bánh flan, café sữa đá Đà Lạt.", "food", "Đường Nguyễn Trãi / Chợ Đà Lạt", 150000, "Bánh tráng nướng đường Lê Đại Hành nổi tiếng nhất — đông lắm."),
                        new ActivityTemplate("Vườn hoa Xuân Hương & Dinh 1, 2, 3", "Tham quan Vườn hoa, check-in Dinh 1 (Bảo Đại), Dinh 2, Dinh 3 — kiến trúc Pháp.", "sight_seeing", "Vườn Hoa Xuân Hương", 100000, "Ghé Dinh 1 vào buổi sáng — view đồi thông đẹp nhất."),
                        new ActivityTemplate("Thác Datanla & máng trượt tốc độ", "Trải nghiệm máng trượt tốc độ Datanla, tham quan thác nước giữa rừng thông.", "sight_seeing", "Thác Datanla", 350000, "Combo vé máng trượt + thác online rẻ hơn 20%. Máng trượt thú vị lắm!"),
                        new ActivityTemplate("Café view đồi thông & Cốc Phê ơ!", "Ngồi café view rừng thông, đồi chè Cầu Đất, uống socola nóng.", "food", "Đồi thông số 7 / Cầu Đất", 100000, "Các quán café view đẹp: Hân Cafe, Cốc Cà Phê, Cầu Đất Tea House."),
                        new ActivityTemplate("Mua quà: atiso, socola Đà Lạt, rau củ sấy, nước cốt dứa", "Mua atiso sấy, socola Đà Lạt, rau củ sấy khô, nước cốt dứa, trà atiso.", "shopping", "Chợ Đà Lạt", 200000, "Chợ Đà Lạt bán sỉ và lẻ — atiso sấy 100-200k/gói.")
                )));

        map.put("vũng tàu", new DestinationData("Vũng Tàu", "Tháng 11–4: thời tiết đẹp, ít mưa. Biển an toàn quanh năm.",
                "Vũng Tàu gần Sài Gòn, nổi tiếng bãi trước, tượng Chúa Kitô, ẩm thực hải sản.",
                Arrays.asList(
                        new ActivityTemplate("Check-in & dạo Bãi Trước", "Nhận phòng, dạo Bãi Trước, ngắm cảng biển Vũng Tàu.", "accommodation", "Vũng Tàu", 50000, "Cách Sài Gòn 120km, đi xe máy/ô tô 2-3 tiếng."),
                        new ActivityTemplate("Tượng Chúa Giáng Sinh trên núi Nhỏ", "Leo 700 bậc thang lên núi Nhỏ, check-in tượng Chúa Giáng Sinh cao 32m.", "sight_seeing", "Núi Nhỏ Vũng Tàu", 50000, "Sáng sớm hoặc chiều tà để tránh nắng. Có đường ô tô lên nếu không leo bậc."),
                        new ActivityTemplate("Hải sản tươi sống Bãi Dâu & Mũi Nghỉ Phong", "Thưởng thức hải sản tươi: cua, ghẹ, cá, mực nướng — đặc sản Vũng Tàu.", "food", "Bãi Dâu", 400000, "Bãi Dâu yên tĩnh, nhà hàng view biển — giá cao hơn. Vào hẻm rẻ hơn."),
                        new ActivityTemplate("Côn Đảo — Thiên đường biển đảo", "Đến Côn Đảo từ Vũng Tàu (tàu cao tốc 2h) — lăng mộ Võ Thị Sáu, bãi biển hoang sơ.", "sight_seeing", "Côn Đảo", 600000, "Côn Đảo cần book tour hoặc vé tàu trước — mùa cao điểm rất đông."),
                        new ActivityTemplate("Lăng Võ Thị Sáu & Nghĩa trang Hàng Dương", "Thăm lăng Võ Thị Sáu, nghĩa trang Hàng Dương — di tích lịch sử.", "sight_seeing", "Vũng Tàu", 0, "Miễn phí. Nên đi vào buổi sáng."),
                        new ActivityTemplate("Bánh xèo, bún mắm nậm, bánh canh Vũng Tàu", "Thưởng thức đặc sản: bánh xèo Vũng Tàu, bún mắm nậm, bánh canh ghẹ.", "food", "Phố ẩm thực Vũng Tàu", 150000, "Bánh canh ghẹ đường Nguyễn Trãi nổi tiếng nhất Vũng Tàu."),
                        new ActivityTemplate("Mua quà: mực một nắng, khô các loại, rượu sim, nước mắm Vũng Tàu", "Mua mực một nắng, khô cá lóc, rượu sim, nước mắm Vũng Tàu làm quà.", "shopping", "Chợ Vũng Tàu", 200000, "Mực một nắng Vũng Tàu nổi tiếng — mua ở chợ Bến Đình rẻ và chất lượng.")
                )));

        map.put("cần thơ", new DestinationData("Cần Thơ", "Tháng 12–4: mùa khô, tránh lũ. Đặc biệt đẹp mùa nước nổi (tháng 10–11).",
                "Cần Thơ sông nước với chợ nổi Cái Răng, nhà cổ Bình Thuỷ, vườn cây ăn trái.",
                Arrays.asList(
                        new ActivityTemplate("Check-in & chợ nổi Cái Răng", "Nhận phòng, đi xuồng chợ nổi Cái Răng — sáng sớm 5-7h là nhộn nhịp nhất.", "accommodation", "Cần Thơ", 50000, "Thuê xuồng chợ nổi trực tiếp tại bến — tránh qua bớt trung gian."),
                        new ActivityTemplate("Bún gỏi, bánh xèo, nem nướng Cần Thơ", "Thưởng thức đặc sản miền Tây: bún gỏi, bánh xèo, nem nướng, cá lóc nướng trui.", "food", "Đường Hai Bà Trưng / Bến Ninh Kiểu", 120000, "Bún gỏi Bến Ninh Kiểu nổi tiếng nhất — quán nào cũng ngon."),
                        new ActivityTemplate("Nhà cổ Bình Thuỷ & chùa Ông", "Tham quan nhà cổ Bình Thuỷ — biểu tượng kiến trúc Á-Âu 140 tuổi.", "sight_seeing", "Nhà Cổ Bình Thuỷ", 30000, "Cách trung tâm 6km — thuê xe máy đi tiện."),
                        new ActivityTemplate("Vườn cây ăn trái & xuồng tay chèo", "Tham quan vườn cây ăn trái (xoài, nhãn, chôm chôm), chèo xuồng kênh rạch.", "sight_seeing", "Vựa trái cây Cần Thơ", 200000, "Mùa trái cây: tháng 5-8 (xoài, nhãn), tháng 10-11 (chôm chôm)."),
                        new ActivityTemplate("Cầu Cần Thơ & view sông Hậu", "Check-in cầu Cần Thơ — cầu dây văng dài nhất Đông Nam Á, ngắm sông Hậu.", "sight_seeing", "Cầu Cần Thơ", 0, "Cầu nằm cách trung tâm 15km — đi xe máy hoặc ô tô."),
                        new ActivityTemplate("Ẩm thực đường phố & cafe sông Hậu", "Dạo phố đêm Cần Thơ, uống café sông Hậu, ăn bánh flan, chè ba màu.", "food", "Sông Hậu / Quảng trường NVC", 100000, "Quảng trường Nguyễn Văn Cừ về đêm nhộn nhịp, nhiều quán ngon."),
                        new ActivityTemplate("Mua quà: trái cây sấy, nước mắm Cần Thơ, bánh pía, xoài sấy", "Mua bánh pía, xoài sấy, nước mắm Cần Thơ, khóm (dứa) sấy, mật ong Mekong.", "shopping", "Chợ Cần Thơ / Cửa hàng đặc sản", 200000, "Bánh pía Sầu Đâu nổi tiếng nhất — mua ở cửa hàng chính hãng.")
                )));

        map.put("hạ long", new DestinationData("Hạ Long", "Tháng 3–5 & 9–11: thời tiết đẹp, biển trong. Tránh mùa mưa bão tháng 7-8.",
                "Hạ Long nổi tiếng vịnh di sản UNESCO với hàng nghìn đảo đá vôi.",
                Arrays.asList(
                        new ActivityTemplate("Check-in tàu du lịch & khám phá Vịnh Hạ Long", "Lên tàu, ngắm hàng nghìn đảo đá vôi, tham quan hang Sửng Sốt, động Thiên Cung.", "accommodation", "Vịnh Hạ Long", 1500000, "Tour 2 ngày 1 đêm trên tàu là trải nghiệm tốt nhất. Mùa cao điểm book sớm 1-2 tuần."),
                        new ActivityTemplate("Hang Sửng Sốt & Động Thiên Cung", "Khám phá hang động lớn nhất vịnh, check-in thạch nhũ kỳ vĩ.", "sight_seeing", "Hang Sửng Sốt", 0, "Có trong tour tàu. Hang đẹp nhất buổi sáng sớm — ít tàu và ánh sáng đẹp."),
                        new ActivityTemplate("Hải sản tươi sống vịnh Hạ Long", "Thưởng thức hải sản vịnh: sam biển, tu hài, ghẹ, cá chiên — tươi sống ngay trên tàu.", "food", "Tàu du lịch / Cảng Hạ Long", 600000, "Ăn trên tàu tour thường đã bao trong giá. Ăn riêng thì giá cao hơn."),
                        new ActivityTemplate("Kayak / Chèo thuyền Bamboo tại vịnh", "Chèo kayak vào hang động nhỏ, bơi lội vịnh trong xanh, check-in đảo Titop.", "sight_seeing", "Vịnh Hạ Long", 200000, "Kayak đã có trong tour tàu cao cấp. Thuê thêm thì 100-200k/người."),
                        new ActivityTemplate("Bãi tắm Titop — đảo nhỏ hình nón", "Lên đảo Titop — bãi tắm nhỏ xinh, view vịnh tuyệt đẹp từ trên đỉnh.", "sight_seeing", "Đảo Titop", 0, "Leo ~400 bậc lên đỉnh để có view panorama vịnh — đẹp nhất lúc hoàng hôn."),
                        new ActivityTemplate("Quảng trường & phố đêm Hạ Long", "Dạo phố đêm Hạ Long, mua đồ lưu niệm, ăn hải sản giá hợp lý.", "food", "Quảng trường Hạ Long", 200000, "Khu phố đêm Sun Plaza — nhộn nhịp và đa dạng ẩm thực."),
                        new ActivityTemplate("Mua quà: nước mắm Hạ Long, mực khô, vịnh cua, ngọc trai", "Mua nước mắm Hạ Long (nổi tiếng), mực khô, vỏ sò vịnh, ngọc trai Hạ Long.", "shopping", "Chợ Hạ Long / Cửa hàng ngọc trai", 300000, "Ngọc trai nuôi cấy Hạ Long nổi tiếng — mua ở cửa hàng uy tín, có giấy chứng nhận.")
                )));

        return map;
    }

    private List<ActivityTemplate> getDefaultActivities() {
        return Arrays.asList(
                new ActivityTemplate("Check-in khách sạn & nghỉ ngơi", "Nhận phòng, gửi hành lý, nghỉ ngơi sau chuyến đi dài.", "accommodation", "Điểm đến", 50000, "Mang theo CMND/CCCD và mã booking."),
                new ActivityTemplate("Khám phá trung tâm thành phố", "Dạo quanh trung tâm, tham quan các địa điểm nổi tiếng.", "sight_seeing", "Trung tâm", 100000, "Nên đi sớm để tránh nắng nóng."),
                new ActivityTemplate("Thưởng thức ẩm thực địa phương", "Thưởng thức các món ăn đặc trưng của vùng miền.", "food", "Nhà hàng địa phương", 200000, "Hỏi người địa phương địa chỉ ngon, giá hợp lý."),
                new ActivityTemplate("Tham quan danh lam thắng cảnh", "Tham quan các điểm du lịch nổi tiếng tại địa phương.", "sight_seeing", "Điểm tham quan", 100000, "Mua vé online để tiết kiệm thời gian."),
                new ActivityTemplate("Mua sắm & quà lưu niệm", "Mua đặc sản và quà lưu niệm đặc trưng của vùng.", "shopping", "Khu chợ / Trung tâm thương mại", 150000, "Mặc cả nhẹ ở chợ, mua nhiều sẽ được giảm.")
        );
    }

    private ActivityTemplate findByType(List<ActivityTemplate> list, String type) {
        for (ActivityTemplate t : list) {
            if (t.type.equals(type)) return t;
        }
        return null;
    }

    // ===== UTILITIES ==========================================================

    private String formatDuration(long days) {
        if (days == 1) return "1 ngày 0 đêm";
        return days + " ngày " + (days - 1) + " đêm";
    }

    private LocalDate parseDate(String dateStr, LocalDate fallback) {
        if (dateStr == null || dateStr.isBlank()) return fallback;
        try {
            return LocalDate.parse(dateStr);
        } catch (Exception e) {
            return fallback;
        }
    }

    private String nullSafe(String s) {
        return s != null ? s : "";
    }

    // ===== INNER CLASSES ======================================================

    private static class DestinationData {
        String name;
        String weatherNote;
        String localTip;
        List<ActivityTemplate> activities;

        DestinationData(String name, String weatherNote, String localTip, List<ActivityTemplate> activities) {
            this.name = name;
            this.weatherNote = weatherNote;
            this.localTip = localTip;
            this.activities = activities;
        }
    }

    private static class ActivityTemplate {
        String title;
        String description;
        String type;
        String location;
        int baseCost;
        String tip;

        ActivityTemplate(String title, String description, String type, String location, int baseCost, String tip) {
            this.title = title;
            this.description = description;
            this.type = type;
            this.location = location;
            this.baseCost = baseCost;
            this.tip = tip;
        }
    }
}
