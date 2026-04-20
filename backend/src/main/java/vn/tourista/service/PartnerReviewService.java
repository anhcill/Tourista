package vn.tourista.service;

import vn.tourista.dto.response.PartnerReviewResponse;

import java.util.List;

public interface PartnerReviewService {

    List<PartnerReviewResponse> getReviewsForPartner(String partnerEmail);

    PartnerReviewResponse getReviewDetail(String partnerEmail, Long reviewId);

    PartnerReviewResponse replyToReview(String partnerEmail, Long reviewId, String reply);
}
