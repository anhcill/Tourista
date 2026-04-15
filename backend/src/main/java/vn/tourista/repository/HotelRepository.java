package vn.tourista.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.query.Param;
import vn.tourista.entity.Hotel;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface HotelRepository extends JpaRepository<Hotel, Long>, JpaSpecificationExecutor<Hotel> {

  Optional<Hotel> findByIdAndIsActiveTrue(Long id);

  @Query(value = """
      SELECT h.id
      FROM hotels h
      WHERE h.is_active = TRUE
        AND h.is_featured = TRUE
      ORDER BY h.avg_rating DESC, h.review_count DESC, h.id DESC
      """, nativeQuery = true)
  List<Long> findFeaturedHotelIds(Pageable pageable);

  @Query(value = """
      SELECT h.id
      FROM hotels h
      WHERE h.is_active = TRUE
        AND h.is_trending = TRUE
      ORDER BY h.avg_rating DESC, h.review_count DESC, h.id DESC
      """, nativeQuery = true)
  List<Long> findTrendingHotelIds(Pageable pageable);

  @Query(value = """
      SELECT h.id
      FROM hotels h
      WHERE h.is_active = TRUE
      ORDER BY h.avg_rating DESC, h.review_count DESC, h.id DESC
      """, nativeQuery = true)
  List<Long> findActiveHotelIds(Pageable pageable);

  @Query(value = """
      SELECT h.id
      FROM hotels h
      JOIN cities c ON c.id = h.city_id
      JOIN room_types rt ON rt.hotel_id = h.id AND rt.is_active = TRUE
      WHERE h.is_active = TRUE
        AND (
              :city IS NULL OR :city = ''
              OR LOWER(c.name_vi) LIKE LOWER(CONCAT('%', :city, '%'))
              OR LOWER(c.name_en) LIKE LOWER(CONCAT('%', :city, '%'))
              OR LOWER(h.address) LIKE LOWER(CONCAT('%', :city, '%'))
            )
        AND rt.max_adults >= :adults
        AND (
              rt.total_rooms - COALESCE((
                  SELECT SUM(bhd.num_rooms)
                  FROM booking_hotel_details bhd
                  JOIN bookings b ON b.id = bhd.booking_id
                  WHERE bhd.room_type_id = rt.id
                    AND bhd.check_in_date < :checkOut
                    AND bhd.check_out_date > :checkIn
                    AND b.status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
              ), 0)
            ) >= :rooms
      GROUP BY h.id
      ORDER BY MAX(h.avg_rating) DESC, h.id DESC
      """, nativeQuery = true)
  List<Long> searchAvailableHotelIds(
      @Param("city") String city,
      @Param("checkIn") LocalDate checkIn,
      @Param("checkOut") LocalDate checkOut,
      @Param("adults") Integer adults,
      @Param("rooms") Integer rooms);

  @Query(value = """
      SELECT hi.url
      FROM hotel_images hi
      WHERE hi.hotel_id = :hotelId
        AND hi.is_cover = TRUE
      ORDER BY hi.sort_order ASC, hi.id ASC
      LIMIT 1
      """, nativeQuery = true)
  Optional<String> findCoverImageByHotelId(@Param("hotelId") Long hotelId);

  @Query(value = """
      SELECT hi.hotel_id, hi.url
      FROM hotel_images hi
      WHERE hi.hotel_id IN :hotelIds
        AND hi.is_cover = TRUE
      """, nativeQuery = true)
  List<Object[]> findCoverImagesByHotelIds(@Param("hotelIds") List<Long> hotelIds);
}
