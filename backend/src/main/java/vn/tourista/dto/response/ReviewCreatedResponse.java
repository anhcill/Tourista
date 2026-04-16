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
public class ReviewCreatedResponse {

    private Long id;
    private String targetType;
    private Long targetId;
    private Integer overallRating;
    private String comment;
    private Boolean verified;
    private LocalDateTime createdAt;
    private List<String> mediaUrls;
}