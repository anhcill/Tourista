package vn.tourista.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import vn.tourista.entity.Conversation;

/**
 * Request body khi client tạo hoặc mở lại một conversation.
 * - type = BOT: không cần partnerId
 * - type = P2P_TOUR / P2P_HOTEL: cần partnerId + referenceId
 * - bookingId: tùy chọn, khi chat từ trang Lịch sử Booking
 */
@Data
public class CreateConversationRequest {

    @NotNull(message = "type là bắt buộc")
    private Conversation.ConversationType type;

    // ID của chủ tour/hotel (null nếu type = BOT)
    private Long partnerId;

    // ID của Tour hoặc Hotel
    private Long referenceId;

    // ID của Booking (nếu chat từ trang Lịch sử Booking)
    private Long bookingId;
}
