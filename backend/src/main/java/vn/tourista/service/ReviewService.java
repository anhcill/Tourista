package vn.tourista.service;

import vn.tourista.dto.request.CreateReviewRequest;
import vn.tourista.dto.response.ReviewCreatedResponse;

public interface ReviewService {

    ReviewCreatedResponse createReview(String userEmail, CreateReviewRequest request);
}