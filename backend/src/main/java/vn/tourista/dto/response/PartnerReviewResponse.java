package vn.tourista.dto.response;

import lombok.*;
import vn.tourista.entity.Review;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PartnerReviewResponse {

    private Long id;
    private Long userId;
    private String userName;
    private String userAvatar;
    private Review.TargetType targetType;
    private Long targetId;
    private String targetName;
    private Integer overallRating;
    private String comment;
    private Boolean isVerified;
    private Boolean isPublished;
    private Review.AdminStatus adminStatus;
    private String adminReply;
    private LocalDateTime adminRepliedAt;
    private String partnerReply;
    private LocalDateTime partnerRepliedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
