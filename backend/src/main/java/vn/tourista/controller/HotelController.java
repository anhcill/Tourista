package vn.tourista.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.tourista.dto.request.HotelSearchRequest;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.HotelDetailResponse;
import vn.tourista.dto.response.HotelReviewResponse;
import vn.tourista.dto.response.HotelSearchResponse;
import vn.tourista.dto.response.HotelSummaryResponse;
import vn.tourista.service.HotelService;

import java.util.List;

@RestController
@RequestMapping("/api/hotels")
public class HotelController {

    @Autowired
    private HotelService hotelService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<HotelSummaryResponse>>> getHotels(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "20") Integer limit) {

        List<HotelSummaryResponse> data = hotelService.getHotels(limit);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách khách sạn thành công", data));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<HotelSearchResponse>> searchHotels(
            @Valid @ModelAttribute HotelSearchRequest request) {

        HotelSearchResponse data = hotelService.searchHotels(request);
        return ResponseEntity.ok(ApiResponse.ok("Tim kiem khach san thanh cong", data));
    }

    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<HotelSummaryResponse>>> getFeaturedHotels(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "6") Integer limit) {

        List<HotelSummaryResponse> data = hotelService.getFeaturedHotels(limit);
        return ResponseEntity.ok(ApiResponse.ok("Lấy khách sạn nổi bật thành công", data));
    }

    @GetMapping("/trending")
    public ResponseEntity<ApiResponse<List<HotelSummaryResponse>>> getTrendingHotels(
            @org.springframework.web.bind.annotation.RequestParam(defaultValue = "6") Integer limit) {

        List<HotelSummaryResponse> data = hotelService.getTrendingHotels(limit);
        return ResponseEntity.ok(ApiResponse.ok("Lấy khách sạn thịnh hành thành công", data));
    }

    @GetMapping("/{id:[0-9]+}")
    public ResponseEntity<ApiResponse<HotelDetailResponse>> getHotelDetail(@PathVariable Long id) {
        HotelDetailResponse data = hotelService.getHotelDetail(id);
        return ResponseEntity.ok(ApiResponse.ok("Lấy chi tiết khách sạn thành công", data));
    }

    @GetMapping("/{id:[0-9]+}/reviews")
    public ResponseEntity<ApiResponse<List<HotelReviewResponse>>> getHotelReviews(
            @PathVariable Long id,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "6") Integer limit) {

        List<HotelReviewResponse> data = hotelService.getHotelReviews(id, page, limit);
        return ResponseEntity.ok(ApiResponse.ok("Lấy đánh giá khách sạn thành công", data));
    }
}
