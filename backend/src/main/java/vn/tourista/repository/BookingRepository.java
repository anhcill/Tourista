package vn.tourista.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.tourista.entity.Booking;
import vn.tourista.entity.User;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long>, JpaSpecificationExecutor<Booking> {

    boolean existsByBookingCode(String bookingCode);

    Optional<Booking> findByBookingCode(String bookingCode);

    Optional<Booking> findByBookingCodeIgnoreCase(String bookingCode);

    Optional<Booking> findByBookingCodeAndUser_Email(String bookingCode, String email);

    List<Booking> findByUser_IdOrderByCreatedAtDesc(Long userId);

    List<Booking> findByUserAndStatusIn(User user, List<Booking.BookingStatus> statuses);

    List<Booking> findByStatusAndCreatedAtBefore(Booking.BookingStatus status, LocalDateTime before);

    // ===== Partner queries =====

    @Query("""
            SELECT b FROM Booking b
            JOIN BookingHotelDetail hd ON hd.booking = b
            JOIN hd.hotel h
            WHERE h.owner.id = :ownerId
            ORDER BY b.createdAt DESC
            """)
    Page<Booking> findByHotelOwnerId(@Param("ownerId") Long ownerId, Pageable pageable);

    @Query("""
            SELECT b FROM Booking b
            JOIN BookingHotelDetail hd ON hd.booking = b
            JOIN hd.hotel h
            WHERE h.owner.id = :ownerId
              AND b.status = :status
            ORDER BY b.createdAt DESC
            """)
    Page<Booking> findByHotelOwnerIdAndStatus(
            @Param("ownerId") Long ownerId,
            @Param("status") Booking.BookingStatus status,
            Pageable pageable);

    @Query("""
            SELECT b FROM Booking b
            JOIN BookingTourDetail td ON td.booking = b
            JOIN td.tour t
            WHERE t.operator.id = :operatorId
            ORDER BY b.createdAt DESC
            """)
    Page<Booking> findByTourOperatorId(@Param("operatorId") Long operatorId, Pageable pageable);

    @Query("""
            SELECT b FROM Booking b
            JOIN BookingTourDetail td ON td.booking = b
            JOIN td.tour t
            WHERE t.operator.id = :operatorId
              AND b.status = :status
            ORDER BY b.createdAt DESC
            """)
    Page<Booking> findByTourOperatorIdAndStatus(
            @Param("operatorId") Long operatorId,
            @Param("status") Booking.BookingStatus status,
            Pageable pageable);

    long countByStatusAndCreatedAtBefore(Booking.BookingStatus status, LocalDateTime before);

    // Lay service name + dates cho chat admin
    // Tra ve Object[]: [serviceName, dateRange]
    @Query(value = """
        SELECT
          CASE
            WHEN hd.hotel_name IS NOT NULL THEN hd.hotel_name
            WHEN td.tour_title IS NOT NULL THEN td.tour_title
            ELSE NULL
          END,
          CASE
            WHEN hd.check_in_date IS NOT NULL AND hd.check_out_date IS NOT NULL
              THEN CONCAT(hd.check_in_date, ' → ', hd.check_out_date)
            WHEN td.departure_date IS NOT NULL
              THEN CONCAT('Khởi hành: ', td.departure_date)
            ELSE NULL
          END
        FROM bookings b
        LEFT JOIN booking_hotel_details hd ON hd.booking_id = b.id
        LEFT JOIN booking_tour_details td ON td.booking_id = b.id
        WHERE b.id = :bookingId
        """, nativeQuery = true)
    Object[] findServiceInfoByBookingId(@Param("bookingId") Long bookingId);

    // ===== Revenue stats queries =====

    @Query("""
            SELECT FUNCTION('DATE', b.confirmedAt) AS date, SUM(b.totalAmount) AS amount, COUNT(b) AS count
            FROM Booking b
            JOIN BookingHotelDetail hd ON hd.booking = b
            JOIN hd.hotel h
            WHERE h.owner.id = :ownerId
              AND b.status IN ('CONFIRMED', 'COMPLETED', 'CHECKED_IN')
              AND b.confirmedAt >= :fromDate
            GROUP BY FUNCTION('DATE', b.confirmedAt)
            ORDER BY FUNCTION('DATE', b.confirmedAt) ASC
            """)
    List<Object[]> sumDailyRevenueByHotelOwner(@Param("ownerId") Long ownerId, @Param("fromDate") LocalDateTime fromDate);

    @Query("""
            SELECT FUNCTION('DATE', b.confirmedAt) AS date, SUM(b.totalAmount) AS amount, COUNT(b) AS count
            FROM Booking b
            JOIN BookingTourDetail td ON td.booking = b
            JOIN td.tour t
            WHERE t.operator.id = :operatorId
              AND b.status IN ('CONFIRMED', 'COMPLETED', 'CHECKED_IN')
              AND b.confirmedAt >= :fromDate
            GROUP BY FUNCTION('DATE', b.confirmedAt)
            ORDER BY FUNCTION('DATE', b.confirmedAt) ASC
            """)
    List<Object[]> sumDailyRevenueByTourOperator(@Param("operatorId") Long operatorId, @Param("fromDate") LocalDateTime fromDate);

    // ==================== EMAIL REMINDER SCHEDULER QUERIES ====================

    /** Hotel bookings sắp nhận phòng ngày target (CONFIRMED, chưa COMPLETED) */
    @Query("""
            SELECT b FROM Booking b
            JOIN BookingHotelDetail hd ON hd.booking = b
            WHERE b.status = 'CONFIRMED'
              AND hd.checkInDate = :targetDate
            """)
    List<Booking> findConfirmedHotelBookingsForDate(@Param("targetDate") LocalDate targetDate);

    /** Tour bookings sắp khởi hành ngày target (CONFIRMED, chưa COMPLETED) */
    @Query("""
            SELECT b FROM Booking b
            JOIN BookingTourDetail td ON td.booking = b
            WHERE b.status = 'CONFIRMED'
              AND td.departureDate = :targetDate
            """)
    List<Booking> findConfirmedTourBookingsForDate(@Param("targetDate") LocalDate targetDate);

    /** Hotel bookings đã trả phòng ngày target (CONFIRMED, checkout = target) */
    @Query("""
            SELECT b FROM Booking b
            JOIN BookingHotelDetail hd ON hd.booking = b
            WHERE b.status = 'CONFIRMED'
              AND hd.checkOutDate = :targetDate
            """)
    List<Booking> findCompletedHotelBookingsForDate(@Param("targetDate") LocalDate targetDate);

    /** Tour bookings đã kết thúc ngày target (CONFIRMED, departure = target) */
    @Query("""
            SELECT b FROM Booking b
            JOIN BookingTourDetail td ON td.booking = b
            WHERE b.status = 'CONFIRMED'
              AND td.departureDate = :targetDate
            """)
    List<Booking> findCompletedTourBookingsForDate(@Param("targetDate") LocalDate targetDate);

    /** Hotel: checkout date < targetDate, status CONFIRMED — dùng cho auto-complete */
    @Query("""
            SELECT b FROM Booking b
            JOIN BookingHotelDetail hd ON hd.booking = b
            WHERE b.status = 'CONFIRMED'
              AND hd.checkOutDate < :targetDate
            """)
    List<Booking> findConfirmedHotelBookingsBeforeDate(@Param("targetDate") LocalDate targetDate);

    /** Tour: departure date < targetDate, status CONFIRMED — dùng cho auto-complete */
    @Query("""
            SELECT b FROM Booking b
            JOIN BookingTourDetail td ON td.booking = b
            WHERE b.status = 'CONFIRMED'
              AND td.departureDate < :targetDate
            """)
    List<Booking> findConfirmedTourBookingsBeforeDate(@Param("targetDate") LocalDate targetDate);
}
