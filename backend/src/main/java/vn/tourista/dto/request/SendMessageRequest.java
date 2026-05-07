package vn.tourista.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request body khi client gửi tin nhắn đến chatbot AI.
 */
@Data
public class SendMessageRequest {

    @NotBlank(message = "Tin nhắn không được rỗng")
    private String message;

    private Long conversationId;
}
