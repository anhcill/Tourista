package vn.tourista.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.tourista.entity.Conversation;
import vn.tourista.entity.ConversationSession;

import java.util.Optional;

@Repository
public interface ConversationSessionRepository extends JpaRepository<ConversationSession, Long> {

    Optional<ConversationSession> findByConversation(Conversation conversation);

    Optional<ConversationSession> findByConversationId(Long conversationId);

    @Query("SELECT cs FROM ConversationSession cs WHERE cs.conversation.id = :convId")
    Optional<ConversationSession> findByConversationIdLazy(@Param("convId") Long conversationId);

    void deleteByConversationId(Long conversationId);
}
