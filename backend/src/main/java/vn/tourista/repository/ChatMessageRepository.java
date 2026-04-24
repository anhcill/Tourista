package vn.tourista.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import vn.tourista.entity.ChatMessage;
import vn.tourista.entity.Conversation;
import vn.tourista.entity.User;

import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    // Lấy lịch sử tin nhắn của 1 phiên chat (phân trang, mới nhất trước)
    Page<ChatMessage> findByConversationOrderByCreatedAtAsc(Conversation conversation, Pageable pageable);

    // Lấy lịch sử tin nhắn mới nhất trước, phục vụ trang đầu là đoạn chat gần nhất
    Page<ChatMessage> findByConversationOrderByCreatedAtDesc(Conversation conversation, Pageable pageable);

    // Tin nhắn mới nhất của conversation (hiển thị snippet trong danh sách)
    Optional<ChatMessage> findTopByConversationOrderByCreatedAtDesc(Conversation conversation);

    // Đếm tin chưa đọc trong 1 conversation (từ góc nhìn của 1 user cụ thể)
    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.conversation = :conv AND m.isRead = false AND m.sender <> :viewer")
    long countUnreadInConversation(@Param("conv") Conversation conv, @Param("viewer") User viewer);

    // Đánh dấu tất cả tin nhắn trong conversation là đã đọc (trừ tin của chính mình)
    @Modifying
    @Transactional
    @Query("UPDATE ChatMessage m SET m.isRead = true WHERE m.conversation = :conv AND m.sender <> :reader")
    void markAllAsRead(@Param("conv") Conversation conv, @Param("reader") User reader);

    // Admin: đánh dấu tất cả tin nhắn là đã đọc (khong loai tru ai)
    @Modifying
    @Transactional
    @Query("UPDATE ChatMessage m SET m.isRead = true WHERE m.conversation = :conv")
    void markAllAsReadForAdmin(@Param("conv") Conversation conv);
}
