package vn.tourista.repository;

import vn.tourista.entity.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

    // Tìm token (dùng khi user click link verify email)
    Optional<EmailVerificationToken> findByToken(String token);
}
