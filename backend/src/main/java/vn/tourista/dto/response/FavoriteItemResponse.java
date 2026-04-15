package vn.tourista.dto.response;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Value
@Builder
public class FavoriteItemResponse {
    Long id;
    String type;
    Long targetId;
    String title;
    String location;
    String imageUrl;
    BigDecimal rating;
    Integer reviewCount;
    BigDecimal priceFrom;
    String currency;
    String detailPath;
    LocalDateTime createdAt;
}
