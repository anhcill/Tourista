package vn.tourista.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.tourista.entity.Tour;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TourRepository extends JpaRepository<Tour, Long>, JpaSpecificationExecutor<Tour> {

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

  @Query(value = """
                  SELECT t.id
                  FROM tours t
      JOIN cities c ON c.id = t.city_id
                  WHERE t.is_active = TRUE
                          AND t.min_group_size <= :travelers
                          AND t.max_group_size >= :travelers
                          AND t.price_per_adult <= :maxPricePerAdult
        AND (
          :city IS NULL OR :city = ''
          OR LOWER(c.name_vi) LIKE LOWER(CONCAT('%', :city, '%'))
          OR LOWER(c.name_en) LIKE LOWER(CONCAT('%', :city, '%'))
          OR LOWER(t.title) LIKE LOWER(CONCAT('%', :city, '%'))
        )
        AND (:maxDurationDays IS NULL OR t.duration_days <= :maxDurationDays)
                          AND EXISTS (
                                          SELECT 1
                                          FROM tour_departures td
                                          WHERE td.tour_id = t.id
                                                  AND td.available_slots >= :travelers
                                                  AND td.departure_date >= :today
                          )
                  ORDER BY t.avg_rating DESC, t.review_count DESC, t.price_per_adult ASC, t.id DESC
                  """, nativeQuery = true)
  List<Long> findBotRecommendedTourIds(
      @Param("travelers") Integer travelers,
      @Param("maxPricePerAdult") BigDecimal maxPricePerAdult,
      @Param("city") String city,
      @Param("maxDurationDays") Integer maxDurationDays,
      @Param("today") LocalDate today,
      Pageable pageable);

  /**
   * Lấy tour hot nhất (is_featured=TRUE, active, có slot, rating cao).
   * Dành cho Quick button "🔥 Tour hot" và intent tương ứng trong bot.
   */
  @Query(value = """
      SELECT t.id
      FROM tours t
      WHERE t.is_active = TRUE
        AND t.is_featured = TRUE
        AND EXISTS (
            SELECT 1
            FROM tour_departures td
            WHERE td.tour_id = t.id
              AND td.available_slots > 0
              AND td.departure_date >= :today
        )
      ORDER BY t.avg_rating DESC, t.review_count DESC, t.id DESC
      """, nativeQuery = true)
  List<Long> findHotTourIds(@Param("today") LocalDate today, Pageable pageable);

  @Query(value = """
      SELECT t.id
      FROM tours t
      WHERE t.is_active = TRUE
        AND t.id <> :excludeTourId
        AND (:cityId IS NULL OR t.city_id = :cityId)
        AND (:categoryId IS NULL OR t.category_id = :categoryId)
      ORDER BY t.avg_rating DESC, t.review_count DESC, t.id DESC
      """, nativeQuery = true)
  List<Long> findSimilarTourIds(
      @Param("excludeTourId") Long excludeTourId,
      @Param("cityId") Integer cityId,
      @Param("categoryId") Long categoryId,
      Pageable pageable);
}
