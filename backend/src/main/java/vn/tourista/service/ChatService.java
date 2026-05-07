package vn.tourista.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
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
@Slf4j
public class ChatService {

        private final ConversationRepository conversationRepository;
        private final ChatMessageRepository chatMessageRepository;
        private final UserRepository userRepository;
        private final BookingRepository bookingRepository;
        private final SimpMessagingTemplate messagingTemplate;
        private final vn.tourista.service.AiService aiService;
        private final vn.tourista.service.chatbot.ChatbotFaqService chatbotFaqService;
        private final vn.tourista.service.chatbot.ChatbotNlpService chatbotNlpService;
        private final vn.tourista.service.chatbot.TourRecommendationQueryService tourRecommendationQueryService;

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
         * Hỗ trợ cả user anonymous (client = null).
         */
        @Transactional
        public ConversationResponse findOrCreateConversation(String clientEmail, CreateConversationRequest req) {
                User client = getUserByEmail(clientEmail);

                // Trường hợp BOT: mỗi client chỉ có 1 phiên BOT
                if (req.getType() == Conversation.ConversationType.BOT) {
                        List<Conversation> botConversations;
                        if (client != null) {
                                botConversations = conversationRepository
                                                .findByClientAndTypeOrderByUpdatedAtDesc(client,
                                                                Conversation.ConversationType.BOT);
                        } else {
                                // Anonymous user - tạo conversation mới mà không cần client
                                botConversations = List.of();
                        }

                        Conversation existing;
                        if (botConversations != null && !botConversations.isEmpty()) {
                                existing = botConversations.get(0);
                        } else {
                                Conversation c = Conversation.builder()
                                                .type(Conversation.ConversationType.BOT)
                                                .client(client) // null cho anonymous
                                                .build();
                                Conversation saved = conversationRepository.save(c);
                                if (client != null) {
                                        saveAndPushBotGreeting(saved, client.getFullName());
                                }
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

                // Validate: partner phải là đối tác (role PARTNER, HOTEL_OWNER, hoặc HOST)
                // ADMIN vẫn cho phép để support có thể chat với khách hàng
                String roleName = partner.getRole() != null ? partner.getRole().getName() : "";
                boolean isPartnerRole = roleName.equals("PARTNER")
                        || roleName.equals("HOTEL_OWNER")
                        || roleName.equals("HOST")
                        || roleName.equals("ADMIN");
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

                // Gắn booking nếu có (table Booking có thể chưa tồn tại trong DB — wrap trong try)
                if (req.getBookingId() != null) {
                    try {
                        bookingRepository.findById(req.getBookingId())
                                .ifPresent(builder::booking);
                    } catch (Exception ex) {
                        log.warn("Cannot attach booking {} to conversation (table may not exist): {}",
                                req.getBookingId(), ex.getMessage());
                    }
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
         * Hỗ trợ cả user anonymous (không đăng nhập).
         */
        @Transactional
        public ChatMessage saveUserMessage(Long conversationId, String senderEmail, String content) {
                Conversation conv = getConversationForAi(conversationId);
                if (conv == null) {
                        throw new RuntimeException("Conversation không tồn tại: " + conversationId);
                }

                User sender = getUserByEmail(senderEmail);
                ChatMessage msg = ChatMessage.builder()
                                .conversation(conv)
                                .sender(sender) // null nếu anonymous
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

        /**
         * Xử lý AI chatbot đồng bộ (không dùng @Async) - dùng cho REST endpoint.
         * Priority: FAQ rules → AI chatbot with DB context → Fallback menu.
         */
        public String askAiSync(String userMessage, String conversationContext, String dbContext) {
                try {
                        String canonical = chatbotNlpService.normalize(
                                chatbotNlpService.canonicalize(userMessage.toLowerCase().trim()));

                        // Bước 1: Thử FAQ rules trước (fast path), skip nếu có từ khóa thời tiết/đồ ăn
                        boolean skipFaq = containsWeatherOrFoodKeyword(userMessage);
                        if (!skipFaq) {
                                String faqAnswer = chatbotFaqService.findMatchingAnswer(canonical);
                                if (faqAnswer != null && !faqAnswer.isBlank()) {
                                        return faqAnswer;
                                }
                        }

                        // Bước 2: Không khớp rule hoặc skip FAQ → gọi AI với DB context
                        String aiResponse = aiService.askChatbot(userMessage, conversationContext, dbContext);
                        if (aiResponse != null && !aiResponse.isBlank()) {
                                return aiResponse;
                        }

                        // Bước 3: AI lỗi → fallback menu
                        return buildFallbackResponse(canonical);
                } catch (Exception e) {
                        log.error("askAiSync: error processing message '{}': {}", userMessage, e.getMessage());
                        return chatbotFaqService.getDefaultAnswer();
                }
        }

        private boolean containsWeatherOrFoodKeyword(String text) {
                if (text == null) return false;
                String lower = text.toLowerCase();
                return lower.contains("thời tiết") || lower.contains("thoi tiet") ||
                       lower.contains("mùa") || lower.contains("mua") ||
                       lower.contains("nhiệt độ") || lower.contains("nhiet do") ||
                       lower.contains("trời") || lower.contains("troi") ||
                       lower.contains("có gì") || lower.contains("co gi") ||
                       lower.contains("món ngon") || lower.contains("mon ngon") ||
                       lower.contains("đặc sản") || lower.contains("dac san") ||
                       lower.contains("ăn ngon") || lower.contains("an ngon") ||
                       lower.contains("nhà hàng") || lower.contains("nha hang");
        }

        /**
         * Xây dựng fallback response khi AI không trả lời được.
         */
        private String buildFallbackResponse(String canonical) {
                if (canonical.contains("thoi tiet") || canonical.contains("weather") ||
                        canonical.contains("mua") || canonical.contains("nang") || canonical.contains("nong") ||
                        canonical.contains("troi")) {
                        String[] parts = canonical.split("\\s+");
                        String location = "";
                        String[] keywords = {"nam dinh", "thai binh", "ha noi", "da nang", "hue", "hoi an",
                                "nha trang", "phan thiet", "vung tau", "phu quoc", "cantho", "tp hcm", "hcm",
                                "sa pa", "moc chau", "dalat", "quang ninh", "haiphong", "binh duong", "dong nai",
                                "quang nam", "quang ngai", "binh thuan", "khanh hoa", "lam dong"};
                        for (String p : parts) {
                                for (String kw : keywords) {
                                        if (p.contains(kw)) { location = p; break; }
                                }
                                if (!location.isBlank()) break;
                        }
                        if (location.isBlank()) {
                                return "🌤️ Mình có thể cho bạn biết thời tiết chung của các vùng miền Việt Nam, nhưng để có thông tin chính xác bạn nên kiểm tra app thời tiết nhé!\n\nBạn muốn hỏi thời tiết ở đâu?";
                        }
                        return switch (location) {
                                case "nam dinh", "thai binh" ->
                                        "🌤️ Xuân Trường, Nam Định có khí hậu nhiệt đới gió mùa, nóng ẩm quanh năm. Nên đi tháng 10-4 (mát mẻ 18-25°C), tránh tháng 5-9 (nắng nóng 33-38°C). Gần bãi biển Quất Lâm và làng trạng nguyên Thái Đỗ!";
                                case "ha noi", "hanoi" ->
                                        "🌤️ Hà Nội: Mùa nóng tháng 5-9 (30-38°C, nóng ẩm), mùa mát tháng 10-4 (15-25°C). Tháng 2-3 hay mưa phùn. Đi tháng 10-12 và 3-4 là đẹp nhất!";
                                case "da nang" ->
                                        "🌤️ Đà Nẵng: Đi tháng 2-8 (nắng đẹp, 25-33°C), tránh tháng 9-12 (mưa bão, đặc biệt tháng 10-11). Bà Nà Hills mát mẻ quanh năm!";
                                case "hue" ->
                                        "🌤️ Huế: Mùa mưa tháng 9-12 nặng nhất, mùa khô tháng 5-9. Đẹp nhất tháng 3-5 (nắng, mát). Nắng nóng gay gắt tháng 6-8.";
                                case "hoi an" ->
                                        "🌤️ Hội An: Tương tự Đà Nẵng — đi tháng 2-8, tránh tháng 9-12 hay ngập lụt. Phố cổ đẹp nhất buổi tối!";
                                case "nha trang", "khanh hoa" ->
                                        "🌤️ Nha Trang: Tốt nhất tháng 2-9 (nắng, biển xanh, 25-32°C), tránh tháng 10-12 hay bão. Lặn biển, tắm biển lý tưởng!";
                                case "phan thiet", "binh thuan" ->
                                        "🌤️ Phan Thiết/Mũi Né: Nắng nóng quanh năm (26-35°C), mùa khô tháng 11-4 đẹp nhất, tránh tháng 9-11 hay mưa lớn. Cát vàng, gió biển thơm!";
                                case "vung tau" ->
                                        "🌤️ Vũng Tàu: Nắng nóng quanh năm, tốt nhất tháng 11-4 (mát hơn, 25-30°C), tránh tháng 5-10 (nắng gay gắt, có bão). Gần SGTP!";
                                case "phu quoc" ->
                                        "🌤️ Phú Quốc: Mùa khô tháng 11-4 (nắng, biển đẹp, 25-32°C) — đẹp nhất! Mùa mưa tháng 5-10 hay mưa rào.";
                                case "cantho", "mekong", "cuu long" ->
                                        "🌤️ Miền Tây (Cần Thơ): Nắng nóng quanh năm 25-35°C, mùa khô tháng 11-4 đẹp, mùa mưa tháng 5-10. Chợ nổi Cái Răng đẹp nhất mùa nước nổi!";
                                case "tp hcm", "hcm", "sai gon" ->
                                        "🌤️ TP.HCM: Nóng quanh năm 26-35°C, mùa khô tháng 11-4 (ít mưa), mùa mưa tháng 5-10 (chiều hay mưa rào). Đi tháng 12-3 là mát nhất!";
                                case "sa pa" ->
                                        "🌤️ Sa Pa: Mát mẻ quanh năm 15-22°C, đẹp nhất tháng 9-11 (nắng, ruộng bậc thang vàng) và tháng 3-5 (hoa đào nở). Tránh tháng 6-8 hay mưa to.";
                                case "moc chau" ->
                                        "🌤️ Mộc Châu: Mát mẻ 18-24°C quanh năm, đẹp nhất tháng 9-11 (hoa cải nở vàng) và tháng 3-5. Sáng sớm hay sương mù, mùa đông lạnh 5-10°C.";
                                case "dalat", "lam dong" ->
                                        "🌤️ Đà Lạt: Mát mẻ 18-24°C quanh năm — 'tiểu Paris'. Mùa khô tháng 11-4 đẹp, tránh tháng 7-10 (mưa nhiều). Sáng sớm hay sương mù.";
                                case "quang ninh", "ha long", "haiphong" ->
                                        "🌤️ Quảng Ninh/Hạ Long: Mùa đông 15-22°C (tháng 10-4), mùa hè nóng 28-35°C. Đẹp nhất tháng 9-11 (nắng, mát). Bãi tắm Tuần Châu, vịnh Hạ Long quanh năm đẹp!";
                                default ->
                                        "🌤️ Mình có thể cho bạn biết thời tiết chung của các vùng miền Việt Nam, nhưng để có thông tin chính xác bạn nên kiểm tra app thời tiết nhé!\n\nBạn muốn hỏi thời tiết ở đâu?";
                        };
                }
                if (canonical.contains("visa") || canonical.contains("passport") || canonical.contains("ho chieu")) {
                        return "🛂 Về visa/hộ chiếu, mình gợi ý bạn liên hệ đại sứ quán để cập nhật thông tin mới nhất nhé!";
                }
                if (canonical.contains("an uong") || canonical.contains("am thuc") || canonical.contains("mon ngon")) {
                        return "🍜 Mỗi điểm đến có món ăn đặc trưng riêng, bạn muốn hỏi về ẩm thực ở đâu?";
                }
                return """
                        🤔 Mình chưa hiểu rõ yêu cầu của bạn.

                        Bạn có thể thử:
                        • 🔍 **Tra cứu booking:** gửi mã TRS-YYYYMMDD-XXXXX
                        • 🗺️ **Gợi ý tour:** nhắn ngân sách + số người
                        • 🏨 **Tìm khách sạn:** nhắn địa điểm + ngân sách
                        """;
        }

        // =====================================================================
        // PRIVATE HELPERS
        // =====================================================================

        private User getUserByEmail(String email) {
                if (email == null || email.isBlank() || email.contains("anonymous")) {
                        // Trả về null cho anonymous - caller phải xử lý
                        return null;
                }
                return userRepository.findByEmail(email)
                                .orElse(null);
        }

        private Conversation getConversationForAi(Long conversationId) {
                return conversationRepository.findById(conversationId)
                                .orElse(null);
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
                ChatMessage saved = chatMessageRepository.save(sys);

                String email = conv.getClient() != null ? conv.getClient().getEmail()
                                : conv.getPartner() != null ? conv.getPartner().getEmail() : null;
                if (email != null) {
                        messagingTemplate.convertAndSendToUser(
                                        email, "/queue/messages", ChatMessageResponse.from(saved));
                }
        }

        private void saveAndPushBotGreeting(Conversation conv, String clientName) {
                String greeting = "Xin chao " + clientName
                                + "! Toi la tro ly Tourista Studio. Go ma dat cho (VD: TRS-20260325-934D6D) de tra cuu lich trinh, hoac hoi toi bat cu dieu gi.";
                ChatMessage saved = chatMessageRepository.save(ChatMessage.builder()
                                .conversation(conv)
                                .sender(null)
                                .contentType(ChatMessage.ContentType.TEXT)
                                .content(greeting)
                                .isRead(false)
                                .build());

                if (conv.getClient() != null) {
                        messagingTemplate.convertAndSendToUser(
                                        conv.getClient().getEmail(), "/queue/messages", ChatMessageResponse.from(saved));
                }
        }

        private ConversationResponse toResponse(Conversation conv, boolean viewingAsClient, User me) {
                var lastMsg = chatMessageRepository.findTopByConversationOrderByCreatedAtDesc(conv);
                String snippet = lastMsg.map(ChatMessage::getContent).orElse(null);
                String lastType = lastMsg.map(m -> m.getContentType().name()).orElse(null);
                var lastAt = lastMsg.map(ChatMessage::getCreatedAt).orElse(null);
                long unread = 0;
                if (me != null) {
                        unread = chatMessageRepository.countUnreadInConversation(conv, me);
                }

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
