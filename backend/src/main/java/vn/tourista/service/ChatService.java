package vn.tourista.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.tourista.dto.request.CreateConversationRequest;
import vn.tourista.dto.response.ChatMessageResponse;
import vn.tourista.dto.response.ConversationResponse;
import vn.tourista.entity.*;
import vn.tourista.repository.*;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Service xử lý logic tạo/lấy hội thoại và lịch sử tin nhắn.
 */
@Service
@RequiredArgsConstructor
public class ChatService {

        private final ConversationRepository conversationRepository;
        private final ChatMessageRepository chatMessageRepository;
        private final UserRepository userRepository;
        private final BookingRepository bookingRepository;

        // =====================================================================
        // CONVERSATION
        // =====================================================================

        /**
         * Lấy danh sách hội thoại của user (client hoặc partner).
         * Trả về tất cả conversation có liên quan, kèm snippet + unread count.
         */
        @Transactional(readOnly = true)
        public List<ConversationResponse> getMyConversations(String email) {
                User me = getUserByEmail(email);

                // Client: lấy conversation mà mình là khách
                Page<Conversation> clientConvs = conversationRepository
                                .findByClientOrderByUpdatedAtDesc(me, PageRequest.of(0, 50));

                // Partner: lấy conversation mà mình là chủ (nếu có)
                Page<Conversation> partnerConvs = conversationRepository
                                .findByPartnerOrderByUpdatedAtDesc(me, PageRequest.of(0, 50));

                return java.util.stream.Stream.concat(
                                clientConvs.stream().map(c -> toResponse(c, true, me)),
                                partnerConvs.stream().map(c -> toResponse(c, false, me))).toList();
        }

        /**
         * Tạo mới hoặc lấy lại conversation đã tồn tại (find-or-create).
         */
        @Transactional
        public ConversationResponse findOrCreateConversation(String clientEmail, CreateConversationRequest req) {
                User client = getUserByEmail(clientEmail);

                // Trường hợp BOT: mỗi client chỉ có 1 phiên BOT
                if (req.getType() == Conversation.ConversationType.BOT) {
                        List<Conversation> botConversations = conversationRepository
                                        .findByClientAndTypeOrderByUpdatedAtDesc(client,
                                                        Conversation.ConversationType.BOT);

                        Conversation existing;
                        if (botConversations != null && !botConversations.isEmpty()) {
                                existing = botConversations.get(0);
                        } else {
                                Conversation c = Conversation.builder()
                                                .type(Conversation.ConversationType.BOT)
                                                .client(client)
                                                .build();
                                Conversation saved = conversationRepository.save(c);
                                // Thêm tin nhắn chào mừng hệ thống (không dùng emoji để tránh lỗi charset DB
                                // cũ)
                                insertSystemMessage(saved, "Xin chao " + client.getFullName()
                                                + "! Toi la tro ly Tourista Studio. Go ma dat cho (VD: TRS-20260325-934D6D) de tra cuu lich trinh, hoac hoi toi bat cu dieu gi.");
                                existing = saved;
                        }

                        return toResponse(existing, true, client);
                }

                // Trường hợp P2P: find-or-create theo client + partner + referenceId
                User partner = userRepository.findById(req.getPartnerId())
                                .orElseThrow(() -> new RuntimeException("Không tìm thấy đối tác"));

                // Validate: không chat với chính mình
                if (client.getId().equals(partner.getId())) {
                        throw new RuntimeException("Không thể nhắn tin với chính mình");
                }

                // Validate: partner phải là đối tác (role PARTNER hoặc HOTEL_OWNER)
                String roleName = partner.getRole() != null ? partner.getRole().getName() : "";
                boolean isPartnerRole = roleName.equals("PARTNER") || roleName.equals("HOTEL_OWNER");
                if (!isPartnerRole) {
                        throw new RuntimeException("Người nhận không phải là đối tác hợp lệ");
                }

                Conversation existing = conversationRepository
                                .findExisting(client, partner, req.getReferenceId(), req.getType())
                                .orElseGet(() -> {
                                        Conversation.ConversationBuilder builder = Conversation.builder()
                                                        .type(req.getType())
                                                        .client(client)
                                                        .partner(partner)
                                                        .referenceId(req.getReferenceId());

                                        // Gắn booking nếu có
                                        if (req.getBookingId() != null) {
                                                bookingRepository.findById(req.getBookingId())
                                                                .ifPresent(builder::booking);
                                        }

                                        Conversation c = conversationRepository.save(builder.build());
                                        // Tin nhắn hệ thống khi bắt đầu chat
                                        insertSystemMessage(c, "Cuộc trò chuyện đã bắt đầu giữa " + client.getFullName()
                                                        + " và " + partner.getFullName());
                                        return c;
                                });

                return toResponse(existing, true, client);
        }

