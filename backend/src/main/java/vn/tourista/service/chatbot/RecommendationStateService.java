package vn.tourista.service.chatbot;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.tourista.entity.Conversation;
import vn.tourista.entity.SessionRecommendationState;
import vn.tourista.repository.ConversationRepository;
import vn.tourista.repository.SessionRecommendationStateRepository;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service quản lý trạng thái slot-filling cho luồng gợi ý tour.
 *
 * Lưu trạng thái (budget, travelers, city, duration) vào DB để:
 * - Tồn tại qua server restart
 * - Hỗ trợ multi-instance deployment
 * - Khôi phục context khi user quay lại sau vài phút
 *
 * TTL: 20 phút không hoạt động → coi như expired.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RecommendationStateService {

    private static final int TIMEOUT_MINUTES = 20;

    private final SessionRecommendationStateRepository recommendationStateRepository;
    private final ConversationRepository conversationRepository;
    private final ChatbotNlpService nlpService;

    public ChatbotNlpService getNlpService() { return nlpService; }

    /**
     * Trạng thái slot-filling cho tour recommendation.
     */
    public record RecommendationState(
            Integer budgetVnd,
            Integer travelers,
            String cityQuery,
            String cityDisplay,
            Integer maxDurationDays,
            LocalDateTime updatedAt
    ) {}

    /**
     * Lưu trạng thái slot-filling vào DB (upsert).
     */
    public void saveState(Long conversationId, RecommendationState state) {
        SessionRecommendationState entity = recommendationStateRepository
                .findByConversationId(conversationId)
                .orElseGet(() -> {
                    Conversation conv = conversationRepository.findById(conversationId).orElse(null);
                    if (conv == null) return null;
                    return SessionRecommendationState.builder()
                            .conversation(conv)
                            .build();
                });

        if (entity == null) return;

        entity.setBudgetVnd(state.budgetVnd());
        entity.setTravelers(state.travelers());
        entity.setCityQuery(state.cityQuery());
        entity.setCityDisplay(state.cityDisplay());
        entity.setMaxDurationDays(state.maxDurationDays());
        recommendationStateRepository.save(entity);
    }

    /**
     * Load trạng thái slot-filling từ DB.
     * Trả về null nếu không tìm thấy hoặc đã expired.
     */
    public RecommendationState loadState(Long conversationId) {
        return recommendationStateRepository.findByConversationId(conversationId)
                .filter(e -> !e.isExpired())
                .map(e -> new RecommendationState(
                        e.getBudgetVnd(),
                        e.getTravelers(),
                        e.getCityQuery(),
                        e.getCityDisplay(),
                        e.getMaxDurationDays(),
                        e.getUpdatedAt()))
                .orElse(null);
    }

    /**
     * Xóa trạng thái recommendation (khi user cancel/exit).
     */
    public void clearState(Long conversationId) {
        recommendationStateRepository.deleteByConversationId(conversationId);
    }

    /**
     * Kiểm tra conversation có active recommendation không.
     */
    public boolean hasActiveRecommendation(Long conversationId) {
        RecommendationState state = loadState(conversationId);
        if (state == null) {
            return false;
        }

        // Kiểm tra timeout
        if (state.updatedAt().isBefore(LocalDateTime.now().minusMinutes(TIMEOUT_MINUTES))) {
            clearState(conversationId);
            return false;
        }

        return true;
    }

    /**
     * Tạo RecommendationState mới với thời gian hiện tại.
     */
    public RecommendationState createState(Integer budgetVnd, Integer travelers,
                                          String cityQuery, String cityDisplay,
                                          Integer maxDurationDays) {
        return new RecommendationState(budgetVnd, travelers, cityQuery, cityDisplay,
                maxDurationDays, LocalDateTime.now());
    }

    /**
     * Merge trạng thái hiện tại với giá trị mới (partial update).
     */
    public RecommendationState mergeState(RecommendationState current, Integer budgetVnd,
                                         Integer travelers, String cityQuery, String cityDisplay,
                                         Integer maxDurationDays) {
        return new RecommendationState(
                budgetVnd != null ? budgetVnd : (current != null ? current.budgetVnd() : null),
                travelers != null ? travelers : (current != null ? current.travelers() : null),
                cityQuery != null ? cityQuery : (current != null ? current.cityQuery() : null),
                cityDisplay != null ? cityDisplay : (current != null ? current.cityDisplay() : null),
                maxDurationDays != null ? maxDurationDays : (current != null ? current.maxDurationDays() : null),
                LocalDateTime.now()
        );
    }

    // ============================================================
    // HOTEL RECOMMENDATION STATE
    // ============================================================

    /**
     * Trạng thái slot-filling cho hotel recommendation.
     */
    public record HotelRecommendationState(
            Integer budgetVnd,
            Integer rooms,
            Integer guests,
            String cityQuery,
            String cityDisplay,
            Integer checkInDays,
            Integer starRating,
            String amenityFilter,
            LocalDateTime updatedAt
    ) {}

    /**
     * Tạo HotelRecommendationState mới với thời gian hiện tại.
     */
    public HotelRecommendationState createHotelState(Integer budgetVnd, Integer rooms,
                                                     Integer guests, String cityQuery,
                                                     String cityDisplay, Integer checkInDays,
                                                     Integer starRating, String amenityFilter) {
        return new HotelRecommendationState(budgetVnd, rooms, guests, cityQuery, cityDisplay,
                checkInDays, starRating, amenityFilter, LocalDateTime.now());
    }
}
