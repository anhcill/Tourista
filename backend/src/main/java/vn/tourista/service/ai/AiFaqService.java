package vn.tourista.service.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

/**
 * AI FAQ Service - xử lý FAQ keyword matching
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiFaqService {

    private static final Pattern WORD_SPLIT = Pattern.compile("\\s+");
    
    private final AiFaqData faqData;

    /**
     * Tìm câu trả lời FAQ phù hợp
     */
    public String findMatchingAnswer(String input) {
        if (input == null || input.isBlank()) return null;
        
        String normalized = normalizeInput(input);
        
        for (FaqRule rule : faqData.getRules()) {
            if (containsAny(normalized, rule.keywords())) {
                return rule.answer();
            }
        }
        return null;
    }

    /**
     * Lấy default answer
     */
    public String getDefaultAnswer() {
        return faqData.getDefaultAnswer();
    }

    // ----- Private -----
    
    private String normalizeInput(String text) {
        if (text == null) return "";
        String normalized = text.toLowerCase().trim();
        normalized = java.text.Normalizer.normalize(normalized, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "").replace('đ', 'd');
        return normalized.replaceAll("\\s+", " ").trim();
    }

    private boolean containsAny(String text, List<String> keywords) {
        for (String kw : keywords) {
            if (text.contains(kw)) return true;
        }
        return false;
    }

    // ----- FAQ Data Record -----
    public record FaqRule(List<String> keywords, String answer) {}
}
