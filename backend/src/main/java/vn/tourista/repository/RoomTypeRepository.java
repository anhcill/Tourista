package vn.tourista.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.tourista.entity.RoomType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface RoomTypeRepository extends JpaRepository<RoomType, Long> {

        List<RoomType> findByHotel_IdAndIsActiveTrueOrderByBasePricePerNightAsc(Long hotelId);

        Optional<RoomType> findByIdAndIsActiveTrue(Long id);

        @Query("""
                        SELECT MIN(rt.basePricePerNight)
                        FROM RoomType rt
                        WHERE rt.hotel.id = :hotelId
                          AND rt.isActive = true
                        """)
        BigDecimal findMinBasePriceByHotelId(@Param("hotelId") Long hotelId);

        @Query("""
                        SELECT COUNT(rt)
                        FROM RoomType rt
                        WHERE rt.hotel.id = :hotelId
                                AND rt.isActive = true
                        """)
        Integer countActiveRoomTypesByHotelId(@Param("hotelId") Long hotelId);

        @Query(value = """
                        SELECT COUNT(*)
                        FROM room_types rt
                        WHERE rt.hotel_id = :hotelId
                          AND rt.is_active = TRUE
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
                        """, nativeQuery = true)
        Integer countAvailableRoomTypesByHotelId(
                        @Param("hotelId") Long hotelId,
                        @Param("checkIn") LocalDate checkIn,
                        @Param("checkOut") LocalDate checkOut,
                        @Param("adults") Integer adults,
                        @Param("rooms") Integer rooms);

        @Query(value = """
                        SELECT COALESCE(SUM(bhd.num_rooms), 0)
                        FROM booking_hotel_details bhd
                        JOIN bookings b ON b.id = bhd.booking_id
                        WHERE bhd.room_type_id = :roomTypeId
                          AND bhd.check_in_date < :checkOut
                          AND bhd.check_out_date > :checkIn
                          AND b.status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
                        """, nativeQuery = true)
        Integer countBookedRoomsInDateRange(
                        @Param("roomTypeId") Long roomTypeId,
                        @Param("checkIn") LocalDate checkIn,
                        @Param("checkOut") LocalDate checkOut);

        @Query(value = """
                        SELECT COALESCE(SUM(bhd.num_rooms), 0)
                        FROM booking_hotel_details bhd
                        JOIN bookings b ON b.id = bhd.booking_id
                        WHERE bhd.room_type_id = :roomTypeId
                          AND bhd.check_in_date < :checkOut
                          AND bhd.check_out_date > :checkIn
                          AND b.status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
                          AND b.id != :excludeBookingId
                        """, nativeQuery = true)
        Integer countBookedRoomsInDateRangeExcluding(
                        @Param("roomTypeId") Long roomTypeId,
                        @Param("checkIn") LocalDate checkIn,
                        @Param("checkOut") LocalDate checkOut,
                        @Param("excludeBookingId") Long excludeBookingId);

        @Query(value = """
            SELECT COALESCE(SUM(
              GREATEST(
                rt.total_rooms - COALESCE((
                  SELECT SUM(bhd.num_rooms)
                  FROM booking_hotel_details bhd
                  JOIN bookings b ON b.id = bhd.booking_id
                  WHERE bhd.room_type_id = rt.id
                    AND bhd.check_in_date < :checkOut
                    AND bhd.check_out_date > :checkIn
                    AND b.status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')
                ), 0),
                0
              )
            ), 0)
            FROM room_types rt
            WHERE rt.hotel_id = :hotelId
              AND rt.is_active = TRUE
              AND rt.max_adults >= :adults
            """, nativeQuery = true)
        Integer countAvailableRoomsByHotelId(
            @Param("hotelId") Long hotelId,
            @Param("checkIn") LocalDate checkIn,
            @Param("checkOut") LocalDate checkOut,
            @Param("adults") Integer adults);

        @Query(value = """
            SELECT rt.hotel_id, MIN(rt.base_price_per_night)
            FROM room_types rt
            WHERE rt.hotel_id IN :hotelIds
              AND rt.is_active = TRUE
            GROUP BY rt.hotel_id
            """, nativeQuery = true)
        List<Object[]> findMinBasePricesByHotelIds(@Param("hotelIds") List<Long> hotelIds);

        @Query(value = """
            SELECT rt.hotel_id, COUNT(rt.id)
            FROM room_types rt
            WHERE rt.hotel_id IN :hotelIds
              AND rt.is_active = TRUE
            GROUP BY rt.hotel_id
            """, nativeQuery = true)
        List<Object[]> countActiveRoomTypesByHotelIds(@Param("hotelIds") List<Long> hotelIds);

        @Modifying
        @Query(value = """
            UPDATE room_types rt
            SET rt.total_rooms = rt.total_rooms + :rooms
            WHERE rt.id = :roomTypeId
            """, nativeQuery = true)
        void incrementRoomsAvailable(@Param("roomTypeId") Long roomTypeId, @Param("rooms") int rooms);
}
