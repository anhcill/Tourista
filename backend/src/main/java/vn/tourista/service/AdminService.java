package vn.tourista.service;

import vn.tourista.dto.request.admin.AdminHotelStatusUpdateRequest;
import vn.tourista.dto.request.admin.AdminBookingStatusUpdateRequest;
import vn.tourista.dto.request.admin.AdminPromotionStatusUpdateRequest;
import vn.tourista.dto.request.admin.AdminPromotionUpsertRequest;
import vn.tourista.dto.request.admin.AdminTourStatusUpdateRequest;
import vn.tourista.dto.request.admin.AdminUserRoleUpdateRequest;
import vn.tourista.dto.request.admin.AdminUserStatusUpdateRequest;
import vn.tourista.dto.response.admin.AdminBookingItemResponse;
import vn.tourista.dto.response.admin.AdminAuditLogItemResponse;
import vn.tourista.dto.response.admin.AdminHotelItemResponse;
import vn.tourista.dto.response.admin.AdminPageResponse;
import vn.tourista.dto.response.admin.AdminPromotionItemResponse;
import vn.tourista.dto.response.admin.AdminTourItemResponse;
import vn.tourista.dto.response.admin.AdminUserItemResponse;

public interface AdminService {

        AdminPageResponse<AdminUserItemResponse> getUsers(
                        Integer page,
                        Integer size,
                        String q,
                        String status,
                        String sort,
                        String role);

        AdminPageResponse<AdminHotelItemResponse> getHotels(
                        Integer page,
                        Integer size,
                        String q,
                        String status,
                        String sort);

        AdminPageResponse<AdminTourItemResponse> getTours(
                        Integer page,
                        Integer size,
                        String q,
                        String status,
                        String sort);

        AdminPageResponse<AdminBookingItemResponse> getBookings(
                        Integer page,
                        Integer size,
                        String q,
                        String status,
                        String sort,
                        String bookingType,
                        String paymentStatus);

        AdminPageResponse<AdminPromotionItemResponse> getPromotions(
                        Integer page,
                        Integer size,
                        String q,
                        String status,
                        String sort,
                        String type);

        AdminPageResponse<AdminAuditLogItemResponse> getAuditLogs(
                        Integer page,
                        Integer size,
                        String q,
                        String action,
                        String resource,
                        String sort);

        AdminUserItemResponse updateUserRole(Long userId, AdminUserRoleUpdateRequest request, String actorEmail);

        AdminUserItemResponse updateUserStatus(Long userId, AdminUserStatusUpdateRequest request, String actorEmail);

        AdminHotelItemResponse updateHotelStatus(Long hotelId, AdminHotelStatusUpdateRequest request,
                        String actorEmail);

        AdminTourItemResponse updateTourStatus(Long tourId, AdminTourStatusUpdateRequest request, String actorEmail);

        AdminBookingItemResponse updateBookingStatus(Long bookingId, AdminBookingStatusUpdateRequest request,
                        String actorEmail);

        AdminPromotionItemResponse createPromotion(AdminPromotionUpsertRequest request, String actorEmail);

        AdminPromotionItemResponse updatePromotion(Long promotionId, AdminPromotionUpsertRequest request,
                        String actorEmail);

        AdminPromotionItemResponse updatePromotionStatus(Long promotionId, AdminPromotionStatusUpdateRequest request,
                        String actorEmail);

        void deletePromotion(Long promotionId, String reason, String actorEmail);
}