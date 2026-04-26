package vn.tourista.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.tourista.entity.Conversation;
import vn.tourista.entity.User;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    // Lấy danh sách hội thoại của client (sắp xếp mới nhất trên đầu)
    Page<Conversation> findByClientOrderByUpdatedAtDesc(User client, Pageable pageable);

    // Lấy danh sách hội thoại mà user là partner (chủ tour/hotel)
    Page<Conversation> findByPartnerOrderByUpdatedAtDesc(User partner, Pageable pageable);

    // Find-or-create: kiểm tra đã có conversation giữa client + partner + reference
    // chưa
    @Query("SELECT c FROM Conversation c WHERE c.client = :client AND c.partner = :partner AND c.referenceId = :referenceId AND c.type = :type")
    Optional<Conversation> findExisting(
            @Param("client") User client,
            @Param("partner") User partner,
            @Param("referenceId") Long referenceId,
            @Param("type") Conversation.ConversationType type);

    // Conversation BOT của một client (thực tế có thể bị trùng dữ liệu cũ)
    // Lấy danh sách mới nhất trước để service chọn bản ghi đầu tiên an toàn.
    List<Conversation> findByClientAndTypeOrderByUpdatedAtDesc(User client, Conversation.ConversationType type);

    // Đếm số tin chưa đọc trong Inbox của Partner
    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.conversation.partner = :partner AND m.isRead = false AND m.sender <> :partner")
    long countUnreadForPartner(@Param("partner") User partner);

    // Đếm số tin chưa đọc trong Inbox của Client
    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.conversation.client = :client AND m.isRead = false AND m.sender <> :client")
    long countUnreadForClient(@Param("client") User client);

    // Admin: lay tat ca hoi thoai, moi nhat truoc
    @Query("SELECT c FROM Conversation c ORDER BY c.updatedAt DESC")
    List<Conversation> findAllOrderByUpdatedAtDesc();

    // Admin: lay tat ca hoi thoai ke ca booking (eager fetch)
    @Query("SELECT DISTINCT c FROM Conversation c LEFT JOIN FETCH c.booking ORDER BY c.updatedAt DESC")
    List<Conversation> findAllWithBooking();

    // Admin: dem tin chua doc cua 1 hoi thoai (bat cu ai gui)
    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE m.conversation = :conv AND m.isRead = false AND m.sender IS NOT NULL")
    long countUnreadForAdmin(@Param("conv") Conversation conv);

    // Eager fetch client + partner to avoid LazyInitializationException in WebSocket handlers
    @Query("SELECT c FROM Conversation c LEFT JOIN FETCH c.client LEFT JOIN FETCH c.partner WHERE c.id = :id")
    Optional<Conversation> findByIdWithUsers(@Param("id") Long id);
}
