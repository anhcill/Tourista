package vn.tourista.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.tourista.entity.TourImage;

import java.util.List;
import java.util.Optional;

public interface TourImageRepository extends JpaRepository<TourImage, Long> {

    @Query(value = """
            SELECT ti.url
            FROM tour_images ti
            WHERE ti.tour_id = :tourId
              AND ti.is_cover = TRUE
            ORDER BY ti.sort_order ASC, ti.id ASC
            LIMIT 1
            """, nativeQuery = true)
    Optional<String> findCoverImageByTourId(@Param("tourId") Long tourId);

    @Query(value = """
            SELECT ti.tour_id, ti.url
            FROM tour_images ti
            WHERE ti.tour_id IN :tourIds
              AND ti.is_cover = TRUE
            """, nativeQuery = true)
    List<Object[]> findCoverImagesByTourIds(@Param("tourIds") List<Long> tourIds);

    List<TourImage> findByTour_IdOrderBySortOrderAscIdAsc(Long tourId);
}
