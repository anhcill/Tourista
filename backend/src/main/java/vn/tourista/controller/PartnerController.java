package vn.tourista.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.partner.PartnerBookingResponse;
import vn.tourista.dto.response.partner.PartnerHotelResponse;
import vn.tourista.dto.response.partner.PartnerTourResponse;
import vn.tourista.dto.response.PartnerReviewResponse;
import vn.tourista.entity.User;
import vn.tourista.repository.UserRepository;
import vn.tourista.service.PartnerReviewService;
import vn.tourista.service.PartnerService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/partner")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('PARTNER', 'HOST', 'ADMIN')")
public class PartnerController {

    private final PartnerService partnerService;
    private final PartnerReviewService partnerReviewService;
    private final UserRepository userRepository;

    @GetMapping("/hotels")
    public ResponseEntity<ApiResponse<Page<PartnerHotelResponse>>> getPartnerHotels(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(ApiResponse.ok("Lay danh sach hotel thanh cong",
                partnerService.getPartnerHotels(user.getId(), page, size)));
    }

    @GetMapping("/tours")
    public ResponseEntity<ApiResponse<?>> getPartnerTours(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(ApiResponse.ok("Lay danh sach tour thanh cong",
                partnerService.getPartnerTours(user.getId())));
    }

    @GetMapping("/bookings/hotels")
    public ResponseEntity<ApiResponse<Page<PartnerBookingResponse>>> getPartnerHotelBookings(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(ApiResponse.ok("Lay danh sach booking hotel thanh cong",
                partnerService.getPartnerHotelBookings(user.getId(), status, page, size)));
    }

    @GetMapping("/bookings/tours")
    public ResponseEntity<ApiResponse<Page<PartnerBookingResponse>>> getPartnerTourBookings(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(ApiResponse.ok("Lay danh sach booking tour thanh cong",
                partnerService.getPartnerTourBookings(user.getId(), status, page, size)));
    }

    @GetMapping("/reviews")
    public ResponseEntity<ApiResponse<Page<PartnerReviewResponse>>> getPartnerReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.ok("Lay danh sach review thanh cong",
                partnerReviewService.getReviewsForPartner(authentication.getName(), page, size)));
    }

    @GetMapping("/reviews/{reviewId}")
    public ResponseEntity<ApiResponse<PartnerReviewResponse>> getPartnerReviewDetail(
            @PathVariable Long reviewId,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.ok("Lay chi tiet review thanh cong",
                partnerReviewService.getReviewDetail(authentication.getName(), reviewId)));
    }

    @PostMapping("/reviews/{reviewId}/reply")
    public ResponseEntity<ApiResponse<PartnerReviewResponse>> replyToReview(
            @PathVariable Long reviewId,
            @RequestBody Map<String, String> body,
            Authentication authentication) {
        String reply = body.get("reply");
        return ResponseEntity.ok(ApiResponse.ok("Phan hoi review thanh cong",
                partnerReviewService.replyToReview(authentication.getName(), reviewId, reply)));
    }

    @GetMapping("/revenue-stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRevenueStats(
            @RequestParam(defaultValue = "30d") String period,
            Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(ApiResponse.ok("Lay thong ke doanh thu thanh cong",
                partnerService.getRevenueStats(user.getId(), period)));
    }
}
