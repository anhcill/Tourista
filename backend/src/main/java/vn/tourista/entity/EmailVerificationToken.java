package vn.tourista.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

// Bảng email_verification_tokens: token xác thực email / reset password
@Entity
@Table(name = "email_verification_tokens")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailVerificationToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "token", nullable = false, unique = true, length = 255)
    private String token;

    // Loại token: VERIFY_EMAIL hoặc RESET_PASSWORD
    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private TokenType type;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    // Đã dùng rồi chưa (chỉ dùng 1 lần)
    @Column(name = "used", nullable = false)
    @Builder.Default
    private Boolean used = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public enum TokenType {
        VERIFY_EMAIL, RESET_PASSWORD
    }
}
