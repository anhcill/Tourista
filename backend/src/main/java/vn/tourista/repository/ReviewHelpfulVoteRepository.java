package vn.tourista.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.tourista.entity.ReviewHelpfulVote;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface ReviewHelpfulVoteRepository extends JpaRepository<ReviewHelpfulVote, Long> {

    Optional<ReviewHelpfulVote> findByReviewIdAndUserId(Long reviewId, Long userId);

    boolean existsByReviewIdAndUserId(Long reviewId, Long userId);

    void deleteByReviewIdAndUserId(Long reviewId, Long userId);

    long countByReviewId(Long reviewId);

    @Query("SELECT v.reviewId FROM ReviewHelpfulVote v WHERE v.userId = :userId AND v.reviewId IN :reviewIds")
    Set<Long> findVotedReviewIdsByUser(@Param("userId") Long userId, @Param("reviewIds") List<Long> reviewIds);

    @Query("SELECT v.reviewId, COUNT(v) FROM ReviewHelpfulVote v WHERE v.reviewId IN :reviewIds GROUP BY v.reviewId")
    List<Object[]> countVotesByReviewIds(@Param("reviewIds") List<Long> reviewIds);
}
