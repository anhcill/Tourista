package vn.tourista.service;

import vn.tourista.dto.response.PartnerReviewResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface PartnerReviewService {

    Page<PartnerReviewResponse> getReviewsForPartner(String partnerEmail, int page, int size);

    PartnerReviewResponse getReviewDetail(String partnerEmail, Long reviewId);

    PartnerReviewResponse replyToReview(String partnerEmail, Long reviewId, String reply);
}
