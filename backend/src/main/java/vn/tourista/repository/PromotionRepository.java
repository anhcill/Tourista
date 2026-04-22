package vn.tourista.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.tourista.entity.Promotion;

import java.util.Optional;

public interface PromotionRepository extends JpaRepository<Promotion, Long>, JpaSpecificationExecutor<Promotion> {

    boolean existsByCodeIgnoreCase(String code);

    Optional<Promotion> findByCodeIgnoreCase(String code);

    @Query(value = "SELECT COUNT(*) FROM promotions WHERE is_active = 1 AND applies_to = :appliesTo", nativeQuery = true)
    long countActiveByAppliesTo(@Param("appliesTo") String appliesTo);
}