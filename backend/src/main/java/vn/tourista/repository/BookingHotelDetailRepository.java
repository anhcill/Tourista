package vn.tourista.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.tourista.entity.Booking;
import vn.tourista.entity.BookingHotelDetail;

import java.util.List;
import java.util.Optional;

public interface BookingHotelDetailRepository extends JpaRepository<BookingHotelDetail, Long> {

    List<BookingHotelDetail> findByBooking_IdIn(List<Long> bookingIds);

    // Lấy chi tiết hotel theo booking (BotService dùng để lấy check-in/out, loại phòng)
    Optional<BookingHotelDetail> findByBooking(Booking booking);
}
