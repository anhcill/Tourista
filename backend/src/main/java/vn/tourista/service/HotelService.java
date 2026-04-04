package vn.tourista.service;

import vn.tourista.dto.request.HotelSearchRequest;
import vn.tourista.dto.response.HotelDetailResponse;
import vn.tourista.dto.response.HotelReviewResponse;
import vn.tourista.dto.response.HotelSummaryResponse;

import java.util.List;

public interface HotelService {

    List<HotelSummaryResponse> getHotels(Integer limit);

    List<HotelSummaryResponse> searchHotels(HotelSearchRequest request);

    List<HotelSummaryResponse> getFeaturedHotels(Integer limit);

    List<HotelSummaryResponse> getTrendingHotels(Integer limit);

    HotelDetailResponse getHotelDetail(Long hotelId);

    List<HotelReviewResponse> getHotelReviews(Long hotelId, Integer page, Integer limit);
}
