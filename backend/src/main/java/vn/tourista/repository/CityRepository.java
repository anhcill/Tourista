package vn.tourista.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.tourista.entity.City;

import java.util.List;
import java.util.Optional;

@Repository
public interface CityRepository extends JpaRepository<City, Integer> {

    Optional<City> findBySlug(String slug);

    List<City> findByNameViContainingIgnoreCaseOrNameEnContainingIgnoreCase(String nameVi, String nameEn);

    @Query(value = """
            SELECT c.id, c.name_vi, c.name_en
            FROM cities c
            WHERE (
                  LOWER(c.name_vi) LIKE LOWER(CONCAT('%', :query, '%'))
              OR LOWER(c.name_en) LIKE LOWER(CONCAT('%', :query, '%'))
            )
            ORDER BY
                CASE
                    WHEN LOWER(c.name_vi) LIKE LOWER(CONCAT(:query, '%')) THEN 1
                    WHEN LOWER(c.name_en) LIKE LOWER(CONCAT(:query, '%')) THEN 2
                    WHEN LOWER(c.name_vi) LIKE LOWER(CONCAT('%', :query, '%')) THEN 3
                    ELSE 4
                END,
                c.name_vi ASC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> searchCities(@Param("query") String query, @Param("limit") int limit);

    @Query(value = """
            SELECT c.id, c.name_vi, c.name_en
            FROM cities c
            WHERE LOWER(c.name_vi) LIKE LOWER(CONCAT('%', :query, '%'))
               OR LOWER(c.name_en) LIKE LOWER(CONCAT('%', :query, '%'))
            ORDER BY
                CASE
                    WHEN LOWER(c.name_vi) = LOWER(:query) THEN 0
                    WHEN LOWER(c.name_en) = LOWER(:query) THEN 1
                    WHEN LOWER(c.name_vi) LIKE LOWER(CONCAT(:query, '%')) THEN 2
                    WHEN LOWER(c.name_en) LIKE LOWER(CONCAT(:query, '%')) THEN 3
                    WHEN LOWER(c.name_vi) LIKE LOWER(CONCAT('%', :query)) THEN 4
                    WHEN LOWER(c.name_en) LIKE LOWER(CONCAT('%', :query)) THEN 5
                    ELSE 6
                END,
                c.name_vi ASC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> searchCitiesFuzzy(@Param("query") String query, @Param("limit") int limit);

    @Query(value = """
            SELECT
                c.id,
                c.name_vi,
                c.name_en,
                COALESCE(hc.hotel_count, 0) AS hotel_count,
                COALESCE(tc.tour_count, 0) AS tour_count,
                COALESCE(hc.avg_price, 0) AS avg_price,
                COALESCE(hc.avg_rating, 0) AS avg_rating,
                hc.top_hotel_name,
                hc.top_hotel_rating,
                h.cover_image
            FROM cities c
            LEFT JOIN (
                SELECT
                    city_id,
                    COUNT(*) AS hotel_count,
                    ROUND(AVG(min_price_per_night)) AS avg_price,
                    ROUND(AVG(avg_rating), 1) AS avg_rating,
                    MAX(name) AS top_hotel_name,
                    MAX(avg_rating) AS top_hotel_rating
                FROM hotels
                WHERE is_active = TRUE
                GROUP BY city_id
            ) hc ON hc.city_id = c.id
            LEFT JOIN (
                SELECT city_id, COUNT(*) AS tour_count
                FROM tours
                WHERE is_active = TRUE
                GROUP BY city_id
            ) tc ON tc.city_id = c.id
            LEFT JOIN LATERAL (
                SELECT h.cover_image
                FROM hotels h
                WHERE h.city_id = c.id AND h.is_active = TRUE
                ORDER BY h.avg_rating DESC, h.cover_image IS NOT NULL DESC
                LIMIT 1
            ) h ON TRUE
            WHERE hc.hotel_count > 0 OR tc.tour_count > 0
            ORDER BY (COALESCE(hc.hotel_count, 0) + COALESCE(tc.tour_count, 0)) DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> findTrendingCities(@Param("limit") int limit);
}
