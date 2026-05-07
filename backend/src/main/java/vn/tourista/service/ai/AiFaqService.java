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
        if (text == null || text.isBlank() || keywords == null || keywords.isEmpty()) {
            return false;
        }
        for (String kw : keywords) {
            if (kw == null || kw.isBlank()) continue;
            // Use word boundary for short keywords (<=3 chars) to avoid false matches
            if (kw.length() <= 3) {
                if (matchesWholeWord(text, kw)) return true;
            } else {
                if (text.contains(kw)) return true;
            }
        }
        return false;
    }

    private boolean matchesWholeWord(String text, String word) {
        // Match word boundaries: space, start/end of string, punctuation
        String pattern = "(?<=[\\s,.!?;:'\"-]|^)" + Pattern.quote(word) + "(?=[\\s,.!?;:'\"-]|$)";
        return Pattern.compile(pattern, Pattern.CASE_INSENSITIVE).matcher(text).find();
    }

    // ----- FAQ Data Record -----
    public record FaqRule(List<String> keywords, String answer) {}
}
