package vn.tourista.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.tourista.entity.Amenity;

import java.util.List;

@Repository
public interface AmenityRepository extends JpaRepository<Amenity, Integer> {

    List<Amenity> findByCategoryIn(List<String> categories);

    @Modifying
    @Query(value = "DELETE FROM hotel_amenities WHERE hotel_id = :hotelId", nativeQuery = true)
    void deleteAllByHotelId(@Param("hotelId") Long hotelId);
}
