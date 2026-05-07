package vn.tourista.service.ai;

import org.springframework.stereotype.Component;

import java.util.List;
import java.util.regex.Pattern;

/**
 * Intent Detection Service - phân loại intent của user input
 * 
 * Ưu tiên xử lý:
 * 1. GREETING - chào hỏi
 * 2. BOOKING_LOOKUP - tra cứu booking
 * 3. HOTEL_RECOMMENDATION - gợi ý hotel
 * 4. TOUR_RECOMMENDATION - gợi ý tour
 * 5. FAQ - câu hỏi thường gặp
 * 6. CHITCHAT - trò chuyện thông thường
 * 7. UNKNOWN - không xác định
 */
@Component
public class IntentDetectionService {

    // ============================================================
    // INTENT TYPES
    // ============================================================
    
    public enum Intent {
        GREETING,           // Chào hỏi
        BOOKING_LOOKUP,     // Tra cứu booking
        TOUR_RECOMMENDATION,// Gợi ý tour
        HOTEL_RECOMMENDATION,// Gợi ý hotel
        BOTH_RECOMMENDATION,// Cả tour + hotel
        FAQ,                // Câu hỏi thường gặp
        COMPLAINT,          // Phàn nàn
        PRAISE,             // Khen ngợi
        CHITCHAT,           // Trò chuyện
        CANCEL,             // Hủy bỏ
        UNKNOWN             // Không xác định
    }

    // ============================================================
    // KEYWORD PATTERNS
    // ============================================================
    
    private static final List<KeywordPattern> GREETING_PATTERNS = List.of(
            new KeywordPattern(List.of("chào", "hello", "hi", "xin chào", "hey", "chào bạn", "alo"), Intent.GREETING),
            new KeywordPattern(List.of("tạm biệt", "goodbye", "bye", "hẹn gặp lại", "tạm thôi"), Intent.CANCEL)
    );

    private static final List<KeywordPattern> BOOKING_PATTERNS = List.of(
            new KeywordPattern(List.of("trs-", "mã đặt", "tra cứu", "xem booking", "lich su", "đặt chỗ"), Intent.BOOKING_LOOKUP),
            new KeywordPattern(List.of("hủy đặt", "hoàn tiền", "refund", "cancel booking", "hủy tour"), Intent.CANCEL)
    );

    private static final List<KeywordPattern> HOTEL_PATTERNS = List.of(
            new KeywordPattern(List.of("khách sạn", "khach san", "hotel", "chỗ ở", "cho o", "nơi nghỉ", "nghỉ dưỡng", "resort", "homestay", "hostel", "tìm phòng", "thuê phòng"), Intent.HOTEL_RECOMMENDATION)
    );

    private static final List<KeywordPattern> TOUR_PATTERNS = List.of(
            new KeywordPattern(List.of("tour", "du lịch", "du lich", "đi chơi", "gợi ý tour", "tìm tour", "goi y", "đi đâu", "chuyến đi", "trip", "vacation", "leisure"), Intent.TOUR_RECOMMENDATION)
    );

    private static final List<KeywordPattern> FAQ_PATTERNS = List.of(
            new KeywordPattern(List.of("chính sách", "hủy", "hoàn tiền", "thanh toán", "vnpay", "chuyển khoản", "paypal"), Intent.FAQ),
            new KeywordPattern(List.of("liên hệ", "hotline", "email", "hỗ trợ", "support"), Intent.FAQ),
            new KeywordPattern(List.of("thời tiết", "weather", "mùa nào", "nên đi mùa nào"), Intent.FAQ),
            new KeywordPattern(List.of("visa", "hộ chiếu", "passport", "làm hộ chiếu"), Intent.FAQ)
    );

    private static final List<KeywordPattern> EMOTION_PATTERNS = List.of(
            new KeywordPattern(List.of("cảm ơn", "cam on", "thanks", "thank", "tốt", "hay", "wow", "tuyệt", "tuyệt vời", "perfect", "excellent"), Intent.PRAISE),
            new KeywordPattern(List.of("tệ", "bad", "失望", "không hài lòng", "phàn nàn", "khiếu nại", "sao lại", "tại sao", "làm ăn", "dở", "dở", " không được"), Intent.COMPLAINT)
    );

    // Booking code pattern: TRS-YYYYMMDD-XXXXXX
    private static final Pattern BOOKING_CODE_PATTERN = Pattern.compile(
            "TRS-\\d{8}-[A-Z0-9]{6}", Pattern.CASE_INSENSITIVE);

    // ============================================================
    // MAIN DETECTION METHOD
    // ============================================================

