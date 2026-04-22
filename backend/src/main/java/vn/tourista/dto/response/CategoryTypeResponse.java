package vn.tourista.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryTypeResponse {
    private String type;
    private String label;
    private String labelEn;
    private String icon;
    private Double avgRating;
    private Integer itemCount;
    private String discount;
    private String tag;
    private String gradient;
    private String coverImage;
    private String description;
}
