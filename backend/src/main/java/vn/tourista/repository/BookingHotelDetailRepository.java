package vn.tourista.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.tourista.entity.BookingHotelDetail;

import java.util.List;

public interface BookingHotelDetailRepository extends JpaRepository<BookingHotelDetail, Long> {

    List<BookingHotelDetail> findByBooking_IdIn(List<Long> bookingIds);
}
