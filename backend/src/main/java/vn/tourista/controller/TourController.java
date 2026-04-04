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
import vn.tourista.dto.request.TourSearchRequest;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.TourDetailResponse;
import vn.tourista.dto.response.TourSummaryResponse;
import vn.tourista.service.TourService;

import java.util.List;

@RestController
@RequestMapping("/api/tours")
public class TourController {

    @Autowired
    private TourService tourService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TourSummaryResponse>>> getTours(
            @RequestParam(defaultValue = "20") Integer limit) {

        List<TourSummaryResponse> data = tourService.getTours(limit);
        return ResponseEntity.ok(ApiResponse.ok("Lay danh sach tours thanh cong", data));
    }

    @GetMapping("/featured")
    public ResponseEntity<ApiResponse<List<TourSummaryResponse>>> getFeaturedTours(
            @RequestParam(defaultValue = "6") Integer limit) {

        List<TourSummaryResponse> data = tourService.getFeaturedTours(limit);
        return ResponseEntity.ok(ApiResponse.ok("Lay danh sach tours noi bat thanh cong", data));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<TourSummaryResponse>>> searchTours(
            @Valid @ModelAttribute TourSearchRequest request) {

        List<TourSummaryResponse> data = tourService.searchTours(request);
        return ResponseEntity.ok(ApiResponse.ok("Lay danh sach tours thanh cong", data));
    }

    @GetMapping("/{id:[0-9]+}")
    public ResponseEntity<ApiResponse<TourDetailResponse>> getTourDetail(@PathVariable Long id) {
        TourDetailResponse data = tourService.getTourDetail(id);
        return ResponseEntity.ok(ApiResponse.ok("Lay chi tiet tour thanh cong", data));
    }
}
