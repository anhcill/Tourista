package vn.tourista.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.tourista.entity.Booking;

import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    boolean existsByBookingCode(String bookingCode);

    Optional<Booking> findByBookingCode(String bookingCode);

    Optional<Booking> findByBookingCodeIgnoreCase(String bookingCode);

    Optional<Booking> findByBookingCodeAndUser_Email(String bookingCode, String email);

    List<Booking> findByUser_IdOrderByCreatedAtDesc(Long userId);
}
