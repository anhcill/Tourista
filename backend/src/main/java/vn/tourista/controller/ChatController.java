package vn.tourista.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.tourista.dto.request.CreateConversationRequest;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.ChatMessageResponse;
import vn.tourista.dto.response.ConversationResponse;
import vn.tourista.service.ChatService;

import java.security.Principal;
import java.util.List;

/**
 * REST API cho Chat (lịch sử và quản lý conversation).
 * WebSocket message handler nằm riêng ở MessageController.
 */
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    /**
     * GET /api/chat/conversations
     * Lấy danh sách tất cả hội thoại của user đang đăng nhập.
     * Trả về cả vai trò client lẫn partner.
     */
    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getMyConversations(Principal principal) {
        List<ConversationResponse> result = chatService.getMyConversations(principal.getName());
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách hội thoại thành công", result));
    }

    /**
     * POST /api/chat/conversations
     * Tạo hoặc lấy lại conversation (find-or-create).
     * - type = BOT → mở/lấy bot conversation của user
     * - type = P2P_TOUR/P2P_HOTEL → mở/lấy conversation với đối tác
     */
    @PostMapping("/conversations")
    public ResponseEntity<ApiResponse<ConversationResponse>> createOrGetConversation(
            Principal principal,
            @Valid @RequestBody CreateConversationRequest req) {
        ConversationResponse result = chatService.findOrCreateConversation(principal.getName(), req);
        return ResponseEntity.ok(ApiResponse.ok("Mở hội thoại thành công", result));
    }

    /**
     * GET /api/chat/conversations/{id}/messages?page=0&size=30
     * Lấy lịch sử tin nhắn của 1 phiên (phân trang, cũ → mới).
     */
    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<ApiResponse<Page<ChatMessageResponse>>> getMessages(
            @PathVariable Long id,
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        Page<ChatMessageResponse> result = chatService.getMessages(id, principal.getName(), page, size);
        return ResponseEntity.ok(ApiResponse.ok("Lấy tin nhắn thành công", result));
    }

    /**
     * PATCH /api/chat/conversations/{id}/read
     * Đánh dấu tất cả tin nhắn trong conversation là đã đọc.
     * Gọi khi user mở chat window.
     */
    @PatchMapping("/conversations/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long id,
            Principal principal) {
        chatService.markAsRead(id, principal.getName());
        return ResponseEntity.ok(ApiResponse.ok("Đã đánh dấu đã đọc"));
    }
}
