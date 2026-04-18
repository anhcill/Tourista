package vn.tourista.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class StatisticsService {

    private final JdbcTemplate jdbcTemplate;

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new LinkedHashMap<>();

        stats.put("totalUsers", getTotalUsers());
        stats.put("totalHotels", getTotalHotels());
        stats.put("totalTours", getTotalTours());
        stats.put("totalBookings", getTotalBookings());
        stats.put("totalReviews", getTotalReviews());
        stats.put("pendingReviews", getPendingReviews());
        stats.put("pendingHotels", getPendingHotels());
        stats.put("pendingTours", getPendingTours());
        stats.put("totalRevenue", getTotalRevenue());
        stats.put("monthlyRevenue", getMonthlyRevenue());
        stats.put("revenueByMonth", getRevenueByMonth());
        stats.put("bookingsByMonth", getBookingsByMonth());
        stats.put("topDestinations", getTopDestinations());
        stats.put("recentBookings", getRecentBookings());

        return stats;
    }

    public Map<String, Object> getRevenueStats(String period) {
        return switch (period.toLowerCase()) {
            case "week" -> getRevenueForPeriod(7);
            case "month" -> getRevenueForPeriod(30);
            case "year" -> getRevenueForPeriod(365);
            default -> getRevenueForPeriod(30);
        };
    }

    private long getTotalUsers() {
        try {
            return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users", Long.class);
        } catch (Exception e) { return 0L; }
    }

    private long getTotalHotels() {
        try {
            return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM hotels WHERE is_active = TRUE", Long.class);
        } catch (Exception e) { return 0L; }
    }

    private long getTotalTours() {
        try {
            return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM tours WHERE is_active = TRUE", Long.class);
        } catch (Exception e) { return 0L; }
    }

    private long getTotalBookings() {
        try {
            return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM bookings", Long.class);
        } catch (Exception e) { return 0L; }
    }

    private long getTotalReviews() {
        try {
            return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM reviews", Long.class);
        } catch (Exception e) { return 0L; }
    }

    private long getPendingReviews() {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM reviews WHERE admin_status = 'PENDING'", Long.class);
        } catch (Exception e) { return 0L; }
    }

    private long getPendingHotels() {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM hotels WHERE admin_status = 'PENDING'", Long.class);
        } catch (Exception e) { return 0L; }
    }

    private long getPendingTours() {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM tours WHERE admin_status = 'PENDING'", Long.class);
        } catch (Exception e) { return 0L; }
    }

    private BigDecimal getTotalRevenue() {
        try {
            BigDecimal revenue = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE status = 'COMPLETED'",
                    BigDecimal.class);
            return revenue != null ? revenue : BigDecimal.ZERO;
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    private BigDecimal getMonthlyRevenue() {
        try {
            LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
            BigDecimal revenue = jdbcTemplate.queryForObject(
                    "SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE status = 'COMPLETED' AND created_at >= ?",
                    BigDecimal.class, startOfMonth);
            return revenue != null ? revenue : BigDecimal.ZERO;
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }

    private List<Map<String, Object>> getRevenueByMonth() {
        try {
            String sql = """
                    SELECT
                        DATE_FORMAT(created_at, '%Y-%m') AS month,
                        COUNT(*) AS bookings,
                        COALESCE(SUM(total_amount), 0) AS revenue
                    FROM bookings
                    WHERE status = 'COMPLETED'
                      AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                    ORDER BY month ASC
                    """;
            return jdbcTemplate.queryForList(sql);
        } catch (Exception e) {
            return List.of();
        }
    }

    private List<Map<String, Object>> getBookingsByMonth() {
        try {
            String sql = """
                    SELECT
                        DATE_FORMAT(created_at, '%Y-%m') AS month,
                        COUNT(*) AS total_bookings,
                        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
                        SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled,
                        SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending
                    FROM bookings
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                    GROUP BY DATE_FORMAT(created_at, '%Y-%m')
                    ORDER BY month ASC
                    """;
            return jdbcTemplate.queryForList(sql);
        } catch (Exception e) {
            return List.of();
        }
    }

    private List<Map<String, Object>> getTopDestinations() {
        try {
            String sql = """
                    SELECT
                        c.name_vi AS name,
                        COUNT(DISTINCT t.id) AS tour_count,
                        COALESCE(AVG(r.overall_rating), 0) AS avg_rating,
                        COUNT(DISTINCT r.id) AS review_count
                    FROM cities c
                    LEFT JOIN tours t ON t.city_id = c.id AND t.is_active = TRUE
                    LEFT JOIN reviews r ON r.target_type = 'TOUR'
                        AND r.target_id = t.id
                        AND r.is_published = TRUE
                    GROUP BY c.id, c.name_vi
                    ORDER BY tour_count DESC, avg_rating DESC
                    LIMIT 10
                    """;
            return jdbcTemplate.queryForList(sql);
        } catch (Exception e) {
            return List.of();
        }
    }

    private List<Map<String, Object>> getRecentBookings() {
        try {
            String sql = """
                    SELECT
                        b.id,
                        b.booking_code,
                        b.total_amount,
                        b.status,
                        b.created_at,
                        u.full_name AS user_name,
                        CASE
                            WHEN btd.tour_title IS NOT NULL THEN btd.tour_title
                            WHEN bhd.hotel_name IS NOT NULL THEN bhd.hotel_name
                            ELSE 'Unknown'
                        END AS service_name,
                        b.booking_type
                    FROM bookings b
                    LEFT JOIN users u ON u.id = b.user_id
                    LEFT JOIN booking_tour_details btd ON btd.booking_id = b.id
                    LEFT JOIN booking_hotel_details bhd ON bhd.booking_id = b.id
                    ORDER BY b.created_at DESC
                    LIMIT 10
                    """;
            return jdbcTemplate.queryForList(sql);
        } catch (Exception e) {
            return List.of();
        }
    }

    private Map<String, Object> getRevenueForPeriod(int days) {
        Map<String, Object> result = new LinkedHashMap<>();
        try {
            String sql = """
                    SELECT
                        COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN total_amount ELSE 0 END), 0) AS total,
                        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS completed_count,
                        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END) AS cancelled_count,
                        COUNT(*) AS total_count
                    FROM bookings
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                    """;
            Map<String, Object> row = jdbcTemplate.queryForMap(sql, days);
            result.putAll(row);

            // Daily breakdown
            String dailySql = """
                    SELECT
                        DATE(created_at) AS date,
                        COUNT(*) AS bookings,
                        COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN total_amount ELSE 0 END), 0) AS revenue
                    FROM bookings
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
                    GROUP BY DATE(created_at)
                    ORDER BY date ASC
                    """;
            result.put("daily", jdbcTemplate.queryForList(dailySql, days));

        } catch (Exception e) {
            log.warn("Revenue stats error: {}", e.getMessage());
        }
        return result;
    }
}
