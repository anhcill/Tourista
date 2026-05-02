package vn.tourista.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.tourista.dto.request.PricingRuleRequest;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.PricingCalculationResponse;
import vn.tourista.entity.PricingRule;
import vn.tourista.service.PricingService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/pricing")
@RequiredArgsConstructor
public class PricingController {

    private final PricingService pricingService;

    @GetMapping("/rules")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<PricingRule>>> getAllRules() {
        List<PricingRule> rules = pricingService.getAllRules();
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách pricing rules thành công", rules));
    }

    @GetMapping("/rules/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PricingRule>> getRuleById(@PathVariable Long id) {
        PricingRule rule = pricingService.getRuleById(id);
        return ResponseEntity.ok(ApiResponse.ok("Lấy pricing rule thành công", rule));
    }

    @PostMapping("/rules")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PricingRule>> createRule(
            @Valid @RequestBody PricingRuleRequest req) {
        PricingRule rule = pricingService.createRule(req);
        return ResponseEntity.ok(ApiResponse.ok("Tạo pricing rule thành công", rule));
    }

    @PutMapping("/rules/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PricingRule>> updateRule(
            @PathVariable Long id,
            @Valid @RequestBody PricingRuleRequest req) {
        PricingRule rule = pricingService.updateRule(id, req);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật pricing rule thành công", rule));
    }

    @DeleteMapping("/rules/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteRule(@PathVariable Long id) {
        pricingService.deleteRule(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa pricing rule thành công"));
    }

    @GetMapping("/calculate/tour/{tourId}")
    public ResponseEntity<ApiResponse<PricingCalculationResponse>> calculateTourPrice(
            @PathVariable Long tourId,
            @RequestParam(required = false) Integer numPeople,
            @RequestParam(required = false) Integer slotsRemaining) {
        PricingCalculationResponse response = pricingService.calculateTourPrice(tourId, numPeople, slotsRemaining);
        return ResponseEntity.ok(ApiResponse.ok("Tính giá tour thành công", response));
    }

    @GetMapping("/calculate/hotel/{hotelId}")
    public ResponseEntity<ApiResponse<PricingCalculationResponse>> calculateHotelPrice(
            @PathVariable Long hotelId,
            @RequestParam(required = false) Integer nights,
            @RequestParam(required = false) Integer rooms) {
        PricingCalculationResponse response = pricingService.calculateHotelPrice(hotelId, nights, rooms);
        return ResponseEntity.ok(ApiResponse.ok("Tính giá khách sạn thành công", response));
    }

    @GetMapping("/calculate/hotel/{hotelId}/per-night")
    public ResponseEntity<ApiResponse<PricingCalculationResponse>> calculateHotelNightPrice(
            @PathVariable Long hotelId,
            @RequestParam String checkIn,
            @RequestParam(required = false) Integer adults) {
        PricingCalculationResponse response = pricingService.calculateHotelNightPrice(
                hotelId, LocalDate.parse(checkIn), adults);
        return ResponseEntity.ok(ApiResponse.ok("Tính giá theo đêm thành công", response));
    }
}
