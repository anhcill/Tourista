package vn.tourista.service.chatbot;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import vn.tourista.dto.response.TourCardItem;
import vn.tourista.entity.Tour;
import vn.tourista.repository.CityRepository;
import vn.tourista.repository.HotelRepository;
import vn.tourista.repository.TourImageRepository;
import vn.tourista.repository.TourRepository;
import vn.tourista.service.AiService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

/**
 * Service query dữ liệu tour cho chatbot.
 *
 * Tách riêng để dễ test và tái sử dụng.
 * Những gì cần: query DB, build cards, tạo context cho AI.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TourRecommendationQueryService {

    private final TourRepository tourRepository;
    private final TourImageRepository tourImageRepository;
    private final CityRepository cityRepository;
    private final HotelRepository hotelRepository;
    private final AiService aiService;

    /**
     * Tìm tour phù hợp theo budget/travelers/city/duration.
     */
    public List<Long> findRecommendedTourIds(
            Integer travelers,
            BigDecimal perPersonBudget,
            String cityQuery,
            Integer maxDurationDays,
            LocalDate today,
            PageRequest pageRequest) {

        if (travelers == null || travelers <= 0) {
            return List.of();
        }

        if (perPersonBudget != null && perPersonBudget.compareTo(BigDecimal.valueOf(400_000)) < 0) {
            return List.of();
        }

        return tourRepository.findBotRecommendedTourIds(
                travelers, perPersonBudget, cityQuery, maxDurationDays, today, pageRequest);
    }

    /**
     * Tìm tour hot (is_featured, active, có slot).
     */
    public List<Long> findHotTourIds(PageRequest pageRequest) {
        return tourRepository.findHotTourIds(LocalDate.now(), pageRequest);
    }

    /**
     * Build danh sách TourCardItem từ list ID, kèm ảnh bìa.
     * Fix N+1 bằng batch fetch.
     */
    public List<TourCardItem> buildTourCards(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }

        // Batch fetch all tours in one query
        Map<Long, Tour> tourMap = new HashMap<>();
        for (Tour t : tourRepository.findAllById(ids)) {
            tourMap.put(t.getId(), t);
        }

        // Batch fetch all cover images in one query (fix N+1)
        Map<Long, String> imageMap = new HashMap<>();
        List<Object[]> imageRows = tourImageRepository.findCoverImagesByTourIds(ids);
        for (Object[] row : imageRows) {
            if (row != null && row.length > 1 && row[0] != null && row[1] != null) {
                imageMap.put(((Number) row[0]).longValue(), (String) row[1]);
            }
        }

        List<TourCardItem> cards = new ArrayList<>();
        for (Long id : ids) {
            Tour tour = tourMap.get(id);
            if (tour == null || !Boolean.TRUE.equals(tour.getIsActive()))
                continue;

            String coverUrl = imageMap.get(id);
            String cityVi = tour.getCity() != null ? tour.getCity().getNameVi() : "Việt Nam";

            cards.add(TourCardItem.builder()
                    .id(tour.getId())
                    .title(tour.getTitle())
                    .slug(tour.getSlug())
                    .cityVi(cityVi)
                    .durationDays(tour.getDurationDays())
                    .durationNights(tour.getDurationNights())
                    .pricePerAdult(tour.getPricePerAdult())
                    .avgRating(tour.getAvgRating())
                    .reviewCount(tour.getReviewCount())
                    .imageUrl(coverUrl)
                    .build());
        }
        return cards;
    }

    /**
     * Gợi ý điểm đến thay thế khi không tìm được tour phù hợp.
     */
    public String suggestAlternativeDestinations(String cityQuery, Integer budgetVnd, Integer travelers) {
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
            log.warn("TourRecommendationQueryService: destination suggestion failed — {}", ex.getMessage());
        }

        return buildDefaultAlternativeSuggestion(cityQuery);
    }

    /**
     * Xây dựng context từ DB thật để gửi cho AI chatbot.
     */
    public String buildDbContextForChatbot(String inputText, String canonical) {
        StringBuilder ctx = new StringBuilder();

        // Cities
        try {
            List<Object[]> cities = cityRepository.findTrendingCities(5);
            if (cities != null && !cities.isEmpty()) {
                ctx.append("Các thành phố du lịch phổ biến: ");
                for (int i = 0; i < Math.min(5, cities.size()); i++) {
                    Object[] row = cities.get(i);
                    String nameVi = row[1] != null ? row[1].toString() : "";
                    String nameEn = row[2] != null ? row[2].toString() : "";
                    int hotels = row[3] != null ? ((Number) row[3]).intValue() : 0;
                    int tours = row[4] != null ? ((Number) row[4]).intValue() : 0;
                    if (i > 0) ctx.append("; ");
                    ctx.append(nameVi).append("/").append(nameEn)
                            .append(" (").append(hotels).append(" khách sạn, ")
                            .append(tours).append(" tour)");
                }
                ctx.append(".\n");
            }
        } catch (Exception e) {
            log.debug("Could not load cities for chatbot: {}", e.getMessage());
        }

        // Tours
        if (containsAny(canonical, List.of("tour", "du lich", "di dau", "goi y", "goi i", "de xuat"))) {
            try {
                List<Long> tourIds = tourRepository.findActiveTourIds(PageRequest.of(0, 5));
                if (tourIds != null && !tourIds.isEmpty()) {
                    List<Tour> tours = tourRepository.findAllById(tourIds);
                    ctx.append("Tour đang hoạt động: ");
                    for (int i = 0; i < tours.size(); i++) {
                        Tour t = tours.get(i);
                        if (i > 0) ctx.append("; ");
                        ctx.append("- \"").append(t.getTitle()).append("\"")
                                .append(" giá từ ").append(formatVnd(t.getPricePerAdult().longValue()))
                                .append("/người lớn");
                        if (t.getAvgRating() != null && t.getAvgRating().compareTo(BigDecimal.ZERO) > 0) {
                            ctx.append(", rating ").append(t.getAvgRating()).append("★");
                        }
                        ctx.append(", ").append(t.getDurationDays()).append(" ngày ")
                                .append(t.getDurationNights()).append(" đêm");
                    }
                    ctx.append(".\n");
                }
            } catch (Exception e) {
                log.debug("Could not load tours for chatbot: {}", e.getMessage());
            }
        }

        // Hotels
        ChatbotNlpService.CityAlias detectedCity = null;
        boolean asksAboutHotel = containsAny(canonical, List.of("khach san", "hotel", "noi that", "nghi duong", "住宿", "cho o", "noi nghi"));
        boolean asksAboutPlace = containsAny(canonical, List.of("di dau", "den dau", "o dau", "nghi o dau", "dia diem", "diem den"));

        if (asksAboutHotel || asksAboutPlace) {
            try {
                List<Object[]> hotelRows;
                if (detectedCity != null) {
                    hotelRows = hotelRepository.findPopularHotelsByCityEn(detectedCity.queryValue(), 3);
                } else {
                    hotelRows = List.of();
                }

                if (hotelRows != null && !hotelRows.isEmpty()) {
                    ctx.append("Khách sạn nổi bật: ");
                    for (int i = 0; i < hotelRows.size(); i++) {
                        Object[] row = hotelRows.get(i);
                        if (i > 0) ctx.append("; ");
                        ctx.append("- \"").append(row[1] != null ? row[1] : "")
                                .append("\" (").append(row[2] != null ? row[2] : "").append("★)")
                                .append(", rating ").append(row[4] != null ? row[4] : "N/A").append("★");
                        if (row[6] != null) {
                            long price = ((Number) row[6]).longValue();
                            ctx.append(", từ ").append(formatVnd(price)).append("/đêm");
                        }
                    }
                    ctx.append(".\n");
                } else if (asksAboutHotel) {
                    ctx.append("Hiện chưa có khách sạn nào trong hệ thống cho khu vực này.\n");
                }
            } catch (Exception e) {
                log.debug("Could not load hotels for chatbot: {}", e.getMessage());
            }
        }

        // Booking hint
        if (containsAny(canonical, List.of("booking", "dat cho", "tour cua toi", "lich su"))) {
            ctx.append("Để tra cứu booking, hãy gửi mã theo định dạng TRS-YYYYMMDD-XXXXX (ví dụ: TRS-20260503-ABC12).\n");
        }

        if (ctx.isEmpty()) {
            return "Hệ thống Tourista Studio có tour du lịch và khách sạn tại nhiều thành phố Việt Nam. Bạn có thể hỏi về tour, khách sạn, điểm đến hoặc gửi mã booking để tra cứu.";
        }

        return ctx.toString();
    }

    // ── Private helpers ──────────────────────────────────────────────────────

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

    private boolean containsAny(String text, List<String> keywords) {
        if (text == null || text.isBlank() || keywords == null || keywords.isEmpty()) {
            return false;
        }
        for (String kw : keywords) {
            if (text.contains(kw)) return true;
        }
        return false;
    }

    private String formatVnd(long amount) {
        return String.format(Locale.US, "%,d", amount).replace(',', '.') + " VND";
    }
}
