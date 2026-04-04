package vn.tourista.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

// Bảng users: thông tin tài khoản người dùng
@Entity
@Table(name = "users")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    // Mật khẩu đã BCrypt — null nếu đăng nhập bằng Google
    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "phone", length = 15)
    private String phone;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    // Liên kết role (Many users → One role)
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    // Trạng thái tài khoản
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 10)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    // Xác thực email
    @Column(name = "is_email_verified", nullable = false)
    @Builder.Default
    private Boolean isEmailVerified = false;

    @Column(name = "email_verified_at")
    private LocalDateTime emailVerifiedAt;

    // Bảo vệ brute force: đếm số lần đăng nhập sai
    @Column(name = "failed_attempts", nullable = false)
    @Builder.Default
    private Integer failedAttempts = 0;

    // Tài khoản bị khóa đến thời điểm này (null = không bị khóa)
    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    // Provider: LOCAL (tự đăng ký), GOOGLE
    @Enumerated(EnumType.STRING)
    @Column(name = "auth_provider", nullable = false, length = 10)
    @Builder.Default
    private AuthProvider authProvider = AuthProvider.LOCAL;

    // ID từ Google OAuth2 (null nếu đăng ký thường)
    @Column(name = "provider_id", length = 100)
    private String providerId;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Enum trạng thái tài khoản
    public enum UserStatus {
        ACTIVE, LOCKED, BANNED
    }

    // Enum provider đăng nhập
    public enum AuthProvider {
        LOCAL, GOOGLE
    }
}
