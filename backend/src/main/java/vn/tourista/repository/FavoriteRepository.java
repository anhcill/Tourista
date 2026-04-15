package vn.tourista.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.tourista.entity.Favorite;

import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    List<Favorite> findByUser_IdOrderByCreatedAtDesc(Long userId);

    Optional<Favorite> findByUser_IdAndTargetTypeAndTargetId(Long userId, Favorite.TargetType targetType,
            Long targetId);

    boolean existsByUser_IdAndTargetTypeAndTargetId(Long userId, Favorite.TargetType targetType, Long targetId);

    void deleteByUser_IdAndTargetTypeAndTargetId(Long userId, Favorite.TargetType targetType, Long targetId);
}
