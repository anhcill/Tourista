package vn.tourista.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.entity.Booking;
import vn.tourista.entity.BookingHotelDetail;
import vn.tourista.entity.BookingTourDetail;
import vn.tourista.entity.User;
import vn.tourista.repository.BookingRepository;
import vn.tourista.repository.BookingHotelDetailRepository;
import vn.tourista.repository.BookingTourDetailRepository;
import vn.tourista.repository.UserRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private BookingHotelDetailRepository bookingHotelDetailRepository;

    @Autowired
    private BookingTourDetailRepository bookingTourDetailRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * GET /api/notifications
     * Trả về danh sách thông báo của user hiện tại,
     * được tổng hợp từ lịch sử đặt phòng/tour.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getNotifications(
            Authentication authentication) {

        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Booking> bookings = bookingRepository.findByUser_IdOrderByCreatedAtDesc(user.getId());
        List<Map<String, Object>> notifications = new ArrayList<>();

        LocalDate today = LocalDate.now();
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        for (Booking b : bookings) {
            // 1. Đặt thành công / đã xác nhận
            if (b.getStatus() == Booking.BookingStatus.CONFIRMED) {
                String serviceName = resolveServiceName(b);
                Map<String, Object> notif = buildNotif(
                        "booking_confirmed_" + b.getId(),
                        "Đặt chỗ đã xác nhận! ✅",
                        serviceName + " (#" + b.getBookingCode() + ") đã được xác nhận thành công.",
                        "booking",
                        "/profile/bookings",
                        b.getConfirmedAt() != null ? b.getConfirmedAt() : b.getCreatedAt(),
                        true
                );
                notifications.add(notif);
            }

            // 2. Nhắc nhở nhận phòng / khởi hành
            if (b.getStatus() == Booking.BookingStatus.CONFIRMED) {
                if (b.getBookingType() == Booking.BookingType.HOTEL) {
                    Optional<BookingHotelDetail> hdOpt = bookingHotelDetailRepository.findByBooking_Id(b.getId());
                    if (hdOpt.isPresent()) {
                        BookingHotelDetail hd = hdOpt.get();
                        if (hd.getCheckInDate() != null) {
                            long daysUntil = ChronoUnit.DAYS.between(today, hd.getCheckInDate());
                            if (daysUntil == 1 || daysUntil == 3) {
                                Map<String, Object> notif = buildNotif(
                                        "checkin_reminder_" + b.getId(),
                                        "Nhắc nhở nhận phòng 🏨",
                                        "Nhận phòng tại " + (hd.getHotelName() != null ? hd.getHotelName() : "khách sạn")
                                                + " vào " + hd.getCheckInDate().format(fmt) + " ("
                                                + (daysUntil == 1 ? "ngày mai" : "3 ngày nữa") + ").",
                                        "reminder",
                                        "/profile/bookings",
                                        LocalDateTime.now(),
                                        false
                                );
                                notifications.add(notif);
                            }
                        }
                    }
                } else if (b.getBookingType() == Booking.BookingType.TOUR) {
                    Optional<BookingTourDetail> tdOpt = bookingTourDetailRepository.findByBooking(b);
                    if (tdOpt.isPresent()) {
                        BookingTourDetail td = tdOpt.get();
                        if (td.getDepartureDate() != null) {
                            long daysUntil = ChronoUnit.DAYS.between(today, td.getDepartureDate());
                            if (daysUntil == 1 || daysUntil == 3) {
                                Map<String, Object> notif = buildNotif(
                                        "tour_reminder_" + b.getId(),
                                        "Nhắc nhở khởi hành tour 🧳",
                                        "Tour " + (td.getTourTitle() != null ? td.getTourTitle() : "của bạn")
                                                + " khởi hành " + td.getDepartureDate().format(fmt) + " ("
                                                + (daysUntil == 1 ? "ngày mai" : "3 ngày nữa") + ").",
                                        "reminder",
                                        "/profile/bookings",
                                        LocalDateTime.now(),
                                        false
                                );
                                notifications.add(notif);
                            }
                        }
                    }
                }
            }

            // 3. Đơn bị hủy
            if (b.getStatus() == Booking.BookingStatus.CANCELLED) {
                String serviceName = resolveServiceName(b);
                Map<String, Object> notif = buildNotif(
                        "booking_cancelled_" + b.getId(),
                        "Đơn đặt bị hủy ❌",
                        "Đơn " + serviceName + " (#" + b.getBookingCode() + ") đã bị hủy.",
                        "cancel",
                        "/profile/bookings",
                        b.getCancelledAt() != null ? b.getCancelledAt() : b.getUpdatedAt(),
                        false
                );
                notifications.add(notif);
            }

            // 4. Đơn hoàn thành
            if (b.getStatus() == Booking.BookingStatus.COMPLETED) {
                String serviceName = resolveServiceName(b);
                Map<String, Object> notif = buildNotif(
                        "booking_completed_" + b.getId(),
                        "Chuyến đi hoàn thành! 🎉",
                        serviceName + " (#" + b.getBookingCode() + ") đã hoàn thành. Hãy để lại đánh giá!",
                        "completed",
                        "/profile/bookings",
                        b.getUpdatedAt(),
                        false
                );
                notifications.add(notif);
            }
        }

        // Sắp xếp theo thời gian mới nhất trước, tối đa 20 thông báo
        notifications.sort((a, b) -> {
            LocalDateTime timeA = (LocalDateTime) a.get("createdAt");
            LocalDateTime timeB = (LocalDateTime) b.get("createdAt");
            if (timeA == null && timeB == null) return 0;
            if (timeA == null) return 1;
            if (timeB == null) return -1;
            return timeB.compareTo(timeA);
        });

        List<Map<String, Object>> result = notifications.stream()
                .limit(20)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok("Lấy thông báo thành công", result));
    }

    private String resolveServiceName(Booking b) {
        if (b.getBookingType() == Booking.BookingType.HOTEL) {
            return bookingHotelDetailRepository.findByBooking_Id(b.getId())
                    .map(hd -> hd.getHotelName() != null ? hd.getHotelName() : "Khách sạn")
                    .orElse("Khách sạn");
        } else if (b.getBookingType() == Booking.BookingType.TOUR) {
            return bookingTourDetailRepository.findByBooking(b)
                    .map(td -> td.getTourTitle() != null ? td.getTourTitle() : "Tour")
                    .orElse("Tour");
        }
        return "Dịch vụ #" + b.getBookingCode();
    }

    private Map<String, Object> buildNotif(
            String id, String title, String text,
            String type, String link,
            LocalDateTime createdAt, boolean unread) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id);
        m.put("title", title);
        m.put("text", text);
        m.put("type", type);
        m.put("link", link);
        m.put("createdAt", createdAt);
        m.put("unread", unread);
        return m;
    }
}
