package vn.tourista.dto.response;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TravelPlanResponse {

    private String destination;
    private String tripDuration;
    private Integer totalDays;
    private Integer totalBudget;
    private String currency;

    private String summary;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DayPlan {
        private Integer day;
        private String date;
        private String title;
        private List<Activity> activities;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Activity {
        private String time;
        private String title;
        private String description;
        private String type; // sight_seeing, food, transport, accommodation, shopping
        private String location;
        private Integer estimatedCost;
        private String tips;
    }

    private List<DayPlan> dayPlans;

    private List<String> packingList;
    private String weatherNote;
    private String localTips;

    /** Văn phong tự nhiên do AI viết lại từ lịch trình CORE. */
    private String rewrittenProse;

    /** Gợi ý câu hỏi tiếp theo từ AI. */
    private List<String> aiSuggestions;
}
