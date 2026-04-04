package vn.tourista.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.HomeTestimonialResponse;
import vn.tourista.repository.ReviewRepository;

import java.util.List;

@RestController
@RequestMapping("/api/home")
public class HomeController {

    @Autowired
    private ReviewRepository reviewRepository;

    @GetMapping("/testimonials")
    public ResponseEntity<ApiResponse<List<HomeTestimonialResponse>>> getHomeTestimonials(
            @RequestParam(defaultValue = "6") Integer limit) {

        int safeLimit = (limit == null || limit < 1) ? 6 : Math.min(limit, 12);

        List<HomeTestimonialResponse> data = reviewRepository.findPublicTestimonials(safeLimit)
                .stream()
                .map(item -> HomeTestimonialResponse.builder()
                        .id(item.getId())
                        .content(item.getContent())
                        .rating(safeRating(item.getRating()))
                        .authorName(item.getAuthorName())
                        .authorAvatar(item.getAuthorAvatar())
                        .country(item.getCountry())
                        .verified(Boolean.TRUE.equals(item.getVerified()))
                        .targetName(item.getTargetName())
                        .targetType(item.getTargetType())
                        .build())
                .toList();

        return ResponseEntity.ok(ApiResponse.ok("Lay testimonials trang chu thanh cong", data));
    }

    private Double safeRating(Double rating) {
        if (rating == null || rating <= 0) {
            return 4.5;
        }
        return Math.min(5.0, Math.max(1.0, rating));
    }
}
