package vn.tourista.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.tourista.entity.BookingCombo;

import java.util.Optional;

@Repository
public interface BookingComboRepository extends JpaRepository<BookingCombo, Long> {

    /**
     * Atomically decrement remaining_slots for a combo.
     * Only decrements if remaining_slots > 0.
     * Returns number of rows affected (0 if no slot available).
     */
    @Modifying
    @Query("UPDATE ComboPackage c SET c.remainingSlots = c.remainingSlots - :quantity " +
           "WHERE c.id = :comboId AND c.remainingSlots >= :quantity")
    int decrementSlot(@Param("comboId") Long comboId, @Param("quantity") int quantity);

    Optional<BookingCombo> findByBookingId(Long bookingId);
}
