package vn.tourista.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.tourista.entity.HotelImage;

import java.util.List;

@Repository
public interface HotelImageRepository extends JpaRepository<HotelImage, Long> {

    List<HotelImage> findByHotel_IdOrderBySortOrderAscIdAsc(Long hotelId);

    @Modifying
    @Query(value = "DELETE FROM hotel_images WHERE hotel_id = :hotelId", nativeQuery = true)
    void deleteByHotel_Id(@Param("hotelId") Long hotelId);
}
