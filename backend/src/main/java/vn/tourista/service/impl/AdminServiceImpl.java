package vn.tourista.service.impl;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.tourista.dto.request.admin.AdminBookingStatusUpdateRequest;
import vn.tourista.dto.request.admin.AdminHotelStatusUpdateRequest;
import vn.tourista.dto.request.admin.AdminHotelUpsertRequest;
import vn.tourista.dto.request.admin.AdminPromotionStatusUpdateRequest;
import vn.tourista.dto.request.admin.AdminPromotionUpsertRequest;
import vn.tourista.dto.request.admin.AdminTourStatusUpdateRequest;
import vn.tourista.dto.request.admin.AdminTourUpsertRequest;
import vn.tourista.dto.request.admin.AdminUserRoleUpdateRequest;
import vn.tourista.dto.request.admin.AdminUserStatusUpdateRequest;
import vn.tourista.dto.response.admin.AdminAuditLogItemResponse;
import vn.tourista.dto.response.admin.AdminBookingItemResponse;
import vn.tourista.dto.response.admin.AdminHotelDetailResponse;
import vn.tourista.dto.response.admin.AdminHotelItemResponse;
import vn.tourista.dto.response.admin.AdminPageResponse;
import vn.tourista.dto.response.admin.AdminPromotionItemResponse;
import vn.tourista.dto.response.admin.AdminTourDetailResponse;
import vn.tourista.dto.response.admin.AdminTourItemResponse;
import vn.tourista.dto.response.admin.AdminUserItemResponse;
import vn.tourista.entity.Amenity;
import vn.tourista.entity.AuditLog;
import vn.tourista.entity.Booking;
import vn.tourista.entity.BookingHotelDetail;
import vn.tourista.entity.BookingTourDetail;
import vn.tourista.entity.City;
import vn.tourista.entity.Hotel;
import vn.tourista.entity.HotelImage;
import vn.tourista.entity.Promotion;
import vn.tourista.entity.Role;
import vn.tourista.entity.RoomType;
import vn.tourista.entity.Tour;
import vn.tourista.entity.TourCategory;
import vn.tourista.entity.TourDeparture;
import vn.tourista.entity.TourImage;
import vn.tourista.entity.TourItinerary;
import vn.tourista.entity.User;
import vn.tourista.repository.AmenityRepository;
import vn.tourista.repository.AuditLogRepository;
import vn.tourista.repository.BookingHotelDetailRepository;
import vn.tourista.repository.BookingRepository;
import vn.tourista.repository.BookingTourDetailRepository;
import vn.tourista.repository.CityRepository;
import vn.tourista.repository.HotelImageRepository;
import vn.tourista.repository.HotelRepository;
import vn.tourista.repository.PromotionRepository;
import vn.tourista.repository.RoleRepository;
import vn.tourista.repository.RoomTypeRepository;
import vn.tourista.repository.TourCategoryRepository;
import vn.tourista.repository.TourDepartureRepository;
import vn.tourista.repository.TourImageRepository;
import vn.tourista.repository.TourItineraryRepository;
import vn.tourista.repository.TourRepository;
import vn.tourista.repository.UserRepository;
import vn.tourista.service.AdminService;
import vn.tourista.util.SlugUtil;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AdminServiceImpl implements AdminService {

    private static final int DEFAULT_PAGE = 1;
    private static final int DEFAULT_SIZE = 10;
    private static final int MAX_SIZE = 100;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private HotelRepository hotelRepository;

    @Autowired
    private TourRepository tourRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private BookingHotelDetailRepository bookingHotelDetailRepository;

    @Autowired
    private BookingTourDetailRepository bookingTourDetailRepository;

    @Autowired
    private PromotionRepository promotionRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private TourCategoryRepository tourCategoryRepository;

    @Autowired
    private HotelImageRepository hotelImageRepository;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @Autowired
    private AmenityRepository amenityRepository;

    @Autowired
    private TourImageRepository tourImageRepository;

    @Autowired
    private TourItineraryRepository tourItineraryRepository;

    @Autowired
    private TourDepartureRepository tourDepartureRepository;

    @Override
    public AdminPageResponse<AdminUserItemResponse> getUsers(
            Integer page,
            Integer size,
            String q,
            String status,
            String sort,
            String role) {

        Pageable pageable = buildPageable(
                page,
                size,
                sort,
                "createdAt",
                Set.of("id", "fullName", "email", "status", "createdAt", "lastLoginAt", "updatedAt"));

        Specification<User> spec = (root, query, cb) -> {
            Predicate predicate = cb.conjunction();

            if (StringUtils.hasText(q)) {
                String keyword = likePattern(q);
                Join<User, ?> roleJoin = root.join("role", JoinType.LEFT);
                predicate = cb.and(predicate, cb.or(
                        cb.like(cb.lower(root.get("fullName")), keyword),
                        cb.like(cb.lower(root.get("email")), keyword),
                        cb.like(cb.lower(cb.coalesce(root.get("phone"), "")), keyword),
                        cb.like(cb.lower(cb.coalesce(roleJoin.get("name"), "")), keyword)));
            }

            if (StringUtils.hasText(role) && !"ALL".equalsIgnoreCase(role)) {
                Join<User, ?> roleJoin = root.join("role", JoinType.LEFT);
                predicate = cb.and(predicate,
                        cb.equal(cb.upper(roleJoin.get("name")), role.trim().toUpperCase(Locale.ROOT)));
            }

            if (StringUtils.hasText(status) && !"ALL".equalsIgnoreCase(status)) {
                User.UserStatus userStatus = parseEnum(User.UserStatus.class, status, "users.status");
                predicate = cb.and(predicate, cb.equal(root.get("status"), userStatus));
            }

            return predicate;
        };

        Page<User> userPage = userRepository.findAll(spec, pageable);
        List<AdminUserItemResponse> items = userPage.getContent().stream()
                .map(user -> AdminUserItemResponse.builder()
                        .id(user.getId())
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .phone(user.getPhone())
                        .roleName(user.getRole() != null ? user.getRole().getName() : null)
                        .status(user.getStatus() != null ? user.getStatus().name() : null)
                        .isEmailVerified(Boolean.TRUE.equals(user.getIsEmailVerified()))
                        .authProvider(user.getAuthProvider() != null ? user.getAuthProvider().name() : null)
                        .createdAt(user.getCreatedAt())
                        .lastLoginAt(user.getLastLoginAt())
                        .build())
                .toList();

        return toPageResponse(userPage, items);
    }

    @Override
    public AdminPageResponse<AdminHotelItemResponse> getHotels(
            Integer page,
            Integer size,
            String q,
            String status,
            String sort) {

        Pageable pageable = buildPageable(
                page,
                size,
                sort,
                "createdAt",
                Set.of("id", "name", "starRating", "avgRating", "reviewCount", "createdAt", "updatedAt"));

        Specification<Hotel> spec = (root, query, cb) -> {
            Predicate predicate = cb.conjunction();

            if (StringUtils.hasText(q)) {
                String keyword = likePattern(q);
                Join<Hotel, ?> cityJoin = root.join("city", JoinType.LEFT);
                Join<Hotel, ?> ownerJoin = root.join("owner", JoinType.LEFT);

                predicate = cb.and(predicate, cb.or(
                        cb.like(cb.lower(root.get("name")), keyword),
                        cb.like(cb.lower(cb.coalesce(root.get("address"), "")), keyword),
                        cb.like(cb.lower(cb.coalesce(cityJoin.get("nameVi"), "")), keyword),
                        cb.like(cb.lower(cb.coalesce(cityJoin.get("nameEn"), "")), keyword),
                        cb.like(cb.lower(cb.coalesce(ownerJoin.get("fullName"), "")), keyword),
                        cb.like(cb.lower(cb.coalesce(ownerJoin.get("email"), "")), keyword)));
            }

            if (StringUtils.hasText(status) && !"ALL".equalsIgnoreCase(status)) {
                String normalized = status.trim().toUpperCase(Locale.ROOT);
                switch (normalized) {
                    case "ACTIVE", "APPROVED" -> {
                        predicate = cb.and(predicate, cb.isTrue(root.get("isActive")));
                        if ("APPROVED".equals(normalized)) {
                            predicate = cb.and(predicate, cb.or(
                                    cb.equal(root.get("adminStatus"), Hotel.AdminStatus.APPROVED),
                                    cb.isNull(root.get("adminStatus"))));
                        }
                    }
                    case "INACTIVE" -> predicate = cb.and(predicate, cb.isFalse(root.get("isActive")));
                    case "PENDING", "REJECTED", "SUSPENDED" -> {
                        Hotel.AdminStatus adminStatus = parseEnum(Hotel.AdminStatus.class, normalized, "hotels.status");
                        predicate = cb.and(predicate, cb.equal(root.get("adminStatus"), adminStatus));
                    }
                    default -> throw new IllegalArgumentException("Giá trị status không hợp lệ cho hotels");
                }
            }

            return predicate;
        };

        Page<Hotel> hotelPage = hotelRepository.findAll(spec, pageable);
        List<AdminHotelItemResponse> items = hotelPage.getContent().stream()
                .map(hotel -> {
                    String city = hotel.getCity() != null
                            ? firstNotBlank(hotel.getCity().getNameVi(), hotel.getCity().getNameEn())
                            : null;

                    String hostName = hotel.getOwner() != null ? hotel.getOwner().getFullName() : null;
                    String hostEmail = hotel.getOwner() != null ? hotel.getOwner().getEmail() : null;

                    String mappedStatus;
                    if (hotel.getAdminStatus() != null) {
                        mappedStatus = hotel.getAdminStatus().name();
                    } else {
                        mappedStatus = Boolean.TRUE.equals(hotel.getIsActive()) ? "APPROVED" : "SUSPENDED";
                    }

                    return AdminHotelItemResponse.builder()
                            .id(hotel.getId())
                            .name(hotel.getName())
                            .city(city)
                            .address(hotel.getAddress())
                            .starRating(hotel.getStarRating())
                            .avgRating(hotel.getAvgRating())
                            .reviewCount(hotel.getReviewCount())
                            .hostName(hostName)
                            .hostEmail(hostEmail)
                            .status(mappedStatus)
                            .isActive(hotel.getIsActive())
                            .createdAt(hotel.getCreatedAt())
                            .updatedAt(hotel.getUpdatedAt())
                            .build();
                })
                .toList();

        return toPageResponse(hotelPage, items);
    }

    @Override
    public AdminPageResponse<AdminTourItemResponse> getTours(
            Integer page,
            Integer size,
            String q,
            String status,
            String sort) {

        Pageable pageable = buildPageable(
                page,
                size,
                sort,
                "createdAt",
                Set.of("id", "title", "durationDays", "pricePerAdult", "avgRating", "createdAt", "updatedAt"));

        Specification<Tour> spec = (root, query, cb) -> {
            Predicate predicate = cb.conjunction();

            if (StringUtils.hasText(q)) {
                String keyword = likePattern(q);
                Join<Tour, ?> cityJoin = root.join("city", JoinType.LEFT);
                Join<Tour, ?> operatorJoin = root.join("operator", JoinType.LEFT);

                predicate = cb.and(predicate, cb.or(
                        cb.like(cb.lower(root.get("title")), keyword),
                        cb.like(cb.lower(cb.coalesce(cityJoin.get("nameVi"), "")), keyword),
                        cb.like(cb.lower(cb.coalesce(cityJoin.get("nameEn"), "")), keyword),
                        cb.like(cb.lower(cb.coalesce(operatorJoin.get("fullName"), "")), keyword),
                        cb.like(cb.lower(cb.coalesce(operatorJoin.get("email"), "")), keyword)));
            }

            if (StringUtils.hasText(status) && !"ALL".equalsIgnoreCase(status)) {
                String normalized = status.trim().toUpperCase(Locale.ROOT);
                switch (normalized) {
                    case "ACTIVE", "APPROVED" -> predicate = cb.and(predicate, cb.isTrue(root.get("isActive")));
                    case "INACTIVE", "SUSPENDED", "PENDING", "REJECTED" -> predicate = cb.and(predicate,
                            cb.isFalse(root.get("isActive")));
                    default -> throw new IllegalArgumentException("Giá trị status không hợp lệ cho tours");
                }
            }

            return predicate;
        };

        Page<Tour> tourPage = tourRepository.findAll(spec, pageable);
        List<AdminTourItemResponse> items = tourPage.getContent().stream()
                .map(tour -> {
                    String city = tour.getCity() != null
                            ? firstNotBlank(tour.getCity().getNameVi(), tour.getCity().getNameEn())
                            : null;

                    String operatorName = tour.getOperator() != null ? tour.getOperator().getFullName() : null;
                    String operatorEmail = tour.getOperator() != null ? tour.getOperator().getEmail() : null;
                    String mappedStatus = Boolean.TRUE.equals(tour.getIsActive()) ? "APPROVED" : "SUSPENDED";

                    return AdminTourItemResponse.builder()
                            .id(tour.getId())
                            .title(tour.getTitle())
                            .city(city)
                            .location(city)
                            .durationDays(tour.getDurationDays())
                            .priceFrom(tour.getPricePerAdult())
                            .operatorName(operatorName)
                            .operatorEmail(operatorEmail)
                            .status(mappedStatus)
                            .isActive(tour.getIsActive())
                            .createdAt(tour.getCreatedAt())
                            .updatedAt(tour.getUpdatedAt())
                            .build();
                })
                .toList();

        return toPageResponse(tourPage, items);
    }

    @Override
    public AdminPageResponse<AdminBookingItemResponse> getBookings(
            Integer page,
            Integer size,
            String q,
            String status,
            String sort,
            String bookingType,
            String paymentStatus) {

        Pageable pageable = buildPageable(
                page,
                size,
                sort,
                "createdAt",
                Set.of("id", "bookingCode", "status", "totalAmount", "createdAt", "updatedAt", "confirmedAt"));

        Specification<Booking> spec = (root, query, cb) -> {
            Predicate predicate = cb.conjunction();

            if (StringUtils.hasText(q)) {
                String keyword = likePattern(q);
                predicate = cb.and(predicate, cb.or(
                        cb.like(cb.lower(root.get("bookingCode")), keyword),
                        cb.like(cb.lower(cb.coalesce(root.get("guestName"), "")), keyword),
                        cb.like(cb.lower(cb.coalesce(root.get("guestEmail"), "")), keyword),
                        cb.like(cb.lower(cb.coalesce(root.get("guestPhone"), "")), keyword)));
            }

            if (StringUtils.hasText(status) && !"ALL".equalsIgnoreCase(status)) {
                Booking.BookingStatus bookingStatus = parseEnum(Booking.BookingStatus.class, status, "bookings.status");
                predicate = cb.and(predicate, cb.equal(root.get("status"), bookingStatus));
            }

            if (StringUtils.hasText(bookingType) && !"ALL".equalsIgnoreCase(bookingType)) {
                Booking.BookingType type = parseEnum(Booking.BookingType.class, bookingType, "bookings.type");
                predicate = cb.and(predicate, cb.equal(root.get("bookingType"), type));
            }

            if (StringUtils.hasText(paymentStatus) && !"ALL".equalsIgnoreCase(paymentStatus)) {
                String normalizedPaymentStatus = paymentStatus.trim().toUpperCase(Locale.ROOT);
                switch (normalizedPaymentStatus) {
                    case "PAID" -> predicate = cb.and(predicate,
                            root.get("status").in(
                                    Booking.BookingStatus.CONFIRMED,
                                    Booking.BookingStatus.CHECKED_IN,
                                    Booking.BookingStatus.COMPLETED));
                    case "PENDING" -> predicate = cb.and(predicate,
                            cb.equal(root.get("status"), Booking.BookingStatus.PENDING));
                    case "FAILED" -> predicate = cb.and(predicate,
                            cb.equal(root.get("status"), Booking.BookingStatus.CANCELLED));
                    case "REFUNDED" -> predicate = cb.and(predicate,
                            cb.equal(root.get("status"), Booking.BookingStatus.REFUNDED));
                    default -> throw new IllegalArgumentException("Gia tri paymentStatus khong hop le cho bookings");
                }
            }

            return predicate;
        };

        Page<Booking> bookingPage = bookingRepository.findAll(spec, pageable);
        List<Long> bookingIds = bookingPage.getContent().stream().map(Booking::getId).toList();

        Map<Long, BookingHotelDetail> hotelDetailMap = new HashMap<>();
        Map<Long, BookingTourDetail> tourDetailMap = new HashMap<>();

        if (!bookingIds.isEmpty()) {
            hotelDetailMap = bookingHotelDetailRepository.findByBooking_IdIn(bookingIds).stream()
                    .collect(Collectors.toMap(detail -> detail.getBooking().getId(), detail -> detail,
                            (left, right) -> left));

            tourDetailMap = bookingTourDetailRepository.findByBooking_IdIn(bookingIds).stream()
                    .collect(Collectors.toMap(detail -> detail.getBooking().getId(), detail -> detail,
                            (left, right) -> left));
        }

        Map<Long, BookingHotelDetail> finalHotelDetailMap = hotelDetailMap;
        Map<Long, BookingTourDetail> finalTourDetailMap = tourDetailMap;

        List<AdminBookingItemResponse> items = bookingPage.getContent().stream()
                .map(booking -> toBookingItem(
                        booking,
                        finalHotelDetailMap.get(booking.getId()),
                        finalTourDetailMap.get(booking.getId())))
                .toList();

        return toPageResponse(bookingPage, items);
    }

    @Override
    public AdminPageResponse<AdminPromotionItemResponse> getPromotions(
            Integer page,
            Integer size,
            String q,
            String status,
            String sort,
            String type) {

        Pageable pageable = buildPageable(
                page,
                size,
                sort,
                "createdAt",
                Set.of("id", "code", "name", "discountValue", "usedCount", "validFrom", "validUntil", "isActive",
                        "createdAt"));

        Specification<Promotion> spec = (root, query, cb) -> {
            Predicate predicate = cb.conjunction();
            LocalDateTime now = LocalDateTime.now();

            if (StringUtils.hasText(q)) {
                String keyword = likePattern(q);
                predicate = cb.and(predicate, cb.or(
                        cb.like(cb.lower(root.get("code")), keyword),
                        cb.like(cb.lower(root.get("name")), keyword),
                        cb.like(cb.lower(cb.coalesce(root.get("description"), "")), keyword)));
            }

            if (StringUtils.hasText(type) && !"ALL".equalsIgnoreCase(type)) {
                String normalizedType = type.trim().toUpperCase(Locale.ROOT);
                Promotion.DiscountType discountType;
                if ("PERCENT".equals(normalizedType) || "PERCENTAGE".equals(normalizedType)) {
                    discountType = Promotion.DiscountType.PERCENTAGE;
                } else if ("FIXED".equals(normalizedType)) {
                    discountType = Promotion.DiscountType.FIXED;
                } else {
                    throw new IllegalArgumentException("Giá trị type không hợp lệ cho promotions");
                }
                predicate = cb.and(predicate, cb.equal(root.get("discountType"), discountType));
            }

            if (StringUtils.hasText(status) && !"ALL".equalsIgnoreCase(status)) {
                String normalized = status.trim().toUpperCase(Locale.ROOT);
                switch (normalized) {
                    case "ACTIVE" -> predicate = cb.and(predicate,
                            cb.isTrue(root.get("isActive")),
                            cb.lessThanOrEqualTo(root.get("validFrom"), now),
                            cb.greaterThanOrEqualTo(root.get("validUntil"), now));
                    case "INACTIVE" -> predicate = cb.and(predicate, cb.isFalse(root.get("isActive")));
                    case "UPCOMING" -> predicate = cb.and(predicate,
                            cb.isTrue(root.get("isActive")),
                            cb.greaterThan(root.get("validFrom"), now));
                    case "EXPIRED" -> predicate = cb.and(predicate,
                            cb.lessThan(root.get("validUntil"), now));
                    default -> throw new IllegalArgumentException("Giá trị status không hợp lệ cho promotions");
                }
            }

            return predicate;
        };

        Page<Promotion> promotionPage = promotionRepository.findAll(spec, pageable);
        List<AdminPromotionItemResponse> items = promotionPage.getContent().stream()
                .map(promotion -> AdminPromotionItemResponse.builder()
                        .id(promotion.getId())
                        .code(promotion.getCode())
                        .name(promotion.getName())
                        .description(promotion.getDescription())
                        .type(promotion.getDiscountType() != null ? promotion.getDiscountType().name() : null)
                        .value(promotion.getDiscountValue())
                        .minOrderAmount(promotion.getMinOrderAmount())
                        .maxDiscountAmount(promotion.getMaxDiscountAmount())
                        .usageLimit(promotion.getUsageLimit())
                        .usedCount(promotion.getUsedCount())
                        .appliesTo(promotion.getAppliesTo() != null ? promotion.getAppliesTo().name() : null)
                        .startAt(promotion.getValidFrom())
                        .endAt(promotion.getValidUntil())
                        .isActive(promotion.getIsActive())
                        .createdAt(promotion.getCreatedAt())
                        .updatedAt(promotion.getUpdatedAt())
                        .build())
                .toList();

        return toPageResponse(promotionPage, items);
    }

    @Override
    public AdminPromotionItemResponse getPromotionById(Long promotionId) {
        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay promotion"));
        return toPromotionItem(promotion);
    }

    @Override
    public AdminPageResponse<AdminAuditLogItemResponse> getAuditLogs(
            Integer page,
            Integer size,
            String q,
            String action,
            String resource,
            String sort) {

        Pageable pageable = buildPageable(
                page,
                size,
                sort,
                "createdAt",
                Set.of("id", "createdAt", "action", "resourceType", "actorEmail", "resourceId"));

        Specification<AuditLog> spec = (root, query, cb) -> {
            Predicate predicate = cb.conjunction();

            if (StringUtils.hasText(q)) {
                String keyword = likePattern(q);
                predicate = cb.and(predicate, cb.or(
                        cb.like(cb.lower(cb.coalesce(root.get("actorEmail"), "")), keyword),
                        cb.like(cb.lower(root.get("action")), keyword),
                        cb.like(cb.lower(root.get("resourceType")), keyword),
                        cb.like(cb.lower(cb.coalesce(root.get("reason"), "")), keyword)));
            }

            if (StringUtils.hasText(action) && !"ALL".equalsIgnoreCase(action)) {
                predicate = cb.and(predicate,
                        cb.equal(cb.upper(root.get("action")), action.trim().toUpperCase(Locale.ROOT)));
            }

            if (StringUtils.hasText(resource) && !"ALL".equalsIgnoreCase(resource)) {
                predicate = cb.and(predicate,
                        cb.equal(cb.upper(root.get("resourceType")), resource.trim().toUpperCase(Locale.ROOT)));
            }

            return predicate;
        };

        Page<AuditLog> logPage = auditLogRepository.findAll(spec, pageable);
        List<AdminAuditLogItemResponse> items = logPage.getContent().stream()
                .map(log -> AdminAuditLogItemResponse.builder()
                        .id(log.getId())
                        .actorId(log.getActor() != null ? log.getActor().getId() : null)
                        .actorEmail(log.getActorEmail())
                        .action(log.getAction())
                        .resource(log.getResourceType())
                        .resourceId(log.getResourceId())
                        .beforeData(log.getOldValue())
                        .afterData(log.getNewValue())
                        .reason(log.getReason())
                        .timestamp(log.getCreatedAt())
                        .build())
                .toList();

        return toPageResponse(logPage, items);
    }

    @Override
    @Transactional
    public AdminUserItemResponse updateUserRole(Long userId, AdminUserRoleUpdateRequest request, String actorEmail) {
        String reason = normalizeReason(request.getReason());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay user"));

        AdminUserItemResponse before = toUserItem(user);

        String roleName = request.getRole().trim().toUpperCase(Locale.ROOT);
        Role role = roleRepository.findByName(roleName)
                .orElseThrow(() -> new IllegalArgumentException("Role khong hop le"));

        user.setRole(role);
        User saved = userRepository.save(user);
        AdminUserItemResponse after = toUserItem(saved);

        saveAudit(actorEmail, "UPDATE_USER_ROLE", "USERS", saved.getId(), before, after, reason);
        return after;
    }

    @Override
    @Transactional
    public AdminUserItemResponse updateUserStatus(Long userId, AdminUserStatusUpdateRequest request,
            String actorEmail) {
        String reason = normalizeReason(request.getReason());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay user"));

        AdminUserItemResponse before = toUserItem(user);

        User.UserStatus nextStatus = parseEnum(User.UserStatus.class, request.getStatus(), "users.status");
        user.setStatus(nextStatus);

        if (nextStatus == User.UserStatus.ACTIVE) {
            user.setLockedUntil(null);
            user.setFailedAttempts(0);
        }

        User saved = userRepository.save(user);
        AdminUserItemResponse after = toUserItem(saved);

        saveAudit(actorEmail, "UPDATE_USER_STATUS", "USERS", saved.getId(), before, after, reason);
        return after;
    }

    @Override
    @Transactional
    public AdminHotelItemResponse updateHotelStatus(Long hotelId, AdminHotelStatusUpdateRequest request,
            String actorEmail) {
        String reason = normalizeReason(request.getReason());

        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay hotel"));

        AdminHotelItemResponse before = toHotelItem(hotel, null);

        Hotel.AdminStatus status = parseEnum(Hotel.AdminStatus.class, request.getStatus(), "hotels.status");
        hotel.setAdminStatus(status);
        hotel.setAdminNote(reason);
        hotel.setIsActive(status == Hotel.AdminStatus.APPROVED);
        hotel.setUpdatedAt(LocalDateTime.now());

        Hotel saved = hotelRepository.save(hotel);
        AdminHotelItemResponse after = toHotelItem(saved, status.name());

        saveAudit(actorEmail, "UPDATE_HOTEL_STATUS", "HOTELS", saved.getId(), before, after, reason);
        return after;
    }

    @Override
    @Transactional
    public AdminTourItemResponse updateTourStatus(Long tourId, AdminTourStatusUpdateRequest request,
            String actorEmail) {
        String reason = normalizeReason(request.getReason());

        Tour tour = tourRepository.findById(tourId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay tour"));

        AdminTourItemResponse before = toTourItem(tour, null);

        String normalizedStatus = request.getStatus().trim().toUpperCase(Locale.ROOT);
        if (!Set.of("APPROVED", "REJECTED", "SUSPENDED", "PENDING").contains(normalizedStatus)) {
            throw new IllegalArgumentException("Gia tri tours.status khong hop le");
        }

        tour.setIsActive("APPROVED".equals(normalizedStatus));
        tour.setUpdatedAt(LocalDateTime.now());

        Tour saved = tourRepository.save(tour);
        AdminTourItemResponse after = toTourItem(saved, normalizedStatus);

        saveAudit(actorEmail, "UPDATE_TOUR_STATUS", "TOURS", saved.getId(), before, after, reason);
        return after;
    }

    @Override
    @Transactional
    public AdminBookingItemResponse updateBookingStatus(Long bookingId, AdminBookingStatusUpdateRequest request,
            String actorEmail) {
        String reason = normalizeReason(request.getReason());

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay booking"));

        BookingHotelDetail hotelDetail = loadHotelDetail(bookingId);
        BookingTourDetail tourDetail = loadTourDetail(bookingId);

        AdminBookingItemResponse before = toBookingItem(booking, hotelDetail, tourDetail);

        Booking.BookingStatus nextStatus = parseEnum(Booking.BookingStatus.class, request.getStatus(),
                "bookings.status");
        booking.setStatus(nextStatus);

        if (nextStatus == Booking.BookingStatus.CONFIRMED && booking.getConfirmedAt() == null) {
            booking.setConfirmedAt(LocalDateTime.now());
        }

        if (nextStatus == Booking.BookingStatus.CANCELLED) {
            booking.setCancelledAt(LocalDateTime.now());
            booking.setCancelReason(reason);
        } else {
            booking.setCancelledAt(null);
            booking.setCancelReason(null);
        }

        booking.setUpdatedAt(LocalDateTime.now());

        Booking saved = bookingRepository.save(booking);
        AdminBookingItemResponse after = toBookingItem(saved, hotelDetail, tourDetail);

        saveAudit(actorEmail, "UPDATE_BOOKING_STATUS", "BOOKINGS", saved.getId(), before, after, reason);
        return after;
    }

    @Override
    @Transactional
    public AdminPromotionItemResponse createPromotion(AdminPromotionUpsertRequest request, String actorEmail) {
        String reason = normalizeReason(request.getReason());

        Promotion promotion = new Promotion();
        applyPromotionPayload(promotion, request, true);
        promotion.setCreatedAt(LocalDateTime.now());
        promotion.setUsedCount(0);

        Promotion saved = promotionRepository.save(promotion);
        AdminPromotionItemResponse after = toPromotionItem(saved);

        saveAudit(actorEmail, "CREATE_PROMOTION", "PROMOTIONS", saved.getId(), null, after, reason);
        return after;
    }

    @Override
    @Transactional
    public AdminPromotionItemResponse updatePromotion(Long promotionId, AdminPromotionUpsertRequest request,
            String actorEmail) {
        String reason = normalizeReason(request.getReason());

        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay promotion"));

        AdminPromotionItemResponse before = toPromotionItem(promotion);

        applyPromotionPayload(promotion, request, false);
        promotion.setUpdatedAt(LocalDateTime.now());

        Promotion saved = promotionRepository.save(promotion);
        AdminPromotionItemResponse after = toPromotionItem(saved);

        saveAudit(actorEmail, "UPDATE_PROMOTION", "PROMOTIONS", saved.getId(), before, after, reason);
        return after;
    }

    @Override
    @Transactional
    public AdminPromotionItemResponse updatePromotionStatus(Long promotionId, AdminPromotionStatusUpdateRequest request,
            String actorEmail) {
        String reason = normalizeReason(request.getReason());

        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay promotion"));

        AdminPromotionItemResponse before = toPromotionItem(promotion);

        promotion.setIsActive(request.getIsActive());
        promotion.setUpdatedAt(LocalDateTime.now());
        Promotion saved = promotionRepository.save(promotion);
        AdminPromotionItemResponse after = toPromotionItem(saved);

        saveAudit(actorEmail, "UPDATE_PROMOTION_STATUS", "PROMOTIONS", saved.getId(), before, after, reason);
        return after;
    }

    @Override
    @Transactional
    public void deletePromotion(Long promotionId, String reason, String actorEmail) {
        String normalizedReason = normalizeReason(reason);

        Promotion promotion = promotionRepository.findById(promotionId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay promotion"));

        AdminPromotionItemResponse before = toPromotionItem(promotion);

        promotionRepository.delete(promotion);

        Map<String, Object> after = Map.of(
                "deleted", true,
                "id", promotionId);
        saveAudit(actorEmail, "DELETE_PROMOTION", "PROMOTIONS", promotionId, before, after, normalizedReason);
    }

    // ===================== HOTEL CRUD =====================

    @Override
    @Transactional(readOnly = true)
    public AdminHotelDetailResponse getHotelById(Long hotelId) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay hotel"));

        List<HotelImage> images = hotelImageRepository.findByHotel_IdOrderBySortOrderAscIdAsc(hotelId);
        List<RoomType> allRoomTypes = roomTypeRepository.findAll();
        List<RoomType> hotelRoomTypes = allRoomTypes.stream()
                .filter(rt -> rt.getHotel() != null && rt.getHotel().getId().equals(hotelId))
                .toList();

        return buildHotelDetail(hotel, images, hotelRoomTypes);
    }

    @Override
    @Transactional
    public AdminHotelItemResponse createHotel(AdminHotelUpsertRequest request, String actorEmail) {
        String reason = normalizeReason(request.getReason());

        City city = cityRepository.findById(request.getCityId())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay city"));

        User owner = null;
        if (request.getOwnerId() != null) {
            owner = userRepository.findById(request.getOwnerId()).orElse(null);
        }

        String slug = SlugUtil.toSlug(request.getName()) + "-" + System.currentTimeMillis();

        Hotel hotel = Hotel.builder()
                .city(city)
                .owner(owner)
                .name(request.getName().trim())
                .slug(slug)
                .description(request.getDescription())
                .address(request.getAddress().trim())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .starRating(request.getStarRating())
                .avgRating(java.math.BigDecimal.ZERO)
                .reviewCount(0)
                .checkInTime(request.getCheckInTime() != null ? request.getCheckInTime() : java.time.LocalTime.of(14, 0))
                .checkOutTime(request.getCheckOutTime() != null ? request.getCheckOutTime() : java.time.LocalTime.of(12, 0))
                .phone(request.getPhone())
                .email(request.getEmail())
                .website(request.getWebsite())
                .isFeatured(Boolean.TRUE.equals(request.getIsFeatured()))
                .isTrending(Boolean.TRUE.equals(request.getIsTrending()))
                .isActive(request.getIsActive() == null ? Boolean.TRUE : request.getIsActive())
                .adminStatus(Hotel.AdminStatus.APPROVED)
                .build();
        hotel.setCreatedAt(LocalDateTime.now());
        hotel.setUpdatedAt(LocalDateTime.now());

        Hotel saved = hotelRepository.save(hotel);

        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            saveHotelImages(saved, request.getImageUrls(), request.getCoverImage());
        }

        if (request.getRoomTypes() != null && !request.getRoomTypes().isEmpty()) {
            saveHotelRoomTypes(saved, request.getRoomTypes());
        }

        AdminHotelItemResponse after = toHotelItem(saved, null);
        saveAudit(actorEmail, "CREATE_HOTEL", "HOTELS", saved.getId(), null, after, reason);
        return after;
    }

    @Override
    @Transactional
    public AdminHotelItemResponse updateHotel(Long hotelId, AdminHotelUpsertRequest request, String actorEmail) {
        String reason = normalizeReason(request.getReason());

        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay hotel"));

        AdminHotelItemResponse before = toHotelItem(hotel, null);

        City city = cityRepository.findById(request.getCityId())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay city"));
        hotel.setCity(city);

        if (request.getOwnerId() != null) {
            User owner = userRepository.findById(request.getOwnerId()).orElse(null);
            hotel.setOwner(owner);
        }

        hotel.setName(request.getName().trim());
        hotel.setDescription(request.getDescription());
        hotel.setAddress(request.getAddress().trim());
        hotel.setLatitude(request.getLatitude());
        hotel.setLongitude(request.getLongitude());
        hotel.setStarRating(request.getStarRating());
        if (request.getCheckInTime() != null) {
            hotel.setCheckInTime(request.getCheckInTime());
        }
        if (request.getCheckOutTime() != null) {
            hotel.setCheckOutTime(request.getCheckOutTime());
        }
        hotel.setPhone(request.getPhone());
        hotel.setEmail(request.getEmail());
        hotel.setWebsite(request.getWebsite());
        hotel.setIsFeatured(Boolean.TRUE.equals(request.getIsFeatured()));
        hotel.setIsTrending(Boolean.TRUE.equals(request.getIsTrending()));
        if (request.getIsActive() != null) {
            hotel.setIsActive(request.getIsActive());
        }

        if (StringUtils.hasText(request.getStatus())) {
            Hotel.AdminStatus adminStatus = parseEnum(Hotel.AdminStatus.class, request.getStatus(), "hotels.status");
            hotel.setAdminStatus(adminStatus);
            hotel.setIsActive(adminStatus == Hotel.AdminStatus.APPROVED);
        }

        Hotel saved = hotelRepository.save(hotel);

        if (request.getImageUrls() != null) {
            hotelImageRepository.deleteByHotel_Id(hotelId);
            saveHotelImages(saved, request.getImageUrls(), request.getCoverImage());
        }

        AdminHotelItemResponse after = toHotelItem(saved, null);
        saveAudit(actorEmail, "UPDATE_HOTEL", "HOTELS", saved.getId(), before, after, reason);
        return after;
    }

    // ===================== TOUR CRUD =====================

    @Override
    @Transactional(readOnly = true)
    public AdminTourDetailResponse getTourById(Long tourId) {
        Tour tour = tourRepository.findById(tourId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay tour"));

        List<TourImage> images = tourImageRepository.findByTour_IdOrderBySortOrderAscIdAsc(tourId);
        List<TourItinerary> itinerary = tourItineraryRepository.findByTour_IdOrderByDayNumberAscIdAsc(tourId);
        List<TourDeparture> departures = tourDepartureRepository.findByTour_IdOrderByDepartureDateAsc(tourId);

        return buildTourDetail(tour, images, itinerary, departures);
    }

    @Override
    @Transactional
    public AdminTourItemResponse createTour(AdminTourUpsertRequest request, String actorEmail) {
        String reason = normalizeReason(request.getReason());

        TourCategory category = tourCategoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay category"));
        City city = cityRepository.findById(request.getCityId())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay city"));

        User operator = null;
        if (request.getOperatorId() != null) {
            operator = userRepository.findById(request.getOperatorId()).orElse(null);
        }

        String slug = SlugUtil.toSlug(request.getTitle()) + "-" + System.currentTimeMillis();
        Tour.Difficulty difficulty = parseEnum(Tour.Difficulty.class, request.getDifficulty(), "tours.difficulty");

        Tour tour = Tour.builder()
                .category(category)
                .city(city)
                .operator(operator)
                .title(request.getTitle().trim())
                .slug(slug)
                .description(request.getDescription())
                .highlights(request.getHighlights())
                .includes(request.getIncludes())
                .excludes(request.getExcludes())
                .durationDays(request.getDurationDays())
                .durationNights(request.getDurationNights() != null ? request.getDurationNights() : request.getDurationDays() - 1)
                .maxGroupSize(request.getMaxGroupSize())
                .minGroupSize(request.getMinGroupSize())
                .difficulty(difficulty)
                .pricePerAdult(request.getPricePerAdult())
                .pricePerChild(request.getPricePerChild() != null ? request.getPricePerChild() : java.math.BigDecimal.ZERO)
                .avgRating(java.math.BigDecimal.ZERO)
                .reviewCount(0)
                .isFeatured(Boolean.TRUE.equals(request.getIsFeatured()))
                .isActive(request.getIsActive() == null ? Boolean.TRUE : request.getIsActive())
                .build();
        tour.setCreatedAt(LocalDateTime.now());
        tour.setUpdatedAt(LocalDateTime.now());

        Tour saved = tourRepository.save(tour);

        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            saveTourImages(saved, request.getImageUrls(), request.getCoverImage());
        }
        if (request.getItineraryItems() != null && !request.getItineraryItems().isEmpty()) {
            saveTourItinerary(saved, request.getItineraryItems());
        }
        if (request.getDepartureDates() != null && !request.getDepartureDates().isEmpty()) {
            saveTourDepartures(saved, request.getDepartureDates());
        }

        AdminTourItemResponse after = toTourItem(saved, null);
        saveAudit(actorEmail, "CREATE_TOUR", "TOURS", saved.getId(), null, after, reason);
        return after;
    }

    @Override
    @Transactional
    public AdminTourItemResponse updateTour(Long tourId, AdminTourUpsertRequest request, String actorEmail) {
        String reason = normalizeReason(request.getReason());

        Tour tour = tourRepository.findById(tourId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay tour"));

        AdminTourItemResponse before = toTourItem(tour, null);

        TourCategory category = tourCategoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay category"));
        City city = cityRepository.findById(request.getCityId())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay city"));

        tour.setCategory(category);
        tour.setCity(city);

        if (request.getOperatorId() != null) {
            User operator = userRepository.findById(request.getOperatorId()).orElse(null);
            tour.setOperator(operator);
        }

        tour.setTitle(request.getTitle().trim());
        tour.setDescription(request.getDescription());
        tour.setHighlights(request.getHighlights());
        tour.setIncludes(request.getIncludes());
        tour.setExcludes(request.getExcludes());
        tour.setDurationDays(request.getDurationDays());
        tour.setDurationNights(request.getDurationNights() != null ? request.getDurationNights() : request.getDurationDays() - 1);
        tour.setMaxGroupSize(request.getMaxGroupSize());
        tour.setMinGroupSize(request.getMinGroupSize());
        tour.setDifficulty(parseEnum(Tour.Difficulty.class, request.getDifficulty(), "tours.difficulty"));
        tour.setPricePerAdult(request.getPricePerAdult());
        if (request.getPricePerChild() != null) {
            tour.setPricePerChild(request.getPricePerChild());
        }
        tour.setIsFeatured(Boolean.TRUE.equals(request.getIsFeatured()));
        if (request.getIsActive() != null) {
            tour.setIsActive(request.getIsActive());
        }

        if (StringUtils.hasText(request.getStatus())) {
            String normalized = request.getStatus().trim().toUpperCase(Locale.ROOT);
            tour.setIsActive("APPROVED".equals(normalized) || "ACTIVE".equals(normalized));
        }

        Tour saved = tourRepository.save(tour);

        if (request.getImageUrls() != null) {
            List<TourImage> existingImages = tourImageRepository.findByTour_IdOrderBySortOrderAscIdAsc(tourId);
            tourImageRepository.deleteAll(existingImages);
            saveTourImages(saved, request.getImageUrls(), request.getCoverImage());
        }

        AdminTourItemResponse after = toTourItem(saved, null);
        saveAudit(actorEmail, "UPDATE_TOUR", "TOURS", saved.getId(), before, after, reason);
        return after;
    }

    // ===================== PRIVATE HELPERS =====================

    private void saveHotelImages(Hotel hotel, List<String> urls, String coverUrl) {
        for (int i = 0; i < urls.size(); i++) {
            String url = urls.get(i);
            boolean isCover = coverUrl != null && coverUrl.equals(url);
            HotelImage image = HotelImage.builder()
                    .hotel(hotel)
                    .url(url)
                    .isCover(isCover)
                    .sortOrder(i)
                    .createdAt(LocalDateTime.now())
                    .build();
            hotelImageRepository.save(image);
        }
    }

    private void saveHotelRoomTypes(Hotel hotel, List<AdminHotelUpsertRequest.RoomTypeRequest> roomTypeRequests) {
        for (AdminHotelUpsertRequest.RoomTypeRequest rtReq : roomTypeRequests) {
            RoomType rt = RoomType.builder()
                    .hotel(hotel)
                    .name(rtReq.getName().trim())
                    .description(rtReq.getDescription())
                    .maxAdults(rtReq.getMaxAdults())
                    .maxChildren(rtReq.getMaxChildren())
                    .bedType(rtReq.getBedType())
                    .areaSqm(rtReq.getAreaSqm())
                    .basePricePerNight(rtReq.getBasePricePerNight())
                    .totalRooms(rtReq.getTotalRooms())
                    .isActive(rtReq.getIsActive() == null ? Boolean.TRUE : rtReq.getIsActive())
                    .build();
            rt.setCreatedAt(LocalDateTime.now());
            rt.setUpdatedAt(LocalDateTime.now());
            roomTypeRepository.save(rt);
        }
    }

    private void saveTourImages(Tour tour, List<String> urls, String coverUrl) {
        for (int i = 0; i < urls.size(); i++) {
            String url = urls.get(i);
            boolean isCover = coverUrl != null && coverUrl.equals(url);
            TourImage image = TourImage.builder()
                    .tour(tour)
                    .url(url)
                    .isCover(isCover)
                    .sortOrder(i)
                    .build();
            tourImageRepository.save(image);
        }
    }

    private void saveTourItinerary(Tour tour, List<AdminTourUpsertRequest.ItineraryRequest> itineraryRequests) {
        for (AdminTourUpsertRequest.ItineraryRequest itinReq : itineraryRequests) {
            TourItinerary itinerary = TourItinerary.builder()
                    .tour(tour)
                    .dayNumber(itinReq.getDayNumber())
                    .title(itinReq.getTitle().trim())
                    .description(itinReq.getDescription())
                    .build();
            tourItineraryRepository.save(itinerary);
        }
    }

    private void saveTourDepartures(Tour tour, List<AdminTourUpsertRequest.DepartureRequest> departureRequests) {
        for (AdminTourUpsertRequest.DepartureRequest depReq : departureRequests) {
            TourDeparture departure = TourDeparture.builder()
                    .tour(tour)
                    .departureDate(depReq.getDepartureDate())
                    .availableSlots(depReq.getAvailableSlots())
                    .priceOverride(depReq.getPriceOverride())
                    .build();
            tourDepartureRepository.save(departure);
        }
    }

    private AdminHotelDetailResponse buildHotelDetail(Hotel hotel, List<HotelImage> images, List<RoomType> roomTypes) {
        return AdminHotelDetailResponse.builder()
                .id(hotel.getId())
                .cityId(hotel.getCity() != null ? hotel.getCity().getId() : null)
                .cityName(hotel.getCity() != null ? firstNotBlank(hotel.getCity().getNameVi(), hotel.getCity().getNameEn()) : null)
                .ownerId(hotel.getOwner() != null ? hotel.getOwner().getId() : null)
                .ownerName(hotel.getOwner() != null ? hotel.getOwner().getFullName() : null)
                .ownerEmail(hotel.getOwner() != null ? hotel.getOwner().getEmail() : null)
                .name(hotel.getName())
                .slug(hotel.getSlug())
                .description(hotel.getDescription())
                .address(hotel.getAddress())
                .latitude(hotel.getLatitude())
                .longitude(hotel.getLongitude())
                .starRating(hotel.getStarRating())
                .avgRating(hotel.getAvgRating())
                .reviewCount(hotel.getReviewCount())
                .checkInTime(hotel.getCheckInTime())
                .checkOutTime(hotel.getCheckOutTime())
                .phone(hotel.getPhone())
                .email(hotel.getEmail())
                .website(hotel.getWebsite())
                .isFeatured(hotel.getIsFeatured())
                .isTrending(hotel.getIsTrending())
                .isActive(hotel.getIsActive())
                .status(hotel.getAdminStatus() != null ? hotel.getAdminStatus().name() : null)
                .createdAt(hotel.getCreatedAt())
                .updatedAt(hotel.getUpdatedAt())
                .imageUrls(images.stream().map(HotelImage::getUrl).toList())
                .coverImage(images.stream().filter(img -> Boolean.TRUE.equals(img.getIsCover())).findFirst().map(HotelImage::getUrl).orElse(images.isEmpty() ? null : images.get(0).getUrl()))
                .amenityNames(List.of())
                .roomTypes(roomTypes.stream()
                        .map(rt -> AdminHotelDetailResponse.RoomTypeDetail.builder()
                                .id(rt.getId())
                                .name(rt.getName())
                                .description(rt.getDescription())
                                .maxAdults(rt.getMaxAdults())
                                .maxChildren(rt.getMaxChildren())
                                .bedType(rt.getBedType())
                                .areaSqm(rt.getAreaSqm())
                                .basePricePerNight(rt.getBasePricePerNight())
                                .totalRooms(rt.getTotalRooms())
                                .isActive(rt.getIsActive())
                                .imageUrls(List.of())
                                .build())
                        .toList())
                .build();
    }

    private AdminTourDetailResponse buildTourDetail(Tour tour, List<TourImage> images, List<TourItinerary> itinerary, List<TourDeparture> departures) {
        return AdminTourDetailResponse.builder()
                .id(tour.getId())
                .categoryId(tour.getCategory() != null ? tour.getCategory().getId() : null)
                .categoryName(tour.getCategory() != null ? firstNotBlank(tour.getCategory().getNameVi(), tour.getCategory().getNameEn()) : null)
                .cityId(tour.getCity() != null ? tour.getCity().getId() != null ? Long.valueOf(tour.getCity().getId()) : null : null)
                .cityName(tour.getCity() != null ? firstNotBlank(tour.getCity().getNameVi(), tour.getCity().getNameEn()) : null)
                .operatorId(tour.getOperator() != null ? tour.getOperator().getId() : null)
                .operatorName(tour.getOperator() != null ? tour.getOperator().getFullName() : null)
                .operatorEmail(tour.getOperator() != null ? tour.getOperator().getEmail() : null)
                .title(tour.getTitle())
                .slug(tour.getSlug())
                .description(tour.getDescription())
                .highlights(tour.getHighlights())
                .includes(tour.getIncludes())
                .excludes(tour.getExcludes())
                .durationDays(tour.getDurationDays())
                .durationNights(tour.getDurationNights())
                .maxGroupSize(tour.getMaxGroupSize())
                .minGroupSize(tour.getMinGroupSize())
                .difficulty(tour.getDifficulty() != null ? tour.getDifficulty().name() : null)
                .pricePerAdult(tour.getPricePerAdult())
                .pricePerChild(tour.getPricePerChild())
                .avgRating(tour.getAvgRating())
                .reviewCount(tour.getReviewCount())
                .isFeatured(tour.getIsFeatured())
                .isActive(tour.getIsActive())
                .status(Boolean.TRUE.equals(tour.getIsActive()) ? "APPROVED" : "SUSPENDED")
                .createdAt(tour.getCreatedAt())
                .updatedAt(tour.getUpdatedAt())
                .imageUrls(images.stream().map(TourImage::getUrl).toList())
                .coverImage(images.stream().filter(img -> Boolean.TRUE.equals(img.getIsCover())).findFirst().map(TourImage::getUrl).orElse(images.isEmpty() ? null : images.get(0).getUrl()))
                .itinerary(itinerary.stream()
                        .map(it -> AdminTourDetailResponse.ItineraryDetail.builder()
                                .id(it.getId())
                                .dayNumber(it.getDayNumber())
                                .title(it.getTitle())
                                .description(it.getDescription())
                                .build())
                        .toList())
                .departures(departures.stream()
                        .map(d -> AdminTourDetailResponse.DepartureDetail.builder()
                                .id(d.getId())
                                .departureDate(d.getDepartureDate())
                                .availableSlots(d.getAvailableSlots())
                                .priceOverride(d.getPriceOverride())
                                .build())
                        .toList())
                .build();
    }

    private void applyPromotionPayload(Promotion promotion, AdminPromotionUpsertRequest request, boolean isCreate) {
        String code = request.getCode().trim().toUpperCase(Locale.ROOT);

        if (isCreate) {
            if (promotionRepository.existsByCodeIgnoreCase(code)) {
                throw new IllegalArgumentException("Code promotion da ton tai");
            }
        } else {
            boolean codeChanged = !code.equalsIgnoreCase(promotion.getCode());
            if (codeChanged && promotionRepository.existsByCodeIgnoreCase(code)) {
                throw new IllegalArgumentException("Code promotion da ton tai");
            }
        }

        Promotion.DiscountType discountType = parsePromotionType(request.getType());
        Promotion.AppliesTo appliesTo = parsePromotionAppliesTo(request.getAppliesTo());
        BigDecimal value = request.getValue();

        if (discountType == Promotion.DiscountType.PERCENTAGE && value.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException("Value khong hop le: PERCENT khong duoc vuot qua 100");
        }

        if (request.getEndAt().isBefore(request.getStartAt()) || request.getEndAt().isEqual(request.getStartAt())) {
            throw new IllegalArgumentException("Khoang thoi gian promotion khong hop le");
        }

        if (request.getMaxDiscountAmount() != null
                && request.getMaxDiscountAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Max discount amount khong hop le");
        }

        if (request.getUsageLimit() != null && request.getUsageLimit() < 0) {
            throw new IllegalArgumentException("Usage limit khong hop le");
        }

        if (request.getUsageLimit() == null) {
            promotion.setUsageLimit(0);
        } else {
            promotion.setUsageLimit(request.getUsageLimit());
        }

        promotion.setCode(code);
        promotion.setName(request.getName().trim());
        promotion
                .setDescription(StringUtils.hasText(request.getDescription()) ? request.getDescription().trim() : null);
        promotion.setDiscountType(discountType);
        promotion.setDiscountValue(request.getValue());
        promotion.setMinOrderAmount(request.getMinOrderAmount());
        promotion.setMaxDiscountAmount(request.getMaxDiscountAmount());
        promotion.setAppliesTo(appliesTo);
        promotion.setValidFrom(request.getStartAt());
        promotion.setValidUntil(request.getEndAt());

        if (isCreate) {
            promotion.setIsActive(request.getIsActive() == null ? Boolean.TRUE : request.getIsActive());
        } else if (request.getIsActive() != null) {
            promotion.setIsActive(request.getIsActive());
        }

        if (promotion.getUsedCount() == null) {
            promotion.setUsedCount(0);
        }
    }

    private Promotion.DiscountType parsePromotionType(String rawType) {
        String normalized = rawType.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "PERCENT", "PERCENTAGE" -> Promotion.DiscountType.PERCENTAGE;
            case "FIXED" -> Promotion.DiscountType.FIXED;
            default -> throw new IllegalArgumentException("Gia tri promotions.type khong hop le");
        };
    }

    private Promotion.AppliesTo parsePromotionAppliesTo(String rawAppliesTo) {
        if (!StringUtils.hasText(rawAppliesTo)) {
            return Promotion.AppliesTo.ALL;
        }

        String normalized = rawAppliesTo.trim().toUpperCase(Locale.ROOT);
        try {
            return Promotion.AppliesTo.valueOf(normalized);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Gia tri promotions.appliesTo khong hop le");
        }
    }

    private String normalizeReason(String reason) {
        if (!StringUtils.hasText(reason)) {
            throw new IllegalArgumentException("Reason khong duoc de trong");
        }
        return reason.trim();
    }

    private void saveAudit(
            String actorEmail,
            String action,
            String resourceType,
            Long resourceId,
            Object beforeData,
            Object afterData,
            String reason) {

        String normalizedActorEmail = StringUtils.hasText(actorEmail)
                ? actorEmail.trim().toLowerCase(Locale.ROOT)
                : null;

        User actor = null;
        if (StringUtils.hasText(normalizedActorEmail)) {
            actor = userRepository.findByEmail(normalizedActorEmail).orElse(null);
        }

        AuditLog auditLog = AuditLog.builder()
                .actor(actor)
                .actorEmail(normalizedActorEmail)
                .action(action)
                .resourceType(resourceType)
                .resourceId(resourceId)
                .oldValue(toJson(beforeData))
                .newValue(toJson(afterData))
                .reason(reason)
                .build();

        auditLogRepository.save(auditLog);
    }

    private String toJson(Object payload) {
        if (payload == null) {
            return null;
        }

        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Khong the serialize audit payload", ex);
        }
    }

    private AdminUserItemResponse toUserItem(User user) {
        return AdminUserItemResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .roleName(user.getRole() != null ? user.getRole().getName() : null)
                .status(user.getStatus() != null ? user.getStatus().name() : null)
                .isEmailVerified(Boolean.TRUE.equals(user.getIsEmailVerified()))
                .authProvider(user.getAuthProvider() != null ? user.getAuthProvider().name() : null)
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }

    private AdminHotelItemResponse toHotelItem(Hotel hotel, String overrideStatus) {
        String city = hotel.getCity() != null
                ? firstNotBlank(hotel.getCity().getNameVi(), hotel.getCity().getNameEn())
                : null;

        String hostName = hotel.getOwner() != null ? hotel.getOwner().getFullName() : null;
        String hostEmail = hotel.getOwner() != null ? hotel.getOwner().getEmail() : null;

        String mappedStatus;
        if (StringUtils.hasText(overrideStatus)) {
            mappedStatus = overrideStatus;
        } else if (hotel.getAdminStatus() != null) {
            mappedStatus = hotel.getAdminStatus().name();
        } else {
            mappedStatus = Boolean.TRUE.equals(hotel.getIsActive()) ? "APPROVED" : "SUSPENDED";
        }

        return AdminHotelItemResponse.builder()
                .id(hotel.getId())
                .name(hotel.getName())
                .city(city)
                .address(hotel.getAddress())
                .starRating(hotel.getStarRating())
                .avgRating(hotel.getAvgRating())
                .reviewCount(hotel.getReviewCount())
                .hostName(hostName)
                .hostEmail(hostEmail)
                .status(mappedStatus)
                .isActive(hotel.getIsActive())
                .createdAt(hotel.getCreatedAt())
                .updatedAt(hotel.getUpdatedAt())
                .build();
    }

    private AdminTourItemResponse toTourItem(Tour tour, String overrideStatus) {
        String city = tour.getCity() != null
                ? firstNotBlank(tour.getCity().getNameVi(), tour.getCity().getNameEn())
                : null;

        String operatorName = tour.getOperator() != null ? tour.getOperator().getFullName() : null;
        String operatorEmail = tour.getOperator() != null ? tour.getOperator().getEmail() : null;

        String mappedStatus = StringUtils.hasText(overrideStatus)
                ? overrideStatus
                : (Boolean.TRUE.equals(tour.getIsActive()) ? "APPROVED" : "SUSPENDED");

        return AdminTourItemResponse.builder()
                .id(tour.getId())
                .title(tour.getTitle())
                .city(city)
                .location(city)
                .durationDays(tour.getDurationDays())
                .priceFrom(tour.getPricePerAdult())
                .operatorName(operatorName)
                .operatorEmail(operatorEmail)
                .status(mappedStatus)
                .isActive(tour.getIsActive())
                .createdAt(tour.getCreatedAt())
                .updatedAt(tour.getUpdatedAt())
                .build();
    }

    private BookingHotelDetail loadHotelDetail(Long bookingId) {
        List<BookingHotelDetail> details = bookingHotelDetailRepository.findByBooking_IdIn(List.of(bookingId));
        return details.isEmpty() ? null : details.get(0);
    }

    private BookingTourDetail loadTourDetail(Long bookingId) {
        List<BookingTourDetail> details = bookingTourDetailRepository.findByBooking_IdIn(List.of(bookingId));
        return details.isEmpty() ? null : details.get(0);
    }

    private AdminBookingItemResponse toBookingItem(
            Booking booking,
            BookingHotelDetail hotelDetail,
            BookingTourDetail tourDetail) {

        String serviceName = null;
        String serviceCity = null;
        java.time.LocalDate startDate = null;
        java.time.LocalDate endDate = null;

        if (hotelDetail != null) {
            serviceName = hotelDetail.getHotelName();
            if (hotelDetail.getHotel() != null && hotelDetail.getHotel().getCity() != null) {
                serviceCity = firstNotBlank(
                        hotelDetail.getHotel().getCity().getNameVi(),
                        hotelDetail.getHotel().getCity().getNameEn());
            }
            startDate = hotelDetail.getCheckInDate();
            endDate = hotelDetail.getCheckOutDate();
        } else if (tourDetail != null) {
            serviceName = tourDetail.getTourTitle();
            if (tourDetail.getTour() != null && tourDetail.getTour().getCity() != null) {
                serviceCity = firstNotBlank(
                        tourDetail.getTour().getCity().getNameVi(),
                        tourDetail.getTour().getCity().getNameEn());
            }
            startDate = tourDetail.getDepartureDate();
            endDate = tourDetail.getDepartureDate();
        }

        return AdminBookingItemResponse.builder()
                .id(booking.getId())
                .bookingCode(booking.getBookingCode())
                .bookingType(booking.getBookingType() != null ? booking.getBookingType().name() : null)
                .guestName(booking.getGuestName())
                .guestEmail(booking.getGuestEmail())
                .serviceName(serviceName)
                .serviceCity(serviceCity)
                .startDate(startDate)
                .endDate(endDate)
                .status(booking.getStatus() != null ? booking.getStatus().name() : null)
                .paymentStatus(resolveBookingPaymentStatus(booking.getStatus()))
                .totalAmount(booking.getTotalAmount())
                .currency(booking.getCurrency())
                .createdAt(booking.getCreatedAt())
                .note(booking.getSpecialRequests())
                .build();
    }

    private String resolveBookingPaymentStatus(Booking.BookingStatus bookingStatus) {
        if (bookingStatus == null) {
            return "PENDING";
        }

        return switch (bookingStatus) {
            case CONFIRMED, CHECKED_IN, COMPLETED -> "PAID";
            case CANCELLED -> "FAILED";
            case REFUNDED -> "REFUNDED";
            case PENDING -> "PENDING";
        };
    }

    private AdminPromotionItemResponse toPromotionItem(Promotion promotion) {
        return AdminPromotionItemResponse.builder()
                .id(promotion.getId())
                .code(promotion.getCode())
                .name(promotion.getName())
                .description(promotion.getDescription())
                .type(promotion.getDiscountType() != null ? promotion.getDiscountType().name() : null)
                .value(promotion.getDiscountValue())
                .minOrderAmount(promotion.getMinOrderAmount())
                .maxDiscountAmount(promotion.getMaxDiscountAmount())
                .usageLimit(promotion.getUsageLimit())
                .usedCount(promotion.getUsedCount())
                .appliesTo(promotion.getAppliesTo() != null ? promotion.getAppliesTo().name() : null)
                .startAt(promotion.getValidFrom())
                .endAt(promotion.getValidUntil())
                .isActive(promotion.getIsActive())
                .createdAt(promotion.getCreatedAt())
                .updatedAt(promotion.getUpdatedAt())
                .build();
    }

    private <E, T> AdminPageResponse<T> toPageResponse(Page<E> page, List<T> items) {
        return AdminPageResponse.<T>builder()
                .items(items)
                .page(page.getNumber() + 1)
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    private Pageable buildPageable(
            Integer page,
            Integer size,
            String sort,
            String defaultSortField,
            Set<String> allowedSortFields) {

        int resolvedPage = page == null ? DEFAULT_PAGE : Math.max(DEFAULT_PAGE, page);
        int resolvedSize = size == null ? DEFAULT_SIZE : Math.min(MAX_SIZE, Math.max(1, size));
        Sort sortObject = parseSort(sort, defaultSortField, allowedSortFields);

        return PageRequest.of(resolvedPage - 1, resolvedSize, sortObject);
    }

    private Sort parseSort(String rawSort, String defaultField, Set<String> allowedFields) {
        String field = defaultField;
        Sort.Direction direction = Sort.Direction.DESC;

        if (StringUtils.hasText(rawSort)) {
            String sortValue = rawSort.trim();
            if (sortValue.contains(",")) {
                String[] parts = sortValue.split(",", 2);
                field = parts[0].trim();
                direction = "ASC".equalsIgnoreCase(parts[1].trim()) ? Sort.Direction.ASC : Sort.Direction.DESC;
            } else if (sortValue.startsWith("-")) {
                field = sortValue.substring(1).trim();
                direction = Sort.Direction.DESC;
            } else {
                field = sortValue;
            }
        }

        if (!allowedFields.contains(field)) {
            field = defaultField;
            direction = Sort.Direction.DESC;
        }

        return Sort.by(direction, field);
    }

    private <E extends Enum<E>> E parseEnum(Class<E> enumClass, String rawValue, String fieldName) {
        try {
            return Enum.valueOf(enumClass, rawValue.trim().toUpperCase(Locale.ROOT));
        } catch (Exception ex) {
            throw new IllegalArgumentException("Giá trị " + fieldName + " không hợp lệ");
        }
    }

    private String likePattern(String value) {
        return "%" + value.trim().toLowerCase(Locale.ROOT) + "%";
    }

    private String firstNotBlank(String first, String second) {
        if (StringUtils.hasText(first)) {
            return first;
        }
        if (StringUtils.hasText(second)) {
            return second;
        }
        return null;
    }
}