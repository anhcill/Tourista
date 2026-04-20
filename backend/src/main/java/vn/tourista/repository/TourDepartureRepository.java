package vn.tourista.repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.tourista.entity.TourDeparture;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface TourDepartureRepository extends JpaRepository<TourDeparture, Long> {

    Optional<TourDeparture> findFirstByTour_IdAndAvailableSlotsGreaterThanAndDepartureDateGreaterThanEqualOrderByDepartureDateAsc(
            Long tourId,
            Integer availableSlots,
            LocalDate departureDate);

    Optional<TourDeparture> findByIdAndTour_Id(Long departureId, Long tourId);

    List<TourDeparture> findByTour_IdOrderByDepartureDateAsc(Long tourId);

    @Modifying
    @Query(value = """
            UPDATE tour_departures
            SET available_slots = available_slots - :slots
            WHERE id = :departureId
              AND available_slots >= :slots
            """, nativeQuery = true)
    int decrementAvailableSlots(@Param("departureId") Long departureId, @Param("slots") Integer slots);

    @Modifying
    @Query(value = """
            UPDATE tour_departures
            SET available_slots = available_slots + :slots
            WHERE id = :departureId
            """, nativeQuery = true)
    int incrementAvailableSlots(@Param("departureId") Long departureId, @Param("slots") Integer slots);
}
