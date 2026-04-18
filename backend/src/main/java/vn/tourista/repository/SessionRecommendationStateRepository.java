package vn.tourista.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import vn.tourista.entity.Conversation;
import vn.tourista.entity.SessionRecommendationState;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface SessionRecommendationStateRepository extends JpaRepository<SessionRecommendationState, Long> {

    Optional<SessionRecommendationState> findByConversation(Conversation conversation);

    Optional<SessionRecommendationState> findByConversationId(Long conversationId);

    @Modifying
    @Transactional
    void deleteByConversationId(Long conversationId);

    @Modifying
    @Transactional
    @Query("DELETE FROM SessionRecommendationState s WHERE s.updatedAt < :threshold")
    int deleteExpiredStates(@Param("threshold") LocalDateTime threshold);
}
