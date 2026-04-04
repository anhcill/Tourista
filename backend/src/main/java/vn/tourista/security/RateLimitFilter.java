package vn.tourista.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

// Rate Limiting Filter: giới hạn số request theo IP + endpoint
// Dùng Bucket4j (token bucket algorithm)
@Component
public class RateLimitFilter implements Filter {

    @Value("${app.rate-limit.login-per-minute}")
    private int loginPerMinute;

    @Value("${app.rate-limit.register-per-minute}")
    private int registerPerMinute;

    // Lưu bucket riêng cho từng IP + endpoint
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    @Override
    public void doFilter(ServletRequest servletRequest,
                         ServletResponse servletResponse,
                         FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest request  = (HttpServletRequest) servletRequest;
        HttpServletResponse response = (HttpServletResponse) servletResponse;
        String path = request.getRequestURI();

        // Chỉ áp dụng rate limit cho login và register
        if (path.endsWith("/api/auth/login") || path.endsWith("/api/auth/register")) {
            String ip = getClientIp(request);
            int limit = path.endsWith("/login") ? loginPerMinute : registerPerMinute;
            String bucketKey = ip + ":" + path;

            // Lấy bucket của IP này (tạo mới nếu chưa có)
            Bucket bucket = buckets.computeIfAbsent(bucketKey, k -> createBucket(limit));

            // Thử lấy 1 token — nếu hết token → trả 429
            if (!bucket.tryConsume(1)) {
                response.setStatus(429); // Too Many Requests
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write(
                    "{\"success\":false,\"message\":\"Quá nhiều yêu cầu. Vui lòng thử lại sau.\"}"
                );
                return;
            }
        }

        chain.doFilter(servletRequest, servletResponse);
    }

    // Tạo bucket với giới hạn N request / phút
    private Bucket createBucket(int requestsPerMinute) {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(requestsPerMinute)
                        .refillIntervally(requestsPerMinute, Duration.ofMinutes(1))
                        .build())
                .build();
    }

    // Lấy IP thực của client (kể cả qua proxy/nginx)
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
