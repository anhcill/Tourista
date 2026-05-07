package vn.tourista.service.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * AI Travel Planner Service - xử lý travel plan generation
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiTravelPlannerService {

    private final AiCoreService aiCore;

    /**
     * Viết lại travel plan thành văn phong tự nhiên
     */
    public String rewritePlanToNaturalProse(String planSummary, String dayPlansJson) {
        String dateContext = "Ngày hiện tại: " 
                + LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
                + " - Mùa: " + getVietnameseSeason();

        String prompt = """
                Bạn là một travel blogger Việt Nam nhiệt huyết. Viết lại lịch trình du lịch thành văn phong tự nhiên, thân thiện, hào hứng — như đang kể cho bạn bè nghe về chuyến đi sắp tới.

                %s

                YÊU CẦU:
                - Viết theo phong cách travel blogger: tự nhiên, gần gũi, có cảm xúc
                - Mỗi ngày viết 1-2 đoạn văn, mỗi đoạn 3-5 câu
                - Đề cập các hoạt động chính với thời gian cụ thể
                - Thêm mẹo nhỏ thực tế phù hợp với MÙA HIỆN TẠI
                - KHÔNG bịa giá, KHÔNG thêm hoạt động không có trong lịch trình
                - Tổng độ dài: 4-8 đoạn văn
                - Trả lời CHỈ bằng văn bản, không dùng markdown

                Lịch trình:
                %s

                Chi tiết từng ngày:
                %s

                Hãy viết ngay phần nội dung, không có tiêu đề hay preamble. Bắt đầu luôn!
                """.formatted(dateContext, planSummary, dayPlansJson);

        return aiCore.ask(prompt);
    }

    /**
     * Gợi ý câu hỏi tiếp theo
     */
    public List<String> suggestFollowUpQuestions(String planSummary, String budget, String tripType) {
        String prompt = """
                Bạn là trợ lý du lịch thân thiện của nền tảng Tourista Studio.
                Dựa vào lịch trình sau, hãy đề xuất câu hỏi gợi ý để khách hàng tiếp tục tương tác.

                Lịch trình: %s
                Ngân sách: %s
                Phong cách: %s

                YÊU CẦU:
                - Mỗi câu hỏi ngắn gọn (dưới 20 từ)
                - Mang tính gợi mở, thúc đẩy hành động
                - Đa dạng chủ đề: hoạt động buổi tối, ẩm thực, chỗ ở, transport
                - Dùng emoji phù hợp
                - Trả lời theo format, mỗi câu 1 dòng, KHÔNG có số thứ tự

                Đề xuất 3 câu hỏi:
                """.formatted(planSummary, budget, tripType);

        String result = aiCore.ask(prompt);
        if (result == null || result.isBlank()) {
            return List.of(
                    "Bạn muốn thêm hoạt động buổi tối không? 🌙",
                    "Có muốn gợi ý chỗ ở gần các điểm tham quan không? 🏨",
                    "Bạn muốn đổi ngân sách hoặc số ngày không? 📅"
            );
        }

        return List.of(result.split("\n")).stream()
                .map(String::trim)
                .filter(line -> !line.isBlank() && line.length() > 5)
                .limit(4)
                .toList();
    }

    /**
     * Tạo gợi ý điểm đến thay thế
     */
    public String suggestAlternativeDestinations(String currentCity, Integer budgetVnd, Integer travelers) {
        String prompt = """
                Ban la chuyen gia du lich Viet Nam.
                Khach hang dang quan tam den %s nhung chua tim duoc tour phu hop.
                Ngan sach: %s
                So nguoi: %d
                
                Hay goi y 3 diem den thay the gan giong voi dia danh cua nguoi dung (cung vung mien).
                Moi goi y chi can ten thanh pho/tinh + giai thich ngan (1 cau) tai sao phu hop.
                Tra loi NGAN GON, chi noi dung.
                """.formatted(
                currentCity != null ? currentCity : "điểm đến này",
                formatVnd(budgetVnd != null ? budgetVnd : 0),
                travelers != null ? travelers : 2
        );

        String result = aiCore.ask(prompt);
        if (result != null && !result.isBlank()) {
            return "🔮 **Gợi ý điểm đến thay thế:**\n" + result;
        }

        return buildDefaultAlternativeSuggestion(currentCity);
    }

    // ----- Private -----

    private String getVietnameseSeason() {
        int month = LocalDate.now().getMonthValue();
        if (month >= 3 && month <= 5) return "Hè / Nắng nóng";
        if (month >= 6 && month <= 8) return "Hè nóng / Mưa mùa hạ";
        if (month >= 9 && month <= 11) return "Thu / Đông đầu";
        return "Đông / Lạnh";
    }

    private String buildDefaultAlternativeSuggestion(String city) {
        if (city == null || city.isBlank()) {
            return """
                    Bạn có thể thử:
                    • **Đà Nẵng** — biển, nắng đẹp
                    • **Nha Trang** — biển, dễ đặt vé
                    • **Phú Quốc** — đảo, nghỉ dưỡng
                    
                    Hoặc nhắn **xóa lọc** để tìm tour rộng hơn nhé!""";
        }

        return """
                Vùng **%s** hiện chưa có tour trong mức giá này.
                Bạn có thể thử:
                • Tăng ngân sách thêm 20-30%
                • Hoặc nhắn **xóa lọc** để tìm rộng hơn""".formatted(city);
    }

    private String formatVnd(long amount) {
        return String.format(java.util.Locale.US, "%,d", amount).replace(',', '.') + " VND";
    }
}
