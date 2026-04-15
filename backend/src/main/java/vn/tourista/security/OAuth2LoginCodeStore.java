package vn.tourista.security;

import org.springframework.stereotype.Component;
import vn.tourista.dto.response.AuthResponse;
import vn.tourista.exception.InvalidTokenException;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class OAuth2LoginCodeStore {

    private static final long CODE_TTL_SECONDS = 120;

    private final Map<String, Entry> entries = new ConcurrentHashMap<>();

    public String issueCode(AuthResponse authResponse) {
        cleanupExpired();

        String code = UUID.randomUUID().toString().replace("-", "");
        entries.put(code, new Entry(authResponse, Instant.now().plusSeconds(CODE_TTL_SECONDS)));
        return code;
    }

    public AuthResponse consumeCode(String code) {
        cleanupExpired();

        Entry entry = entries.remove(code);
        if (entry == null || Instant.now().isAfter(entry.expiresAt())) {
            throw new InvalidTokenException("OAuth2 code khong hop le hoac da het han");
        }

        return entry.authResponse();
    }

    private void cleanupExpired() {
        Instant now = Instant.now();
        entries.entrySet().removeIf(item -> now.isAfter(item.getValue().expiresAt()));
    }

    private record Entry(AuthResponse authResponse, Instant expiresAt) {
    }
}
