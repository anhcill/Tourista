package vn.tourista.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;

/**
 * AiService — Unified AI service using Beeknoee (OpenAI-compatible API, powered by Zhipu GLM).
 *
 * Responsibilities:
 * - Rewrite structured travel plan into natural, friendly Vietnamese prose
 * - Suggest follow-up questions to engage the user
 * - Generate tour enrichment tips
 *
 * Uses OpenAI-compatible chat completions format (different from Gemini's format).
 * Falls back gracefully when API key is not configured.
 */
@Slf4j
@Service
public class AiService {

    @Value("${beeknoee.api-key:}")
    private String apiKey;

    @Value("${beeknoee.api-url:https://platform.beeknoee.com/api/v1/chat/completions}")
    private String apiUrl;

    @Value("${beeknoee.model:glm-4.7-flash}")
    private String model;

    @Value("${beeknoee.timeout-seconds:60}")
    private int timeoutSeconds;

    @Value("${beeknoee.max-tokens:500}")
    private int maxTokens;

    // Semaphore to serialize AI requests (Beeknoee free tier allows only 1 concurrent request)
    private final Semaphore aiSemaphore = new Semaphore(1);

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    /**
     * Check if AI is configured and ready.
     */
    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }

    /**
     * Generic ask method — sends a prompt and returns the AI response.
     * Fails fast (5s wait) so the user never waits too long.
     */
    public String ask(String userMessage) {
        return ask(userMessage, null);
    }

    /**
     * Ask with conversation context.
     */
    public String ask(String userMessage, String conversationContext) {
        if (!isEnabled()) {
            log.debug("AiService: API key not configured, skipping AI call.");
            return null;
        }

        // Fail fast — don't make user wait more than 5s for the AI slot
        try {
            if (!aiSemaphore.tryAcquire(5, TimeUnit.SECONDS)) {
                log.warn("AiService: Could not acquire semaphore (AI busy), skipping request");
                return null;
            }
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            return null;
        }

        try {
            String content = composeContent(userMessage, conversationContext);
            String requestBody = buildRequestBody(content);
            String url = apiUrl;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                return parseOpenAIResponse(response.body());
            } else {
                log.warn("AiService: HTTP {}. Body: {}",
                        response.statusCode(),
                        response.body().length() > 300 ? response.body().substring(0, 300) : response.body());
                return null;
            }
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            log.warn("AiService: Request interrupted.");
            return null;
        } catch (Exception ex) {
            log.warn("AiService: API call failed — {}", ex.getMessage());
            return null;
        } finally {
            aiSemaphore.release();
        }
    }

    // ============================================================
    // TRAVEL PLAN — REWRITE IN NATURAL PROSE
    // ============================================================

    /**
     * Rewrite a structured travel plan into natural, friendly Vietnamese prose.
     * Called after the CORE engine generates the plan.
     *
     * @param planSummary The summary line of the trip
     * @param dayPlansJson JSON string of day plans (from CORE engine)
     * @return Friendly prose describing the trip, or null if AI fails
     */
    public String rewritePlanToNaturalProse(String planSummary, String dayPlansJson) {
        if (!isEnabled()) {
            return null;
        }

        String dateContext = "Ngày hiện tại: "
            + java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"))
            + " - Mùa: " + getVietnameseSeason();

        String prompt = """
                Bạn là một travel blogger Việt Nam nhiệt huyết. Viết lại lịch trình du lịch thành văn phong tự nhiên, thân thiện, hào hứng — như đang kể cho bạn bè nghe về chuyến đi sắp tới.

                %s

                YÊU CẦU:
                - Viết theo phong cách travel blogger: tự nhiên, gần gũi, có cảm xúc, có cá tính
                - Mỗi ngày viết 1-2 đoạn văn, mỗi đoạn 3-5 câu
                - Đề cập các hoạt động chính với thời gian cụ thể
                - Thêm mẹo nhỏ thực tế phù hợp với MÙA HIỆN TẠI
                - KHÔNG bịa giá, KHÔNG thêm hoạt động không có trong lịch trình
                - KHÔNG viết generic tips như "nên mang kem chống nắng"
                - Tổng độ dài: 4-8 đoạn văn
                - Trả lời CHỈ bằng văn bản, không dùng markdown phức tạp
                - VARIATION: Mỗi ngày có góc nhìn khác nhau (ngày 1: háo hức/check-in, ngày 2: khám phá sâu, ngày cuối: thư giãn/mua sắm)

                Lịch trình:
                %s

                Chi tiết từng ngày:
                %s

                Hãy viết ngay phần nội dung, không có tiêu đề hay preamble. Bắt đầu luôn!
                """.formatted(dateContext, planSummary, dayPlansJson);

        return ask(prompt);
    }

    private static String getVietnameseSeason() {
        int month = java.time.LocalDate.now().getMonthValue();
        if (month >= 3 && month <= 5) return "Hè / Nắng nóng";
        if (month >= 6 && month <= 8) return "Hè nóng / Mưa mùa hạ";
        if (month >= 9 && month <= 11) return "Thu / Đông đầu";
        return "Đông / Lạnh";
    }

    // ============================================================
    // TRAVEL PLAN — SUGGEST FOLLOW-UP QUESTIONS
    // ============================================================

    /**
     * Generate 3-4 follow-up questions to engage the user about their trip.
     * Questions are based on the generated plan and user preferences.
     *
     * @param planSummary Brief summary of the generated plan
     * @param budget Budget level (THAP/TRUNGBINH/CAO)
     * @param tripType Trip type (RELAX/ADVENTURE/FAMILY/ROMANTIC/BUSINESS)
     * @return List of suggestion questions, or null if AI fails
     */
    public java.util.List<String> suggestFollowUpQuestions(String planSummary, String budget, String tripType) {
        if (!isEnabled()) {
            return java.util.List.of(
                    "Bạn muốn thêm hoạt động buổi tối không? 🌙",
                    "Có muốn gợi ý chỗ ở gần các điểm tham quan không? 🏨",
                    "Bạn muốn đổi ngân sách hoặc số ngày không? 📅"
            );
        }

        String prompt = """
                Bạn là trợ lý du lịch thân thiện của nền tảng Tourista Studio.
                Dựa vào lịch trình sau, hãy đề xuất 3 câu hỏi gợi ý để khách hàng tiếp tục tương tác.

                Lịch trình: %s
                Ngân sách: %s
                Phong cách: %s

                YÊU CẦU:
                - Mỗi câu hỏi ngắn gọn (dưới 20 từ)
                - Mang tính gợi mở, thúc đẩy hành động
                - Đa dạng chủ đề: hoạt động buổi tối, ẩm thực, chỗ ở, transport, budget
                - Dùng emoji phù hợp
                - Trả lời theo format, mỗi câu 1 dòng, KHÔNG có số thứ tự, KHÔNG có dấu đầu dòng

                Format (đúng 3 dòng, mỗi dòng 1 câu hỏi):
                """.formatted(planSummary, budget, tripType);

        String result = ask(prompt);
        if (result == null || result.isBlank()) {
            return java.util.List.of(
                    "Bạn muốn thêm hoạt động buổi tối không? 🌙",
                    "Có muốn gợi ý chỗ ở gần các điểm tham quan không? 🏨",
                    "Bạn muốn đổi ngân sách hoặc số ngày không? 📅"
            );
        }

        return java.util.Arrays.stream(result.split("\n"))
                .map(String::trim)
                .filter(line -> !line.isBlank())
                .filter(line -> line.length() > 5)
                .limit(4)
                .toList();
    }

    // ============================================================
    // CHATBOT — AI trả lời câu hỏi tự do, có context từ DB thật
    // ============================================================

    /**
     * Trả lời câu hỏi tự do của user bằng AI, kèm dữ liệu thật từ DB.
     * Được gọi khi không khớp rule nào trong BotService.
     *
     * @param userMessage     Tin nhắn của user
     * @param conversationContext Lịch sử chat gần đây (để có context)
     * @param dbContext       Dữ liệu thật từ DB (tour, hotel, booking, cities...)
     * @return Câu trả lời tự nhiên từ AI, hoặc null nếu AI lỗi
     */
    public String askChatbot(String userMessage, String conversationContext, String dbContext) {
        if (!isEnabled()) {
            return null;
        }

        String prompt = buildChatbotPrompt(userMessage, conversationContext, dbContext);
        return ask(prompt, null);
    }

    /**
     * Trả lời câu hỏi tự do — phiên bản không có DB context (fallback).
     */
    public String askChatbotFree(String userMessage, String conversationContext) {
        return askChatbot(userMessage, conversationContext,
                "Hiện tại chưa có dữ liệu tour/hotel trong hệ thống. Hãy trả lời dựa trên kiến thức chung về du lịch Việt Nam.");
    }

    private String buildChatbotPrompt(String userMessage, String conversationContext, String dbContext) {
        StringBuilder sb = new StringBuilder();
        sb.append("Bạn là trợ lý du lịch AI của nền tảng Tourista Studio.\n");
        sb.append("Nền tảng cho phép đặt tour du lịch và khách sạn tại Việt Nam.\n\n");

        // DB context
        if (dbContext != null && !dbContext.isBlank()) {
            sb.append("=== DỮ LIỆU TỪ HỆ THỐNG ===\n");
            sb.append(dbContext);
            sb.append("\n\n");
        }

        // Conversation history
        if (conversationContext != null && !conversationContext.isBlank()) {
            sb.append("=== LỊCH SỬ HỘI THOẠI GẦN ĐÂY ===\n");
            sb.append(conversationContext);
            sb.append("\n\n");
        }

        // Current question
        sb.append("=== CÂU HỎI HIỆN TẠI ===\n");
        sb.append(userMessage);
        sb.append("\n\n");

        sb.append("YÊU CẦU BẮT BUỘC:\n");
        sb.append("1. TRẢ LỜI TỰ NHIÊN: Như đang chat với bạn bè, không phải đọc báo cáo\n");
        sb.append("2. DÙNG EMOJI: 🏖️ biển, 🏨 khách sạn, 🍜 ẩm thực, ✈️ di chuyển, ⭐ đánh giá, 👨‍👩‍👧‍👦 gia đình\n");
        sb.append("3. TRÍCH DẪN CỤ THỂ: Tên tour, giá, rating từ DB nếu có (VD: 'Tour Mùa Hè Xanh 4.8★ chỉ từ 2.5tr')\n");
        sb.append("4. GỢI Ý KHÁCH SẠN KÈM: Khi hỏi địa điểm → luôn đề cập khách sạn gần đó (VD: 'Tại Đà Nẵng có khách sạn ABC 4★ từ 800k/đêm')\n");
        sb.append("5. SO SÁNH RÕ RÀNG: Khi user hỏi so sánh → dùng bảng, bullet points\n");
        sb.append("6. FILTER ĐA ĐIỀU KIỆN: Khi user hỏi 'khách sạn có bể bơi + gần biển + dưới 1tr' → liệt kê thỏa điều kiện\n");
        sb.append("7. TRẢ LỜI NGẮN: Dưới 300 từ, tập trung vào câu hỏi\n");
        sb.append("8. KHÔNG BỊA THÔNG TIN: Không hinvent giá, tên, địa chỉ nếu không có trong DB\n");
        sb.append("9. GỢI Ý HÀNH ĐỘNG: Kết thúc bằng 1 câu hướng dẫn cụ thể (VD: 'Gửi mình mã booking để kiểm tra nhé!')\n");
        sb.append("10. VỚI CÂU HỎI LẠ: Trả lời dựa trên kiến thức du lịch Việt Nam, không bảo là mình không biết\n\n");

        sb.append("VÍ DỤ CÁCH TRẢ LỜI:\n");
        sb.append("❓ 'Đà Nẵng vs Nha Trang đi đâu vui hơn?'\n");
        sb.append("✅ 'Hai nơi đều xinh nhưng khác nhau nè! 🏖️ Đà Nẵng: hiện đại, nhiều cầu rồng, Bà Nà Hills. Nha Trang: yên tĩnh hơn, lặn biển đẹp. Bạn thích sôi động hay chill?'\n\n");

        sb.append("❓ 'Khách sạn gần biển có bể bơi giá rẻ'\n");
        sb.append("✅ 'Mình tìm được vài khách sạn phù hợp: [A] 3★ gần biển Mỹ Khê 450k/đêm, [B] 4★ có bể bơi view biển 680k/đêm. Bạn muốn chọn cái nào?'\n\n");

        sb.append("❓ 'Đà Nẵng ăn gì ngon?'\n");
        sb.append("✅ 'Đà Nẵng có Mì Quảng bà Mạnh nổi tiếng 35k/tô, Bánh Xèo Gánh 25k/cái, Hải Sản Nem Nướng Bà Đào. Ăn 4 bữa no say chỉ tốn 200-300k thôi! 🍜'\n\n");

        sb.append("LƯU Ý QUAN TRỌNG:\n");
        sb.append("- Nếu DB có tour/hotel phù hợp → GỢI Ý CỤ THỂ kèm giá\n");
        sb.append("- Nếu user chưa cung cấp đủ thông tin → HỎI THÊM 1 câu rõ ràng\n");
        sb.append("- Nếu không có data phù hợp → Trả lời kiến thức chung + gợi ý hành động\n");
        sb.append("- Nếu user hỏi về booking cụ thể → Yêu cầu mã TRS-\n");
        sb.append("- Luôn thể hiện SỰ NHIỆT TÌNH, như đang giúp bạn thân chọn tour vậy! 😊\n");

        return sb.toString();
    }

    // ============================================================
    // PRIVATE HELPERS
    // ============================================================

    private String composeContent(String userMessage, String conversationContext) {
        if (conversationContext == null || conversationContext.isBlank()) {
            return userMessage;
        }
        return "Ngữ cảnh hội thoại gần đây:\n" + conversationContext + "\n\nCâu hỏi hiện tại:\n" + userMessage;
    }

    private String buildRequestBody(String content) {
        return """
                {
                  "model": "%s",
                  "messages": [
                    {
                      "role": "system",
                      "content": "Ban la tro ly du lich AI cua nen tang Tourista Studio. Tra loi ngan gon, thân thiên, dung emoji phu hop. Chi tra loi ve du lich, tour, khach san, diem den Viet Nam."
                    },
                    {
                      "role": "user",
                      "content": "%s"
                    }
                  ],
                  "max_tokens": %d,
                  "temperature": 0.5
                }
                """.formatted(model, escapeJson(content), maxTokens);
    }

    private String parseOpenAIResponse(String responseBody) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = mapper.readTree(responseBody);

            // Standard OpenAI format: choices[0].message.content
            com.fasterxml.jackson.databind.JsonNode choices = root.path("choices");
            if (choices.isArray() && !choices.isEmpty()) {
                com.fasterxml.jackson.databind.JsonNode message = choices.get(0).path("message");
                String content = message.path("content").asText("").trim();
                if (!content.isBlank()) return content;

                // Gemini-style format: choices[0].text
                String text = choices.get(0).path("text").asText("").trim();
                if (!text.isBlank()) return text;
            }

            // Alternative: choices[0].delta.content (streaming-like)
            if (choices.isArray() && !choices.isEmpty()) {
                String deltaContent = choices.get(0).path("delta").path("content").asText("").trim();
                if (!deltaContent.isBlank()) return deltaContent;
            }

            // Beeknoee/Gemini alternative: root.text or root.output
            String rootText = root.path("text").asText("").trim();
            if (!rootText.isBlank()) return rootText;

            String rootOutput = root.path("output").asText("").trim();
            if (!rootOutput.isBlank()) return rootOutput;

            // Beeknoee sometimes returns content in root.response or root.result
            String rootResponse = root.path("response").asText("").trim();
            if (!rootResponse.isBlank()) return rootResponse;

            String rootResult = root.path("result").asText("").trim();
            if (!rootResult.isBlank()) return rootResult;

            // Log full response for debugging if all paths failed
            log.warn("AiService: No content found in response. Body: {}",
                    responseBody.length() > 500 ? responseBody.substring(0, 500) : responseBody);
            return null;
        } catch (Exception ex) {
            log.warn("AiService: Parse response failed — {}", ex.getMessage());
            return null;
        }
    }

    private String escapeJson(String text) {
        if (text == null) return "";
        return text
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
