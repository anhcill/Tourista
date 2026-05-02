package vn.tourista.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.tourista.entity.Tour;
import vn.tourista.repository.TourRepository;
import vn.tourista.service.AiService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service gợi ý tour — kết hợp DB query + AI enrichment.
 *
 * Luồng:
 * 1. Query DB theo budget/travelers/city/duration → lấy danh sách tour phù hợp
 * 2. Nếu DB trả < 3 kết quả → dùng Gemini đề xuất điểm đến thay thế
 * 3. Enrich mỗi tour card với travel tips từ Gemini (nếu Gemini enabled)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TourRecommendationService {

    private final TourRepository tourRepository;
    private final AiService aiService;

    private static final int DEFAULT_LIMIT = 3;
    private static final BigDecimal MIN_PRICE_PER_PERSON = new BigDecimal("400000");

    /**
     * Kết quả gợi ý tour — gồm tour IDs từ DB + travel tips từ AI.
     */
    public record RecommendationResult(
            List<Long> tourIds,
            List<TourEnrichment> enrichments,
            boolean hasAiSuggestions,
            String aiDestinationSuggestion
    ) {}

    /**
     * Travel tip enrichment cho mỗi tour.
     */
    public record TourEnrichment(
            Long tourId,
            String travelTip,
            String bestTimeToVisit,
            String packingHint
    ) {}

    /**
     * Tìm tour phù hợp từ DB.
     */
    public List<Long> findMatchingTourIds(
            Integer travelers,
            BigDecimal perPersonBudget,
            String cityQuery,
            Integer maxDurationDays,
            LocalDate today,
            int limit) {

        if (travelers == null || travelers <= 0) {
            return List.of();
        }

        if (perPersonBudget != null
                && perPersonBudget.compareTo(MIN_PRICE_PER_PERSON) < 0) {
            return List.of();
        }

        var pageRequest = limit > 0
                ? org.springframework.data.domain.PageRequest.of(0, limit)
                : org.springframework.data.domain.PageRequest.of(0, DEFAULT_LIMIT);

        return tourRepository.findBotRecommendedTourIds(
                travelers, perPersonBudget, cityQuery, maxDurationDays, today, pageRequest);
    }

    /**
     * Gợi ý điểm đến thay thế khi không tìm được tour phù hợp.
     * Dùng Gemini để phân tích và đề xuất.
     */
    public String suggestAlternativeDestinations(
            String cityQuery,
            Integer budgetVnd,
            Integer travelers) {

        if (!aiService.isEnabled()) {
            return buildDefaultAlternativeSuggestion(cityQuery);
        }

        try {
            String prompt = buildDestinationPrompt(cityQuery, budgetVnd, travelers);
            String answer = aiService.ask(prompt, null);
            if (answer != null && !answer.isBlank()) {
                return "🔮 **Gợi ý điểm đến thay thế:**\n" + answer;
            }
        } catch (Exception ex) {
            log.warn("TourRecommendationService: Gemini destination suggestion failed — {}", ex.getMessage());
        }

        return buildDefaultAlternativeSuggestion(cityQuery);
    }

    /**
     * Tạo travel tips cho một danh sách tour bằng Gemini.
     * Chỉ gọi khi có Gemini key và số lượng tour <= 5 để tránh rate limit.
     */
    public List<TourEnrichment> enrichToursWithAiTips(List<Long> tourIds) {
        if (!aiService.isEnabled() || tourIds == null || tourIds.isEmpty() || tourIds.size() > 5) {
            return List.of();
        }

        try {
            Map<Long, Tour> tourMap = tourRepository.findAllById(tourIds).stream()
                    .collect(Collectors.toMap(Tour::getId, t -> t));

            return tourIds.stream()
                    .filter(tourMap::containsKey)
                    .map(id -> {
                        Tour t = tourMap.get(id);
                        return generateTourEnrichment(t);
                    })
                    .toList();
        } catch (Exception ex) {
            log.warn("TourRecommendationService: AI enrichment failed — {}", ex.getMessage());
            return List.of();
        }
    }

    /**
     * Tạo enrichment cho một tour cụ thể.
     */
    private TourEnrichment generateTourEnrichment(Tour tour) {
        if (!aiService.isEnabled()) {
            return new TourEnrichment(tour.getId(), null, null, null);
        }

        try {
            String prompt = String.format("""
                    Ban la chuyen gia tu van du lich. Cho tour sau:
                    - Ten: %s
                    - Thanh pho: %s
                    - Gia/nguoi: %s VND
                    - So ngay: %dN%dD

                    Tra loi NGAN GON (toi da 3 cau) ve:
                    1. Thoi diem tot nhat de di (mua nao, thang nao)
                    2. 3 vat dung can mang theo (ngan gon)
                    3. Loi khuyen nho khi den

                    Chi tra loi theo format:
                    THOI DIEM: ...
                    VAT DUNG: ...
                    LOI KHUYEN: ...
                    """,
                    tour.getTitle() != null ? tour.getTitle() : "Tour",
                    tour.getCity() != null ? tour.getCity().getNameVi() : "Viet Nam",
                    tour.getPricePerAdult() != null ? tour.getPricePerAdult().toString() : "0",
                    tour.getDurationDays() != null ? tour.getDurationDays() : 1,
                    tour.getDurationNights() != null ? tour.getDurationNights() : 0);

            String answer = aiService.ask(prompt, null);
            if (answer == null || answer.isBlank()) {
                return new TourEnrichment(tour.getId(), null, null, null);
            }

            String tip = parseEnrichmentSection(answer, "LOI KHUYEN");
            String bestTime = parseEnrichmentSection(answer, "THOI DIEM");
            String packing = parseEnrichmentSection(answer, "VAT DUNG");

            return new TourEnrichment(tour.getId(), tip, bestTime, packing);
        } catch (Exception ex) {
            log.debug("generateTourEnrichment failed for tour {} — {}", tour.getId(), ex.getMessage());
            return new TourEnrichment(tour.getId(), null, null, null);
        }
    }

    private String parseEnrichmentSection(String answer, String section) {
        if (answer == null || section == null) return null;
        String upper = answer.toUpperCase();
        int start = upper.indexOf(section);
        if (start < 0) return null;

        int colon = answer.indexOf(':', start);
        if (colon < 0) return null;
        colon++;

        int nextSection = Integer.MAX_VALUE;
        for (String s : List.of("THOI DIEM:", "VAT DUNG:", "LOI KHUYEN:")) {
            int idx = upper.indexOf(s, colon);
            if (idx > 0 && idx < nextSection) nextSection = idx;
        }

        String result = answer.substring(colon, nextSection == Integer.MAX_VALUE ? answer.length() : nextSection).trim();
        return result.isBlank() ? null : result;
    }

    private String buildDestinationPrompt(String cityQuery, Integer budgetVnd, Integer travelers) {
        StringBuilder sb = new StringBuilder();
        sb.append("Ban la chuyen gia du lich Viet Nam.\n");
        if (cityQuery != null && !cityQuery.isBlank()) {
            sb.append("Khach hang dang quan tam den ").append(cityQuery).append(" nhung chua tim duoc tour phu hop.\n");
        }
        if (budgetVnd != null) {
            sb.append("Ngan sach: ").append(formatVnd(budgetVnd)).append("\n");
        }
        if (travelers != null) {
            sb.append("So nguoi: ").append(travelers).append("\n");
        }
        sb.append("""
                Hay goi y 3 diem den thay the gan giong voi dia danh cua nguoi dung (cung vung mien).
                Moi goi y chi can ten thanh pho/tinh + giai thich ngan (1 cau) tai sao phu hop.
                Tra loi NGAN GON, chi noi dung, khong canh tranh voi Booking.com.
                """);
        return sb.toString();
    }

    private String buildDefaultAlternativeSuggestion(String cityQuery) {
        if (cityQuery == null || cityQuery.isBlank()) {
            return "Ban co the thu:\n"
                    + "- **Da Nang** — bien, np bua sang dep\n"
                    + "- **Nha Trang** — bien, de dat ve\n"
                    + "- **Phu Quoc** — dao, nghi duong\n"
                    + "Hoac nhac **xoa loc** de tim tour rong hon nhe!";
        }

        return "Vung **" + cityQuery + "** hien chua co tour trong muc gia nay.\n"
                + "Ban co the thu:\n"
                + "- Tang ngan sach them 20-30%\n"
                + "- Hoac nhac **xoa loc** de tim rong hon";
    }

    private String formatVnd(long amount) {
        return String.format("%,d", amount).replace(',', '.') + " VND";
    }
}
