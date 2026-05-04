package vn.tourista.repository;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.tourista.entity.Hotel;
import vn.tourista.entity.User;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HotelRepository extends JpaRepository<Hotel, Long>, JpaSpecificationExecutor<Hotel> {

    List<Hotel> findByOwner(User owner);

    @Query("SELECT h.id FROM Hotel h WHERE h.isActive = true")
    List<Long> findActiveHotelIds(PageRequest pageRequest);

    @Query("SELECT h.id FROM Hotel h WHERE h.owner.id = :partnerId")
    List<Long> findIdsByPartnerId(@Param("partnerId") Long partnerId);

    @Query(value = "SELECT h.id FROM hotels h WHERE h.is_active = true " +
            "AND h.is_featured = true",
            nativeQuery = true)
    List<Long> findFeaturedHotelIds(PageRequest pageRequest);

    @Query(value = "SELECT h.id FROM hotels h WHERE h.is_active = true " +
            "AND h.is_trending = true",
            nativeQuery = true)
    List<Long> findTrendingHotelIds(PageRequest pageRequest);

    @Query(value = "SELECT h.id FROM hotels h " +
            "LEFT JOIN cities c ON c.id = h.city_id " +
            "WHERE h.is_active = true " +
            "AND (:city IS NULL OR " +
            "  LOWER(h.name) LIKE CONCAT('%', LOWER(:city), '%') OR " +
            "  LOWER(c.name_vi) LIKE CONCAT('%', LOWER(:city), '%') OR " +
            "  LOWER(c.name_en) LIKE CONCAT('%', LOWER(:city), '%'))",
            nativeQuery = true)
    List<Long> searchAvailableHotelIds(
            @Param("city") String city,
            @Param("checkIn") LocalDate checkIn,
            @Param("checkOut") LocalDate checkOut,
            @Param("adults") Integer adults,
            @Param("rooms") Integer rooms);

    @Query(value = "SELECT h.id FROM hotels h " +
            "LEFT JOIN cities c ON c.id = h.city_id " +
            "WHERE h.is_active = true " +
            "AND (:city IS NULL OR :city = '' OR " +
            "  LOWER(h.name) LIKE CONCAT('%', LOWER(:city), '%') OR " +
            "  LOWER(c.name_vi) LIKE CONCAT('%', LOWER(:city), '%') OR " +
            "  LOWER(c.name_en) LIKE CONCAT('%', LOWER(:city), '%') OR " +
            "  LOWER(h.address) LIKE CONCAT('%', LOWER(:city), '%'))",
            nativeQuery = true)
    List<Long> searchAvailableHotelIdsPaged(
            @Param("city") String city,
            @Param("checkIn") LocalDate checkIn,
            @Param("checkOut") LocalDate checkOut,
            @Param("adults") Integer adults,
            @Param("rooms") Integer rooms,
            PageRequest pageRequest);

    @Query(value = "SELECT COUNT(h.id) FROM hotels h " +
            "LEFT JOIN cities c ON c.id = h.city_id " +
            "WHERE h.is_active = true " +
            "AND (:city IS NULL OR :city = '' OR " +
            "  LOWER(h.name) LIKE CONCAT('%', LOWER(:city), '%') OR " +
            "  LOWER(c.name_vi) LIKE CONCAT('%', LOWER(:city), '%') OR " +
            "  LOWER(c.name_en) LIKE CONCAT('%', LOWER(:city), '%') OR " +
            "  LOWER(h.address) LIKE CONCAT('%', LOWER(:city), '%'))",
            nativeQuery = true)
    long countSearchAvailableHotels(
            @Param("city") String city,
            @Param("checkIn") LocalDate checkIn,
            @Param("checkOut") LocalDate checkOut,
            @Param("adults") Integer adults,
            @Param("rooms") Integer rooms);

    @Query(value = "SELECT h.id, " +
            "(SELECT url FROM hotel_images WHERE hotel_id = h.id AND is_cover = TRUE LIMIT 1) AS url " +
            "FROM hotels h WHERE h.id IN :hotelIds",
            nativeQuery = true)
    List<Object[]> findCoverImagesByHotelIds(@Param("hotelIds") List<Long> hotelIds);

    @Query(value = "SELECT hi.hotel_id, hi.url FROM hotel_images hi " +
            "WHERE hi.hotel_id = :hotelId AND hi.is_cover = true LIMIT 1",
            nativeQuery = true)
    Object[] findCoverImageByHotelId(@Param("hotelId") Long hotelId);

    Optional<Hotel> findByIdAndIsActiveTrue(Long id);

    @Query("SELECT h FROM Hotel h LEFT JOIN FETCH h.owner WHERE h.id = :id AND h.isActive = true")
    Optional<Hotel> findByIdAndIsActiveTrueWithOwner(@Param("id") Long id);

    @Query(value = """
            SELECT h.id, h.name, COALESCE(c.name_vi, c.name_en) AS city_name, h.address
            FROM hotels h
            LEFT JOIN cities c ON c.id = h.city_id
            WHERE h.is_active = TRUE
              AND (
                  LOWER(h.name) LIKE LOWER(CONCAT('%', :query, '%'))
                  OR LOWER(h.address) LIKE LOWER(CONCAT('%', :query, '%'))
                  OR LOWER(c.name_vi) LIKE LOWER(CONCAT('%', :query, '%'))
                  OR LOWER(c.name_en) LIKE LOWER(CONCAT('%', :query, '%'))
              )
            ORDER BY
                CASE
                    WHEN LOWER(h.name) = LOWER(:query) THEN 0
                    WHEN LOWER(h.name) LIKE LOWER(CONCAT(:query, '%')) THEN 1
                    WHEN LOWER(h.address) LIKE LOWER(CONCAT(:query, '%')) THEN 2
                    WHEN LOWER(c.name_vi) LIKE LOWER(CONCAT(:query, '%')) THEN 3
                    WHEN LOWER(c.name_en) LIKE LOWER(CONCAT(:query, '%')) THEN 4
                    ELSE 5
                END,
                h.avg_rating DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> searchHotelsAutocomplete(@Param("query") String query, @Param("limit") int limit);

    @Query(value = "SELECT COUNT(*) FROM hotels WHERE is_active = 1", nativeQuery = true)
    long countActiveHotels();

    boolean existsBySlug(String slug);

    @Query(value = """
        SELECT MIN(rt.base_price) FROM room_types rt
        WHERE rt.hotel_id = :hotelId
        """, nativeQuery = true)
    BigDecimal findMinBasePriceByHotelId(@Param("hotelId") Long hotelId);

    /**
     * Tim khu khach san noi bat theo thanh pho/tinh.
     * Dung de AI chatbot goi y khach san khi user hoi ve dia diem du lich.
     */
    @Query(value = """
            SELECT
                h.id,
                h.name,
                h.star_rating,
                COALESCE(c.name_vi, c.name_en) AS city_name,
                h.avg_rating,
                h.review_count,
                (SELECT MIN(rt.base_price_per_night)
                 FROM room_types rt
                 WHERE rt.hotel_id = h.id
                   AND rt.is_active = TRUE
                   AND rt.base_price_per_night > 0
                 LIMIT 1) AS min_price
            FROM hotels h
            LEFT JOIN cities c ON c.id = h.city_id
            WHERE h.is_active = TRUE
              AND c.name_en = :cityEn
            ORDER BY h.avg_rating DESC, h.review_count DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> findPopularHotelsByCityEn(
            @Param("cityEn") String cityEn,
            @Param("limit") int limit);

    @Query(value = """
            SELECT
                h.id,
                h.name,
                h.star_rating,
                COALESCE(c.name_vi, c.name_en) AS city_name,
                h.avg_rating,
                h.review_count,
                (SELECT MIN(rt.base_price_per_night)
                 FROM room_types rt
                 WHERE rt.hotel_id = h.id
                   AND rt.is_active = TRUE
                   AND rt.base_price_per_night > 0
                 LIMIT 1) AS min_price
            FROM hotels h
            LEFT JOIN cities c ON c.id = h.city_id
            WHERE h.is_active = TRUE
              AND (
                  LOWER(c.name_vi) = LOWER(:cityName)
                  OR LOWER(c.name_en) = LOWER(:cityName)
              )
            ORDER BY h.avg_rating DESC, h.review_count DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> findPopularHotelsByCityName(
            @Param("cityName") String cityName,
            @Param("limit") int limit);
}
