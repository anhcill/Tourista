package vn.tourista.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.tourista.dto.response.ReviewModerationResponse;
import vn.tourista.entity.Review;
import vn.tourista.entity.User;
import vn.tourista.repository.HotelRepository;
import vn.tourista.repository.ReviewRepository;
import vn.tourista.repository.TourRepository;
import vn.tourista.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewModerationService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final HotelRepository hotelRepository;
    private final TourRepository tourRepository;

    public Page<ReviewModerationResponse> getReviews(
            Integer page,
            Integer size,
            String status,
            String targetType) {

        PageRequest pr = PageRequest.of(page != null ? page : 0, size != null ? size : 20);

        Page<Review> reviewPage;
        if (status != null && !status.isBlank() && targetType != null && !targetType.isBlank()) {
            Review.AdminStatus adminStatus = Review.AdminStatus.valueOf(status.toUpperCase());
            Review.TargetType type = Review.TargetType.valueOf(targetType.toUpperCase());
            reviewPage = reviewRepository.findByAdminStatusAndTargetTypeOrderByCreatedAtDesc(adminStatus, type, pr);
        } else if (status != null && !status.isBlank()) {
            Review.AdminStatus adminStatus = Review.AdminStatus.valueOf(status.toUpperCase());
            reviewPage = reviewRepository.findByAdminStatusOrderByCreatedAtDesc(adminStatus, pr);
        } else if (targetType != null && !targetType.isBlank()) {
            Review.TargetType type = Review.TargetType.valueOf(targetType.toUpperCase());
            reviewPage = reviewRepository.findByTargetTypeOrderByCreatedAtDesc(type, pr);
        } else {
            reviewPage = reviewRepository.findAll(pr);
        }

        return reviewPage.map(this::toModerationResponse);
    }

    public ReviewModerationResponse getReviewById(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found: " + id));
        return toModerationResponse(review);
    }

    @Transactional
    public ReviewModerationResponse approveReview(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found: " + id));
        review.setAdminStatus(Review.AdminStatus.APPROVED);
        review.setIsPublished(true);
        review = reviewRepository.save(review);
        return toModerationResponse(review);
    }

    @Transactional
    public ReviewModerationResponse rejectReview(Long id) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found: " + id));
        review.setAdminStatus(Review.AdminStatus.REJECTED);
        review.setIsPublished(false);
        review = reviewRepository.save(review);
        return toModerationResponse(review);
    }

    @Transactional
    public ReviewModerationResponse replyToReview(Long id, String reply) {
        Review review = reviewRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Review not found: " + id));
        review.setAdminReply(reply);
        review.setAdminRepliedAt(LocalDateTime.now());
        review = reviewRepository.save(review);
        return toModerationResponse(review);
    }

    @Transactional
    public void deleteReview(Long id) {
        if (!reviewRepository.existsById(id)) {
            throw new RuntimeException("Review not found: " + id);
        }
        reviewRepository.deleteById(id);
    }

    public Map<String, Long> getReviewCounts() {
        return Map.of(
                "total", reviewRepository.count(),
                "pending", reviewRepository.countByAdminStatus(Review.AdminStatus.PENDING),
                "approved", reviewRepository.countByAdminStatus(Review.AdminStatus.APPROVED),
                "rejected", reviewRepository.countByAdminStatus(Review.AdminStatus.REJECTED)
        );
    }

    private ReviewModerationResponse toModerationResponse(Review r) {
        String targetName = null;
        if (r.getTargetType() == Review.TargetType.HOTEL && r.getTargetId() != null) {
            targetName = hotelRepository.findById(r.getTargetId())
                    .map(h -> h.getName())
                    .orElse("Hotel #" + r.getTargetId());
        } else if (r.getTargetType() == Review.TargetType.TOUR && r.getTargetId() != null) {
            targetName = tourRepository.findById(r.getTargetId())
                    .map(t -> t.getTitle())
                    .orElse("Tour #" + r.getTargetId());
        }

        String userName = null;
        String userAvatar = null;
        if (r.getUserId() != null) {
            userName = userRepository.findById(r.getUserId())
                    .map(u -> u.getFullName())
                    .orElse("User #" + r.getUserId());
            userAvatar = userRepository.findById(r.getUserId())
                    .map(u -> u.getAvatarUrl())
                    .orElse(null);
        }

        return ReviewModerationResponse.builder()
                .id(r.getId())
                .userId(r.getUserId())
                .userName(userName)
                .userAvatar(userAvatar)
                .targetType(r.getTargetType())
                .targetId(r.getTargetId())
                .targetName(targetName)
                .overallRating(r.getOverallRating())
                .comment(r.getComment())
                .isVerified(r.getIsVerified())
                .isPublished(r.getIsPublished())
                .adminStatus(r.getAdminStatus())
                .adminReply(r.getAdminReply())
                .adminRepliedAt(r.getAdminRepliedAt())
                .partnerId(r.getPartnerId())
                .partnerReply(r.getPartnerReply())
                .partnerRepliedAt(r.getPartnerRepliedAt())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
