package vn.tourista.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
// import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
// import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.util.StringUtils;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity // Cho phép dùng @PreAuthorize trên method
public class SecurityConfig {

        @Autowired
        private JwtUtil jwtUtil;

        @Autowired
        private OAuth2SuccessHandler oAuth2SuccessHandler;

        @Autowired
        private RateLimitFilter rateLimitFilter;

        @Value("${app.cors.allowed-origins:http://localhost:3000}")
        private String corsAllowedOrigins;

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                http
                                // Tắt CSRF vì dùng JWT stateless
                                .csrf(AbstractHttpConfigurer::disable)

                                // CORS config
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                                // Không dùng session (stateless)
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                                // API chưa đăng nhập => trả 401, không redirect sang Google OAuth
                                .exceptionHandling(ex -> ex
                                                .defaultAuthenticationEntryPointFor(
                                                                new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                                                                new AntPathRequestMatcher("/api/**")))

                                // Quyền truy cập từng endpoint
                                .authorizeHttpRequests(auth -> auth
                                                // Public: đăng ký, đăng nhập, verify email, OAuth2
                                                .requestMatchers(
                                                                "/api/auth/register",
                                                                "/api/auth/login",
                                                                "/api/auth/oauth2/exchange",
                                                                "/api/auth/verify-email",
                                                                "/api/auth/forgot-password",
                                                                "/api/auth/reset-password",
                                                                "/api/auth/refresh",
                                                                "/api/autocomplete/**",
                                                                "/api/hotels/**",
                                                                "/api/tours/**",
                                                                "/api/home/**",
                                                                "/api/availability/**",
                                                                "/api/travel-plan/**",
                                                                "/api/payments/vnpay/return",
                                                                "/api/payments/vnpay/ipn",
                                                                "/api/payments/momo/**",
                                                                "/api/payments/zalopay/**",
                                                                "/login/oauth2/**",
                                                                "/oauth2/**",
                                                                // WebSocket handshake endpoint (SockJS dùng HTTP trước
                                                                // khi upgrade)
                                                                "/ws/**")
                                                .permitAll()
                                                // Admin APIs: chỉ cho role ADMIN
                                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                                // Partner APIs: cho PARTNER, HOST, hoặc ADMIN
                                                .requestMatchers("/api/partner/**").hasAnyRole("PARTNER", "HOST", "ADMIN")
                                                // Còn lại phải có JWT
                                                .anyRequest().authenticated())

                                // Google OAuth2
                                .oauth2Login(oauth2 -> oauth2
                                                .successHandler(oAuth2SuccessHandler))

                                // Thêm rate-limit filter để giới hạn login/register theo IP
                                .addFilterBefore(rateLimitFilter,
                                                UsernamePasswordAuthenticationFilter.class)

                                // Thêm JWT filter chạy trước filter mặc định
                                .addFilterBefore(new JwtAuthFilter(jwtUtil),
                                                UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }

        // BCrypt để hash mật khẩu - Moved to PasswordEncoderConfig.java
        // @Bean
        // public PasswordEncoder passwordEncoder() {
        // return new BCryptPasswordEncoder();
        // }

        // CORS: cho phép frontend localhost:3000 gọi API
        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration config = new CorsConfiguration();
                config.setAllowedOriginPatterns(resolveAllowedOrigins());
                config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                config.setAllowedHeaders(List.of("*"));
                config.setAllowCredentials(true);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", config);
                return source;
        }

        private List<String> resolveAllowedOrigins() {
                return Arrays.stream(corsAllowedOrigins.split(","))
                                .map(String::trim)
                                .filter(StringUtils::hasText)
                                .toList();
        }
}
