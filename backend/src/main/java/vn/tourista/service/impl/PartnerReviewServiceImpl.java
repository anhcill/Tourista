package vn.tourista.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.tourista.dto.response.PartnerReviewResponse;
import vn.tourista.entity.Hotel;
import vn.tourista.entity.Review;
import vn.tourista.entity.Tour;
import vn.tourista.entity.User;
import vn.tourista.repository.HotelRepository;
import vn.tourista.repository.ReviewRepository;
import vn.tourista.repository.TourRepository;
import vn.tourista.repository.UserRepository;
import vn.tourista.service.PartnerReviewService;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
@Slf4j
public class PartnerReviewServiceImpl implements PartnerReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final HotelRepository hotelRepository;
    private final TourRepository tourRepository;

    @Override
    public Page<PartnerReviewResponse> getReviewsForPartner(String partnerEmail, int page, int size) {
        User partner = userRepository.findByEmail(partnerEmail.trim().toLowerCase())
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay tai khoan"));

        Long partnerId = partner.getId();

        List<Long> hotelIds = hotelRepository.findIdsByPartnerId(partnerId);
        List<Long> tourIds = tourRepository.findIdsByPartnerId(partnerId);

        if (hotelIds.isEmpty() && tourIds.isEmpty()) {
            return Page.empty();
        }

        PageRequest pageable = PageRequest.of(page, size);

        List<Long> allReviewIds = reviewRepository.findIdsByPartnerHotelsAndTours(hotelIds, tourIds, pageable);

        if (allReviewIds.isEmpty()) {
            return new org.springframework.data.domain.PageImpl<>(
                    java.util.Collections.emptyList(), pageable, 0);
        }

        List<Review> reviews = reviewRepository.findAllById(allReviewIds);

        reviews.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));

        long total = reviewRepository.findIdsByPartnerHotelsAndTours(hotelIds, tourIds, PageRequest.of(0, Integer.MAX_VALUE)).size();

        List<PartnerReviewResponse> content = reviews.stream().map(this::toResponse).toList();
        return new org.springframework.data.domain.PageImpl<>(content, pageable, total);
    }

    @Override
    public PartnerReviewResponse getReviewDetail(String partnerEmail, Long reviewId) {
        User partner = userRepository.findByEmail(partnerEmail.trim().toLowerCase())
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay tai khoan"));

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NoSuchElementException("Review not found: " + reviewId));

        validateOwnership(partner.getId(), review);

        return toResponse(review);
    }

    @Override
    @Transactional
    public PartnerReviewResponse replyToReview(String partnerEmail, Long reviewId, String reply) {
        User partner = userRepository.findByEmail(partnerEmail.trim().toLowerCase())
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay tai khoan"));

        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new NoSuchElementException("Review not found: " + reviewId));

        validateOwnership(partner.getId(), review);

        String trimmedReply = (reply != null ? reply.trim() : null);
        if (trimmedReply == null || trimmedReply.isEmpty()) {
            throw new IllegalArgumentException("Noi dung phan hoi khong duoc trong");
        }

        review.setPartnerId(partner.getId());
        review.setPartnerReply(trimmedReply);
        review.setPartnerRepliedAt(LocalDateTime.now());
        review = reviewRepository.save(review);

        return toResponse(review);
    }

    private void validateOwnership(Long partnerId, Review review) {
        if (review.getTargetType() == Review.TargetType.HOTEL) {
            Hotel hotel = hotelRepository.findById(review.getTargetId()).orElse(null);
            if (hotel == null || hotel.getOwner() == null || !hotel.getOwner().getId().equals(partnerId)) {
                throw new SecurityException("Ban khong co quyen truy cap review nay");
            }
        } else if (review.getTargetType() == Review.TargetType.TOUR) {
            Tour tour = tourRepository.findById(review.getTargetId()).orElse(null);
            if (tour == null || tour.getOperator() == null || !tour.getOperator().getId().equals(partnerId)) {
                throw new SecurityException("Ban khong co quyen truy cap review nay");
            }
        }
    }

    private PartnerReviewResponse toResponse(Review r) {
        String targetName = null;
        if (r.getTargetType() == Review.TargetType.HOTEL) {
            targetName = hotelRepository.findById(r.getTargetId())
                    .map(Hotel::getName)
                    .orElse("Hotel #" + r.getTargetId());
        } else {
            targetName = tourRepository.findById(r.getTargetId())
                    .map(Tour::getTitle)
                    .orElse("Tour #" + r.getTargetId());
        }

        String userName = null;
        String userAvatar = null;
        if (r.getUserId() != null) {
            userName = userRepository.findById(r.getUserId())
                    .map(User::getFullName)
                    .orElse("User #" + r.getUserId());
            userAvatar = userRepository.findById(r.getUserId())
                    .map(User::getAvatarUrl)
                    .orElse(null);
        }

        return PartnerReviewResponse.builder()
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
                .partnerReply(r.getPartnerReply())
                .partnerRepliedAt(r.getPartnerRepliedAt())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
