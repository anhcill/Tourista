package vn.tourista.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.tourista.entity.TourImage;

import java.util.List;
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
                 ORDER BY ti.is_primary DESC, ti.sort_order ASC, ti.id ASC
                 LIMIT 1)
            )
            """, nativeQuery = true)
    Optional<String> findCoverImageByTourId(@Param("tourId") Long tourId);

    @Query(value = """
            SELECT ti.tour_id, COALESCE(
                (SELECT ti2.url
                 FROM tour_images ti2
                 WHERE ti2.tour_id = ti.tour_id
                   AND ti2.is_cover = TRUE
                 ORDER BY ti2.sort_order ASC, ti2.id ASC
                 LIMIT 1),
                (SELECT ti3.url
                 FROM tour_images ti3
                 WHERE ti3.tour_id = ti.tour_id
                 ORDER BY ti3.is_primary DESC, ti3.sort_order ASC, ti3.id ASC
                 LIMIT 1)
            ) AS cover_url
            FROM tour_images ti
            WHERE ti.tour_id IN :tourIds
            GROUP BY ti.tour_id
            """, nativeQuery = true)
    List<Object[]> findCoverImagesByTourIds(@Param("tourIds") List<Long> tourIds);

    List<TourImage> findByTour_IdOrderBySortOrderAscIdAsc(Long tourId);
}
