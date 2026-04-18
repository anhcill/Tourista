package vn.tourista.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.ReviewModerationResponse;
import vn.tourista.service.ReviewModerationService;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/reviews")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ReviewModerationController {

    private final ReviewModerationService reviewModerationService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ReviewModerationResponse>>> getReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String targetType) {
        Page<ReviewModerationResponse> result = reviewModerationService.getReviews(page, size, status, targetType);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách review thành công", result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReviewModerationResponse>> getReviewById(@PathVariable Long id) {
        ReviewModerationResponse result = reviewModerationService.getReviewById(id);
        return ResponseEntity.ok(ApiResponse.ok("Lấy review thành công", result));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<ReviewModerationResponse>> approveReview(@PathVariable Long id) {
        ReviewModerationResponse result = reviewModerationService.approveReview(id);
        return ResponseEntity.ok(ApiResponse.ok("Duyệt review thành công", result));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<ReviewModerationResponse>> rejectReview(@PathVariable Long id) {
        ReviewModerationResponse result = reviewModerationService.rejectReview(id);
        return ResponseEntity.ok(ApiResponse.ok("Từ chối review thành công", result));
    }

    @PostMapping("/{id}/reply")
    public ResponseEntity<ApiResponse<ReviewModerationResponse>> replyToReview(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String reply = body.get("reply");
        ReviewModerationResponse result = reviewModerationService.replyToReview(id, reply);
        return ResponseEntity.ok(ApiResponse.ok("Phản hồi review thành công", result));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReview(@PathVariable Long id) {
        reviewModerationService.deleteReview(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa review thành công"));
    }

    @GetMapping("/counts")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getReviewCounts() {
        Map<String, Long> counts = reviewModerationService.getReviewCounts();
        return ResponseEntity.ok(ApiResponse.ok("Lấy số liệu review thành công", counts));
    }
}
