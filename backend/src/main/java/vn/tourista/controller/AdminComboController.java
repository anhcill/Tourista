package vn.tourista.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.tourista.dto.request.admin.AdminComboUpsertRequest;
import vn.tourista.dto.request.admin.AdminReasonRequest;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.admin.AdminComboItemResponse;
import vn.tourista.dto.response.admin.AdminPageResponse;
import vn.tourista.service.AdminComboService;

@RestController
@RequestMapping("/api/admin/combos")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminComboController {

    private final AdminComboService adminComboService;

    @GetMapping
    public ResponseEntity<ApiResponse<AdminPageResponse<AdminComboItemResponse>>> getCombos(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String sort) {

        AdminPageResponse<AdminComboItemResponse> result =
                adminComboService.getCombos(page, size, q, status, type, sort);
        return ResponseEntity.ok(ApiResponse.ok("Lay danh sach combo thanh cong", result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminComboItemResponse>> getComboById(@PathVariable Long id) {
        AdminComboItemResponse data = adminComboService.getComboById(id);
        return ResponseEntity.ok(ApiResponse.ok("Lay chi tiet combo thanh cong", data));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AdminComboItemResponse>> createCombo(
            @Valid @RequestBody AdminComboUpsertRequest request,
            Authentication authentication) {
        AdminComboItemResponse data = adminComboService.createCombo(request, resolveActor(authentication));
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tao combo thanh cong", data));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminComboItemResponse>> updateCombo(
            @PathVariable Long id,
            @Valid @RequestBody AdminComboUpsertRequest request,
            Authentication authentication) {
        AdminComboItemResponse data = adminComboService.updateCombo(id, request, resolveActor(authentication));
        return ResponseEntity.ok(ApiResponse.ok("Cap nhat combo thanh cong", data));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<AdminComboItemResponse>> updateComboStatus(
            @PathVariable Long id,
            @Valid @RequestBody AdminReasonRequest request,
            Authentication authentication) {
        AdminComboItemResponse data = adminComboService.updateComboStatus(
                id, request.getIsActive() != null ? request.getIsActive() : false,
                request.getReason(), resolveActor(authentication));
        return ResponseEntity.ok(ApiResponse.ok("Cap nhat trang thai combo thanh cong", data));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCombo(
            @PathVariable Long id,
            @Valid @RequestBody AdminReasonRequest request,
            Authentication authentication) {
        adminComboService.deleteCombo(id, request.getReason(), resolveActor(authentication));
        return ResponseEntity.ok(ApiResponse.ok("Xoa combo thanh cong"));
    }

    private String resolveActor(Authentication authentication) {
        return authentication != null ? authentication.getName() : null;
    }
}
