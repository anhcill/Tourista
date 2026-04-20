package vn.tourista.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.tourista.dto.request.TravelPlanRequest;
import vn.tourista.dto.response.TravelPlanResponse;
import vn.tourista.service.GeminiService;
import vn.tourista.service.TravelPlanService;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class TravelPlanServiceImpl implements TravelPlanService {

    private final GeminiService geminiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String TRAVEL_PLAN_PROMPT_TEMPLATE = """
            Bạn là chuyên gia lập kế hoạch du lịch của nền tảng Tourista.vn.
            Hãy tạo lịch trình chi tiết cho chuyến đi sau (trả lời BẮT BUỘC bằng tiếng Việt):

            Điểm đến: %s
            Ngày đi: %s
            Ngày về: %s
            Số người lớn: %d
            Số trẻ em: %d
            Ngân sách: %s
            Sở thích: %s
            Loại chuyến đi: %s

            Hãy trả lời BẰNG MỘT OBJECT JSON HỢP LỆ, KHÔNG có markdown code block, KHÔNG có giải thích gì thêm, CHỈ JSON thuần.
            Cấu trúc JSON bắt buộc như sau:

            {
              "destination": "Tên điểm đến",
              "tripDuration": "X ngày Y đêm",
              "totalDays": số_ngày,
              "summary": "Một đoạn tóm tắt 2-3 câu về chuyến đi này",
              "dayPlans": [
                {
                  "day": 1,
                  "date": "dd/MM/yyyy",
                  "title": "Tiêu đề ngày 1, ví dụ: Khám phá trung tâm",
                  "activities": [
                    {
                      "time": "08:00",
                      "title": "Tên hoạt động",
                      "description": "Mô tả ngắn 1-2 câu",
                      "type": "sight_seeing|food|transport|accommodation|shopping",
                      "location": "Tên địa điểm",
                      "estimatedCost": số_tiền_VND,
                      "tips": "Mẹo ngắn"
                    }
                  ]
                }
              ],
              "packingList": ["vật dụng 1", "vật dụng 2", ...],
              "weatherNote": "Ghi chú thời tiết",
              "localTips": "Mẹo địa phương 2-3 câu"
            }

            QUY TẮC:
            - Nếu không có ngày cụ thể, hãy dùng ngày hiện tại làm ngày đi.
            - Mỗi ngày nên có 3-5 hoạt động.
            - Hoạt động nên đa dạng: tham quan, ăn uống, di chuyển.
            - Chi phí ước tính tính bằng VND.
            - Điểm đến phải phù hợp với Việt Nam (nếu là điểm quốc tế thì vẫn ok).
            """;

    @Override
    public TravelPlanResponse generatePlan(TravelPlanRequest request) {
        String prompt = buildPrompt(request);
        String jsonResponse = geminiService.ask(prompt);

        if (jsonResponse == null || jsonResponse.isBlank()) {
            return buildFallbackPlan(request);
        }

        try {
            String cleanJson = cleanJsonResponse(jsonResponse);
            return parsePlanResponse(cleanJson, request);
        } catch (Exception ex) {
            log.warn("TravelPlanService: Parse Gemini response failed — {}", ex.getMessage());
            return buildFallbackPlan(request);
        }
    }

    private String buildPrompt(TravelPlanRequest request) {
        LocalDate checkIn = parseDate(request.getCheckIn(), LocalDate.now());
        LocalDate checkOut = parseDate(request.getCheckOut(), checkIn.plusDays(3));
        long days = Math.max(1, ChronoUnit.DAYS.between(checkIn, checkOut));
        long nights = days - 1;

        String budgetLabel = switch (request.getBudget() != null ? request.getBudget().toUpperCase() : "TRUNGBINH") {
            case "THAP" -> "Tiết kiệm (dưới 2 triệu/người)";
            case "CAO" -> "Cao cấp (trên 10 triệu/người)";
            default -> "Trung bình (2-10 triệu/người)";
        };

        String tripTypeLabel = switch (request.getTripType() != null ? request.getTripType().toUpperCase() : "RELAX") {
            case "ADVENTURE" -> "Phiêu lưu - khám phá";
            case "FAMILY" -> "Gia đình";
            case "ROMANTIC" -> "Lãng mạn";
            case "BUSINESS" -> "Công tác";
            default -> "Nghỉ dưỡng";
        };

        return String.format(
                TRAVEL_PLAN_PROMPT_TEMPLATE,
                nullSafe(request.getDestination()),
                checkIn.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                checkOut.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                request.getAdults() != null ? request.getAdults() : 2,
                request.getChildren() != null ? request.getChildren() : 0,
                budgetLabel,
                nullSafe(request.getInterests()),
                tripTypeLabel
        );
    }

    private String cleanJsonResponse(String response) {
        String cleaned = response.trim();
        // Remove markdown code blocks
        if (cleaned.startsWith("```")) {
            int firstNewline = cleaned.indexOf('\n');
            if (firstNewline > 0) {
                cleaned = cleaned.substring(firstNewline + 1);
            }
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        return cleaned.trim();
    }

    private TravelPlanResponse parsePlanResponse(String json, TravelPlanRequest request) throws Exception {
        JsonNode root = objectMapper.readTree(json);

        List<TravelPlanResponse.DayPlan> dayPlans = new ArrayList<>();
        JsonNode daysNode = root.path("dayPlans");
        if (daysNode.isArray()) {
            for (JsonNode dayNode : daysNode) {
                List<TravelPlanResponse.Activity> activities = new ArrayList<>();
                JsonNode actsNode = dayNode.path("activities");
                if (actsNode.isArray()) {
                    for (JsonNode actNode : actsNode) {
                        activities.add(TravelPlanResponse.Activity.builder()
                                .time(nullSafeText(actNode, "time"))
                                .title(nullSafeText(actNode, "title"))
                                .description(nullSafeText(actNode, "description"))
                                .type(nullSafeText(actNode, "type"))
                                .location(nullSafeText(actNode, "location"))
                                .estimatedCost(actNode.has("estimatedCost") ? actNode.get("estimatedCost").asInt() : 0)
                                .tips(nullSafeText(actNode, "tips"))
                                .build());
                    }
                }
                dayPlans.add(TravelPlanResponse.DayPlan.builder()
                        .day(dayNode.has("day") ? dayNode.get("day").asInt() : 0)
                        .date(nullSafeText(dayNode, "date"))
                        .title(nullSafeText(dayNode, "title"))
                        .activities(activities)
                        .build());
            }
        }

        List<String> packingList = new ArrayList<>();
        JsonNode packingNode = root.path("packingList");
        if (packingNode.isArray()) {
            packingNode.forEach(item -> packingList.add(item.asText()));
        }

        return TravelPlanResponse.builder()
                .destination(nullSafeText(root, "destination"))
                .tripDuration(nullSafeText(root, "tripDuration"))
                .totalDays(root.has("totalDays") ? root.get("totalDays").asInt() : 3)
                .summary(nullSafeText(root, "summary"))
                .dayPlans(dayPlans)
                .packingList(packingList)
                .weatherNote(nullSafeText(root, "weatherNote"))
                .localTips(nullSafeText(root, "localTips"))
                .currency("VND")
                .build();
    }

    private TravelPlanResponse buildFallbackPlan(TravelPlanRequest request) {
        LocalDate checkIn = parseDate(request.getCheckIn(), LocalDate.now());
        LocalDate checkOut = parseDate(request.getCheckOut(), checkIn.plusDays(3));

        TravelPlanResponse.Activity act1 = TravelPlanResponse.Activity.builder()
                .time("08:00")
                .title("Đến điểm đến & nhận phòng")
                .description("Làm thủ tục nhận phòng khách sạn, nghỉ ngơi sau chuyến đi.")
                .type("accommodation")
                .location(request.getDestination())
                .estimatedCost(50000)
                .tips("Mang theo CMND/CCCD và mã booking")
                .build();

        TravelPlanResponse.Activity act2 = TravelPlanResponse.Activity.builder()
                .time("10:00")
                .title("Khám phá trung tâm thành phố")
                .description("Dạo quanh trung tâm, tham quan các địa điểm nổi tiếng.")
                .type("sight_seeing")
                .location(request.getDestination())
                .estimatedCost(100000)
                .tips("Nên đi sớm để tránh nắng")
                .build();

        TravelPlanResponse.Activity act3 = TravelPlanResponse.Activity.builder()
                .time("12:30")
                .title("Bữa trưa đặc sản địa phương")
                .description("Thưởng thức các món ăn đặc trưng của vùng miền.")
                .type("food")
                .location(request.getDestination())
                .estimatedCost(200000)
                .tips("Hỏi người địa phương địa chỉ ngon")
                .build();

        TravelPlanResponse.DayPlan dayPlan = TravelPlanResponse.DayPlan.builder()
                .day(1)
                .date(checkIn.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")))
                .title("Ngày đầu tiên — Khám phá " + nullSafe(request.getDestination()))
                .activities(List.of(act1, act2, act3))
                .build();

        return TravelPlanResponse.builder()
                .destination(nullSafe(request.getDestination()))
                .tripDuration("3 ngày 2 đêm")
                .totalDays(3)
                .summary("Chuyến đi " + nullSafe(request.getDestination()) + " với lịch trình được gợi ý phù hợp với " +
                        (request.getAdults() != null ? request.getAdults() : 2) + " người lớn.")
                .dayPlans(List.of(dayPlan))
                .packingList(List.of("CMND/CCCD", "Tiền mặt", "Điện thoại", "Sạc dự phòng", "Quần áo thoáng mát", "Kem chống nắng"))
                .weatherNote("Nên mang theo áo mưa nhẹ và kem chống nắng quanh năm.")
                .localTips("Nên thuê xe máy để di chuyển linh hoạt, giá khoảng 100-150k/ngày.")
                .currency("VND")
                .build();
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

    private String nullSafeText(JsonNode node, String field) {
        JsonNode n = node.path(field);
        return n.isMissingNode() ? "" : n.asText("");
    }
}
