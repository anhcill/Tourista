package vn.tourista.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.tourista.entity.TourCategory;

import java.util.Optional;

@Repository
public interface TourCategoryRepository extends JpaRepository<TourCategory, Integer> {

    Optional<TourCategory> findBySlug(String slug);
}
