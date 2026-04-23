package vn.tourista.controller;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.tourista.dto.response.ApiResponse;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/hotels")
public class AdminHotelMapController {

    @PersistenceContext
    private EntityManager em;

    @GetMapping("/map")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getHotelsForMap(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "500") Integer limit) {

        StringBuilder sql = new StringBuilder();
        sql.append("SELECT h.id, h.name, h.address, h.latitude, h.longitude, ");
        sql.append("h.avg_rating, h.review_count, h.star_rating, ");
        sql.append("COALESCE(c.name_vi, c.name_en) AS city_name, ");
        sql.append("h.admin_status, h.is_active, ");
        sql.append("(SELECT url FROM hotel_images WHERE hotel_id = h.id AND is_cover = TRUE LIMIT 1) AS cover_image ");
        sql.append("FROM hotels h ");
        sql.append("LEFT JOIN cities c ON c.id = h.city_id ");
        sql.append("WHERE h.latitude IS NOT NULL AND h.longitude IS NOT NULL ");
        sql.append("AND h.latitude != 0 AND h.longitude != 0 ");

        List<Object> params = new ArrayList<>();

        if (city != null && !city.isBlank() && !"ALL".equalsIgnoreCase(city)) {
            sql.append(" AND (LOWER(c.name_vi) LIKE ? OR LOWER(c.name_en) LIKE ?) ");
            String likeCity = "%" + city.toLowerCase() + "%";
            params.add(likeCity);
            params.add(likeCity);
        }

        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            sql.append(" AND h.admin_status = ? ");
            params.add(status);
        }

        sql.append(" AND h.is_active = TRUE ");
        sql.append(" ORDER BY h.avg_rating DESC ");
        sql.append(" LIMIT ? ");

        int safeLimit = (limit != null && limit > 0 && limit <= 1000) ? limit : 500;
        params.add(safeLimit);

        var query = em.createNativeQuery(sql.toString());
        for (int i = 0; i < params.size(); i++) {
            query.setParameter(i + 1, params.get(i));
        }
        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();

        List<Map<String, Object>> results = rows.stream().map(row -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", ((Number) row[0]).longValue());
            map.put("name", row[1]);
            map.put("address", row[2]);
            map.put("latitude", row[3] != null ? new BigDecimal(row[3].toString()) : null);
            map.put("longitude", row[4] != null ? new BigDecimal(row[4].toString()) : null);
            map.put("avgRating", row[5] != null ? new BigDecimal(row[5].toString()) : BigDecimal.ZERO);
            map.put("reviewCount", row[6] != null ? ((Number) row[6]).intValue() : 0);
            map.put("starRating", row[7] != null ? ((Number) row[7]).intValue() : 3);
            map.put("cityName", row[8]);
            map.put("adminStatus", row[9]);
            map.put("isActive", row[10]);
            map.put("coverImage", row[11]);
            return map;
        }).toList();

        return ResponseEntity.ok(ApiResponse.ok("Lấy dữ liệu bản đồ thành công", results));
    }

    @GetMapping("/map/cities")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCitiesWithHotels() {
        String sql = """
            SELECT c.id, c.name_vi, c.name_en,
                   COUNT(h.id) AS hotel_count
            FROM cities c
            LEFT JOIN hotels h ON h.city_id = c.id
                AND h.latitude IS NOT NULL AND h.longitude IS NOT NULL
                AND h.latitude != 0 AND h.longitude != 0
                AND h.is_active = TRUE
            GROUP BY c.id, c.name_vi, c.name_en
            HAVING COUNT(h.id) > 0
            ORDER BY hotel_count DESC
            LIMIT 50
            """;

        @SuppressWarnings("unchecked")
        List<Object[]> rows = em.createNativeQuery(sql).getResultList();

        List<Map<String, Object>> results = rows.stream().map(row -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", ((Number) row[0]).intValue());
            map.put("nameVi", row[1]);
            map.put("nameEn", row[2]);
            map.put("hotelCount", row[3] != null ? ((Number) row[3]).intValue() : 0);
            return map;
        }).toList();

        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách thành phố thành công", results));
    }
}
