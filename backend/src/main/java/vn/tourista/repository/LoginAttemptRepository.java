package vn.tourista.repository;

import vn.tourista.entity.LoginAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoginAttemptRepository extends JpaRepository<LoginAttempt, Long> {
    // Chỉ cần save() — insert log mỗi lần login attempt
}
