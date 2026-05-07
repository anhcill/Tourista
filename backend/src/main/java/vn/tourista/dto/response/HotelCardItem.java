package vn.tourista.dto.response;

import lombok.Builder;

import java.math.BigDecimal;

/**
 * HotelCardItem - DTO cho hotel recommendation cards
 */
@Builder
public record HotelCardItem(
        Long id,
        String name,
        String slug,
        String cityVi,
        String address,
        Integer starRating,
        BigDecimal avgRating,
        Integer reviewCount,
        BigDecimal minPricePerNight,
        String imageUrl
) {}
