package vn.tourista.service.chatbot;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service xử lý FAQ matching cho chatbot.
 * Được dùng trước khi gọi AI để phản hồi nhanh (fast path).
 *
 * Nạp FAQ rules từ thư mục faq/, thực hiện keyword matching.
 * Tách FAQ theo category: general, tours, destinations, cuisine...
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatbotFaqService {

    private static final String FAQ_RESOURCE_DIR = "faq/";
    private static final String FAQ_FILE_PATTERN = "chatbot-faq-*.json";
    private static final String DEFAULT_FAQ_ANSWER = """
            🤔 Mình chưa hiểu rõ yêu cầu của bạn.

            Bạn có thể thử:
            • 🔍 **Tra cứu booking:** gửi mã TRS-YYYYMMDD-XXXXXX
            • 🗺️ **Gợi ý tour:** nhắn ngân sách + số người (ví dụ: "gợi ý tour 8tr cho 2 người")
            • 📋 **Hỏi về:** hủy/hoàn tiền, thanh toán, thời tiết, kinh nghiệm du lịch

            Hoặc chọn một trong các gợi ý nhanh bên dưới nhé! 👇
            """;
    private static final Pattern WORD_SPLIT = Pattern.compile("\\s+");

    private final org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
    private volatile List<FaqRule> faqRules = List.of();
    private volatile String defaultFaqAnswer = DEFAULT_FAQ_ANSWER;

    @jakarta.annotation.PostConstruct
    public void loadFaqRules() {
        List<FaqRule> loaded = new ArrayList<>();
        try {
            // Load all FAQ files from faq/ directory
            var resourcePatternResolver = new org.springframework.core.io.support.PathMatchingResourcePatternResolver();
            var resources = resourcePatternResolver.getResources("classpath:" + FAQ_RESOURCE_DIR + FAQ_FILE_PATTERN);

            log.info("ChatbotFaqService: found {} FAQ files to load", resources.length);

            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();

            for (var resource : resources) {
                try (InputStream stream = resource.getInputStream()) {
                    String filename = resource.getFilename();
                    log.debug("ChatbotFaqService: loading FAQ from {}", filename);

                    FaqConfig config = mapper.readValue(stream, FaqConfig.class);
                    if (config != null && config.rules() != null) {
                        for (FaqItem item : config.rules()) {
                            if (item == null || item.answer() == null || item.answer().isBlank()) continue;
                            List<String> keywords = new ArrayList<>();
                            if (item.keywords() != null) {
                                for (String kw : item.keywords()) {
                                    if (kw != null && !kw.isBlank()) {
                                        keywords.add(kw.toLowerCase().trim());
                                    }
                                }
                            }
                            if (!keywords.isEmpty()) {
                                loaded.add(new FaqRule(List.copyOf(keywords), item.answer().trim()));
                            }
                        }
                    }
                } catch (Exception e) {
                    log.warn("ChatbotFaqService: failed to load FAQ from {}: {}", resource.getFilename(), e.getMessage());
                }
            }
        } catch (Exception ex) {
            log.warn("ChatbotFaqService: cannot load FAQ from directory. Using fallback rules.", ex);
        }

        if (loaded.isEmpty()) {
            loaded = buildFallbackFaqRules();
        }
        faqRules = List.copyOf(loaded);
        log.info("ChatbotFaqService: loaded {} FAQ rules from {} files", faqRules.size());
    }

    /**
     * Tìm câu trả lời FAQ phù hợp với input của user.
     * Trả về null nếu không khớp rule nào.
     */
    public String findMatchingAnswer(String input) {
        if (input == null || input.isBlank()) {
            return null;
        }

        String canonical = canonicalize(normalizeInput(input));

        for (FaqRule rule : faqRules) {
            List<String> canonicalKeywords = rule.keywords().stream()
                    .map(this::canonicalize)
                    .toList();
            if (containsAny(canonical, canonicalKeywords)) {
                return rule.answer();
            }
        }
        return null;
    }

    public String getDefaultAnswer() {
        return defaultFaqAnswer;
    }

    /**
     * Kiểm tra input có chứa booking code hay không.
     */
    public String extractBookingCode(String input) {
        if (input == null) return null;
        Pattern pattern = Pattern.compile("\\bTRS-\\d{8}-[A-Z0-9]{6}\\b", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(input);
        return matcher.find() ? matcher.group().toUpperCase() : null;
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private boolean containsAny(String text, List<String> keywords) {
        if (text == null || text.isBlank() || keywords == null || keywords.isEmpty()) {
            return false;
        }
        for (String kw : keywords) {
            if (text.contains(kw)) return true;
        }
        return false;
    }

    private String normalizeInput(String text) {
        return text == null ? "" : text.toLowerCase().trim();
    }

    private String canonicalize(String text) {
        if (text == null || text.isBlank()) return "";
        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .toLowerCase();
        return normalized.replaceAll("\\s+", " ").trim();
    }

    private List<FaqRule> buildFallbackFaqRules() {
        return List.of(
                new FaqRule(
                        List.of("huy", "cancel", "hoan tien", "refund", "hủy", "hoàn tiền"),
                        """
                                📋 **Chinh sach huy & hoan tien Tourista Studio:**

                                • Huy truoc 7 ngay: Hoan 100% tien coc
                                • Huy truoc 3-6 ngay: Hoan 50% tong tien
                                • Huy trong 3 ngay: Co the phat sinh phi theo dieu kien doi tac

                                Vao Tai khoan > Lich su Booking de thao tac nhanh."""),
                new FaqRule(
                        List.of("thanh toan", "payment", "vnpay", "chuyen khoan", "trả tiền", "thanh toán"),
                        """
                                💳 **Thanh toan tren Tourista Studio:**

                                • VNPay: ATM noi dia, Visa/Mastercard, QR
                                • Chuyen khoan: co huong dan qua email sau khi dat

                                Neu thanh toan loi, gui ma booking cho support@tourista.vn de duoc xu ly nhanh."""),
                new FaqRule(
                        List.of("tra cuu", "xem booking", "ma dat", "đặt chỗ", "lịch trình", "tour cua toi"),
                        "🔍 **Tra cuu booking:**\n\nGui ma dat cho minh theo dinh dang **TRS-YYYYMMDD-XXXXXX** de xem chi tiet lich trinh."),
                new FaqRule(
                        List.of("lien he", "hotline", "email", "ho tro", "support", "hỗ trợ"),
                        """
                                📞 **Lien he ho tro Tourista Studio:**

                                • Hotline: 1900 xxxx (7:00 - 22:00)
                                • Email: support@tourista.vn
                                • Chat voi chu tour/hotel tai trang chi tiet dich vu."""),
                new FaqRule(
                        List.of("chao", "hello", "hi", "xin chao", "xin chào"),
                        "👋 Chao ban! Minh la tro ly Tourista Studio.\n\nMinh co the giup ban tra cuu booking, giai dap chinh sach va ket noi doi tac du lich.")
        );
    }

    // ── Records for JSON parsing ──────────────────────────────────────────────

    private record FaqConfig(List<FaqItem> rules, String defaultAnswer, String category, String description) {}
    private record FaqItem(List<String> keywords, String answer) {}
    private record FaqRule(List<String> keywords, String answer) {}
}
