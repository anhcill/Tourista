package vn.tourista.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import vn.tourista.dto.request.admin.AdminComboUpsertRequest;
import vn.tourista.dto.response.admin.AdminComboItemResponse;
import vn.tourista.dto.response.admin.AdminPageResponse;
import vn.tourista.entity.AuditLog;
import vn.tourista.entity.ComboPackage;
import vn.tourista.entity.Hotel;
import vn.tourista.entity.Tour;
import vn.tourista.repository.AuditLogRepository;
import vn.tourista.repository.ComboPackageRepository;
import vn.tourista.repository.HotelRepository;
import vn.tourista.repository.TourRepository;
import vn.tourista.service.AdminComboService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AdminComboServiceImpl implements AdminComboService {

    private final ComboPackageRepository comboRepository;
    private final HotelRepository hotelRepository;
    private final TourRepository tourRepository;
    private final AuditLogRepository auditLogRepository;

    @Override
    public AdminPageResponse<AdminComboItemResponse> getCombos(
            Integer page, Integer size, String q, String status, String type, String sort) {

        int p = page != null && page > 0 ? page - 1 : 0;
        int s = size != null && size > 0 ? Math.min(size, 100) : 10;

        Page<ComboPackage> comboPage = comboRepository.findAll(PageRequest.of(p, s));
        List<ComboPackage> combos = comboPage.getContent();

        // Bulk-fetch hotel and tour names to avoid N+1
        var hotelIds = combos.stream()
                .flatMap(c -> java.util.stream.Stream.of(c.getHotelId(), c.getSecondHotelId()))
                .filter(java.util.Objects::nonNull).distinct().toList();
        var tourIds = combos.stream()
                .flatMap(c -> java.util.stream.Stream.of(c.getTourId(), c.getSecondTourId()))
                .filter(java.util.Objects::nonNull).distinct().toList();

        Map<Long, Hotel> hotels = hotelRepository.findAllById(hotelIds).stream()
                .collect(Collectors.toMap(Hotel::getId, Function.identity()));
        Map<Long, Tour> tours = tourRepository.findAllById(tourIds).stream()
                .collect(Collectors.toMap(Tour::getId, Function.identity()));

        List<AdminComboItemResponse> items = combos.stream()
                .filter(c -> matchesFilters(c, q, status, type))
                .map(c -> toItemResponse(c, hotels, tours))
                .collect(Collectors.toList());

        return AdminPageResponse.<AdminComboItemResponse>builder()
                .items(items)
                .totalElements(comboPage.getTotalElements())
                .page(page != null ? page : 1)
                .size(s)
                .totalPages(comboPage.getTotalPages())
                .build();
    }

    @Override
    public AdminComboItemResponse getComboById(Long comboId) {
        ComboPackage combo = comboRepository.findById(comboId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay combo: " + comboId));
        return toItemResponse(combo);
    }

    @Override
    @Transactional
    public AdminComboItemResponse createCombo(AdminComboUpsertRequest request, String actorEmail) {
        ComboPackage combo = new ComboPackage();
        applyUpsert(combo, request);
        combo = comboRepository.save(combo);
        saveAudit("CREATE", "COMBO", combo.getId(), null, toJson(combo), request.getReason(), actorEmail);
        return toItemResponse(combo);
    }

    @Override
    @Transactional
    public AdminComboItemResponse updateCombo(Long comboId, AdminComboUpsertRequest request, String actorEmail) {
        ComboPackage combo = comboRepository.findById(comboId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay combo: " + comboId));
        String before = toJson(combo);
        applyUpsert(combo, request);
        combo = comboRepository.save(combo);
        saveAudit("UPDATE", "COMBO", combo.getId(), before, toJson(combo), request.getReason(), actorEmail);
        return toItemResponse(combo);
    }

    @Override
    @Transactional
    public AdminComboItemResponse updateComboStatus(Long comboId, boolean isActive, String reason, String actorEmail) {
        ComboPackage combo = comboRepository.findById(comboId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay combo: " + comboId));
        String before = toJson(combo);
        combo.setIsActive(isActive);
        combo = comboRepository.save(combo);
        saveAudit("UPDATE_STATUS", "COMBO", combo.getId(), before, toJson(combo), reason, actorEmail);
        return toItemResponse(combo);
    }

    @Override
    @Transactional
    public void deleteCombo(Long comboId, String reason, String actorEmail) {
        ComboPackage combo = comboRepository.findById(comboId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay combo: " + comboId));
        String before = toJson(combo);
        comboRepository.delete(combo);
        saveAudit("DELETE", "COMBO", comboId, before, null, reason, actorEmail);
    }

    private void applyUpsert(ComboPackage combo, AdminComboUpsertRequest req) {
        if (StringUtils.hasText(req.getName())) combo.setName(req.getName().trim());
        combo.setDescription(req.getDescription());
        combo.setImageUrl(req.getImageUrl());

        if (StringUtils.hasText(req.getComboType())) {
            try {
                combo.setComboType(ComboPackage.ComboType.valueOf(req.getComboType().toUpperCase(Locale.ROOT)));
            } catch (IllegalArgumentException ignored) { /* invalid type */ }
        }

        combo.setHotelId(req.getHotelId());
        combo.setTourId(req.getTourId());
        combo.setSecondHotelId(req.getSecondHotelId());
        combo.setSecondTourId(req.getSecondTourId());

        // Validate date range
        if (req.getValidFrom() != null && req.getValidUntil() != null
                && !req.getValidFrom().isBefore(req.getValidUntil())) {
            throw new IllegalArgumentException("Valid from phai truoc valid until.");
        }
        combo.setValidFrom(req.getValidFrom());
        combo.setValidUntil(req.getValidUntil());

        if (req.getTotalSlots() != null) combo.setTotalSlots(req.getTotalSlots());
        if (req.getRemainingSlots() != null) {
            combo.setRemainingSlots(req.getRemainingSlots());
        } else if (req.getTotalSlots() != null) {
            combo.setRemainingSlots(req.getTotalSlots());
        }

        if (req.getOriginalPrice() != null) combo.setOriginalPrice(req.getOriginalPrice());
        if (req.getComboPrice() != null) combo.setComboPrice(req.getComboPrice());

        // Validate combo price < original price
        if (combo.getOriginalPrice() != null && combo.getComboPrice() != null
                && combo.getComboPrice().compareTo(combo.getOriginalPrice()) >= 0) {
            throw new IllegalArgumentException("Combo price phai nho hon original price.");
        }

        if (combo.getOriginalPrice() != null && combo.getComboPrice() != null
                && combo.getOriginalPrice().compareTo(BigDecimal.ZERO) > 0
                && combo.getComboPrice().compareTo(combo.getOriginalPrice()) < 0) {
            BigDecimal savingsAmt = combo.getOriginalPrice().subtract(combo.getComboPrice());
            combo.setSavingsAmount(savingsAmt);
            int pct = savingsAmt.multiply(BigDecimal.valueOf(100))
                    .divide(combo.getOriginalPrice(), 0, RoundingMode.HALF_UP)
                    .intValue();
            combo.setSavingsPercent(pct);
        }

        if (req.getSavingsAmount() != null) combo.setSavingsAmount(req.getSavingsAmount());
        if (req.getSavingsPercent() != null) combo.setSavingsPercent(req.getSavingsPercent());
        if (req.getIsFeatured() != null) combo.setIsFeatured(req.getIsFeatured());
        if (req.getIsActive() != null) combo.setIsActive(req.getIsActive());
        else if (combo.getId() == null) combo.setIsActive(true);
    }

    private AdminComboItemResponse toItemResponse(ComboPackage c) {
        String hotelName = null;
        String tourName = null;
        String secondHotelName = null;
        String secondTourName = null;

        if (c.getHotelId() != null) {
            hotelName = hotelRepository.findById(c.getHotelId())
                    .map(Hotel::getName).orElse(null);
        }
        if (c.getTourId() != null) {
            tourName = tourRepository.findById(c.getTourId())
                    .map(Tour::getTitle).orElse(null);
        }
        if (c.getSecondHotelId() != null) {
            secondHotelName = hotelRepository.findById(c.getSecondHotelId())
                    .map(Hotel::getName).orElse(null);
        }
        if (c.getSecondTourId() != null) {
            secondTourName = tourRepository.findById(c.getSecondTourId())
                    .map(Tour::getTitle).orElse(null);
        }

        AdminComboItemResponse.AdminComboItemResponseBuilder b = AdminComboItemResponse.builder();
        b.id(c.getId());
        b.name(c.getName());
        b.description(c.getDescription());
        b.imageUrl(c.getImageUrl());
        b.comboType(c.getComboType() != null ? c.getComboType().name() : null);
        b.hotelId(c.getHotelId());
        b.hotelName(hotelName);
        b.tourId(c.getTourId());
        b.tourName(tourName);
        b.secondHotelId(c.getSecondHotelId());
        b.secondHotelName(secondHotelName);
        b.secondTourId(c.getSecondTourId());
        b.secondTourName(secondTourName);
        b.validFrom(c.getValidFrom());
        b.validUntil(c.getValidUntil());
        b.totalSlots(c.getTotalSlots());
        b.remainingSlots(c.getRemainingSlots());
        b.originalPrice(c.getOriginalPrice());
        b.comboPrice(c.getComboPrice());
        b.savingsAmount(c.getSavingsAmount());
        b.savingsPercent(c.getSavingsPercent());
        b.isFeatured(c.getIsFeatured());
        b.isActive(c.getIsActive());
        b.createdAt(c.getCreatedAt());
        b.updatedAt(c.getUpdatedAt());
        return b.build();
    }

    private AdminComboItemResponse toItemResponse(ComboPackage c, Map<Long, Hotel> hotels, Map<Long, Tour> tours) {
        String hotelName = hotels.containsKey(c.getHotelId()) ? hotels.get(c.getHotelId()).getName() : null;
        String tourName = tours.containsKey(c.getTourId()) ? tours.get(c.getTourId()).getTitle() : null;
        String secondHotelName = hotels.containsKey(c.getSecondHotelId()) ? hotels.get(c.getSecondHotelId()).getName() : null;
        String secondTourName = tours.containsKey(c.getSecondTourId()) ? tours.get(c.getSecondTourId()).getTitle() : null;

        return AdminComboItemResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .description(c.getDescription())
                .imageUrl(c.getImageUrl())
                .comboType(c.getComboType() != null ? c.getComboType().name() : null)
                .hotelId(c.getHotelId())
                .hotelName(hotelName)
                .tourId(c.getTourId())
                .tourName(tourName)
                .secondHotelId(c.getSecondHotelId())
                .secondHotelName(secondHotelName)
                .secondTourId(c.getSecondTourId())
                .secondTourName(secondTourName)
                .validFrom(c.getValidFrom())
                .validUntil(c.getValidUntil())
                .totalSlots(c.getTotalSlots())
                .remainingSlots(c.getRemainingSlots())
                .originalPrice(c.getOriginalPrice())
                .comboPrice(c.getComboPrice())
                .savingsAmount(c.getSavingsAmount())
                .savingsPercent(c.getSavingsPercent())
                .isFeatured(c.getIsFeatured())
                .isActive(c.getIsActive())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private boolean matchesFilters(ComboPackage c, String q, String status, String type) {
        if (StringUtils.hasText(q)) {
            String term = q.toLowerCase();
            boolean nameMatch = c.getName() != null && c.getName().toLowerCase().contains(term);
            boolean descMatch = c.getDescription() != null && c.getDescription().toLowerCase().contains(term);
            if (!nameMatch && !descMatch) return false;
        }

        if (StringUtils.hasText(status)) {
            if ("ACTIVE".equalsIgnoreCase(status) && !Boolean.TRUE.equals(c.getIsActive())) return false;
            if ("INACTIVE".equalsIgnoreCase(status) && Boolean.TRUE.equals(c.getIsActive())) return false;
        }

        if (StringUtils.hasText(type)) {
            if (c.getComboType() == null || !c.getComboType().name().equalsIgnoreCase(type)) return false;
        }

        return true;
    }

    private void saveAudit(String action, String resource, Long resourceId,
            String before, String after, String reason, String actorEmail) {
        try {
            AuditLog audit = AuditLog.builder()
                    .action(action)
                    .resourceType(resource)
                    .resourceId(resourceId)
                    .oldValue(before)
                    .newValue(after)
                    .reason(reason)
                    .actorEmail(actorEmail != null ? actorEmail : "system")
                    .build();
            auditLogRepository.save(audit);
        } catch (Exception e) {
            log.warn("Failed to save audit log for {} {}: {}", action, resource, e.getMessage());
        }
    }

    private String toJson(ComboPackage c) {
        return "{ \"id\": " + c.getId() +
                ", \"name\": \"" + (c.getName() != null ? c.getName().replace("\"", "\\\"") : "") + "\"" +
                ", \"comboType\": \"" + (c.getComboType() != null ? c.getComboType().name() : "") + "\"" +
                ", \"originalPrice\": " + c.getOriginalPrice() +
                ", \"comboPrice\": " + c.getComboPrice() +
                ", \"isActive\": " + c.getIsActive() +
                " }";
    }
}
