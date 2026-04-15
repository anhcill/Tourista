package vn.tourista.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Arrays;

/**
 * Cấu hình WebSocket STOMP cho hệ thống Chat.
 *
 * Endpoint: ws://localhost:8080/ws (kèm SockJS fallback)
 * Broker prefix:
 * /topic → broadcast (không dùng nhiều trong chat private)
 * /user → push đích danh: /user/{email}/queue/messages
 * App prefix: /app → ví dụ client gửi tới /app/chat.send
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Autowired
    private WebSocketAuthInterceptor webSocketAuthInterceptor;

    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String corsAllowedOrigins;

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                // Cho phép frontend từ danh sách origin cấu hình theo môi trường
                .setAllowedOriginPatterns(resolveAllowedOrigins())
                // SockJS fallback cho browser cũ không hỗ trợ WebSocket
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // /user/{userName}/queue/... → push private message về đúng người
        // /topic/... → broadcast (ít dùng trong chat P2P)
        registry.enableSimpleBroker("/user", "/topic");

        // Tin nhắn từ client gửi lên sẽ có prefix /app
        // VD: client gửi tới /app/chat.send
        registry.setApplicationDestinationPrefixes("/app");

        // Prefix để SimpMessagingTemplate.convertAndSendToUser() hoạt động đúng
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Đăng ký interceptor xác thực JWT trên kênh nhận lệnh từ Client
        registration.interceptors(webSocketAuthInterceptor);
    }

    private String[] resolveAllowedOrigins() {
        return Arrays.stream(corsAllowedOrigins.split(","))
                .map(String::trim)
                .filter(StringUtils::hasText)
                .toArray(String[]::new);
    }
}
