package vn.tourista.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import vn.tourista.dto.response.FaqResponse;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Service cung cấp FAQ dựa trên context:
 * - HOTEL: FAQ liên quan đến khách sạn (thanh toán, hủy, tiện nghi...)
 * - TOUR: FAQ liên quan đến tour (lịch trình, khởi hành, bao gồm...)
 * - GENERAL: FAQ chung của nền tảng
 *
 * Dữ liệu gốc từ chatbot-faq.json, được phân loại theo category.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FaqService {

    private static final String FAQ_RESOURCE = "chatbot-faq.json";

    private final ObjectMapper objectMapper;
    private final GeminiService geminiService;
    private volatile List<FaqEntry> cachedFaqs = List.of();

    @jakarta.annotation.PostConstruct
    public void init() {
        loadFaqs();
    }

    private void loadFaqs() {
        try (InputStream stream = new ClassPathResource(FAQ_RESOURCE).getInputStream()) {
            FaqRoot root = objectMapper.readValue(stream, FaqRoot.class);
            if (root != null && root.rules() != null) {
                List<FaqEntry> loaded = new ArrayList<>();
                for (int i = 0; i < root.rules().size(); i++) {
                    FaqRule rule = root.rules().get(i);
                    if (rule == null || rule.answer() == null || rule.answer().isBlank()) continue;

                    String category = inferCategory(rule);
                    loaded.add(new FaqEntry(
                            "faq-" + i,
                            extractQuestionFromAnswer(rule.answer()),
                            rule.answer().trim(),
                            category));
                }
                cachedFaqs = List.copyOf(loaded);
                log.info("FaqService: loaded {} FAQ entries", cachedFaqs.size());
            }
        } catch (Exception ex) {
            log.warn("FaqService: cannot load FAQ from {} — using defaults", FAQ_RESOURCE, ex);
            cachedFaqs = buildDefaultFaqs();
        }
    }

    /**
     * Lấy FAQ theo context.
     * @param context: "HOTEL" | "TOUR" | "GENERAL" | null (trả về tất cả)
     */
    public List<FaqResponse> getFaqs(String context) {
        if (context == null || context.isBlank() || "ALL".equalsIgnoreCase(context)) {
            return cachedFaqs.stream()
                    .map(e -> FaqResponse.builder()
                            .id(e.id).question(e.question).answer(e.answer).category(e.category).build())
                    .toList();
        }

        String ctx = context.toUpperCase(Locale.ROOT);
        return cachedFaqs.stream()
                .filter(e -> ctx.equals(e.category))
                .map(e -> FaqResponse.builder()
                        .id(e.id).question(e.question).answer(e.answer).category(e.category).build())
                .toList();
    }

    /**
     * Hỏi Gemini trả lời câu hỏi tùy ý về context cho trước.
     */
    public String askGemini(String question, String context, String conversationContext) {
        if (!geminiService.isEnabled()) {
            return null;
        }

        String enhancedQuestion = buildEnhancedQuestion(question, context);
        try {
            String answer = geminiService.ask(enhancedQuestion, conversationContext);
            if (answer != null && !answer.isBlank()) {
                return "🤖 " + answer;
            }
        } catch (Exception ex) {
            log.warn("FaqService: Gemini ask failed — {}", ex.getMessage());
        }

        return null;
    }

    /**
     * Tìm câu trả lời gần nhất từ FAQ cache (fallback khi Gemini không khả dụng).
     */
    public String findClosestFaqAnswer(String question, String context) {
        String lower = question.toLowerCase(Locale.ROOT);
        String ctx = context != null && !context.isBlank() ? context.toUpperCase(Locale.ROOT) : null;

        return cachedFaqs.stream()
                .filter(e -> ctx == null || ctx.equals(e.category) || "GENERAL".equals(e.category))
                .filter(e -> matchesQuestion(lower, e.question.toLowerCase(Locale.ROOT)))
                .findFirst()
                .map(e -> e.answer)
                .orElseGet(() -> buildFallbackAnswer());
    }

    private boolean matchesQuestion(String userQuestion, String faqQuestion) {
        if (userQuestion.contains(faqQuestion) || faqQuestion.contains(userQuestion)) {
            return true;
        }
        String[] words = userQuestion.split("\\s+");
        for (String w : words) {
            if (w.length() > 3 && faqQuestion.contains(w)) {
                return true;
            }
        }
        return false;
    }

    private String buildEnhancedQuestion(String question, String context) {
        if (question == null) return "";
        String hint = switch (context == null ? "" : context.toUpperCase(Locale.ROOT)) {
            case "HOTEL" -> "[Ve khach san] ";
            case "TOUR" -> "[Ve tour du lich] ";
            default -> "";
        };
        return hint + question;
    }

    private String extractQuestionFromAnswer(String answer) {
        if (answer == null || answer.isBlank()) return "";
        String firstLine = answer.split("\n")[0];
        return firstLine.replaceAll("^[^:]+:\\s*", "").trim();
    }

    private String inferCategory(FaqRule rule) {
        String a = rule.answer().toLowerCase(Locale.ROOT);
        if (a.contains("thanh toan") || a.contains("vnpay") || a.contains("hoan tien")
                || a.contains("huy") || a.contains("khach san") || a.contains("phong")
                || a.contains("check-in") || a.contains("check-out")) {
            return "HOTEL";
        }
        if (a.contains("tour") || a.contains("khoi hanh") || a.contains("lichtrinh")
                || a.contains("bao gom") || a.contains("nguoi lon") || a.contains("tre em")) {
            return "TOUR";
        }
        return "GENERAL";
    }

    private String buildFallbackAnswer() {
        return "Minh chua co thong tin chinh xac cho cau nay.\n\n"
                + "Ban co the:\n"
                + "- Nhan **Chat voi chu khach san** de hoi truc tiep\n"
                + "- Tra cuu ma **TRS-YYYYMMDD-XXXXXX** de xem chi tiet\n"
                + "- Lien he hotline: 1900 xxxx (7:00 - 22:00)";
    }

    private List<FaqEntry> buildDefaultFaqs() {
        return List.of(
                new FaqEntry("def-1", "Chinh sach huy",
                        "Huỷ trước 7 ngày: Hoàn 100% tiền cọc\nHuỷ trước 3-6 ngày: Hoàn 50% tổng tiền",
                        "GENERAL"),
                new FaqEntry("def-2", "Thanh toan",
                        "VNPay: ATM nội địa, Visa/Mastercard, QR\nChuyển khoản theo hướng dẫn qua email sau khi đặt",
                        "GENERAL")
        );
    }

    private record FaqEntry(String id, String question, String answer, String category) {}

    private record FaqRoot(List<FaqRule> rules, String defaultAnswer) {}

    private record FaqRule(String answer) {}
}
