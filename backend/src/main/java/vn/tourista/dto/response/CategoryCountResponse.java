package vn.tourista.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryCountResponse {
    private String type;
    private String label;
    private String icon;
    private Double avgRating;
    private Integer offerCount;
    private String discount;
    private String tag;
    private String gradient;
}
