package vn.tourista.controller.admin;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.tourista.dto.request.CreateConversationRequest;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.ChatMessageResponse;
import vn.tourista.dto.response.ConversationResponse;
import vn.tourista.entity.Conversation;
import vn.tourista.service.ChatService;

import java.security.Principal;
import java.util.List;

/**
 * REST API cho Admin quản lý chat.
 * Tách ra từ ChatController để dễ scale và bảo trì.
 */
@RestController
@RequestMapping("/api/admin/chat")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminChatController {

    private final ChatService chatService;

    /**
     * GET /api/admin/chat/conversations
     * Lay tat ca hoi thoai - admin thay het moi nguoi.
     */
    @GetMapping("/conversations")
    public ResponseEntity<ApiResponse<List<ConversationResponse>>> getAllConversations() {
        List<ConversationResponse> result = chatService.getAllConversationsForAdmin();
        return ResponseEntity.ok(ApiResponse.ok("Danh sach hoi thoai", result));
    }

    /**
     * GET /api/admin/chat/conversations/{id}/messages?page=0&size=50
     * Lay tin nhan cua bat ky hoi thoai nao.
     */
    @GetMapping("/conversations/{id}/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageResponse>>> getMessages(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Conversation conv = chatService.getConversationForAdmin(id);
        var result = chatService.getMessagesForAdmin(conv, page, size);
        return ResponseEntity.ok(ApiResponse.ok("Lay tin nhan thanh cong", result.getContent()));
    }

    /**
     * PATCH /api/admin/chat/conversations/{id}/read
     * Danh dau da doc tat ca tin nhan trong hoi thoai.
     */
    @PatchMapping("/conversations/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id) {
        chatService.markAsReadByAdmin(id);
        return ResponseEntity.ok(ApiResponse.ok("Da danh dau da doc"));
    }

    /**
     * POST /api/admin/chat/conversations/{id}/send
     * Gui tin nhan tra loi khach hang.
     */
    @PostMapping("/conversations/{id}/send")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessage(
            @PathVariable Long id,
            @RequestBody SendMessageRequest req,
            Principal principal) {
        ChatMessageResponse msg = chatService.sendAdminMessage(id, principal.getName(), req.content());
        return ResponseEntity.ok(ApiResponse.ok("Gui tin nhan thanh cong", msg));
    }

    public record SendMessageRequest(String content) {}
}