        // =====================================================================
        // MESSAGES
        // =====================================================================

        /**
         * Lấy lịch sử tin nhắn của 1 phiên (phân trang, cũ → mới).
         */
        @Transactional(readOnly = true)
        public Page<ChatMessageResponse> getMessages(Long conversationId, String email, int page, int size) {
                User me = getUserByEmail(email);
                Conversation conv = getConversation(conversationId, me);
                Page<ChatMessage> descPage = chatMessageRepository
                                .findByConversationOrderByCreatedAtDesc(conv, PageRequest.of(page, size));

                List<ChatMessageResponse> content = new ArrayList<>(descPage.getContent().stream()
                                .map(ChatMessageResponse::from)
                                .toList());
                Collections.reverse(content);

                return new PageImpl<>(content, descPage.getPageable(), descPage.getTotalElements());
        }

        /**
         * Đánh dấu tất cả tin nhắn trong conversation là đã đọc.
         */
        @Transactional
        public void markAsRead(Long conversationId, String email) {
                User me = getUserByEmail(email);
                Conversation conv = getConversation(conversationId, me);
                chatMessageRepository.markAllAsRead(conv, me);
        }

        /**
         * Lưu tin nhắn text từ user (P2P hoặc Bot input).
         * WebSocket controller gọi method này, sau đó push về phía nhận.
         */
        @Transactional
        public ChatMessage saveUserMessage(Long conversationId, String senderEmail, String content) {
                User sender = getUserByEmail(senderEmail);
                Conversation conv = getConversation(conversationId, sender);

                ChatMessage msg = ChatMessage.builder()
                                .conversation(conv)
                                .sender(sender)
                                .contentType(ChatMessage.ContentType.TEXT)
                                .content(content)
                                .isRead(false)
                                .build();

                ChatMessage saved = chatMessageRepository.save(msg);

                // Cập nhật updated_at để conversation nổi lên đầu danh sách inbox
                conversationRepository.save(conv);

                return saved;
        }

        /**
         * Lưu tin nhắn do BOT sinh ra.
         * sender = null, contentType có thể là TEXT hoặc BOOKING_DETAILS.
         */
        @Transactional
        public ChatMessage saveBotMessage(Long conversationId, String content,
                        ChatMessage.ContentType contentType, String metadata) {
                Conversation conv = conversationRepository.findById(conversationId)
                                .orElseThrow(() -> new RuntimeException(
                                                "Conversation không tồn tại: " + conversationId));

                ChatMessage msg = ChatMessage.builder()
                                .conversation(conv)
                                .sender(null) // BOT
                                .contentType(contentType)
                                .content(content)
                                .metadata(metadata)
                                .isRead(false)
                                .build();

                ChatMessage saved = chatMessageRepository.save(msg);
                conversationRepository.save(conv);
                return saved;
        }

        // =====================================================================
        // PRIVATE HELPERS
        // =====================================================================

        private User getUserByEmail(String email) {
                return userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User không tồn tại: " + email));
        }

        private Conversation getConversation(Long conversationId, User requester) {
                Conversation conv = conversationRepository.findById(conversationId)
                                .orElseThrow(() -> new RuntimeException(
                                                "Conversation không tồn tại: " + conversationId));

                // Bảo mật: chỉ client hoặc partner của conversation mới được truy cập
                boolean isClient = conv.getClient() != null && conv.getClient().getId().equals(requester.getId());
                boolean isPartner = conv.getPartner() != null && conv.getPartner().getId().equals(requester.getId());
                if (!isClient && !isPartner) {
                        throw new RuntimeException("Bạn không có quyền truy cập cuộc trò chuyện này");
                }

                return conv;
        }

        private void insertSystemMessage(Conversation conv, String text) {
                ChatMessage sys = ChatMessage.builder()
                                .conversation(conv)
                                .sender(null)
                                .contentType(ChatMessage.ContentType.SYSTEM_LOG)
                                .content(text)
                                .isRead(true)
                                .build();
                chatMessageRepository.save(sys);
        }

        private ConversationResponse toResponse(Conversation conv, boolean viewingAsClient, User me) {
                var lastMsg = chatMessageRepository.findTopByConversationOrderByCreatedAtDesc(conv);
                String snippet = lastMsg.map(ChatMessage::getContent).orElse(null);
                String lastType = lastMsg.map(m -> m.getContentType().name()).orElse(null);
                var lastAt = lastMsg.map(ChatMessage::getCreatedAt).orElse(null);
                long unread = chatMessageRepository.countUnreadInConversation(conv, me);

                return ConversationResponse.from(conv, viewingAsClient, snippet, lastType, lastAt, unread);
        }

