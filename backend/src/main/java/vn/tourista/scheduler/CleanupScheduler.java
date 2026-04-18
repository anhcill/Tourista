package vn.tourista.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import vn.tourista.repository.SessionRecommendationStateRepository;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class CleanupScheduler {

    private final SessionRecommendationStateRepository stateRepository;

    /**
     * Xoa expired recommendation states mỗi 5 phut.
     * TTL: 20 phut không hoạt động (định nghĩa trong SessionRecommendationState.TIMEOUT_MINUTES).
     * Chạy fixedDelayString de cho phep doc tu config neu can.
     */
    @Scheduled(fixedRate = 300_000) // 5 phut
    public void cleanupExpiredRecommendationStates() {
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(20);
        try {
            int deleted = stateRepository.deleteExpiredStates(threshold);
            if (deleted > 0) {
                log.info("Cleaned up {} expired recommendation state(s).", deleted);
            }
        } catch (Exception e) {
            log.error("Failed to cleanup expired recommendation states: {}", e.getMessage());
        }
    }
}
