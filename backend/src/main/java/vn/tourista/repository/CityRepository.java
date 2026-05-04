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
                COALESCE(hc.hotel_count, 0),
                COALESCE(tc.tour_count, 0),
                COALESCE(
                    (SELECT MIN(rt.base_price_per_night)
                     FROM room_types rt
                     JOIN hotels h ON rt.hotel_id = h.id
                     WHERE h.city_id = c.id
                       AND h.is_active = TRUE
                       AND rt.is_active = TRUE
                       AND rt.base_price_per_night > 0
                    ), 0
                ) AS avg_price,
                COALESCE(hc.top_hotel_rating, 0),
                (
                    SELECT h3.name
                    FROM hotels h3
                    WHERE h3.city_id = c.id
                      AND h3.is_active = TRUE
                    ORDER BY h3.avg_rating DESC, h3.review_count DESC
                    LIMIT 1
                ) AS top_hotel_name,
                COALESCE(
                    c.cover_image,
                    (
                        SELECT hi.image_url
                        FROM hotels h3
                        LEFT JOIN hotel_images hi ON hi.hotel_id = h3.id
                        WHERE h3.city_id = c.id
                          AND h3.is_active = TRUE
                        ORDER BY h3.avg_rating DESC, h3.review_count DESC,
                                 hi.is_primary DESC, hi.id ASC
                        LIMIT 1
                    )
                ) AS cover_image
            FROM cities c
            LEFT JOIN (
                SELECT
                    h.city_id,
                    COUNT(*) AS hotel_count,
                    MAX(h.avg_rating) AS top_hotel_rating
                FROM hotels h
                WHERE h.is_active = TRUE
                GROUP BY h.city_id
            ) hc ON hc.city_id = c.id
            LEFT JOIN (
                SELECT city_id, COUNT(*) AS tour_count
                FROM tours
                WHERE is_active = TRUE
                GROUP BY city_id
            ) tc ON tc.city_id = c.id
            WHERE (hc.hotel_count > 0 OR tc.tour_count > 0)
            ORDER BY (COALESCE(hc.hotel_count, 0) + COALESCE(tc.tour_count, 0)) DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> findTrendingCities(@Param("limit") int limit);
}
