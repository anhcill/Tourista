package vn.tourista.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.tourista.entity.PricingRule;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PricingRuleRepository extends JpaRepository<PricingRule, Long> {

    List<PricingRule> findByTargetTypeAndIsActiveTrue(PricingRule.TargetType targetType);

    List<PricingRule> findByTargetTypeAndIsActiveTrueOrderByPriorityDesc(PricingRule.TargetType targetType);

    @Query("""
            SELECT r FROM PricingRule r
            WHERE r.targetType = :targetType
              AND r.isActive = true
              AND (r.startDate IS NULL OR r.startDate <= :now)
              AND (r.endDate IS NULL OR r.endDate >= :now)
            ORDER BY r.priority DESC
            """)
    List<PricingRule> findActiveByTargetType(
            @Param("targetType") PricingRule.TargetType targetType,
            @Param("now") LocalDateTime now);

    @Query("""
            SELECT r FROM PricingRule r
            WHERE r.targetType = :targetType
              AND r.hotelId = :entityId
              AND r.isActive = true
              AND (r.startDate IS NULL OR r.startDate <= :now)
              AND (r.endDate IS NULL OR r.endDate >= :now)
            ORDER BY r.priority DESC
            """)
    List<PricingRule> findActiveForHotel(
            @Param("targetType") PricingRule.TargetType targetType,
            @Param("entityId") Long entityId,
            @Param("now") LocalDateTime now);

    @Query("""
            SELECT r FROM PricingRule r
            WHERE r.targetType = :targetType
              AND r.tourId = :entityId
              AND r.isActive = true
              AND (r.startDate IS NULL OR r.startDate <= :now)
              AND (r.endDate IS NULL OR r.endDate >= :now)
            ORDER BY r.priority DESC
            """)
    List<PricingRule> findActiveForTour(
            @Param("targetType") PricingRule.TargetType targetType,
            @Param("entityId") Long entityId,
            @Param("now") LocalDateTime now);
}
