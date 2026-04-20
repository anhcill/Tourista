package vn.tourista.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.tourista.entity.Booking;
import vn.tourista.entity.BookingTourDetail;

import java.util.List;
import java.util.Optional;

public interface BookingTourDetailRepository extends JpaRepository<BookingTourDetail, Long> {

    List<BookingTourDetail> findByBooking_IdIn(List<Long> bookingIds);

    // Lấy chi tiết tour theo booking (BotService dùng để lấy itinerary, thông tin chuyến)
    Optional<BookingTourDetail> findByBooking(Booking booking);

    List<BookingTourDetail> findByTourIdIn(List<Long> tourIds);
}
