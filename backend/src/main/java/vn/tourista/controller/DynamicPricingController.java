package vn.tourista.controller;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.HotelPriceResponse;
import vn.tourista.dto.response.HotelPriceResponse.RoomPrice;
import vn.tourista.entity.PricingRule;
import vn.tourista.repository.PricingRuleRepository;
import vn.tourista.repository.RoomTypeRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/pricing")
public class DynamicPricingController {

    @PersistenceContext
    private EntityManager em;

    private final RoomTypeRepository roomTypeRepository;
    private final PricingRuleRepository pricingRuleRepository;

    public DynamicPricingController(RoomTypeRepository roomTypeRepository,
                                   PricingRuleRepository pricingRuleRepository) {
        this.roomTypeRepository = roomTypeRepository;
        this.pricingRuleRepository = pricingRuleRepository;
    }

    @SuppressWarnings("unchecked")
    @GetMapping("/dynamic/hotel/{hotelId}")
    public ResponseEntity<ApiResponse<HotelPriceResponse>> getDynamicHotelPrice(
            @PathVariable Long hotelId,
            @RequestParam(required = false) Integer nights,
            @RequestParam(required = false) Integer rooms) {

        String sql = """
            SELECT rt.id, rt.name, rt.bed_type, rt.area_sqm,
                   rt.base_price_per_night, rt.max_adults, rt.max_children,
                   rt.total_rooms, rt.is_active, h.name
            FROM room_types rt
            JOIN hotels h ON h.id = rt.hotel_id
            WHERE rt.hotel_id = ? AND rt.is_active = TRUE
            ORDER BY rt.base_price_per_night ASC
            """;

        List<Object[]> rows = em.createNativeQuery(sql.toString())
                .setParameter(1, hotelId)
                .getResultList();

        if (rows.isEmpty()) {
            HotelPriceResponse empty = HotelPriceResponse.builder()
                    .hotelId(hotelId)
                    .rooms(List.of())
                    .minPriceFrom(null)
                    .maxPriceFrom(null)
                    .priceNote("Không có phòng nào được tìm thấy")
                    .generatedAtMs(System.currentTimeMillis())
                    .build();
            return ResponseEntity.ok(ApiResponse.ok("Không có phòng", empty));
        }

        String hotelName = rows.get(0)[9] != null ? rows.get(0)[9].toString() : "Khách sạn";

        List<PricingRule> activeRules = pricingRuleRepository
                .findActiveByTargetType(PricingRule.TargetType.HOTEL, LocalDate.now().atStartOfDay());

        List<PricingRule> hotelRules = activeRules.stream()
                .filter(r -> r.getHotelId() != null && r.getHotelId().equals(hotelId))
                .toList();

        List<RoomPrice> roomPrices = new ArrayList<>();
        BigDecimal minPrice = null;
        BigDecimal maxPrice = null;

        int nightsVal = (nights != null && nights > 0) ? nights : 1;
        int roomsVal = (rooms != null && rooms > 0) ? rooms : 1;

        double seasonMultiplier = getSeasonMultiplier();
        int dayOfWeek = LocalDate.now().getDayOfWeek().getValue();
        boolean isWeekend = (dayOfWeek == 6 || dayOfWeek == 7);

        for (Object[] row : rows) {
            Long roomTypeId = ((Number) row[0]).longValue();
            String name = (String) row[1];
            String bedType = (String) row[2];
            BigDecimal basePrice = row[4] != null
                    ? new BigDecimal(row[4].toString())
                    : BigDecimal.ZERO;

            double variance = (Math.random() - 0.5) * 0.20;
            double weekendBoost = isWeekend ? 0.15 : 0.0;
            double totalMultiplier = seasonMultiplier + variance + weekendBoost;

            double finalMultiplier = 1.0 + totalMultiplier;
            finalMultiplier = Math.max(0.7, Math.min(1.5, finalMultiplier));

            BigDecimal currentPrice = basePrice
                    .multiply(BigDecimal.valueOf(finalMultiplier))
                    .setScale(-3, RoundingMode.HALF_UP);

            BigDecimal priceDiff = currentPrice.subtract(basePrice);
            BigDecimal variancePercent = basePrice.compareTo(BigDecimal.ZERO) > 0
                    ? priceDiff.divide(basePrice, 4, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(100))
                            .setScale(1, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;

            boolean isOnSale = variancePercent.compareTo(BigDecimal.ZERO) < 0;

            RoomPrice rp = RoomPrice.builder()
                    .roomTypeId(roomTypeId)
                    .name(name)
                    .bedType(bedType)
                    .basePrice(basePrice.setScale(0, RoundingMode.HALF_UP))
                    .currentPrice(currentPrice)
                    .priceVariance(priceDiff.setScale(0, RoundingMode.HALF_UP))
                    .variancePercent((variancePercent.compareTo(BigDecimal.ZERO) >= 0 ? "+" : "")
                            + variancePercent.toString() + "%")
                    .isOnSale(isOnSale)
                    .build();

            roomPrices.add(rp);

            if (minPrice == null || currentPrice.compareTo(minPrice) < 0) {
                minPrice = currentPrice;
            }
            if (maxPrice == null || currentPrice.compareTo(maxPrice) > 0) {
                maxPrice = currentPrice;
            }
        }

        String priceNote;
        if (seasonMultiplier > 0.1) {
            priceNote = "Mùa cao điểm - Giá có thể cao hơn";
        } else if (seasonMultiplier < -0.1) {
            priceNote = "Mùa thấp điểm - Cơ hội giá tốt!";
        } else if (isWeekend) {
            priceNote = "Cuối tuần - Giá có thể cao hơn 15%";
        } else {
            priceNote = "Giá được cập nhật theo thời gian thực";
        }

        HotelPriceResponse response = HotelPriceResponse.builder()
                .hotelId(hotelId)
                .hotelName(hotelName)
                .rooms(roomPrices)
                .minPriceFrom(minPrice)
                .maxPriceFrom(maxPrice)
                .priceNote(priceNote)
                .generatedAtMs(System.currentTimeMillis())
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Lấy giá động thành công", response));
    }

    private double getSeasonMultiplier() {
        int month = LocalDate.now().getMonthValue();
        if (month >= 6 && month <= 8) {
            return 0.25;
        }
        if ((month >= 11 && month <= 12) || month == 1 || month == 2) {
            return 0.30;
        }
        if (month == 4 || month == 5) {
            return -0.15;
        }
        if (month == 9 || month == 10) {
            return -0.10;
        }
        return 0.0;
    }

    @SuppressWarnings("unchecked")
    @GetMapping("/dynamic/prices")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDynamicPrices(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) Integer limit) {

        int safeLimit = (limit != null && limit > 0) ? Math.min(limit, 100) : 20;

        StringBuilder sql = new StringBuilder();
        sql.append("SELECT h.id, h.name, rt.base_price_per_night, rt.id AS room_id ");
        sql.append("FROM hotels h ");
        sql.append("JOIN room_types rt ON rt.hotel_id = h.id AND rt.is_active = TRUE ");
        sql.append("JOIN cities c ON c.id = h.city_id ");
        sql.append("WHERE h.is_active = TRUE AND rt.is_active = TRUE ");
        sql.append("AND h.latitude IS NOT NULL AND h.longitude IS NOT NULL ");

        List<Object> params = new ArrayList<>();

        if (city != null && !city.isBlank() && !"ALL".equalsIgnoreCase(city)) {
            sql.append(" AND (LOWER(c.name_vi) LIKE ? OR LOWER(c.name_en) LIKE ?) ");
            String likeCity = "%" + city.toLowerCase() + "%";
            params.add(likeCity);
            params.add(likeCity);
        }

        sql.append("ORDER BY h.avg_rating DESC LIMIT ?");
        params.add(safeLimit);

        List<Object[]> rows;
        if (params.size() == 1) {
            rows = em.createNativeQuery(sql.toString())
                    .setParameter(1, params.get(0))
                    .getResultList();
        } else if (params.size() == 2) {
            rows = em.createNativeQuery(sql.toString())
                    .setParameter(1, params.get(0))
                    .setParameter(2, params.get(1))
                    .getResultList();
        } else {
            var query = em.createNativeQuery(sql.toString());
            for (int i = 0; i < params.size(); i++) {
                query.setParameter(i + 1, params.get(i));
            }
            rows = query.getResultList();
        }

        List<Map<String, Object>> prices = new ArrayList<>();
        Set<Long> seenHotels = new LinkedHashSet<>();

        for (Object[] row : rows) {
            Long hotelId = ((Number) row[0]).longValue();
            if (seenHotels.contains(hotelId)) continue;
            seenHotels.add(hotelId);

            BigDecimal basePrice = row[2] != null
                    ? new BigDecimal(row[2].toString()) : BigDecimal.ZERO;

            double variance = (Math.random() - 0.5) * 0.15;
            double seasonMult = getSeasonMultiplier();
            double totalMult = 1.0 + seasonMult + variance;
            totalMult = Math.max(0.75, Math.min(1.5, totalMult));

            BigDecimal dynamicPrice = basePrice
                    .multiply(BigDecimal.valueOf(totalMult))
                    .setScale(-3, RoundingMode.HALF_UP);

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("hotelId", hotelId);
            item.put("hotelName", row[1]);
            item.put("roomId", ((Number) row[3]).longValue());
            item.put("basePrice", basePrice.setScale(0, RoundingMode.HALF_UP));
            item.put("dynamicPrice", dynamicPrice);
            item.put("discount", totalMult < 1.0);
            item.put("seasonBoost", seasonMult > 0.1);
            item.put("generatedAt", System.currentTimeMillis());
            prices.add(item);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("prices", prices);
        result.put("total", prices.size());
        result.put("generatedAtMs", System.currentTimeMillis());

        return ResponseEntity.ok(ApiResponse.ok("Lấy giá động thành công", result));
    }
}
