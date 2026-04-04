package vn.tourista.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HomeTestimonialResponse {

    private Long id;
    private String content;
    private Double rating;

    private String authorName;
    private String authorAvatar;
    private String country;
    private Boolean verified;

    private String targetName;
    private String targetType;
}
