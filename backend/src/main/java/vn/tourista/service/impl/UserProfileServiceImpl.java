package vn.tourista.service.impl;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import vn.tourista.dto.request.UserProfileUpdateRequest;
import vn.tourista.dto.response.UserProfileResponse;
import vn.tourista.entity.User;
import vn.tourista.repository.UserRepository;
import vn.tourista.service.UserProfileService;

import java.util.NoSuchElementException;

@Service
@Transactional
public class UserProfileServiceImpl implements UserProfileService {

    private final UserRepository userRepository;

    public UserProfileServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserProfileResponse getCurrentProfile(String email) {
        User user = findByEmail(email);
        return toProfileResponse(user);
    }

    @Override
    public UserProfileResponse updateCurrentProfile(String email, UserProfileUpdateRequest request) {
        User user = findByEmail(email);

        user.setFullName(request.getFullName().trim());
        user.setPhone(normalizeOptional(request.getPhone()));
        user.setAvatarUrl(normalizeOptional(request.getAvatarUrl()));

        User saved = userRepository.save(user);
        return toProfileResponse(saved);
    }

    private User findByEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Thong tin xac thuc khong hop le");
        }

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay user hien tai"));
    }

    private String normalizeOptional(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private UserProfileResponse toProfileResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole() != null ? user.getRole().getName() : null)
                .authProvider(user.getAuthProvider() != null ? user.getAuthProvider().name() : null)
                .isEmailVerified(user.getIsEmailVerified())
                .build();
    }
}
