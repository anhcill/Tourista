package vn.tourista.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.tourista.entity.City;

import java.util.List;
import java.util.Optional;

@Repository
public interface CityRepository extends JpaRepository<City, Integer> {

    Optional<City> findBySlug(String slug);

    List<City> findByNameViContainingIgnoreCaseOrNameEnContainingIgnoreCase(String nameVi, String nameEn);

    @Query(value = """
            SELECT c.id, c.name_vi, c.name_en
            FROM cities c
            WHERE (
                  LOWER(c.name_vi) LIKE LOWER(CONCAT('%', :query, '%'))
              OR LOWER(c.name_en) LIKE LOWER(CONCAT('%', :query, '%'))
            )
            ORDER BY
                CASE
                    WHEN LOWER(c.name_vi) LIKE LOWER(CONCAT(:query, '%')) THEN 1
                    WHEN LOWER(c.name_en) LIKE LOWER(CONCAT(:query, '%')) THEN 2
                    ELSE 3
                END,
                c.name_vi ASC
            LIMIT :limit
            """, nativeQuery = true)
    List<Object[]> searchCities(@Param("query") String query, @Param("limit") int limit);
}
