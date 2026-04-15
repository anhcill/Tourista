package vn.tourista.service;

import vn.tourista.dto.request.TourSearchRequest;
import vn.tourista.dto.response.TourDetailResponse;
import vn.tourista.dto.response.TourReviewResponse;
import vn.tourista.dto.response.TourSummaryResponse;

import java.util.List;

public interface TourService {

    List<TourSummaryResponse> getTours(Integer limit);

    List<TourSummaryResponse> getFeaturedTours(Integer limit);

    List<TourSummaryResponse> searchTours(TourSearchRequest request);

    TourDetailResponse getTourDetail(Long tourId);

    List<TourReviewResponse> getTourReviews(Long tourId, Integer page, Integer limit);

    List<TourSummaryResponse> getSimilarTours(Long tourId, Integer limit);
}
