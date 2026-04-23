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

    // ===== Revenue stats queries =====

    @Query("""
            SELECT FUNCTION('DATE', b.createdAt) AS date, SUM(b.totalAmount) AS amount, COUNT(b) AS count
            FROM Booking b
            JOIN BookingHotelDetail hd ON hd.booking = b
            JOIN hd.hotel h
            WHERE h.owner.id = :ownerId
              AND b.status IN ('CONFIRMED', 'COMPLETED', 'CHECKED_IN')
              AND b.createdAt >= :fromDate
            GROUP BY FUNCTION('DATE', b.createdAt)
            ORDER BY FUNCTION('DATE', b.createdAt) ASC
            """)
    List<Object[]> sumDailyRevenueByHotelOwner(@Param("ownerId") Long ownerId, @Param("fromDate") LocalDateTime fromDate);

    @Query("""
            SELECT FUNCTION('DATE', b.createdAt) AS date, SUM(b.totalAmount) AS amount, COUNT(b) AS count
            FROM Booking b
            JOIN BookingTourDetail td ON td.booking = b
            JOIN td.tour t
            WHERE t.operator.id = :operatorId
              AND b.status IN ('CONFIRMED', 'COMPLETED', 'CHECKED_IN')
              AND b.createdAt >= :fromDate
            GROUP BY FUNCTION('DATE', b.createdAt)
            ORDER BY FUNCTION('DATE', b.createdAt) ASC
            """)
    List<Object[]> sumDailyRevenueByTourOperator(@Param("operatorId") Long operatorId, @Param("fromDate") LocalDateTime fromDate);
}
