package vn.tourista.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.tourista.dto.request.UserProfileUpdateRequest;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.UserProfileResponse;
import vn.tourista.service.UserProfileService;

@RestController
@RequestMapping("/api/users/me")
public class UserProfileController {

    private final UserProfileService userProfileService;

    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<UserProfileResponse>> getCurrentProfile(Authentication authentication) {
        UserProfileResponse data = userProfileService.getCurrentProfile(resolveEmail(authentication));
        return ResponseEntity.ok(ApiResponse.ok("Lay profile thanh cong", data));
    }

    @PatchMapping
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateCurrentProfile(
            @Valid @RequestBody UserProfileUpdateRequest request,
            Authentication authentication) {

        UserProfileResponse data = userProfileService.updateCurrentProfile(resolveEmail(authentication), request);
        return ResponseEntity.ok(ApiResponse.ok("Cap nhat profile thanh cong", data));
    }

    private String resolveEmail(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new IllegalArgumentException("Thong tin xac thuc khong hop le");
        }
        return authentication.getName().trim();
    }
}
