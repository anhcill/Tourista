package vn.tourista.service;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple in-memory idempotency cache.
 * In production, replace with Redis for distributed idempotency.
 */
@Service
public class IdempotencyService {

    private static final Duration TTL = Duration.ofMinutes(10);

    private final Map<String, IdempotencyEntry> cache = new ConcurrentHashMap<>();

    public record IdempotencyEntry(Object result, long expiresAt) {}

    /**
     * Try to resolve from cache.
     * @return cached result if found and not expired, null otherwise
     */
    @SuppressWarnings("unchecked")
    public <T> T get(String key) {
        IdempotencyEntry entry = cache.get(key);
        if (entry == null) return null;
        if (System.currentTimeMillis() > entry.expiresAt()) {
            cache.remove(key);
            return null;
        }
        return (T) entry.result();
    }

    /**
     * Put result into cache with TTL.
     */
    public void put(String key, Object result) {
        cache.put(key, new IdempotencyEntry(result, System.currentTimeMillis() + TTL.toMillis()));
    }

    /**
     * Check if key exists and is valid (not expired).
     */
    public boolean exists(String key) {
        return get(key) != null;
    }
}
