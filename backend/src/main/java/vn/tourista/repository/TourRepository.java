package vn.tourista.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.tourista.entity.Tour;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TourRepository extends JpaRepository<Tour, Long> {

    Optional<Tour> findByIdAndIsActiveTrue(Long id);

    @Query(value = """
            SELECT t.id
            FROM tours t
            WHERE t.is_active = TRUE
            ORDER BY t.avg_rating DESC, t.review_count DESC, t.id DESC
            """, nativeQuery = true)
    List<Long> findActiveTourIds(Pageable pageable);

    @Query(value = """
            SELECT t.id
            FROM tours t
            WHERE t.is_active = TRUE
              AND t.is_featured = TRUE
            ORDER BY t.avg_rating DESC, t.review_count DESC, t.id DESC
            """, nativeQuery = true)
    List<Long> findFeaturedTourIds(Pageable pageable);

    @Query(value = """
            SELECT t.id
            FROM tours t
            JOIN cities c ON c.id = t.city_id
            WHERE t.is_active = TRUE
              AND (
                   :city IS NULL OR :city = ''
                   OR LOWER(c.name_vi) LIKE LOWER(CONCAT('%', :city, '%'))
                   OR LOWER(c.name_en) LIKE LOWER(CONCAT('%', :city, '%'))
                   OR LOWER(t.title) LIKE LOWER(CONCAT('%', :city, '%'))
              )
              AND (:categoryId IS NULL OR t.category_id = :categoryId)
              AND (:difficulty IS NULL OR t.difficulty = :difficulty)
              AND (:durationMin IS NULL OR t.duration_days >= :durationMin)
              AND (:durationMax IS NULL OR t.duration_days <= :durationMax)
              AND (:minRating IS NULL OR t.avg_rating >= :minRating)
              AND (:minPrice IS NULL OR t.price_per_adult >= :minPrice)
              AND (:maxPrice IS NULL OR t.price_per_adult <= :maxPrice)
              AND EXISTS (
                  SELECT 1
                  FROM tour_departures td
                  WHERE td.tour_id = t.id
                    AND td.available_slots > 0
                    AND td.departure_date >= COALESCE(:departureDate, :today)
              )
            ORDER BY t.avg_rating DESC, t.review_count DESC, t.id DESC
            """, nativeQuery = true)
    List<Long> searchTourIds(
            @Param("city") String city,
            @Param("categoryId") Long categoryId,
            @Param("difficulty") String difficulty,
            @Param("durationMin") Integer durationMin,
            @Param("durationMax") Integer durationMax,
            @Param("minRating") BigDecimal minRating,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("departureDate") LocalDate departureDate,
            @Param("today") LocalDate today,
            Pageable pageable);
}
