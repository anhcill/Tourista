package vn.tourista.service.chatbot;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service phân tích input của user để trích xuất:
 * - Budget (tiền VND)
 * - Số người đi
 * - Thành phố / điểm đến
 * - Số ngày
 *
 * Tất cả các regex và logic NLP nằm ở đây — dễ test, dễ mở rộng.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatbotNlpService {

    private static final Pattern BUDGET_MILLION_PATTERN = Pattern.compile(
            "(\\d+(?:[\\.,]\\d+)?)\\s*(tr|trieu|triệu|m)\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern BUDGET_THOUSAND_PATTERN = Pattern.compile(
            "(\\d+(?:[\\.,]\\d+)?)\\s*(k|nghin|nghìn)\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern BUDGET_RAW_PATTERN = Pattern.compile(
            "\\b(\\d{1,3}(?:[\\.,]\\d{3}){1,3}|\\d{6,11})\\b");
    private static final Pattern TRAVELERS_PATTERN = Pattern.compile(
            "\\b(\\d{1,2})\\s*(nguoi|người|khach|khách|adult|adults)\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern GROUP_PATTERN = Pattern.compile(
            "\\b(nhom|nhóm|team)\\s*(\\d{1,2})\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern TRAVELERS_FOR_PATTERN = Pattern.compile(
            "\\bcho\\s*(\\d{1,2})\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern PAX_PATTERN = Pattern.compile(
            "\\b(\\d{1,2})\\s*(pax|person|persons)\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern DURATION_PATTERN = Pattern.compile(
            "\\b(\\d{1,2})\\s*(ngay|ngày|dem|đêm)\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern DURATION_TRIP_PATTERN = Pattern.compile(
            "\\b(\\d{1,2})\\s*n\\s*\\d{1,2}\\s*[đd]\\b",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern SINGLE_TRAVELER_PATTERN = Pattern.compile(
            "\\b(mot|một)\\s*(nguoi|người|nguoi|người|mình|minh)\\b|"
            + "\\b(mot|một)\\s*(nguoi|người|nguoi|người)\\s*(di|đi)?\\s*(mình|minh|mot|một)?\\b|"
            + "\\b(toi|tôi)\\s*(di|đi)\\s*(mot|một|mot minh|mình một|một mình|người)?\\s*(minh|mình|mot|một)?\\b|"
            + "\\b(di|đi)\\s*(mot|một)\\s*(mình|minh|nguoi|người)\\b|"
            + "\\b(mot|một)\\s*(minh|mình)\\b",
            Pattern.CASE_INSENSITIVE);

    private static final List<CityAlias> CITY_ALIASES = List.of(
            new CityAlias("da nang", "Da Nang", List.of("da nang", "đà nẵng")),
            new CityAlias("da lat", "Da Lat", List.of("da lat", "đà lạt")),
            new CityAlias("phu quoc", "Phu Quoc", List.of("phu quoc", "phú quốc")),
            new CityAlias("nha trang", "Nha Trang", List.of("nha trang", "nha trang")),
            new CityAlias("ha noi", "Ha Noi", List.of("ha noi", "hà nội")),
            new CityAlias("sapa", "Sa Pa", List.of("sapa", "sa pa")),
            new CityAlias("hue", "Hue", List.of("hue", "huế")),
            new CityAlias("hoi an", "Hoi An", List.of("hoi an", "hội an")));

    /**
     * Trích xuất budget (VND) từ text.
     */
    public Integer parseBudgetVnd(String inputText) {
        if (inputText == null || inputText.isBlank()) {
            return null;
        }

        Matcher millionMatcher = BUDGET_MILLION_PATTERN.matcher(inputText);
        if (millionMatcher.find()) {
            Double value = parseDecimalToken(millionMatcher.group(1));
            if (value == null) return null;
            long budget = Math.round(value * 1_000_000L);
            return normalizeBudgetValue(budget);
        }

        Matcher thousandMatcher = BUDGET_THOUSAND_PATTERN.matcher(inputText);
        if (thousandMatcher.find()) {
            Double value = parseDecimalToken(thousandMatcher.group(1));
            if (value == null) return null;
            long budget = Math.round(value * 1_000L);
            return normalizeBudgetValue(budget);
        }

        Matcher rawMatcher = BUDGET_RAW_PATTERN.matcher(inputText);
        if (rawMatcher.find()) {
            String digits = rawMatcher.group(1).replaceAll("[^0-9]", "");
            if (!digits.isBlank()) {
                try {
                    long budget = Long.parseLong(digits);
                    return normalizeBudgetValue(budget);
                } catch (NumberFormatException ignored) {
                    return null;
                }
            }
        }

        return null;
    }

    /**
     * Trích xuất số người đi từ text.
     */
    public Integer parseTravelers(String inputText, boolean allowLooseNumber) {
        if (inputText == null || inputText.isBlank()) {
            return null;
        }

        Matcher travelersMatcher = TRAVELERS_PATTERN.matcher(inputText);
        if (travelersMatcher.find()) {
            return normalizeTravelersValue(travelersMatcher.group(1));
        }

        Matcher groupMatcher = GROUP_PATTERN.matcher(inputText);
        if (groupMatcher.find()) {
            return normalizeTravelersValue(groupMatcher.group(2));
        }

        Matcher forMatcher = TRAVELERS_FOR_PATTERN.matcher(inputText);
        if (forMatcher.find()) {
            return normalizeTravelersValue(forMatcher.group(1));
        }

        Matcher paxMatcher = PAX_PATTERN.matcher(inputText);
        if (paxMatcher.find()) {
            return normalizeTravelersValue(paxMatcher.group(1));
        }

        // "một người", "tôi đi một mình", "đi một mình"
        Matcher singleMatcher = SINGLE_TRAVELER_PATTERN.matcher(inputText);
        if (singleMatcher.find()) {
            return 1;
        }

        if (allowLooseNumber) {
            String trimmed = inputText.trim();
            if (trimmed.matches("\\d{1,2}")) {
                return normalizeTravelersValue(trimmed);
            }
        }

        return null;
    }

    /**
     * Trích xuất thành phố từ text.
     */
    public CityAlias parseCityAlias(String canonicalInput) {
        if (canonicalInput == null || canonicalInput.isBlank()) {
            return null;
        }

        for (CityAlias cityAlias : CITY_ALIASES) {
            List<String> canonicalKeywords = cityAlias.keywords().stream()
                    .map(this::canonicalize)
                    .toList();
            if (containsAny(canonicalInput, canonicalKeywords)) {
                return cityAlias;
            }
        }
        return null;
    }

    /**
     * Trích xuất số ngày tối đa từ text.
     */
    public Integer parseMaxDurationDays(String inputText) {
        if (inputText == null || inputText.isBlank()) {
            return null;
        }

        Matcher tripMatcher = DURATION_TRIP_PATTERN.matcher(inputText);
        if (tripMatcher.find()) {
            return normalizeDurationValue(tripMatcher.group(1));
        }

        Matcher durationMatcher = DURATION_PATTERN.matcher(inputText);
        if (durationMatcher.find()) {
            return normalizeDurationValue(durationMatcher.group(1));
        }

        return null;
    }

    /**
     * Kiểm tra text có chứa booking code không.
     */
    public boolean containsBookingCode(String inputText) {
        if (inputText == null) return false;
        Pattern pattern = Pattern.compile("\\bTRS-\\d{8}-[A-Z0-9]{5,6}\\b", Pattern.CASE_INSENSITIVE);
        return pattern.matcher(inputText).find();
    }

    /**
     * Trích xuất booking code TRS-YYYYMMDD-XXXXXX từ text.
     */
    public String extractBookingCode(String inputText) {
        if (inputText == null) return null;
        Pattern pattern = Pattern.compile("\\b(TRS-\\d{8}-[A-Z0-9]{5,6})\\b", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(inputText);
        if (matcher.find()) {
            return matcher.group(1).toUpperCase();
        }
        return null;
    }

    /**
     * Kiểm tra có phải intent gợi ý tour không.
     */
    public boolean isRecommendationIntent(String canonicalInput) {
        boolean hasSuggestIntent = containsAny(canonicalInput,
                List.of("goi y", "goi i", "tu van", "de xuat", "suggest"));
        boolean hasTourContext = containsAny(canonicalInput,
                List.of("tour", "du lich", "lich trinh", "di dau", "bien", "nghi duong"));
        boolean directBudgetIntent = containsAny(canonicalInput,
                List.of("ngan sach", "bao nhieu nguoi", "cho 2", "cho 3", "cho 4"));
        boolean directRefineIntent = containsAny(canonicalInput,
                List.of("loc", "diem den", "so ngay"));

        return (hasSuggestIntent && hasTourContext) || directBudgetIntent || (directRefineIntent && hasTourContext);
    }

    /**
     * Kiểm tra có phải intent refine (lọc thêm) không.
     */
    public boolean isRecommendationFollowUpIntent(String inputText, String canonicalInput) {
        boolean hasRefineKeyword = containsAny(canonicalInput,
                List.of("loc", "xoa loc", "bo loc", "reset loc", "diem den", "so ngay", "ngay", "dem"));
        boolean hasCityHint = parseCityAlias(canonicalInput) != null;
        boolean hasDurationHint = parseMaxDurationDays(inputText) != null;

        return hasRefineKeyword || hasCityHint || hasDurationHint;
    }

    /**
     * Kiểm tra có phải intent "tour hot" không.
     */
    public boolean isHotTourIntent(String canonicalInput) {
        return containsAny(canonicalInput, List.of(
                "tour hot", "tour noi bat", "pho bien", "bestseller",
                "nhieu nguoi dat", "top tour", "tours hot"));
    }

    /**
     * Kiểm tra có phải intent cancel/exit recommendation không.
     */
    public boolean isCancelRecommendationIntent(String canonicalInput) {
        return containsAny(canonicalInput, List.of("dung", "thoi", "thoat", "exit", "cancel", "huy"));
    }

    /**
     * Kiểm tra có phải intent reset filter không.
     */
    public boolean isResetFilterIntent(String canonicalInput) {
        return containsAny(canonicalInput, List.of("xoa loc", "bo loc", "reset loc"));
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private Integer normalizeDurationValue(String raw) {
        try {
            int value = Integer.parseInt(raw);
            if (value < 1 || value > 14) {
                return null;
            }
            return value;
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private Integer normalizeTravelersValue(String raw) {
        try {
            int value = Integer.parseInt(raw);
            if (value < 1 || value > 20) {
                return null;
            }
            return value;
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private Integer normalizeBudgetValue(long budget) {
        if (budget < 300_000L || budget > 1_500_000_000L) {
            return null;
        }
        return (int) budget;
    }

    private Double parseDecimalToken(String raw) {
        try {
            String normalized = raw.trim().replace(" ", "");
            if (normalized.contains(",") && normalized.contains(".")) {
                normalized = normalized.replace(".", "").replace(",", ".");
            } else if (normalized.contains(",")) {
                normalized = normalized.replace(",", ".");
            }
            return Double.parseDouble(normalized);
        } catch (Exception ex) {
            return null;
        }
    }

    /**
     * Chuẩn hóa text: lowercase + trim.
     * Tách riêng khỏi canonicalize (loại bỏ dấu) để giữ nguyên text gốc khi cần.
     */
    public String normalize(String text) {
        return text == null ? "" : text.toLowerCase().trim();
    }

    private boolean containsAny(String text, List<String> keywords) {
        if (text == null || text.isBlank() || keywords == null || keywords.isEmpty()) {
            return false;
        }
        for (String kw : keywords) {
            if (text.contains(kw)) return true;
        }
        return false;
    }

    public String canonicalize(String text) {
        if (text == null || text.isBlank()) return "";
        String normalized = java.text.Normalizer.normalize(text, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd')
                .replace('Đ', 'D')
                .toLowerCase();
        return normalized.replaceAll("\\s+", " ").trim();
    }

    public record CityAlias(String queryValue, String displayValue, List<String> keywords) {}
}
