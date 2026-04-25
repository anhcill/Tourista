package vn.tourista.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import vn.tourista.entity.Booking;
import vn.tourista.entity.BookingHotelDetail;
import vn.tourista.entity.BookingTourDetail;
import vn.tourista.repository.BookingHotelDetailRepository;
import vn.tourista.repository.BookingRepository;
import vn.tourista.repository.BookingTourDetailRepository;
import vn.tourista.service.BookingService;
import vn.tourista.service.BrevoEmailService;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Scheduler tự động gửi email nhắc nhở và cảm ơn.
 * Chạy mỗi ngày lúc 08:00 và 20:00.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EmailReminderScheduler {

    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final BookingRepository bookingRepository;
    private final BookingHotelDetailRepository bookingHotelDetailRepository;
    private final BookingTourDetailRepository bookingTourDetailRepository;
    private final BrevoEmailService emailService;
    private final BookingService bookingService;

    /**
     * Gửi email NHẮC NHỞ trước 1 ngày (check-in hoặc khởi hành).
     * Chạy mỗi ngày lúc 08:00.
     */
    @Scheduled(cron = "0 0 8 * * *")
    public void sendReminderEmails() {
        log.info("=== [SCHEDULER] Gửi email nhắc nhở trước check-in ===");
        int count = 0;

        LocalDate tomorrow = LocalDate.now().plusDays(1);

        // Hotel bookings - nhắc nhở nhận phòng
        List<Booking> hotelBookings = bookingRepository.findConfirmedHotelBookingsForDate(tomorrow);
        for (Booking booking : hotelBookings) {
            try {
                BookingHotelDetail detail = bookingHotelDetailRepository.findByBooking(booking).orElse(null);
                if (detail == null) continue;

                emailService.sendReminderEmail(
                        booking.getGuestEmail(),
                        booking.getBookingCode(),
                        "HOTEL",
                        detail.getHotelName(),
                        "Phòng: " + detail.getRoomTypeName(),
                        detail.getCheckInDate() != null ? detail.getCheckInDate().format(DF) : "",
                        detail.getCheckOutDate() != null ? detail.getCheckOutDate().format(DF) : "",
                        detail.getAdults() != null ? detail.getAdults() : 0,
                        detail.getChildren() != null ? detail.getChildren() : 0,
                        detail.getNumRooms() != null ? detail.getNumRooms() : 0,
                        booking.getTotalAmount(),
                        booking.getCurrency() != null ? booking.getCurrency() : "VND"
                );
                count++;
            } catch (Exception e) {
                log.error("Lỗi gửi reminder email cho booking {}: {}", booking.getBookingCode(), e.getMessage());
            }
        }

        // Tour bookings - nhắc nhở khởi hành
        List<Booking> tourBookings = bookingRepository.findConfirmedTourBookingsForDate(tomorrow);
        for (Booking booking : tourBookings) {
            try {
                BookingTourDetail detail = bookingTourDetailRepository.findByBooking(booking).orElse(null);
                if (detail == null) continue;

                emailService.sendReminderEmail(
                        booking.getGuestEmail(),
                        booking.getBookingCode(),
                        "TOUR",
                        detail.getTourTitle(),
                        "Khởi hành: " + (detail.getDepartureDate() != null ? detail.getDepartureDate().format(DF) : ""),
                        detail.getDepartureDate() != null ? detail.getDepartureDate().format(DF) : "",
                        "",
                        detail.getNumAdults() != null ? detail.getNumAdults() : 0,
                        detail.getNumChildren() != null ? detail.getNumChildren() : 0,
                        detail.getNumAdults() != null ? detail.getNumAdults() : 0,
                        booking.getTotalAmount(),
                        booking.getCurrency() != null ? booking.getCurrency() : "VND"
                );
                count++;
            } catch (Exception e) {
                log.error("Lỗi gửi reminder email cho booking {}: {}", booking.getBookingCode(), e.getMessage());
            }
        }

        log.info("=== [SCHEDULER] Đã gửi {} email nhắc nhở ===", count);
    }

    /**
     * Gửi email CẢM ƠN cho booking đã check-out / kết thúc.
     * Chạy mỗi ngày lúc 20:00.
     */
    @Scheduled(cron = "0 0 20 * * *")
    public void sendThankYouEmails() {
        log.info("=== [SCHEDULER] Gửi email cảm ơn sau chuyến đi ===");
        int count = 0;

        LocalDate today = LocalDate.now();

        // Hotel bookings - đã trả phòng (checkout = today)
        List<Booking> hotelCompleted = bookingRepository.findCompletedHotelBookingsForDate(today);
        for (Booking booking : hotelCompleted) {
            try {
                BookingHotelDetail detail = bookingHotelDetailRepository.findByBooking(booking).orElse(null);
                if (detail == null) continue;

                emailService.sendThankYouEmail(
                        booking.getGuestEmail(),
                        booking.getBookingCode(),
                        "HOTEL",
                        detail.getHotelName(),
                        detail.getCheckInDate() != null ? detail.getCheckInDate().format(DF) : "",
                        detail.getCheckOutDate() != null ? detail.getCheckOutDate().format(DF) : "",
                        detail.getAdults() != null ? detail.getAdults() : 0,
                        detail.getChildren() != null ? detail.getChildren() : 0,
                        booking.getTotalAmount(),
                        booking.getCurrency() != null ? booking.getCurrency() : "VND"
                );
                count++;
            } catch (Exception e) {
                log.error("Lỗi gửi thank-you email cho booking {}: {}", booking.getBookingCode(), e.getMessage());
            }
        }

        // Tour bookings - đã kết thúc (departure = today)
        List<Booking> tourCompleted = bookingRepository.findCompletedTourBookingsForDate(today);
        for (Booking booking : tourCompleted) {
            try {
                BookingTourDetail detail = bookingTourDetailRepository.findByBooking(booking).orElse(null);
                if (detail == null) continue;

                emailService.sendThankYouEmail(
                        booking.getGuestEmail(),
                        booking.getBookingCode(),
                        "TOUR",
                        detail.getTourTitle(),
                        detail.getDepartureDate() != null ? detail.getDepartureDate().format(DF) : "",
                        "",
                        detail.getNumAdults() != null ? detail.getNumAdults() : 0,
                        detail.getNumChildren() != null ? detail.getNumChildren() : 0,
                        booking.getTotalAmount(),
                        booking.getCurrency() != null ? booking.getCurrency() : "VND"
                );
                count++;
            } catch (Exception e) {
                log.error("Lỗi gửi thank-you email cho booking {}: {}", booking.getBookingCode(), e.getMessage());
            }
        }

        log.info("=== [SCHEDULER] Đã gửi {} email cảm ơn ===", count);
    }

    /**
     * Tự động đánh dấu COMPLETED cho booking đã trả phòng / kết thúc tour.
     * Chạy mỗi ngày lúc 23:30.
     */
    @Scheduled(cron = "0 30 23 * * *")
    public void autoCompleteBookings() {
        log.info("=== [SCHEDULER] Tự động đánh dấu COMPLETED ===");
        int count = 0;

        List<Booking> hotelToComplete = bookingRepository.findConfirmedHotelBookingsBeforeDate(LocalDate.now());
        for (Booking booking : hotelToComplete) {
            try {
                bookingService.completeBooking(booking.getId());
                count++;
            } catch (Exception e) {
                log.error("Lỗi complete booking {}: {}", booking.getBookingCode(), e.getMessage());
            }
        }

        // Tour: departure date < today, status CONFIRMED
        List<Booking> tourToComplete = bookingRepository.findConfirmedTourBookingsBeforeDate(LocalDate.now());
        for (Booking booking : tourToComplete) {
            try {
                bookingService.completeBooking(booking.getId());
                count++;
            } catch (Exception e) {
                log.error("Lỗi complete booking {}: {}", booking.getBookingCode(), e.getMessage());
            }
        }

        log.info("=== [SCHEDULER] Đã đánh dấu {} booking là COMPLETED ===", count);
    }
}
