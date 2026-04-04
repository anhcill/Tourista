package vn.tourista.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

// Response trả về sau khi login hoặc refresh token thành công
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;
    private String refreshToken;

    @Builder.Default
    private String tokenType = "Bearer";

    private long expiresIn;  // Số giây đến khi access token hết hạn

    private UserInfo user;

    // Thông tin user trả về cho client (không trả password!)
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserInfo {
        private Long id;
        private String email;
        private String fullName;
        private String role;
        private String avatarUrl;
        private Boolean isEmailVerified;
    }
}
