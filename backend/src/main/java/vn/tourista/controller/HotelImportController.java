package vn.tourista.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.tourista.dto.request.CsvHotelRow;
import vn.tourista.dto.request.HotelImportRequest;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.HotelImportPreviewResponse;
import vn.tourista.dto.response.HotelImportResultResponse;
import vn.tourista.service.HotelImportService;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/admin/hotels/import")
@PreAuthorize("hasRole('ADMIN')")
public class HotelImportController {

    @Autowired
    private HotelImportService hotelImportService;

    /**
     * Handles CSV file upload.
     * - Strips UTF-8 BOM (\uFEFF) from file start before parsing
     * - Supports any encoding; prefers UTF-8
     */
    @PostMapping("/parse")
    public ResponseEntity<ApiResponse<List<CsvHotelRow>>> parseCsv(
            @RequestParam("file") MultipartFile file) {
        try {
            byte[] rawBytes = file.getBytes();
            String csvContent = new String(rawBytes, StandardCharsets.UTF_8);

            // Strip UTF-8 BOM if present (common in files saved from Excel/Google Sheets)
            if (csvContent.length() > 0 && csvContent.charAt(0) == '\uFEFF') {
                csvContent = csvContent.substring(1);
            }
            List<CsvHotelRow> rows = hotelImportService.parseCsv(csvContent);
            return ResponseEntity.ok(ApiResponse.ok("Đã parse " + rows.size() + " dòng từ CSV", rows));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.<List<CsvHotelRow>>fail("Lỗi parse CSV: " + e.getMessage()));
        }
    }

    @PostMapping("/preview")
    public ResponseEntity<ApiResponse<HotelImportPreviewResponse>> previewImport(
            @RequestBody HotelImportRequest request) {
        try {
            if (request.getRows() == null || request.getRows().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.<HotelImportPreviewResponse>fail("Danh sách dòng trống"));
            }
            HotelImportPreviewResponse preview = hotelImportService.previewImport(request);
            return ResponseEntity.ok(ApiResponse.ok("Preview thành công", preview));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.<HotelImportPreviewResponse>fail("Lỗi preview: " + e.getMessage()));
        }
    }

    @PostMapping("/execute")
    public ResponseEntity<ApiResponse<HotelImportResultResponse>> executeImport(
            @RequestBody HotelImportRequest request) {
        try {
            if (request.getRows() == null || request.getRows().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.<HotelImportResultResponse>fail("Danh sách dòng trống"));
            }
            HotelImportResultResponse result = hotelImportService.executeImport(request);
            return ResponseEntity.ok(ApiResponse.ok("Import hoàn tất", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.<HotelImportResultResponse>fail("Lỗi import: " + e.getMessage()));
        }
    }
}
