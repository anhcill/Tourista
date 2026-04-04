package vn.tourista.repository;

import vn.tourista.entity.RefreshToken;
import vn.tourista.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    // Tìm token (dùng khi refresh hoặc logout)
    Optional<RefreshToken> findByToken(String token);

    // Thu hồi (revoke) toàn bộ refresh token của 1 user (khi đổi mật khẩu, banned...)
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.user = :user AND rt.revoked = false")
    void revokeAllByUser(User user);
}
