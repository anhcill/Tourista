package vn.tourista.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * GeminiService — Gọi Gemini Flash API để trả lời thông minh khi FAQ không
 * khớp.
 *
 * - Dùng java.net.http (Java 11+, không cần thêm dependency)
 * - System prompt đặt context Tourista, chỉ trả lời về du lịch
 * - Nếu API key rỗng hoặc lỗi → trả về null để BotService dùng default FAQ
 * answer
 */
@Slf4j
@Service
public class GeminiService {

    private static final String SYSTEM_PROMPT = """
            Bạn là Tourista Studio Travel Buddy — trợ lý du lịch AI thân thiện của nền tảng Tourista Studio.
            Tourista chuyên cung cấp dịch vụ đặt tour và khách sạn tại Việt Nam.

            QUY TẮC TRẢ LỜI:
            1. Chỉ trả lời các câu hỏi liên quan đến: du lịch, tour, khách sạn, điểm đến, kinh nghiệm đi lại, thời tiết, thủ tục visa/giấy tờ, tiết kiệm chi phí du lịch.
            2. Nếu user hỏi ngoài phạm vi du lịch → từ chối lịch sự và hướng về chủ đề du lịch.
            3. KHÔNG bịa giá cụ thể, KHÔNG hứa hẹn điều nền tảng chưa xác nhận.
            4. Khuyến khích user cung cấp ngân sách + số người để gợi ý tour cụ thể hơn.
            5. Trả lời bằng tiếng Việt, ngắn gọn (tối đa 5-6 câu hoặc 1 danh sách ngắn), thân thiện, dùng emoji phù hợp.
            6. Không nhắc đến các nền tảng cạnh tranh như Booking.com, Agoda, Traveloka, Airbnb.
            """;

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.api-url:https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent}")
    private String apiUrl;

    @Value("${gemini.timeout-seconds:10}")
    private int timeoutSeconds;

    @Value("${gemini.max-output-tokens:400}")
    private int maxOutputTokens;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Gọi Gemini API với câu hỏi của user.
     *
     * @param userMessage Tin nhắn gốc của user
     * @return Câu trả lời từ Gemini, hoặc null nếu API key chưa cấu hình / lỗi
     */
    public String ask(String userMessage) {
        return ask(userMessage, null);
    }

    /**
     * Gọi Gemini API với ngữ cảnh hội thoại gần nhất để trả lời bám mạch hơn.
     */
    public String ask(String userMessage, String conversationContext) {
        if (apiKey == null || apiKey.isBlank()) {
            log.debug("GeminiService: API key chưa cấu hình, bỏ qua AI fallback.");
            return null;
        }

        try {
            String prompt = composePrompt(userMessage, conversationContext);
            String requestBody = buildRequestBody(prompt);
            String url = apiUrl + "?key=" + apiKey;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            // Use async send to not block the thread
            CompletableFuture<HttpResponse<String>> future = httpClient.sendAsync(request, HttpResponse.BodyHandlers.ofString());
            HttpResponse<String> response = future.get(timeoutSeconds + 1, TimeUnit.SECONDS);

            if (response.statusCode() == 200) {
                return parseResponse(response.body());
            } else {
                log.warn("GeminiService: API trả về HTTP {}. Body: {}", response.statusCode(),
                        response.body().length() > 200 ? response.body().substring(0, 200) : response.body());
                return null;
            }

        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            log.warn("GeminiService: Request bị interrupt.");
            return null;
        } catch (Exception ex) {
            log.warn("GeminiService: Lỗi khi gọi API — {}", ex.getMessage());
            return null;
        }
    }

    /**
     * Build JSON body cho Gemini generateContent API.
     * Dùng "system_instruction" để nhúng system prompt.
     */
    private String buildRequestBody(String userMessage) {
        // Escape ký tự đặc biệt trong JSON
        String escapedSystem = escapeJson(SYSTEM_PROMPT);
        String escapedUser = escapeJson(userMessage);

        return """
                {
                  "system_instruction": {
                    "parts": [{ "text": "%s" }]
                  },
                  "contents": [
                    {
                      "role": "user",
                      "parts": [{ "text": "%s" }]
                    }
                  ],
                  "generationConfig": {
                    "maxOutputTokens": %d,
                    "temperature": 0.7,
                    "topP": 0.9
                  }
                }
                """.formatted(escapedSystem, escapedUser, maxOutputTokens);
    }

    private String composePrompt(String userMessage, String conversationContext) {
        if (conversationContext == null || conversationContext.isBlank()) {
            return userMessage;
        }

        return """
                Ngữ cảnh hội thoại gần đây:
                %s

                Câu hỏi hiện tại của khách:
                %s
                """.formatted(conversationContext, userMessage);
    }

    /**
     * Parse response JSON từ Gemini API.
     * Cấu trúc: candidates[0].content.parts[0].text
     */
    private String parseResponse(String responseBody) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode candidates = root.path("candidates");

        if (candidates.isEmpty() || !candidates.isArray()) {
            log.warn("GeminiService: Response không có candidates. Body: {}",
                    responseBody.length() > 300 ? responseBody.substring(0, 300) : responseBody);
            return null;
        }

        JsonNode firstCandidate = candidates.get(0);

        // Kiểm tra finish reason
        String finishReason = firstCandidate.path("finishReason").asText("");
        if ("SAFETY".equals(finishReason)) {
            log.info("GeminiService: Response bị chặn vì lý do an toàn.");
            return null;
        }

        JsonNode text = firstCandidate.path("content").path("parts").get(0).path("text");
        String result = text.asText("").trim();

        return result.isBlank() ? null : result;
    }

    /**
     * Escape các ký tự đặc biệt trong JSON string.
     */
    private String escapeJson(String text) {
        if (text == null)
            return "";
        return text
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    /**
     * Kiểm tra xem Gemini có đang được cấu hình và sẵn sàng không.
     */
    public boolean isEnabled() {
        return apiKey != null && !apiKey.isBlank();
    }
}
