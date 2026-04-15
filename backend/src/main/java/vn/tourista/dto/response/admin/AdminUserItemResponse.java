package vn.tourista.dto.response.admin;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class AdminUserItemResponse {
    Long id;
    String fullName;
    String email;
    String phone;
    String roleName;
    String status;
    Boolean isEmailVerified;
    String authProvider;
    LocalDateTime createdAt;
    LocalDateTime lastLoginAt;
}