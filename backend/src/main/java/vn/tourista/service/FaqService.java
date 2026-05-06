package vn.tourista.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import vn.tourista.dto.response.FaqResponse;
import vn.tourista.service.chatbot.ChatbotFaqService;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Service cung cấp FAQ dựa trên context cho trang hotel/tour detail.
 *
 * KHÔNG dùng AI — tất cả câu trả lời từ FAQ keyword matching cục bộ.
 *
 * Dùng chung FAQ data từ chatbot-faq.json (thông qua ChatbotFaqService).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class FaqService {

    private static final String FAQ_RESOURCE = "chatbot-faq.json";
    private static final Pattern WORD_SPLIT = Pattern.compile("\\s+");

    private final ObjectMapper objectMapper;
    private final ChatbotFaqService chatbotFaqService;
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
     * Trả lời câu hỏi bằng keyword matching từ FAQ cache.
     * KHÔNG dùng AI.
     */
    public String answerQuestion(String question, String context, String conversationContext) {
        if (question == null || question.isBlank()) {
            return buildFallbackAnswer();
        }

        String normalizedQuestion = normalize(question);
        String ctx = context != null && !context.isBlank() ? context.toUpperCase(Locale.ROOT) : null;

        FaqEntry best = null;
        int bestScore = 0;

        for (FaqEntry entry : cachedFaqs) {
            if (ctx != null && !"GENERAL".equals(ctx)) {
                if (!ctx.equals(entry.category) && !"GENERAL".equals(entry.category)) {
                    continue;
                }
            }

            int score = calculateMatchScore(normalizedQuestion, normalize(entry.question));
            if (score > bestScore) {
                bestScore = score;
                best = entry;
            }
        }

        if (best != null && bestScore >= 2) {
            return best.answer;
        }

        return answerByKeywords(normalizedQuestion, ctx);
    }

    public String findClosestFaqAnswer(String question, String context) {
        return answerQuestion(question, context, null);
    }

    private int calculateMatchScore(String userQuestion, String faqQuestion) {
        if (userQuestion.contains(faqQuestion) || faqQuestion.contains(userQuestion)) {
            return 4;
        }

        String[] userWords = WORD_SPLIT.split(userQuestion);
        String[] faqWords = WORD_SPLIT.split(faqQuestion);

        int score = 0;
        int matchedWords = 0;
        int totalWords = faqWords.length;

        for (String uw : userWords) {
            if (uw.length() < 3) continue;
            for (String fw : faqWords) {
                if (fw.length() < 3) continue;
                if (uw.equals(fw)) {
                    matchedWords++;
                    score += 2;
                } else if (fw.contains(uw) || uw.contains(fw)) {
                    matchedWords++;
                    score += 1;
                }
            }
        }

        if (totalWords > 0 && (double) matchedWords / totalWords > 0.5) {
            score += 2;
        }

        return score;
    }

    private String answerByKeywords(String question, String ctx) {
        if (containsAny(question, List.of(
                "check-in", "checkin", "nhận phòng", "trả phòng", "checkout",
                "hủy", "huỷ", "hoàn tiền", "refund", "huy tour", "hủy tour",
                "thanh toán", "vnpay", "payment", "atm", "qr", "visa",
                "wifi", "điều hòa", "bữa sáng", "ăn sáng", "bãi đỗ", "đỗ xe",
                "tiện nghi", "tiện ích", "hồ bơi", "spa", "gym", "phòng gym",
                "hướng view", "tầng", "giường", "khách sạn", "khach san",
                "địa chỉ", "bản đồ", "chỉ đường", "cách trung tâm"
        ))) {
            return getHotelAnswer(question);
        }

        if (containsAny(question, List.of(
                "lịch trình", "lichtrinh", "ngày", "đêm", "thời gian", "khởi hành",
                "bao gồm", "không bao gồm", "excludes", "includes",
                "hướng dẫn viên", "hdv", "xe", "di chuyển", "transport",
                " vé ", "ve may bay", "máy bay", "khách sạn", "住宿",
                "tre em", "trẻ em", "người lớn", "thanh toán", "đặt cọc",
                "tour", "trip", "hủy", "huỷ", "chuyến đi", "hành trình",
                "điểm đến", "điểm tham quan", "hoạt động", "ăn uống",
                "trang phục", "mang theo", "chuẩn bị", "thời tiết", "mùa"
        ))) {
            return getTourAnswer(question);
        }

        if (containsAny(question, List.of(
                "liên hệ", "hotline", "email", "support", "hỗ trợ", "zalo",
                "tài khoản", "đăng nhập", "đăng ký", "register", "login",
                "mật khẩu", "password", "quên", "reset", "oauth2", "google",
                "visa", "passport", "hộ chiếu", "thị thực", "giấy tờ",
                "bảo hiểm", "insurance", "đổi", "trả", "refund", "hoàn"
        ))) {
            return getGeneralAnswer(question);
        }

        return buildFallbackAnswer();
    }

    private String getHotelAnswer(String question) {
        if (containsAny(question, List.of("hủy", "huy", "huỷ", "hoàn tiền", "cancel", "refund"))) {
            return """
                    📋 **Chính sách hủy & hoàn tiền:**

                    • **Hủy trước 7 ngày** so với ngày nhận phòng: **Hoàn 100%** tiền cọc
                    • **Hủy trước 3–6 ngày**: **Hoàn 50%** tổng tiền
                    • **Hủy trong 3 ngày**: Không hoàn tiền (theo điều kiện của khách sạn)

                    ⚠️ Một số khách sạn có chính sách riêng — kiểm tra email xác nhận hoặc liên hệ chủ khách sạn trực tiếp.
                    """;
        }
        if (containsAny(question, List.of("thanh toán", "vnpay", "payment", "atm", "qr", "visa", "mastercard"))) {
            return """
                    💳 **Thanh toán trên Tourista Studio:**

                    • **VNPay**: ATM nội địa, Visa/Mastercard, QR code
                    • **Chuyển khoản**: theo hướng dẫn trong email xác nhận sau khi đặt

                    ✅ Thanh toán được mã hóa bảo mật qua cổng VNPay.
                    """;
        }
        if (containsAny(question, List.of("check-in", "checkin", "nhận phòng", "trả phòng", "checkout", "giờ"))) {
            return """
                    🕐 **Giờ nhận / trả phòng:**

                    • **Nhận phòng (Check-in)**: thường từ **14:00**
                    • **Trả phòng (Check-out)**: thường trước **12:00**

                    ⚡ Nếu cần nhận sớm hoặc trả muộn, vui lòng liên hệ chủ khách sạn trực tiếp để xác nhận.
                    """;
        }
        if (containsAny(question, List.of("wifi", "điều hòa", "bữa sáng", "ăn sáng", "bãi đỗ", "đỗ xe", "tiện nghi", "tiện ích", "hồ bơi", "spa", "gym"))) {
            return """
                    🛎️ **Tiện nghi khách sạn:**

                    Các tiện nghi phổ biến:
                    • ✅ WiFi miễn phí (nhiều nơi có ở lobby hoặc phòng)
                    • 🌡️ Điều hòa nhiệt độ
                    • 🍳 Bữa sáng (buffet hoặc set menu — kiểm tra chi tiết phòng)
                    • 🅿️ Bãi đỗ xe (miễn phí hoặc có phí)
                    • 🏊 Hồ bơi, Spa, Gym (tùy khách sạn)

                    Liên hệ chủ khách sạn để xác nhận tiện nghi cụ thể.
                    """;
        }
        if (containsAny(question, List.of("địa chỉ", "bản đồ", "chỉ đường", "cách trung tâm", "ở đâu"))) {
            return """
                    📍 **Về địa chỉ khách sạn:**

                    Địa chỉ chi tiết và bản đồ có trong trang chi tiết khách sạn trên Tourista Studio.

                    💡 Mẹo: Copy địa chỉ và dán vào Google Maps để xem đường đi và hình ảnh thực tế.
                    """;
        }
        return """
                🏨 **Về khách sạn này:**

                Bạn có thể xem đầy đủ thông tin: tiện nghi, hình ảnh, đánh giá, chính sách hủy trong trang chi tiết khách sạn.

                Hoặc nhấn **"Chat với chủ khách sạn"** để hỏi trực tiếp!
                """;
    }

    private String getTourAnswer(String question) {
        if (containsAny(question, List.of("lịch trình", "lichtrinh", "ngày", "đêm", "thời gian", "bao gồm"))) {
            return """
                    🗓️ **Về lịch trình tour:**

                    Lịch trình chi tiết từng ngày có trong trang chi tiết tour trên Tourista Studio.

                    Thông tin thường có:
                    • 🕐 Giờ khởi hành và kết thúc
                    • 📍 Điểm tham quan mỗi ngày
                    • 🍽️ Bữa ăn (sáng/trưa/tối)
                    • 🚐 Phương tiện di chuyển
                    • 🏨 Nghỉ ngơi (nếu tour qua đêm)

                    Để xem lịch trình cụ thể, cuộn xuống phần **"Lịch trình chi tiết"** trong trang tour.
                    """;
        }
        if (containsAny(question, List.of("bao gồm", "không bao gồm", "excludes", "includes", "giá", "chi phí"))) {
            return """
                    💰 **Giá tour bao gồm:**

                    ✅ **Thường đã bao gồm:**
                    • Xe du lịch điều hòa
                    • Hướng dẫn viên
                    • Vé vào cửa các điểm tham quan
                    • Bữa ăn (tùy tour)
                    • Khách sạn (nếu tour qua đêm)

                    ❌ **Thường KHÔNG bao gồm:**
                    • Chi tiêu cá nhân
                    • Đồ uống, ăn ngoài bữa ăn
                    • Vé máy bay (trừ tour combo)
                    • Bảo hiểm du lịch (nên mua thêm)

                    Kiểm tra tab **"Bao gồm / Không bao gồm"** trong trang tour để biết chắc.
                    """;
        }
        if (containsAny(question, List.of("hủy", "huy", "huỷ", "hoàn tiền", "cancel", "refund", "đổi"))) {
            return """
                    📋 **Chính sách hủy tour:**

                    • **Hủy trước 7 ngày** so với ngày khởi hành: **Hoàn 100%** tiền cọc
                    • **Hủy trước 3–6 ngày**: **Hoàn 50%** tổng tiền
                    • **Hủy trong 3 ngày**: Không hoàn tiền

                    ⚠️ Mỗi đối tác có thể có điều kiện riêng — kiểm tra trong chi tiết tour hoặc email xác nhận.
                    """;
        }
        if (containsAny(question, List.of("trẻ em", "tre em", "người lớn", "thanh toán", "đặt cọc", "giá", "price"))) {
            return """
                    💳 **Về giá & thanh toán:**

                    • Giá tour hiển thị theo **người lớn**
                    • Trẻ em thường có **giá riêng** (tùy độ tuổi và chiều cao)
                    • **Đặt cọc** để giữ chỗ — số tiền và deadline trong email xác nhận
                    • **Thanh toán** qua VNPay: ATM, Visa, QR code

                    💡 Gửi mã **TRS-YYYYMMDD-XXXXXX** cho mình để tra cứu chi tiết thanh toán của bạn nhé!
                    """;
        }
        if (containsAny(question, List.of("thời tiết", "mùa", "trang phục", "mang theo", "chuẩn bị", "điểm đến"))) {
            return """
                    🌤️ **Mẹo chuẩn bị chuyến đi:**

                    • **Thời tiết**: Kiểm tra dự báo thời tiết tại điểm đến 3–5 ngày trước
                    • **Trang phục**: thoáng mát, mang thêm áo khoác nhẹ (núi/cao nguyên)
                    • **Giày**: giày thể thao thoải mái cho đi bộ nhiều
                    • **Kem chống nắng** — bắt buộc nếu đi biển!
                    • **Thuốc cá nhân** — mang đủ cho cả gia đình
                    • **Tiền mặt** — một số nơi không có ATM

                    Liên hệ chủ tour để được tư vấn cụ thể cho chuyến đi của bạn.
                    """;
        }
        return """
                🗺️ **Về tour này:**

                Bạn có thể xem đầy đủ thông tin: lịch trình, giá, đánh giá, chính sách hủy trong trang chi tiết tour.

                Hoặc nhấn **"Chat với chủ tour"** để hỏi trực tiếp!
                """;
    }

    private String getGeneralAnswer(String question) {
        if (containsAny(question, List.of("liên hệ", "hotline", "hỗ trợ", "zalo", "support"))) {
            return """
                    📞 **Liên hệ hỗ trợ Tourista Studio:**

                    • **Hotline**: 1900 xxxx (7:00 – 22:00, thứ Hai – Chủ Nhật)
                    • **Email**: support@tourista.vn
                    • **Chat**: nhấn nút 💬 ở góc phải màn hình
                    • **Chat trực tiếp** với chủ khách sạn/tour trong trang chi tiết dịch vụ

                    Phản hồi qua email trong vòng 2–4 giờ làm việc.
                    """;
        }
        if (containsAny(question, List.of("visa", "passport", "hộ chiếu", "thị thực", "giấy tờ"))) {
            return """
                    🛂 **Giấy tờ & Visa:**

                    • **Trong nước**: Chỉ cần **CMND/CCCD** hoặc Passport
                    • **Quốc tế**: Kiểm tra yêu cầu visa tại đại sứ quán / lãnh sự quán của nước bạn
                    • **Passport**: Còn hạn ít nhất **6 tháng** tính đến ngày về dự kiến

                    💡 Mình không cập nhật được thông tin visa mới nhất — bạn nên kiểm tra trực tiếp tại website của đại sứ quán.
                    """;
        }
        if (containsAny(question, List.of("bảo hiểm", "insurance", "đổi", "trả", "refund", "hoàn"))) {
            return """
                    🔄 **Đổi / Trả / Hoàn tiền:**

                    • Yêu cầu **hoàn tiền** trong vòng **7 ngày** sau khi hủy dịch vụ (theo chính sách)
                    • **Đổi tour/ngày**: liên hệ chủ tour hoặc hotline càng sớm càng tốt
                    • **Hoàn tiền** qua cùng phương thức thanh toán ban đầu, thường mất **3–7 ngày làm việc**

                    💡 Gửi mã booking **TRS-YYYYMMDD-XXXXXX** để mình hỗ trợ tra cứu nhé!
                    """;
        }
        return """
                ℹ️ **Hỗ trợ Tourista Studio:**

                Mình có thể giúp bạn về:
                • 📋 Tra cứu booking (gửi mã **TRS-YYYYMMDD-XXXXXX**)
                • 💳 Thanh toán & hoàn tiền
                • 🗓️ Lịch trình & thông tin tour/khách sạn
                • 📞 Liên hệ hỗ trợ

                Nhấn **"Chat với chủ tour/khách sạn"** để hỏi trực tiếp!
                """;
    }

    private boolean containsAny(String text, List<String> keywords) {
        for (String kw : keywords) {
            if (text.contains(kw)) return true;
        }
        return false;
    }

    private String normalize(String text) {
        if (text == null) return "";
        return text.toLowerCase()
                .replace("đ", "d").replace("Đ", "d")
                .replaceAll("\\s+", " ").trim();
    }

    private String buildFallbackAnswer() {
        return """
                🤔 Mình chưa tìm được câu trả lời chính xác cho bạn.

                Bạn có thể thử:
                • 📋 Xem **Câu hỏi thường gặp** bên dưới
                • 💬 Nhấn **"Chat với chủ khách sạn/tour"** để hỏi trực tiếp
                • 📞 Gọi hotline: **1900 xxxx** (7:00 – 22:00)
                """;
    }

    private String extractQuestionFromAnswer(String answer) {
        if (answer == null || answer.isBlank()) return "";
        String firstLine = answer.split("\n")[0];
        return firstLine.replaceAll("^[^:]+:\\s*", "").replaceAll("^[^a-zA-Zà-žÀ-Ž]+", "").trim();
    }

    private String inferCategory(FaqRule rule) {
        String a = rule.answer().toLowerCase(Locale.ROOT);
        if (a.contains("thanh toan") || a.contains("vnpay") || a.contains("hoan tien")
                || a.contains("huy") || a.contains("khach san") || a.contains("phong")
                || a.contains("check-in") || a.contains("check-out")
                || a.contains("tien nghi") || a.contains("hồ bơi")) {
            return "HOTEL";
        }
        if (a.contains("tour") || a.contains("khoi hanh") || a.contains("lichtrinh")
                || a.contains("bao gom") || a.contains("nguoi lon") || a.contains("tre em")
                || a.contains("lich trinh") || a.contains("tham quan")) {
            return "TOUR";
        }
        return "GENERAL";
    }

    private List<FaqEntry> buildDefaultFaqs() {
        return List.of(
                new FaqEntry("def-1", "Chính sách hủy",
                        "Hủy trước 7 ngày: Hoàn 100% tiền cọc\nHủy trước 3–6 ngày: Hoàn 50% tổng tiền\nHủy trong 3 ngày: Không hoàn tiền",
                        "GENERAL"),
                new FaqEntry("def-2", "Thanh toán",
                        "VNPay: ATM nội địa, Visa/Mastercard, QR\nChuyển khoản theo hướng dẫn qua email sau khi đặt",
                        "GENERAL"),
                new FaqEntry("def-3", "Liên hệ hỗ trợ",
                        "Hotline: 1900 xxxx (7:00 – 22:00)\nEmail: support@tourista.vn\nChat trực tiếp: nút 💬 góc phải màn hình",
                        "GENERAL")
        );
    }

    private record FaqEntry(String id, String question, String answer, String category) {}
    private record FaqRoot(List<FaqRule> rules, String defaultAnswer) {}
    private record FaqRule(String answer) {}
}
