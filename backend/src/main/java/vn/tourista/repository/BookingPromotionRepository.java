package vn.tourista.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.tourista.entity.Booking;
import vn.tourista.entity.BookingPromotion;

import java.util.List;
import java.util.Optional;

public interface BookingPromotionRepository extends JpaRepository<BookingPromotion, Long> {

    Optional<BookingPromotion> findByBooking(Booking booking);

    Optional<BookingPromotion> findByBookingId(Long bookingId);

    List<BookingPromotion> findByBooking_IdIn(List<Long> bookingIds);

    boolean existsByBookingId(Long bookingId);
}
