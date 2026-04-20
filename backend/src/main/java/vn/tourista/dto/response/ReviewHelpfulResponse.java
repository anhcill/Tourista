package vn.tourista.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewHelpfulResponse {

    private Long reviewId;
    private Integer helpfulCount;
    private Boolean userVoted;
}
