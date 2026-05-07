package vn.tourista.service.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import vn.tourista.dto.response.ChatMessageResponse;
import vn.tourista.dto.response.HotelCardItem;
import vn.tourista.dto.response.TourCardItem;
import vn.tourista.entity.ChatMessage;
import vn.tourista.repository.HotelRepository;
import vn.tourista.repository.TourImageRepository;
import vn.tourista.repository.TourRepository;
import vn.tourista.service.ChatService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

/**
 * Hybrid Service - gợi ý tour + hotel kết hợp
 * Khi user hỏi về tour → gợi luôn hotel nearby
 * Khi user hỏi về hotel → gợi luôn tour nearby
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class HybridRecommendationService {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final TourRepository tourRepository;
    private final TourImageRepository tourImageRepository;
    private final HotelRepository hotelRepository;
    private final ObjectMapper objectMapper;

    /**
     * Sau khi push tour cards → gợi ý hotel kèm theo
     */
    public void suggestHotelsAfterTour(Long conversationId, String clientEmail, 
                                       String city, Integer budgetVnd) {
        if (city == null) return;
        
        try {
            // Tính budget hotel = budget tour / 3 (cho 1 đêm)
            int hotelBudget = budgetVnd != null ? budgetVnd / 3 : 2_000_000;
            BigDecimal maxPrice = BigDecimal.valueOf(hotelBudget);
            
            List<Long> hotelIds = hotelRepository.findBotRecommendedHotelIds(
                    city, maxPrice, null, BigDecimal.ZERO, 2);
            
            if (hotelIds.isEmpty()) return;
            
            List<HotelCardItem> cards = buildHotelCards(hotelIds);
            
            String intro = "\n🏨 **Gợi ý khách sạn** gần đó (từ " + formatVnd(hotelBudget) + "/đêm):\n";
            pushBotText(conversationId, clientEmail, intro);
            pushHotelCardsMessage(conversationId, clientEmail, cards);
            
        } catch (Exception e) {
            log.debug("Hybrid: Could not suggest hotels after tour: {}", e.getMessage());
        }
    }

    /**
     * Sau khi push hotel cards → gợi ý tour kèm theo
     */
    public void suggestToursAfterHotel(Long conversationId, String clientEmail,
                                       String city, Integer travelers) {
        if (city == null) return;
        
        try {
            int budget = 5_000_000; // Default budget per person
            BigDecimal perPerson = BigDecimal.valueOf(budget);
            int pax = travelers != null ? travelers : 2;
            
            var ids = tourRepository.findBotRecommendedTourIds(
                    pax, perPerson, city, null, LocalDate.now(), 
                    org.springframework.data.domain.PageRequest.of(0, 2));
            
            if (ids.isEmpty()) return;
            
            List<TourCardItem> cards = buildTourCards(ids);
            
            String intro = "\n🗺️ **Gợi ý tour** tại " + city + ":\n";
            pushBotText(conversationId, clientEmail, intro);
            pushTourCardsMessage(conversationId, clientEmail, cards);
            
        } catch (Exception e) {
            log.debug("Hybrid: Could not suggest tours after hotel: {}", e.getMessage());
        }
    }

    /**
     * Gợi ý kết hợp tour + hotel cho 1 destination
     */
    public void suggestTourAndHotelCombo(Long conversationId, String clientEmail,
                                       String city, Integer budgetVnd, Integer travelers) {
        if (city == null) return;
        
        int pax = travelers != null ? travelers : 2;
        int tourBudget = budgetVnd != null ? budgetVnd : 10_000_000;
        int hotelBudget = tourBudget / 3;
        
        BigDecimal perPerson = BigDecimal.valueOf(tourBudget / pax);
        BigDecimal maxHotelPrice = BigDecimal.valueOf(hotelBudget);
        
        try {
            // Push tour
            var tourIds = tourRepository.findBotRecommendedTourIds(
                    pax, perPerson, city, null, LocalDate.now(), 
                    org.springframework.data.domain.PageRequest.of(0, 2));
            
            if (!tourIds.isEmpty()) {
                List<TourCardItem> tourCards = buildTourCards(tourIds);
                pushBotText(conversationId, clientEmail, "🗺️ **Tour tại " + city + "** cho **" + pax + " người**:");
                pushTourCardsMessage(conversationId, clientEmail, tourCards);
            }
            
            // Push hotel
            var hotelIds = hotelRepository.findBotRecommendedHotelIds(
                    city, maxHotelPrice, null, BigDecimal.ZERO, 2);
            
            if (!hotelIds.isEmpty()) {
                List<HotelCardItem> hotelCards = buildHotelCards(hotelIds);
                pushBotText(conversationId, clientEmail, "🏨 **Khách sạn tại " + city + "** (từ " + formatVnd(hotelBudget) + "/đêm):");
                pushHotelCardsMessage(conversationId, clientEmail, hotelCards);
            }
            
            // Summary
            if (!tourIds.isEmpty() && !hotelIds.isEmpty()) {
                pushBotText(conversationId, clientEmail, 
                        "💡 **Combo tour + khách sạn** là lựa chọn phổ biến! Bạn có thể đặt riêng từng phần hoặc inbox mình để được tư vấn thêm nhé!");
            }
            
        } catch (Exception e) {
            log.error("Hybrid: Error suggesting combo: {}", e.getMessage());
        }
    }

    // ============================================================
    // PRIVATE: Build Cards
    // ============================================================

    private List<HotelCardItem> buildHotelCards(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return List.of();

        Map<Long, String> imageMap = new HashMap<>();
        List<Object[]> imageRows = hotelRepository.findCoverImagesByHotelIds(ids);
        for (Object[] row : imageRows) {
            if (row != null && row.length > 1 && row[0] != null && row[1] != null) {
                imageMap.put(((Number) row[0]).longValue(), (String) row[1]);
            }
        }

        List<HotelCardItem> cards = new ArrayList<>();
        for (Long id : ids) {
            hotelRepository.findById(id).ifPresent(hotel -> {
                if (Boolean.TRUE.equals(hotel.getIsActive())) {
                    BigDecimal minPrice = hotelRepository.findMinBasePriceByHotelId(id);
                    cards.add(HotelCardItem.builder()
                            .id(hotel.getId())
                            .name(hotel.getName())
                            .slug(hotel.getSlug())
                            .cityVi(hotel.getCity() != null ? hotel.getCity().getNameVi() : "")
                            .address(hotel.getAddress())
                            .starRating(hotel.getStarRating())
                            .avgRating(hotel.getAvgRating())
                            .reviewCount(hotel.getReviewCount())
                            .minPricePerNight(minPrice)
                            .imageUrl(imageMap.get(id))
                            .build());
                }
            });
        }
        return cards;
    }

    private List<TourCardItem> buildTourCards(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return List.of();

        Map<Long, String> imageMap = new HashMap<>();
        List<Object[]> imageRows = tourImageRepository.findCoverImagesByTourIds(ids);
        for (Object[] row : imageRows) {
            if (row != null && row.length > 1 && row[0] != null && row[1] != null) {
                imageMap.put(((Number) row[0]).longValue(), (String) row[1]);
            }
        }

        List<TourCardItem> cards = new ArrayList<>();
        for (Long id : ids) {
            tourRepository.findById(id).ifPresent(tour -> {
                if (Boolean.TRUE.equals(tour.getIsActive())) {
                    cards.add(TourCardItem.builder()
                            .id(tour.getId())
                            .title(tour.getTitle())
                            .slug(tour.getSlug())
                            .cityVi(tour.getCity() != null ? tour.getCity().getNameVi() : "Việt Nam")
                            .durationDays(tour.getDurationDays())
                            .durationNights(tour.getDurationNights())
                            .pricePerAdult(tour.getPricePerAdult())
                            .avgRating(tour.getAvgRating())
                            .reviewCount(tour.getReviewCount())
                            .imageUrl(imageMap.get(id))
                            .build());
                }
            });
        }
        return cards;
    }

    private void pushTourCardsMessage(Long conversationId, String clientEmail, List<TourCardItem> cards) {
        try {
            String json = objectMapper.writeValueAsString(cards);
            ChatMessage saved = chatService.saveBotMessage(
                    conversationId, "🗺️ Tour gợi ý",
                    ChatMessage.ContentType.TOUR_CARDS, json);
            messagingTemplate.convertAndSendToUser(clientEmail, "/queue/messages", ChatMessageResponse.from(saved));
        } catch (Exception e) {
            log.error("Lỗi push tour cards", e);
        }
    }

    private void pushHotelCardsMessage(Long conversationId, String clientEmail, List<HotelCardItem> cards) {
        try {
            String json = objectMapper.writeValueAsString(cards);
            ChatMessage saved = chatService.saveBotMessage(
                    conversationId, "🏨 Khách sạn gợi ý",
                    ChatMessage.ContentType.HOTEL_CARDS, json);
            messagingTemplate.convertAndSendToUser(clientEmail, "/queue/messages", ChatMessageResponse.from(saved));
        } catch (Exception e) {
            log.error("Lỗi push hotel cards", e);
        }
    }

    private void pushBotText(Long conversationId, String clientEmail, String text) {
        try {
            ChatMessage saved = chatService.saveBotMessage(
                    conversationId, text, ChatMessage.ContentType.TEXT, null);
            messagingTemplate.convertAndSendToUser(clientEmail, "/queue/messages", ChatMessageResponse.from(saved));
        } catch (Exception e) {
            log.error("Lỗi push bot text", e);
        }
    }

    private String formatVnd(long amount) {
        return String.format(Locale.US, "%,d", amount).replace(',', '.') + " VND";
    }
}
