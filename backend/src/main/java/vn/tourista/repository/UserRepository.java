package vn.tourista.repository;

import vn.tourista.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long>, JpaSpecificationExecutor<User> {

    // Tìm user theo email (dùng cho login, register check)
    Optional<User> findByEmail(String email);

    // Kiểm tra email đã tồn tại chưa (dùng khi register)
    boolean existsByEmail(String email);

    // Tìm user theo Google provider ID
    Optional<User> findByProviderIdAndAuthProvider(String providerId, User.AuthProvider authProvider);
}
