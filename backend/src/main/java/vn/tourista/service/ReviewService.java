package vn.tourista.service;

import vn.tourista.dto.request.CreateReviewRequest;
import vn.tourista.dto.response.ReviewCreatedResponse;

public interface ReviewService {

    ReviewCreatedResponse createReview(String userEmail, CreateReviewRequest request);

    boolean canUserReview(String userEmail, String targetType, Long targetId);

    boolean canUserReviewHotel(String userEmail, Long hotelId);

    boolean hasUserReviewed(String userEmail, String targetType, Long targetId); boolean canUserReviewTour(String userEmail, Long tourId);
}