    /**
     * Phát hiện intent từ input text
     */
    public Intent detect(String input) {
        if (input == null || input.isBlank()) {
            return Intent.UNKNOWN;
        }

        String normalized = normalizeInput(input);
        String lower = input.toLowerCase();

        // 1. Check booking code first (highest priority)
        if (BOOKING_CODE_PATTERN.matcher(input).find()) {
            return Intent.BOOKING_LOOKUP;
        }

        // 2. Check greeting
        if (matchesAny(normalized, GREETING_PATTERNS)) {
            if (isCancelIntent(normalized)) return Intent.CANCEL;
            return Intent.GREETING;
        }

        // 3. Check booking-related
        if (matchesAny(normalized, BOOKING_PATTERNS)) {
            if (isCancelIntent(normalized)) return Intent.CANCEL;
            return Intent.BOOKING_LOOKUP;
        }

        // 4. Check hotel + tour (hybrid)
        boolean hasHotel = matchesAny(normalized, HOTEL_PATTERNS);
        boolean hasTour = matchesAny(normalized, TOUR_PATTERNS);
        
        if (hasHotel && hasTour) {
            return Intent.BOTH_RECOMMENDATION;
        }
        if (hasHotel) {
            return Intent.HOTEL_RECOMMENDATION;
        }
        if (hasTour) {
            return Intent.TOUR_RECOMMENDATION;
        }

        // 5. Check FAQ
        if (matchesAny(normalized, FAQ_PATTERNS)) {
            return Intent.FAQ;
        }

        // 6. Check emotions
        if (matchesAny(normalized, EMOTION_PATTERNS)) {
            if (isComplaint(normalized)) return Intent.COMPLAINT;
            return Intent.PRAISE;
        }

        // 7. Check cancel intent
        if (isCancelIntent(normalized)) {
            return Intent.CANCEL;
        }

        // 8. Check if it's a question (likely FAQ or chat)
        if (isQuestion(normalized)) {
            return Intent.CHITCHAT;
        }

        return Intent.UNKNOWN;
    }

    /**
     * Lấy confidence score cho intent
     */
    public double getConfidence(String input, Intent intent) {
        if (input == null || input.isBlank()) return 0.0;
        
        String normalized = normalizeInput(input);
        double baseConfidence = 0.5;

        // Tăng confidence nếu keyword xuất hiện nhiều lần
        String[] words = normalized.split("\\s+");
        long keywordCount = 0;
        for (String word : words) {
            if (normalized.contains(word)) keywordCount++;
        }

        return Math.min(1.0, baseConfidence + (keywordCount * 0.05));
    }

    // ============================================================
    // PRIVATE HELPERS
    // ============================================================

    private boolean matchesAny(String normalized, List<KeywordPattern> patterns) {
        for (KeywordPattern pattern : patterns) {
            for (String keyword : pattern.keywords) {
                if (normalized.contains(keyword)) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean isCancelIntent(String normalized) {
        return normalized.contains("dừng") || normalized.contains("thoát") || 
               normalized.contains("thôi") || normalized.contains("cancel") ||
               normalized.contains("hủy") || normalized.contains("exit") ||
               normalized.contains("bỏ qua");
    }

    private boolean isComplaint(String normalized) {
        return normalized.contains("tệ") || normalized.contains("dở") || 
               normalized.contains("không hài lòng") || normalized.contains("phàn nàn") ||
               normalized.contains("sao lại") || normalized.contains("làm ăn") ||
               normalized.contains(" không được");
    }

    private boolean isQuestion(String normalized) {
        return normalized.contains("?") || normalized.contains("sao") ||
               normalized.contains("như thế nào") || normalized.contains("như nào") ||
               normalized.contains("là gì") || normalized.contains("ở đâu") ||
               normalized.contains("bao lâu") || normalized.contains("bao nhiêu") ||
               normalized.contains("có gì") || normalized.contains("ở đâu");
    }

    private String normalizeInput(String text) {
        if (text == null) return "";
        String normalized = text.toLowerCase().trim();
        normalized = normalized
                .replace("áàảãạăắằẳẵặâấầẩẫậ", "a")
                .replace("éèẻẽẹêếềểễệ", "e")
                .replace("íìỉĩị", "i")
                .replace("óòỏõọôốồổỗộơớờởỡợ", "o")
                .replace("úùủũụưứừửữự", "u")
                .replace("ýỳỷỹỵ", "y")
                .replace("đ", "d");
        return normalized.replaceAll("\\s+", " ").trim();
    }

    // ============================================================
    // INNER CLASS
    // ============================================================
    
    private record KeywordPattern(List<String> keywords, Intent intent) {}
}
