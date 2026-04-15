package vn.tourista.dto.request.admin;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AdminPromotionStatusUpdateRequest {

    @NotNull(message = "isActive khong duoc de trong")
    private Boolean isActive;

    @NotBlank(message = "Reason khong duoc de trong")
    @Size(max = 500, message = "Reason toi da 500 ky tu")
    private String reason;
}