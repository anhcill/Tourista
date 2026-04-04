package vn.tourista.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.tourista.entity.BookingTourDetail;

import java.util.List;

public interface BookingTourDetailRepository extends JpaRepository<BookingTourDetail, Long> {

    List<BookingTourDetail> findByBooking_IdIn(List<Long> bookingIds);
}
