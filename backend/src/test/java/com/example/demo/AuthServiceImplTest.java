package com.example.demo;

import com.example.demo.dto.*;
import com.example.demo.entity.User;
import com.example.demo.exception.FieldValidationException;
import com.example.demo.exception.UnauthorizedException;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.JwtUtil;
import com.example.demo.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

// @ExtendWith(MockitoExtension.class) giúp Mockito tự khởi tạo các @Mock và @InjectMocks
@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    // Giả lập các dependency — không kết nối DB hay tạo JWT thật
    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    // Class cần test — Mockito tự inject các @Mock vào đây
    @InjectMocks
    private AuthServiceImpl authService;

    // Dữ liệu dùng chung cho các test
    private User fakeUser;

    @BeforeEach
    void setUp() {
        // Tạo 1 user giả để dùng trong các test case
        fakeUser = new User();
        fakeUser.setId(1L);
        fakeUser.setFullName("Jane Doe");
        fakeUser.setEmail("jane@example.com");
        fakeUser.setPassword("$2a$10$hashedPassword"); // BCrypt hash giả
        fakeUser.setRole("USER");
    }

    // ============================================================
    // TEST ĐĂNG NHẬP (LOGIN)
    // ============================================================

    @Test
    void login_Success() {
        // GIVEN — chuẩn bị dữ liệu đầu vào
        LoginRequest request = new LoginRequest();
        request.setEmail("jane@example.com");
        request.setPassword("password123");

        // Giả lập: tìm user theo email → trả về fakeUser
        when(userRepository.findByEmail("jane@example.com"))
                .thenReturn(Optional.of(fakeUser));

        // Giả lập: so sánh mật khẩu → đúng
        when(passwordEncoder.matches("password123", "$2a$10$hashedPassword"))
                .thenReturn(true);

        // Giả lập: tạo token và lấy expire time
        when(jwtUtil.generateToken("jane@example.com", "USER"))
                .thenReturn("fake.jwt.token");
        when(jwtUtil.getExpireTime())
                .thenReturn("2026-03-12T00:00:00Z");

        // WHEN — gọi hàm cần test
        LoginResponse result = authService.login(request);

        // THEN — kiểm tra kết quả
        assertNotNull(result);
        assertEquals("fake.jwt.token", result.getAccessToken());
        assertEquals("2026-03-12T00:00:00Z", result.getExpire());
    }

    @Test
    void login_EmailNotFound_ShouldThrowUnauthorizedException() {
        // GIVEN — email không tồn tại trong DB
        LoginRequest request = new LoginRequest();
        request.setEmail("nobody@example.com");
        request.setPassword("password123");

        when(userRepository.findByEmail("nobody@example.com"))
                .thenReturn(Optional.empty()); // Không tìm thấy

        // WHEN & THEN — phải throw UnauthorizedException
        UnauthorizedException ex = assertThrows(UnauthorizedException.class, () -> {
            authService.login(request);
        });

        assertEquals("Invalid email or password", ex.getMessage());
    }

    @Test
    void login_WrongPassword_ShouldThrowUnauthorizedException() {
        // GIVEN — email đúng nhưng mật khẩu sai
        LoginRequest request = new LoginRequest();
        request.setEmail("jane@example.com");
        request.setPassword("wrongpassword1");

        when(userRepository.findByEmail("jane@example.com"))
                .thenReturn(Optional.of(fakeUser));

        // Giả lập: so sánh mật khẩu → sai
        when(passwordEncoder.matches("wrongpassword1", "$2a$10$hashedPassword"))
                .thenReturn(false);

        // WHEN & THEN — phải throw UnauthorizedException
        assertThrows(UnauthorizedException.class, () -> {
            authService.login(request);
        });
    }

    // ============================================================
    // TEST ĐĂNG KÝ (REGISTER)
    // ============================================================

    @Test
    void register_Success() {
        // GIVEN
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Jane Doe");
        request.setEmail("jane@example.com");
        request.setPassword("password123");

        // Email chưa tồn tại
        when(userRepository.existsByEmail("jane@example.com"))
                .thenReturn(false);

        // Mã hóa mật khẩu
        when(passwordEncoder.encode("password123"))
                .thenReturn("$2a$10$hashedPassword");

        // Giả lập: save user → trả về fakeUser với id=1
        when(userRepository.save(any(User.class)))
                .thenReturn(fakeUser);

        // WHEN
        RegisterResponse result = authService.register(request);

        // THEN
        assertNotNull(result);
        assertEquals(1L, result.getUserId());
        assertEquals("Jane Doe", result.getFullName());
        assertEquals("jane@example.com", result.getEmail());
    }

    @Test
    void register_DuplicateEmail_ShouldThrowFieldValidationException() {
        // GIVEN — email đã tồn tại trong DB
        RegisterRequest request = new RegisterRequest();
        request.setFullName("Jane Doe");
        request.setEmail("jane@example.com");
        request.setPassword("password123");

        when(userRepository.existsByEmail("jane@example.com"))
                .thenReturn(true); // Email đã tồn tại!

        // WHEN & THEN — phải throw FieldValidationException
        FieldValidationException ex = assertThrows(FieldValidationException.class, () -> {
            authService.register(request);
        });

        assertEquals("email", ex.getField());
        assertEquals("Email is already registered", ex.getMessage());
    }

    // ============================================================
    // TEST CẬP NHẬT PROFILE (UPDATE PROFILE)
    // ============================================================

    @Test
    void updateProfile_Success() {
        // GIVEN
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFullName("Jane Doe Updated");

        when(userRepository.findByEmail("jane@example.com"))
                .thenReturn(Optional.of(fakeUser));

        // Giả lập: sau khi save → user đã được cập nhật fullName
        User updatedUser = new User();
        updatedUser.setId(1L);
        updatedUser.setFullName("Jane Doe Updated");
        updatedUser.setEmail("jane@example.com");

        when(userRepository.save(any(User.class)))
                .thenReturn(updatedUser);

        // WHEN
        UpdateProfileResponse result = authService.updateProfile("jane@example.com", request);

        // THEN
        assertNotNull(result);
        assertEquals("Jane Doe Updated", result.getFullName());
        assertEquals("jane@example.com", result.getEmail());
    }

    @Test
    void updateProfile_UserNotFound_ShouldThrowUnauthorizedException() {
        // GIVEN — email không tồn tại (trường hợp token hợp lệ nhưng user đã bị xóa)
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFullName("New Name");

        when(userRepository.findByEmail("ghost@example.com"))
                .thenReturn(Optional.empty());

        // WHEN & THEN
        assertThrows(UnauthorizedException.class, () -> {
            authService.updateProfile("ghost@example.com", request);
        });
    }
}
