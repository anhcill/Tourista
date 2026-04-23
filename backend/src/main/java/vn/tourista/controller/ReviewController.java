package vn.tourista.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.tourista.dto.request.CreateReviewRequest;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.ReviewCreatedResponse;
import vn.tourista.dto.response.ReviewHelpfulResponse;
import vn.tourista.service.ReviewHelpfulService;
import vn.tourista.service.ReviewService;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private ReviewHelpfulService helpfulService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReviewCreatedResponse>> createReview(
            @Valid @RequestBody CreateReviewRequest request,
            Authentication authentication) {

        ReviewCreatedResponse data = reviewService.createReview(resolveEmail(authentication), request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tao danh gia thanh cong", data));
    }

    /**
     * Toggle helpful vote on a review. Creates vote if not exists, removes if exists.
     * Returns the new helpful count after toggle.
     */
    @PatchMapping("/{reviewId}/helpful")
    public ResponseEntity<ApiResponse<ReviewHelpfulResponse>> toggleHelpful(
            @PathVariable Long reviewId,
            Authentication authentication) {

        int newCount = helpfulService.toggleHelpful(resolveEmail(authentication), reviewId);

        ReviewHelpfulResponse data = ReviewHelpfulResponse.builder()
                .reviewId(reviewId)
                .helpfulCount(newCount)
                .userVoted(true)
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Toggle helpful vote thanh cong", data));
    }

    /**
     * Get helpful count for specific reviews. Requires authentication to also
     * return which reviews the current user has voted on.
     */
    @GetMapping("/helpful")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getHelpfulInfo(
            @RequestParam List<Long> reviewIds,
            Authentication authentication) {

        Map<Long, Integer> counts = helpfulService.getHelpfulCounts(reviewIds);

        Map<String, Object> data = new java.util.HashMap<>();
        data.put("counts", counts);

        if (authentication != null && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getName())) {
            Set<Long> votedIds = helpfulService.getUserVotedReviewIds(
                    authentication.getName(), reviewIds);
            data.put("userVotedIds", votedIds);
        }

        return ResponseEntity.ok(ApiResponse.ok("Lay helpful info thanh cong", data));
    }

    private String resolveEmail(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new IllegalArgumentException("Thong tin xac thuc khong hop le");
        }
        return authentication.getName().trim();
    }

    @GetMapping("/can-review")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> canUserReview(
            @RequestParam String targetType,
            @RequestParam Long targetId,
            Authentication authentication) {

        boolean canReview = reviewService.canUserReview(resolveEmail(authentication), targetType, targetId);
        Map<String, Boolean> data = Map.of("canReview", canReview);
        return ResponseEntity.ok(ApiResponse.ok("Kiem tra quyen danh gia thanh cong", data));
    }
}