package vn.tourista.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.tourista.entity.City;

import java.util.List;
import java.util.Optional;

@Repository
public interface CityRepository extends JpaRepository<City, Integer> {

    Optional<City> findBySlug(String slug);

    List<City> findByNameViContainingIgnoreCaseOrNameEnContainingIgnoreCase(String nameVi, String nameEn);
}
