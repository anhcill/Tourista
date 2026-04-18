package vn.tourista.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.service.StatisticsService;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/statistics")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        Map<String, Object> stats = statisticsService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.ok("Lấy thống kê dashboard thành công", stats));
    }

    @GetMapping("/revenue")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getRevenueStats(
            @RequestParam(defaultValue = "month") String period) {
        Map<String, Object> stats = statisticsService.getRevenueStats(period);
        return ResponseEntity.ok(ApiResponse.ok("Lấy thống kê doanh thu thành công", stats));
    }
}
