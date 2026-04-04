package vn.tourista.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.tourista.entity.TourItinerary;

import java.util.List;

public interface TourItineraryRepository extends JpaRepository<TourItinerary, Long> {

    List<TourItinerary> findByTour_IdOrderByDayNumberAscIdAsc(Long tourId);
}
