package vn.tourista.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import vn.tourista.entity.User;
import vn.tourista.repository.UserRepository;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

// Filter đọc JWT từ header Authorization, xác thực, set user vào SecurityContext
// Không dùng @Component để tránh Spring tự đăng ký 2 lần
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public JwtAuthFilter(JwtUtil jwtUtil, UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        if (!jwtUtil.validateToken(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        String email = jwtUtil.getEmailFromToken(token);

        // Load user from DB to get the full role object
        User user = userRepository.findByEmail(email).orElse(null);
        List<SimpleGrantedAuthority> authorities;

        if (user != null && user.getRole() != null) {
            // Use the role from DB (authorities are already EAGER loaded)
            authorities = List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().getName()));
        } else {
            // Fallback: use role from JWT token
            String role = jwtUtil.getRoleFromToken(token);
            authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role));
        }

        UsernamePasswordAuthenticationToken authentication =
                new UsernamePasswordAuthenticationToken(email, null, authorities);

        SecurityContextHolder.getContext().setAuthentication(authentication);

        filterChain.doFilter(request, response);
    }
}
