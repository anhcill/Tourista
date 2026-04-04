package vn.tourista.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

// Filter đọc JWT từ header Authorization, xác thực, set user vào SecurityContext
// Không dùng @Component để tránh Spring tự đăng ký 2 lần
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public JwtAuthFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // Bước 1: Lấy header Authorization
        String authHeader = request.getHeader("Authorization");

        // Bước 2: Không có hoặc sai format → bỏ qua (request sẽ fail ở security rule)
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Bước 3: Cắt lấy token (bỏ "Bearer ")
        String token = authHeader.substring(7);

        // Bước 4: Validate token
        if (!jwtUtil.validateToken(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Bước 5: Lấy email và role từ token
        String email = jwtUtil.getEmailFromToken(token);
        String role  = jwtUtil.getRoleFromToken(token);

        // Bước 6: Tạo authentication với role (dạng ROLE_USER, ROLE_ADMIN...)
        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(
                        email,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role))
                );

        // Bước 7: Set vào SecurityContext → Spring Security nhận ra user đã login
        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Bước 8: Cho request đi tiếp
        filterChain.doFilter(request, response);
    }
}
