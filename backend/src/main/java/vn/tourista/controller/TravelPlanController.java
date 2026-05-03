package vn.tourista.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.tourista.dto.request.TravelPlanRequest;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.TravelPlanResponse;
import vn.tourista.service.TravelPlanService;

@Slf4j
@RestController
@RequestMapping("/api/travel-plan")
@RequiredArgsConstructor
public class TravelPlanController {

    private final TravelPlanService travelPlanService;

    @PostMapping("/generate")
    public ResponseEntity<ApiResponse<TravelPlanResponse>> generatePlan(
            @Valid @RequestBody TravelPlanRequest request) {
        log.info("TravelPlanController: Received request for destination={}, days={}-{}",
                request.getDestination(), request.getCheckIn(), request.getCheckOut());
        try {
            TravelPlanResponse plan = travelPlanService.generatePlan(request);
            log.info("TravelPlanController: Plan generated successfully");
            return ResponseEntity.ok(ApiResponse.ok("Lịch trình đã được tạo", plan));
        } catch (Exception e) {
            log.error("TravelPlanController: Failed to generate plan for destination={}. Error: {}",
                    request.getDestination(), e.getMessage(), e);
            return ResponseEntity.internalServerError()
                    .body(ApiResponse.fail("Tạo lịch trình thất bại: " + e.getMessage()));
        }
    }
}
