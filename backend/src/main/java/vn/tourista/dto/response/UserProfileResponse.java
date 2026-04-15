package vn.tourista.dto.response;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class UserProfileResponse {
    Long id;
    String email;
    String fullName;
    String phone;
    String avatarUrl;
    String role;
    String authProvider;
    Boolean isEmailVerified;
}
