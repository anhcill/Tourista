package vn.tourista.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.tourista.dto.request.TravelPlanRequest;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.TravelPlanResponse;
import vn.tourista.service.TravelPlanService;

@RestController
@RequestMapping("/api/travel-plan")
@RequiredArgsConstructor
public class TravelPlanController {

    private final TravelPlanService travelPlanService;

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<TravelPlanResponse>> generatePlan(
            @Valid @RequestBody TravelPlanRequest request) {
        try {
            TravelPlanResponse plan = travelPlanService.generatePlan(request);
            return ResponseEntity.ok(ApiResponse.ok("Lịch trình đã được tạo", plan));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.fail("Tạo lịch trình thất bại: " + e.getMessage()));
        }
    }
}
