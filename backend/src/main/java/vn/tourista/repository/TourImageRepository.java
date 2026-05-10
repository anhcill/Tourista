package vn.tourista.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.tourista.entity.TourImage;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface TourImageRepository extends JpaRepository<TourImage, Long> {

    @Query(value = """
            SELECT COALESCE(
                (SELECT ti.url
                 FROM tour_images ti
                 WHERE ti.tour_id = :tourId
                   AND ti.is_cover = TRUE
                 ORDER BY ti.sort_order ASC, ti.id ASC
                 LIMIT 1),
                (SELECT ti.url
                 FROM tour_images ti
                 WHERE ti.tour_id = :tourId
                 ORDER BY ti.is_cover DESC, ti.sort_order ASC, ti.id ASC
                 LIMIT 1)
            )
            """, nativeQuery = true)
    Optional<String> findCoverImageByTourId(@Param("tourId") Long tourId);

    @Query(value = """
            SELECT ti.tour_id,
                   COALESCE(
                       (SELECT ti2.url
                        FROM tour_images ti2
                        WHERE ti2.tour_id = ti.tour_id
                          AND ti2.is_cover = TRUE
                        ORDER BY ti2.sort_order ASC, ti2.id ASC
                        LIMIT 1),
                       (SELECT ti3.url
                        FROM tour_images ti3
                        WHERE ti3.tour_id = ti.tour_id
                        ORDER BY ti3.is_cover DESC, ti3.sort_order ASC, ti3.id ASC
                        LIMIT 1)
                   ) AS cover_url
            FROM tour_images ti
            WHERE ti.tour_id IN :tourIds
            GROUP BY ti.tour_id
            """, nativeQuery = true)
    List<Object[]> findCoverImagesByTourIds(@Param("tourIds") List<Long> tourIds);

    default Map<Long, String> mapCoverImagesByTourIds(List<Object[]> rows) {
        Map<Long, String> result = new java.util.LinkedHashMap<>();
        if (rows == null) return result;
        for (Object[] row : rows) {
            result.put(((Number) row[0]).longValue(), (String) row[1]);
        }
        return result;
    }

    List<TourImage> findByTour_IdOrderBySortOrderAscIdAsc(Long tourId);
}
