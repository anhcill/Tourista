package vn.tourista.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.tourista.dto.request.PricingRuleRequest;
import vn.tourista.dto.response.PricingCalculationResponse;
import vn.tourista.entity.PricingRule;
import vn.tourista.repository.PricingRuleRepository;
import vn.tourista.repository.TourRepository;
import vn.tourista.repository.HotelRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PricingService {

    private final PricingRuleRepository pricingRuleRepository;
    private final TourRepository tourRepository;
    private final HotelRepository hotelRepository;

    /**
     * Calculate dynamic price for a Tour.
     */
    public PricingCalculationResponse calculateTourPrice(Long tourId, Integer numPeople, Integer slotsRemaining) {
        var tourOpt = tourRepository.findById(tourId);
        if (tourOpt.isEmpty()) {
            return PricingCalculationResponse.builder()
                    .entityId(tourId)
                    .entityType("TOUR")
                    .hasDynamicPricing(false)
                    .build();
        }

        var tour = tourOpt.get();
        BigDecimal basePrice = tour.getPricePerAdult();

        return calculatePrice(
                tourId,
                PricingRule.TargetType.TOUR,
                basePrice,
                numPeople,
                slotsRemaining,
                null
        );
    }

    /**
     * Calculate dynamic price for a Hotel room type.
     * Applies hotel-specific pricing rules, weekend markup, and seasonal adjustments.
     */
    public PricingCalculationResponse calculateHotelPrice(Long hotelId, Integer nights, Integer rooms) {
        if (hotelId == null) {
            return PricingCalculationResponse.builder()
                    .entityId(hotelId)
                    .entityType("HOTEL")
                    .hasDynamicPricing(false)
                    .build();
        }

        BigDecimal basePricePerNight = hotelRepository.findMinBasePriceByHotelId(hotelId);
        if (basePricePerNight == null) {
            return PricingCalculationResponse.builder()
                    .entityId(hotelId)
                    .entityType("HOTEL")
                    .hasDynamicPricing(false)
                    .build();
        }

        return calculatePrice(
                hotelId,
                PricingRule.TargetType.HOTEL,
                basePricePerNight,
                null,
                null,
                null
        );
    }

    /**
     * Calculate dynamic price for a specific check-in date.
     * Used by the frontend PriceCalendar to show per-night prices.
     */
    public PricingCalculationResponse calculateHotelNightPrice(Long hotelId, LocalDate checkIn, Integer adults) {
        if (hotelId == null || checkIn == null) {
            return PricingCalculationResponse.builder()
                    .entityId(hotelId)
                    .entityType("HOTEL")
                    .hasDynamicPricing(false)
                    .build();
        }

        BigDecimal basePricePerNight = hotelRepository.findMinBasePriceByHotelId(hotelId);
        if (basePricePerNight == null) {
            return PricingCalculationResponse.builder()
                    .entityId(hotelId)
                    .entityType("HOTEL")
                    .hasDynamicPricing(false)
                    .build();
        }

        return calculatePrice(
                hotelId,
                PricingRule.TargetType.HOTEL,
                basePricePerNight,
                adults,
                null,
                checkIn
        );
    }

    private PricingCalculationResponse calculatePrice(
            Long entityId,
            PricingRule.TargetType targetType,
            BigDecimal basePrice,
            Integer numPeople,
            Integer slotsRemaining,
            LocalDate checkInDate
    ) {
        List<PricingRule> rules = pricingRuleRepository.findActiveByTargetType(targetType, LocalDateTime.now());

        if (targetType == PricingRule.TargetType.TOUR && entityId != null) {
            rules = pricingRuleRepository.findActiveForTour(targetType, entityId, LocalDateTime.now());
        } else if (targetType == PricingRule.TargetType.HOTEL && entityId != null) {
            rules = pricingRuleRepository.findActiveForHotel(targetType, entityId, LocalDateTime.now());
        }

        List<PricingCalculationResponse.AppliedRuleInfo> applied = new ArrayList<>();
        BigDecimal cumulativeMultiplier = BigDecimal.ONE;
        BigDecimal totalDiscount = BigDecimal.ZERO;

        for (PricingRule rule : rules) {
            if (!matchesRule(rule, numPeople, slotsRemaining, checkInDate)) {
                continue;
            }

            BigDecimal adjustment = rule.getAdjustmentPercent()
                    .divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP);
            BigDecimal ruleMultiplier = BigDecimal.ONE.add(adjustment);
            cumulativeMultiplier = cumulativeMultiplier.multiply(ruleMultiplier);

            applied.add(PricingCalculationResponse.AppliedRuleInfo.builder()
                    .ruleId(rule.getId())
                    .name(rule.getName())
                    .description(rule.getDescription())
                    .adjustmentPercent(rule.getAdjustmentPercent())
                    .reason(buildReason(rule))
                    .build());
        }

        BigDecimal finalPrice = basePrice.multiply(cumulativeMultiplier)
                .setScale(0, RoundingMode.HALF_UP);
        totalDiscount = finalPrice.subtract(basePrice);
        BigDecimal discountPercent = BigDecimal.ZERO;
        if (basePrice.compareTo(BigDecimal.ZERO) > 0) {
            discountPercent = totalDiscount.divide(basePrice, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);
        }

        return PricingCalculationResponse.builder()
                .entityId(entityId)
                .entityType(targetType.name())
                .basePrice(basePrice)
                .finalPrice(finalPrice)
                .totalDiscount(totalDiscount)
                .discountPercent(discountPercent)
                .hasDynamicPricing(!applied.isEmpty())
                .appliedRules(applied)
                .build();
    }

    private boolean matchesRule(PricingRule rule, Integer numPeople, Integer slotsRemaining, LocalDate checkInDate) {
        // ── Day-of-week constraint ──
        if (rule.getRuleType() == PricingRule.RuleType.DAY_OF_WEEK && checkInDate != null) {
            int dayOfWeek = checkInDate.getDayOfWeek().getValue();
            if (rule.getDayOfWeek() != null && rule.getDayOfWeek() != dayOfWeek) {
                return false;
            }
        }

        // ── Group-size constraint (applies to ALL rule types, not just GROUP_SIZE) ──
        if (numPeople != null) {
            Integer minPax = rule.getMinPax();
            Integer maxPax = rule.getMaxPax();
            if (minPax != null && numPeople < minPax) return false;
            if (maxPax != null && numPeople > maxPax) return false;
        }

        // ── Advance-booking window (LAST_MINUTE or EARLY_BIRD) ──
        if ((rule.getRuleType() == PricingRule.RuleType.LAST_MINUTE
                || rule.getRuleType() == PricingRule.RuleType.EARLY_BIRD)
                && checkInDate != null) {
            long daysUntil = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), checkInDate);
            Integer min = rule.getAdvanceDaysMin();
            Integer max = rule.getAdvanceDaysMax();
            if (min != null && daysUntil < min) return false;
            if (max != null && daysUntil > max) return false;
        }

        // ── Season constraint ──
        if (rule.getRuleType() == PricingRule.RuleType.SEASON && checkInDate != null) {
            if (rule.getSeason() != null) {
                SeasonType currentSeason = getCurrentSeason(checkInDate);
                if (!matchesSeason(rule.getSeason(), currentSeason)) {
                    return false;
                }
            }
        }

        return true;
    }

    private SeasonType getCurrentSeason(LocalDate date) {
        int month = date.getMonthValue();
        if (month >= 6 && month <= 8) return SeasonType.PEAK;
        if (month >= 11 || month <= 2) return SeasonType.OFF;
        return SeasonType.REGULAR;
    }

    private enum SeasonType { PEAK, REGULAR, OFF }

    private boolean matchesSeason(PricingRule.Season ruleSeason, SeasonType actualSeason) {
        return switch (ruleSeason) {
            case PEAK -> actualSeason == SeasonType.PEAK;
            case OFF -> actualSeason == SeasonType.OFF;
            case REGULAR -> actualSeason == SeasonType.REGULAR;
        };
    }

    private String buildReason(PricingRule rule) {
        return switch (rule.getRuleType()) {
            case DAY_OF_WEEK -> "Giảm giá ngày trong tuần";
            case SEASON -> "Theo mùa: " + (rule.getSeason() != null ? rule.getSeason().name().toLowerCase() : "regular");
            case LAST_MINUTE -> "Khuyến mãi last-minute";
            case EARLY_BIRD -> "Đặt sớm tiết kiệm";
            case GROUP_SIZE -> "Giá nhóm " + rule.getMinPax() + "+ người";
        };
    }

    public PricingRule createRule(PricingRuleRequest req) {
        PricingRule rule = PricingRule.builder()
                .targetType(req.getTargetType())
                .hotelId(req.getHotelId())
                .tourId(req.getTourId())
                .ruleType(req.getRuleType())
                .season(req.getSeason())
                .dayOfWeek(req.getDayOfWeek())
                .advanceDaysMin(req.getAdvanceDaysMin())
                .advanceDaysMax(req.getAdvanceDaysMax())
                .slotsRemainingMax(req.getSlotsRemainingMax())
                .adjustmentPercent(req.getAdjustmentPercent())
                .minPax(req.getMinPax())
                .maxPax(req.getMaxPax())
                .name(req.getName())
                .description(req.getDescription())
                .priority(req.getPriority() != null ? req.getPriority() : 0)
                .isActive(req.getIsActive() != null ? req.getIsActive() : true)
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .build();
        return pricingRuleRepository.save(rule);
    }

    public PricingRule updateRule(Long id, PricingRuleRequest req) {
        PricingRule rule = pricingRuleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pricing rule not found: " + id));
        rule.setTargetType(req.getTargetType());
        rule.setHotelId(req.getHotelId());
        rule.setTourId(req.getTourId());
        rule.setRuleType(req.getRuleType());
        rule.setSeason(req.getSeason());
        rule.setDayOfWeek(req.getDayOfWeek());
        rule.setAdvanceDaysMin(req.getAdvanceDaysMin());
        rule.setAdvanceDaysMax(req.getAdvanceDaysMax());
        rule.setSlotsRemainingMax(req.getSlotsRemainingMax());
        rule.setAdjustmentPercent(req.getAdjustmentPercent());
        rule.setMinPax(req.getMinPax());
        rule.setMaxPax(req.getMaxPax());
        rule.setName(req.getName());
        rule.setDescription(req.getDescription());
        if (req.getPriority() != null) rule.setPriority(req.getPriority());
        if (req.getIsActive() != null) rule.setIsActive(req.getIsActive());
        rule.setStartDate(req.getStartDate());
        rule.setEndDate(req.getEndDate());
        return pricingRuleRepository.save(rule);
    }

    public void deleteRule(Long id) {
        pricingRuleRepository.deleteById(id);
    }

    public List<PricingRule> getAllRules() {
        return pricingRuleRepository.findAll();
    }

    public PricingRule getRuleById(Long id) {
        return pricingRuleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pricing rule not found: " + id));
    }
}
