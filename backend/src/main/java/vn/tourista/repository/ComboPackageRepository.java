package vn.tourista.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.tourista.entity.ComboPackage;

import java.time.LocalDate;
import java.util.List;

public interface ComboPackageRepository extends JpaRepository<ComboPackage, Long> {

    List<ComboPackage> findByIsActiveTrueOrderByIsFeaturedDescCreatedAtDesc();

    Page<ComboPackage> findByIsActiveTrueOrderByIsFeaturedDescCreatedAtDesc(Pageable pageable);

    List<ComboPackage> findByComboTypeAndIsActiveTrueOrderByCreatedAtDesc(ComboPackage.ComboType comboType);

    List<ComboPackage> findByIsActiveTrueAndValidFromLessThanEqualAndValidUntilGreaterThanEqualOrderByCreatedAtDesc(
            LocalDate now1, LocalDate now2);

    @Query("SELECT c FROM ComboPackage c WHERE c.isActive = true " +
            "AND c.validFrom <= :now AND c.validUntil >= :now " +
            "ORDER BY c.isFeatured DESC, c.createdAt DESC")
    List<ComboPackage> findActiveCombos(@Param("now") LocalDate now);

    @Modifying
    @Query("UPDATE ComboPackage c SET c.remainingSlots = c.remainingSlots - :count WHERE c.id = :id AND c.remainingSlots >= :count")
    int decrementSlots(@Param("id") Long id, @Param("count") int count);

    @Modifying
    @Query("UPDATE ComboPackage c SET c.remainingSlots = c.remainingSlots + :count WHERE c.id = :id")
    int incrementSlots(@Param("id") Long id, @Param("count") int count);

    boolean existsByIdAndIsActiveTrue(Long id);
}