        // =====================================================================
        // ADMIN: Xem tat ca hoi thoai (khong can la client hay partner)
        // =====================================================================

        /**
         * Lay tat ca hoi thoai cho admin - bat cu ai la client hay partner deu thay.
         * Hoi thoai BOT chi tra ve client.
         */
        @Transactional(readOnly = true)
        public List<ConversationResponse> getAllConversationsForAdmin() {
                List<Conversation> all = conversationRepository.findAllWithBooking();
                return all.stream()
                                .map(c -> toAdminResponse(c, null))
                                .toList();
        }

        /**
         * Lay chi tiet mot hoi thoai bat ky cho admin.
         */
        @Transactional(readOnly = true)
        public Conversation getConversationForAdmin(Long conversationId) {
                return conversationRepository.findById(conversationId)
                                .orElseThrow(() -> new RuntimeException(
                                                "Conversation khong ton tai: " + conversationId));
        }

        /**
         * Danh dau tat ca tin nhan trong hoi thoai la da doc (cho admin).
         */
        @Transactional
        public void markAsReadByAdmin(Long conversationId) {
                Conversation conv = conversationRepository.findById(conversationId)
                                .orElseThrow(() -> new RuntimeException(
                                                "Conversation khong ton tai: " + conversationId));
                chatMessageRepository.markAllAsReadForAdmin(conv);
        }

        /**
         * Lay tin nhan cho admin (bat cu hoi thoai nao).
         */
        @Transactional(readOnly = true)
        public Page<ChatMessageResponse> getMessagesForAdmin(Conversation conv, int page, int size) {
                Page<ChatMessage> descPage = chatMessageRepository
                                .findByConversationOrderByCreatedAtDesc(conv, PageRequest.of(page, size));

                List<ChatMessageResponse> content = new ArrayList<>(descPage.getContent().stream()
                                .map(ChatMessageResponse::from)
                                .toList());
                Collections.reverse(content);

                return new PageImpl<>(content, descPage.getPageable(), descPage.getTotalElements());
        }

        /**
         * Gui tin nhan tra loi tu admin.
         */
        @Transactional
        public ChatMessageResponse sendAdminMessage(Long conversationId, String adminEmail, String content) {
                Conversation conv = conversationRepository.findById(conversationId)
                                .orElseThrow(() -> new RuntimeException(
                                                "Conversation khong ton tai: " + conversationId));
                User admin = getUserByEmail(adminEmail);

                ChatMessage msg = ChatMessage.builder()
                                .conversation(conv)
                                .sender(admin)
                                .contentType(ChatMessage.ContentType.TEXT)
                                .content(content)
                                .isRead(false)
                                .build();

                ChatMessage saved = chatMessageRepository.save(msg);
                conversationRepository.save(conv);

                return ChatMessageResponse.from(saved);
        }

        private ConversationResponse toAdminResponse(Conversation conv, User me) {
                var lastMsg = chatMessageRepository.findTopByConversationOrderByCreatedAtDesc(conv);
                String snippet = lastMsg.map(ChatMessage::getContent).orElse(null);
                String lastType = lastMsg.map(m -> m.getContentType().name()).orElse(null);
                var lastAt = lastMsg.map(ChatMessage::getCreatedAt).orElse(null);
                long unread = chatMessageRepository.countUnreadInConversation(conv, null);

                ConversationResponse.ConversationResponseBuilder b = ConversationResponse.builder()
                        .id(conv.getId())
                        .type(conv.getType().name())
                        .referenceId(conv.getReferenceId())
                        .lastMessageSnippet(snippet)
                        .lastMessageType(lastType)
                        .lastMessageAt(lastAt)
                        .unreadCount(unread)
                        .createdAt(conv.getCreatedAt())
                        .updatedAt(conv.getUpdatedAt());

                // Hiển thị partner là người khách (client) - admin đang quản lý
                if (conv.getClient() != null) {
                        b.partnerId(conv.getClient().getId())
                         .partnerName(conv.getClient().getFullName())
                         .partnerAvatar(conv.getClient().getAvatarUrl());
                }

                // Booking info
                if (conv.getBooking() != null) {
                        var booking = conv.getBooking();
                        b.bookingId(booking.getId())
                         .bookingCode(booking.getBookingCode())
                         .bookingStatus(booking.getStatus() != null ? booking.getStatus().name() : null)
                         .guestName(booking.getGuestName());

                        // Lấy service name + dates từ booking detail
                        var info = bookingRepository.findServiceInfoByBookingId(booking.getId());
                        if (info != null && info.length >= 2) {
                                if (info[0] != null) b.serviceName((String) info[0]);
                                if (info[1] != null) b.bookingDates((String) info[1]);
                        }
                }

                return b.build();
        }
}
