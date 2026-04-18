package vn.tourista.repository;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.tourista.entity.Hotel;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HotelRepository extends JpaRepository<Hotel, Long>, JpaSpecificationExecutor<Hotel> {

    @Query("SELECT h.id FROM Hotel h WHERE h.isActive = true")
    List<Long> findActiveHotelIds(PageRequest pageRequest);

    @Query(value = "SELECT h.id FROM hotels h WHERE h.is_active = true " +
            "AND h.is_trending = true",
            nativeQuery = true)
    List<Long> findFeaturedHotelIds(PageRequest pageRequest);

    @Query(value = "SELECT h.id FROM hotels h WHERE h.is_active = true " +
            "AND h.is_trending = true",
            nativeQuery = true)
    List<Long> findTrendingHotelIds(PageRequest pageRequest);

    @Query(value = "SELECT h.id FROM hotels h " +
            "WHERE h.is_active = true " +
            "AND (:city IS NULL OR LOWER(h.name) LIKE CONCAT('%', LOWER(:city), '%'))",
            nativeQuery = true)
    List<Long> searchAvailableHotelIds(
            @Param("city") String city,
            @Param("checkIn") LocalDate checkIn,
            @Param("checkOut") LocalDate checkOut,
            @Param("adults") Integer adults,
            @Param("rooms") Integer rooms);

    @Query(value = "SELECT h.id, COALESCE(hi.image_url, (SELECT image_url FROM hotel_images WHERE hotel_id = h.id LIMIT 1)) " +
            "FROM hotels h LEFT JOIN hotel_images hi ON h.id = hi.hotel_id AND hi.is_cover = true " +
            "WHERE h.id IN :hotelIds",
            nativeQuery = true)
    List<Object[]> findCoverImagesByHotelIds(@Param("hotelIds") List<Long> hotelIds);

    @Query(value = "SELECT hi.hotel_id, hi.image_url FROM hotel_images hi " +
            "WHERE hi.hotel_id = :hotelId AND hi.is_cover = true LIMIT 1",
            nativeQuery = true)
    Object[] findCoverImageByHotelId(@Param("hotelId") Long hotelId);

    Optional<Hotel> findByIdAndIsActiveTrue(Long id);
}
