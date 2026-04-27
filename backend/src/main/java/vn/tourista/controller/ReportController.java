package vn.tourista.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.tourista.dto.request.CreateReportRequest;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.ReportResponse;
import vn.tourista.service.ReportService;

import java.security.Principal;

/**
 * REST API cho he thong bao cao/khieu nai.
 *
 * WORKFLOW:
 * - User khiếu nại partner → POST /api/reports  (type = USER_COMPLAINT_PARTNER)
 * - Partner bao cao user vi phạm → POST /api/reports (type = PARTNER_REPORT_USER)
 * - User/Partner yeu cau ho tro → POST /api/reports  (type = USER_REQUEST_SUPPORT / PARTNER_REQUEST_SUPPORT)
 *
 * Admin:
 * - GET /api/admin/reports — Danh sach tat ca bao cao
 * - GET /api/admin/reports/{id} — Chi tiet bao cao
 * - PATCH /api/admin/reports/{id} — Cap nhat trang thai bao cao
 */
@RestController
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    /**
     * POST /api/reports
     * Tao bao cao/khieu nai.
     * Bat cu user hoac partner deu co the gui bao cao.
     */
    @PostMapping("/api/reports")
    public ResponseEntity<ApiResponse<ReportResponse>> createReport(
            Principal principal,
            @Valid @RequestBody CreateReportRequest req) {
        ReportResponse result = reportService.createReport(principal.getName(), req);
        return ResponseEntity.ok(ApiResponse.ok("Gửi báo cáo thành công. Chúng tôi sẽ xem xét trong thời gian sớm nhất.", result));
    }

    // =================================================================
    // ADMIN ENDPOINTS
    // =================================================================

    /**
     * GET /api/admin/reports
     * Lay tat ca bao cao (phan trang).
     */
    @GetMapping("/api/admin/reports")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Page<ReportResponse>>> getAllReports(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        Page<ReportResponse> result;
        if (status != null && !status.isBlank()) {
            result = reportService.getReportsByStatus(status, page, size);
        } else {
            result = reportService.getAllReports(page, size);
        }
        return ResponseEntity.ok(ApiResponse.ok("Danh sách báo cáo", result));
    }

    /**
     * GET /api/admin/reports/{id}
     * Lay chi tiet 1 bao cao.
     */
    @GetMapping("/api/admin/reports/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ReportResponse>> getReport(@PathVariable Long id) {
        ReportResponse result = reportService.getReport(id);
        return ResponseEntity.ok(ApiResponse.ok("Chi tiết báo cáo", result));
    }

    /**
     * PATCH /api/admin/reports/{id}
     * Cap nhat trang thai bao cao (RESOLVED / REJECTED / REVIEWING).
     */
    @PatchMapping("/api/admin/reports/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ReportResponse>> updateReportStatus(
            @PathVariable Long id,
            @RequestBody UpdateReportStatusRequest req,
            Principal principal) {
        ReportResponse result = reportService.updateReportStatus(
                id, req.status(), req.adminNotes(), principal.getName());
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái báo cáo thành công", result));
    }

    /**
     * DTO cap nhat trang thai bao cao.
     */
    public record UpdateReportStatusRequest(String status, String adminNotes) {}
}
