package vn.tourista.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TourReviewResponse {

    private Long id;
    private String userName;
    private String avatarUrl;
    private Integer overallRating;
    private String comment;
    private Boolean verified;
    private LocalDateTime createdAt;
    private Integer helpfulCount;
    private List<String> mediaUrls;
}
