package vn.tourista.controller;

import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.tourista.dto.request.admin.AdminBookingStatusUpdateRequest;
import vn.tourista.dto.request.admin.AdminHotelStatusUpdateRequest;
import vn.tourista.dto.request.admin.AdminHotelUpsertRequest;
import vn.tourista.dto.request.admin.AdminPromotionStatusUpdateRequest;
import vn.tourista.dto.request.admin.AdminPromotionUpsertRequest;
import vn.tourista.dto.request.admin.AdminReasonRequest;
import vn.tourista.dto.request.admin.AdminTourStatusUpdateRequest;
import vn.tourista.dto.request.admin.AdminTourUpsertRequest;
import vn.tourista.dto.request.admin.AdminUserRoleUpdateRequest;
import vn.tourista.dto.request.admin.AdminUserStatusUpdateRequest;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.admin.AdminAuditLogItemResponse;
import vn.tourista.dto.response.admin.AdminBookingItemResponse;
import vn.tourista.dto.response.admin.AdminHotelDetailResponse;
import vn.tourista.dto.response.admin.AdminHotelItemResponse;
import vn.tourista.dto.response.admin.AdminPageResponse;
import vn.tourista.dto.response.admin.AdminPromotionItemResponse;
import vn.tourista.dto.response.admin.AdminTourDetailResponse;
import vn.tourista.dto.response.admin.AdminTourItemResponse;
import vn.tourista.dto.response.admin.AdminUserItemResponse;
import vn.tourista.service.AdminService;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<AdminPageResponse<AdminUserItemResponse>>> getUsers(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String role,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        AdminPageResponse<AdminUserItemResponse> data = adminService.getUsers(
                page,
                resolveSize(size, limit),
                resolveQuery(q, search),
                status,
                sort,
                role);

        return ResponseEntity.ok(ApiResponse.ok("Lay danh sach users thanh cong", data));
    }

    @GetMapping("/hotels")
    public ResponseEntity<ApiResponse<AdminPageResponse<AdminHotelItemResponse>>> getHotels(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        AdminPageResponse<AdminHotelItemResponse> data = adminService.getHotels(
                page,
                resolveSize(size, limit),
                resolveQuery(q, search),
                status,
                sort);

        return ResponseEntity.ok(ApiResponse.ok("Lay danh sach hotels thanh cong", data));
    }

    @GetMapping("/tours")
    public ResponseEntity<ApiResponse<AdminPageResponse<AdminTourItemResponse>>> getTours(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        AdminPageResponse<AdminTourItemResponse> data = adminService.getTours(
                page,
                resolveSize(size, limit),
                resolveQuery(q, search),
                status,
                sort);

        return ResponseEntity.ok(ApiResponse.ok("Lay danh sach tours thanh cong", data));
    }

    @GetMapping("/bookings")
    public ResponseEntity<ApiResponse<AdminPageResponse<AdminBookingItemResponse>>> getBookings(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String paymentStatus,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        AdminPageResponse<AdminBookingItemResponse> data = adminService.getBookings(
                page,
                resolveSize(size, limit),
                resolveQuery(q, search),
                status,
                sort,
                type,
                paymentStatus);

        return ResponseEntity.ok(ApiResponse.ok("Lay danh sach bookings thanh cong", data));
    }

    @GetMapping("/promotions")
    public ResponseEntity<ApiResponse<AdminPageResponse<AdminPromotionItemResponse>>> getPromotions(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        AdminPageResponse<AdminPromotionItemResponse> data = adminService.getPromotions(
                page,
                resolveSize(size, limit),
                resolveQuery(q, search),
                status,
                sort,
                type);

        return ResponseEntity.ok(ApiResponse.ok("Lay danh sach promotions thanh cong", data));
    }

    @GetMapping("/promotions/{promotionId}")
    public ResponseEntity<ApiResponse<AdminPromotionItemResponse>> getPromotionById(@PathVariable Long promotionId) {
        AdminPromotionItemResponse data = adminService.getPromotionById(promotionId);
        return ResponseEntity.ok(ApiResponse.ok("Lay chi tiet promotion thanh cong", data));
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<AdminPageResponse<AdminAuditLogItemResponse>>> getAuditLogs(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String resource,
            @RequestParam(defaultValue = "createdAt,desc") String sort) {

        AdminPageResponse<AdminAuditLogItemResponse> data = adminService.getAuditLogs(
                page,
                resolveSize(size, limit),
                q,
                action,
                resource,
                sort);

        return ResponseEntity.ok(ApiResponse.ok("Lay audit logs thanh cong", data));
    }

    @PatchMapping("/users/{userId}/role")
    public ResponseEntity<ApiResponse<AdminUserItemResponse>> updateUserRole(
            @PathVariable Long userId,
            @Valid @RequestBody AdminUserRoleUpdateRequest request,
            Authentication authentication) {

        AdminUserItemResponse data = adminService.updateUserRole(userId, request, resolveActor(authentication));
        return ResponseEntity.ok(ApiResponse.ok("Cap nhat role user thanh cong", data));
    }

    @PatchMapping("/users/{userId}/status")
    public ResponseEntity<ApiResponse<AdminUserItemResponse>> updateUserStatus(
            @PathVariable Long userId,
            @Valid @RequestBody AdminUserStatusUpdateRequest request,
            Authentication authentication) {

        AdminUserItemResponse data = adminService.updateUserStatus(userId, request, resolveActor(authentication));
        return ResponseEntity.ok(ApiResponse.ok("Cap nhat status user thanh cong", data));
    }

    @PatchMapping("/hotels/{hotelId}/status")
    public ResponseEntity<ApiResponse<AdminHotelItemResponse>> updateHotelStatus(
            @PathVariable Long hotelId,
            @Valid @RequestBody AdminHotelStatusUpdateRequest request,
            Authentication authentication) {

        AdminHotelItemResponse data = adminService.updateHotelStatus(hotelId, request, resolveActor(authentication));
        return ResponseEntity.ok(ApiResponse.ok("Cap nhat trang thai hotel thanh cong", data));
    }

    @PatchMapping("/tours/{tourId}/status")
    public ResponseEntity<ApiResponse<AdminTourItemResponse>> updateTourStatus(
            @PathVariable Long tourId,
            @Valid @RequestBody AdminTourStatusUpdateRequest request,
            Authentication authentication) {

        AdminTourItemResponse data = adminService.updateTourStatus(tourId, request, resolveActor(authentication));
        return ResponseEntity.ok(ApiResponse.ok("Cap nhat trang thai tour thanh cong", data));
    }

    @PatchMapping("/bookings/{bookingId}/status")
    public ResponseEntity<ApiResponse<AdminBookingItemResponse>> updateBookingStatus(
            @PathVariable Long bookingId,
            @Valid @RequestBody AdminBookingStatusUpdateRequest request,
            Authentication authentication) {

        AdminBookingItemResponse data = adminService.updateBookingStatus(bookingId, request,
                resolveActor(authentication));
        return ResponseEntity.ok(ApiResponse.ok("Cap nhat trang thai booking thanh cong", data));
    }

    @PostMapping("/promotions")
    public ResponseEntity<ApiResponse<AdminPromotionItemResponse>> createPromotion(
            @Valid @RequestBody AdminPromotionUpsertRequest request,
            Authentication authentication) {

        AdminPromotionItemResponse data = adminService.createPromotion(request, resolveActor(authentication));
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tao promotion thanh cong", data));
    }

    @PatchMapping("/promotions/{promotionId}")
    public ResponseEntity<ApiResponse<AdminPromotionItemResponse>> updatePromotion(
            @PathVariable Long promotionId,
            @Valid @RequestBody AdminPromotionUpsertRequest request,
            Authentication authentication) {

        AdminPromotionItemResponse data = adminService.updatePromotion(promotionId, request,
                resolveActor(authentication));
        return ResponseEntity.ok(ApiResponse.ok("Cap nhat promotion thanh cong", data));
    }

    @PatchMapping("/promotions/{promotionId}/status")
    public ResponseEntity<ApiResponse<AdminPromotionItemResponse>> updatePromotionStatus(
            @PathVariable Long promotionId,
            @Valid @RequestBody AdminPromotionStatusUpdateRequest request,
            Authentication authentication) {

        AdminPromotionItemResponse data = adminService.updatePromotionStatus(promotionId, request,
                resolveActor(authentication));
        return ResponseEntity.ok(ApiResponse.ok("Cap nhat trang thai promotion thanh cong", data));
    }

    @DeleteMapping("/promotions/{promotionId}")
    public ResponseEntity<ApiResponse<Void>> deletePromotion(
            @PathVariable Long promotionId,
            @Valid @RequestBody AdminReasonRequest request,
            Authentication authentication) {

        adminService.deletePromotion(promotionId, request.getReason(), resolveActor(authentication));
        return ResponseEntity.ok(ApiResponse.ok("Xoa promotion thanh cong"));
    }

    // ===================== HOTEL CRUD =====================

    @GetMapping("/hotels/{hotelId}")
    public ResponseEntity<ApiResponse<AdminHotelDetailResponse>> getHotelById(@PathVariable Long hotelId) {
        AdminHotelDetailResponse data = adminService.getHotelById(hotelId);
        return ResponseEntity.ok(ApiResponse.ok("Lay chi tiet hotel thanh cong", data));
    }

    @PostMapping("/hotels")
    public ResponseEntity<ApiResponse<AdminHotelItemResponse>> createHotel(
            @Valid @RequestBody AdminHotelUpsertRequest request,
            Authentication authentication) {

        AdminHotelItemResponse data = adminService.createHotel(request, resolveActor(authentication));
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tao hotel thanh cong", data));
    }

    @PutMapping("/hotels/{hotelId}")
    public ResponseEntity<ApiResponse<AdminHotelItemResponse>> updateHotel(
            @PathVariable Long hotelId,
            @Valid @RequestBody AdminHotelUpsertRequest request,
            Authentication authentication) {

        AdminHotelItemResponse data = adminService.updateHotel(hotelId, request, resolveActor(authentication));
        return ResponseEntity.ok(ApiResponse.ok("Cap nhat hotel thanh cong", data));
    }

    // ===================== TOUR CRUD =====================

    @GetMapping("/tours/{tourId}")
    public ResponseEntity<ApiResponse<AdminTourDetailResponse>> getTourById(@PathVariable Long tourId) {
        AdminTourDetailResponse data = adminService.getTourById(tourId);
        return ResponseEntity.ok(ApiResponse.ok("Lay chi tiet tour thanh cong", data));
    }

    @PostMapping("/tours")
    public ResponseEntity<ApiResponse<AdminTourItemResponse>> createTour(
            @Valid @RequestBody AdminTourUpsertRequest request,
            Authentication authentication) {

        AdminTourItemResponse data = adminService.createTour(request, resolveActor(authentication));
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tao tour thanh cong", data));
    }

    @PutMapping("/tours/{tourId}")
    public ResponseEntity<ApiResponse<AdminTourItemResponse>> updateTour(
            @PathVariable Long tourId,
            @Valid @RequestBody AdminTourUpsertRequest request,
            Authentication authentication) {

        AdminTourItemResponse data = adminService.updateTour(tourId, request, resolveActor(authentication));
        return ResponseEntity.ok(ApiResponse.ok("Cap nhat tour thanh cong", data));
    }

    private String resolveActor(Authentication authentication) {
        return authentication != null ? authentication.getName() : null;
    }

    private Integer resolveSize(Integer size, Integer limit) {
        if (size != null) {
            return size;
        }
        if (limit != null) {
            return limit;
        }
        return 10;
    }

    private String resolveQuery(String q, String search) {
        if (StringUtils.hasText(q)) {
            return q;
        }
        if (StringUtils.hasText(search)) {
            return search;
        }
        return null;
    }
}