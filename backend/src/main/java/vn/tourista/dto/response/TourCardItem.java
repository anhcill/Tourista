package vn.tourista.dto.response;

import lombok.Builder;

import java.math.BigDecimal;

/**
 * DTO gọn để Bot gửi card gợi ý tour — dùng cho ContentType.TOUR_CARDS
 */
@Builder
public record TourCardItem(
        Long id,
        String title,
        String slug,
        String cityVi,
        Integer durationDays,
        Integer durationNights,
        BigDecimal pricePerAdult,
        BigDecimal avgRating,
        Integer reviewCount,
        String imageUrl
) {}
