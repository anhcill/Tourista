package vn.tourista.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.tourista.entity.Booking;
import vn.tourista.entity.BookingHotelDetail;
import vn.tourista.entity.BookingTourDetail;
import vn.tourista.repository.BookingHotelDetailRepository;
import vn.tourista.repository.BookingRepository;
import vn.tourista.repository.BookingTourDetailRepository;
import vn.tourista.repository.SessionRecommendationStateRepository;
import vn.tourista.service.ResendEmailService;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class CleanupScheduler {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final SessionRecommendationStateRepository stateRepository;
    private final BookingRepository bookingRepository;
    private final BookingHotelDetailRepository bookingHotelDetailRepository;
    private final BookingTourDetailRepository bookingTourDetailRepository;
    private final ResendEmailService emailService;

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

    /**
     * Auto-cancel bookings that have been PENDING for more than 30 minutes without payment.
     * Runs every 15 minutes.
     */
    @Scheduled(fixedRate = 900_000) // 15 phut
    @Transactional
    public void autoCancelExpiredBookings() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(30);
        try {
            List<Booking> expiredBookings = bookingRepository.findByStatusAndCreatedAtBefore(
                    Booking.BookingStatus.PENDING, cutoff);

            if (expiredBookings.isEmpty()) {
                return;
            }

            int count = 0;
            for (Booking booking : expiredBookings) {
                booking.setStatus(Booking.BookingStatus.CANCELLED);
                booking.setCancelReason("Tu dong huy do khong thanh toan trong 30 phut.");
                booking.setCancelledAt(LocalDateTime.now());
                bookingRepository.save(booking);

                // Gửi email thông báo hủy
                String serviceName = getServiceName(booking);
                emailService.sendBookingCancelledEmail(
                        booking.getGuestEmail(),
                        booking.getBookingCode(),
                        booking.getBookingType() != null ? booking.getBookingType().name() : "HOTEL",
                        serviceName,
                        booking.getCancelReason());
                count++;
            }

            log.info("Auto-cancelled {} expired PENDING booking(s).", count);
        } catch (Exception e) {
            log.error("Failed to auto-cancel expired bookings: {}", e.getMessage());
        }
    }

    private String getServiceName(Booking booking) {
        if (booking.getBookingType() == Booking.BookingType.HOTEL) {
            return bookingHotelDetailRepository.findByBooking(booking)
                    .map(BookingHotelDetail::getHotelName)
                    .orElse("Khách sạn không xác định");
        } else {
            return bookingTourDetailRepository.findByBooking(booking)
                    .map(BookingTourDetail::getTourTitle)
                    .orElse("Tour không xác định");
        }
    }
}
