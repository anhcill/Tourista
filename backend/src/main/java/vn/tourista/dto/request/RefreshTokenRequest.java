package vn.tourista.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

// DTO nhận refresh token để cấp lại access token
@Data
public class RefreshTokenRequest {

    @NotBlank(message = "Refresh token không được để trống")
    private String refreshToken;
}
