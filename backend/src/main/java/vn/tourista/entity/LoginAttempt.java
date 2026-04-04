package vn.tourista.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

// Bảng login_attempts: ghi log từng lần đăng nhập để audit và detect brute force
@Entity
@Table(name = "login_attempts")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Email đăng nhập (không cần FK — ngay cả email không tồn tại cũng phải log)
    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "ip_address", nullable = false, length = 45)
    private String ipAddress;

    // true = đăng nhập thành công, false = thất bại
    @Column(name = "success", nullable = false)
    private Boolean success;

    @Column(name = "user_agent", length = 255)
    private String userAgent;

    // Lý do thất bại (WRONG_PASSWORD, ACCOUNT_LOCKED, EMAIL_NOT_VERIFIED...)
    @Column(name = "failure_reason", length = 50)
    private String failureReason;

    @Column(name = "attempted_at", nullable = false, updatable = false)
    private LocalDateTime attemptedAt;

    @PrePersist
    public void onCreate() {
        this.attemptedAt = LocalDateTime.now();
    }
}
