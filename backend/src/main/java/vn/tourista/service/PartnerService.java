package vn.tourista.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import vn.tourista.dto.response.partner.PartnerBookingResponse;
import vn.tourista.dto.response.partner.PartnerHotelResponse;
import vn.tourista.dto.response.partner.PartnerTourResponse;
import vn.tourista.entity.Booking;
import vn.tourista.entity.BookingHotelDetail;
import vn.tourista.entity.BookingTourDetail;
import vn.tourista.entity.Hotel;
import vn.tourista.entity.Tour;
import vn.tourista.entity.User;
import vn.tourista.repository.BookingHotelDetailRepository;
import vn.tourista.repository.BookingRepository;
import vn.tourista.repository.BookingTourDetailRepository;
import vn.tourista.repository.HotelRepository;
import vn.tourista.repository.TourRepository;
import vn.tourista.repository.UserRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PartnerService {

    private final UserRepository userRepository;
    private final HotelRepository hotelRepository;
    private final TourRepository tourRepository;
    private final BookingRepository bookingRepository;
    private final BookingHotelDetailRepository bookingHotelDetailRepository;
    private final BookingTourDetailRepository bookingTourDetailRepository;

    public List<PartnerHotelResponse> getPartnerHotels(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        List<Hotel> hotels = hotelRepository.findByOwner(user);

        List<Long> hotelIds = hotels.stream().map(Hotel::getId).collect(Collectors.toList());
        List<BookingHotelDetail> allDetails = hotelIds.isEmpty()
                ? List.of()
                : bookingHotelDetailRepository.findByHotelIdIn(hotelIds);

        Map<Long, Long> hotelBookingCount = allDetails.stream()
                .collect(Collectors.groupingBy(d -> d.getHotel().getId(), Collectors.counting()));
        Map<Long, BigDecimal> hotelRevenue = allDetails.stream()
                .filter(d -> d.getBooking().getStatus() == Booking.BookingStatus.CONFIRMED
                        || d.getBooking().getStatus() == Booking.BookingStatus.COMPLETED
                        || d.getBooking().getStatus() == Booking.BookingStatus.CHECKED_IN)
                .collect(Collectors.groupingBy(
                        d -> d.getHotel().getId(),
                        Collectors.reducing(BigDecimal.ZERO, d -> d.getBooking().getTotalAmount(), BigDecimal::add)));

        return hotels.stream().map(h -> PartnerHotelResponse.builder()
                .id(h.getId())
                .name(h.getName())
                .city(h.getCity() != null ? h.getCity().getNameVi() : null)
                .starRating(h.getStarRating())
                .avgRating(h.getAvgRating())
                .reviewCount(h.getReviewCount())
                .isActive(h.getIsActive())
                .adminStatus(h.getAdminStatus() != null ? h.getAdminStatus().name() : null)
                .totalBookings(hotelBookingCount.getOrDefault(h.getId(), 0L).intValue())
                .totalRevenue(hotelRevenue.getOrDefault(h.getId(), BigDecimal.ZERO))
                .build())
                .collect(Collectors.toList());
    }

    public List<PartnerTourResponse> getPartnerTours(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        List<Tour> tours = tourRepository.findByOperator(user);

        List<Long> tourIds = tours.stream().map(Tour::getId).collect(Collectors.toList());
        List<BookingTourDetail> allDetails = tourIds.isEmpty()
                ? List.of()
                : bookingTourDetailRepository.findByTourIdIn(tourIds);

        Map<Long, Long> tourBookingCount = allDetails.stream()
                .collect(Collectors.groupingBy(d -> d.getTour().getId(), Collectors.counting()));
        Map<Long, BigDecimal> tourRevenue = allDetails.stream()
                .filter(d -> d.getBooking().getStatus() == Booking.BookingStatus.CONFIRMED
                        || d.getBooking().getStatus() == Booking.BookingStatus.COMPLETED
                        || d.getBooking().getStatus() == Booking.BookingStatus.CHECKED_IN)
                .collect(Collectors.groupingBy(
                        d -> d.getTour().getId(),
                        Collectors.reducing(BigDecimal.ZERO, d -> d.getBooking().getTotalAmount(), BigDecimal::add)));

        return tours.stream().map(t -> PartnerTourResponse.builder()
                .id(t.getId())
                .title(t.getTitle())
                .city(t.getCity() != null ? t.getCity().getNameVi() : null)
                .durationDays(t.getDurationDays())
                .pricePerAdult(t.getPricePerAdult())
                .avgRating(t.getAvgRating())
                .reviewCount(t.getReviewCount())
                .isActive(t.getIsActive())
                .totalBookings(tourBookingCount.getOrDefault(t.getId(), 0L).intValue())
                .totalRevenue(tourRevenue.getOrDefault(t.getId(), BigDecimal.ZERO))
                .build())
                .collect(Collectors.toList());
    }

    public Page<PartnerBookingResponse> getPartnerHotelBookings(Long userId, String status, int page, int size) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        Hotel dummyHotel = hotelRepository.findByOwner(user).stream().findFirst().orElse(null);
        if (dummyHotel == null) {
            return Page.empty(PageRequest.of(page, size));
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<Booking> bookingPage;

        if (status != null && !status.isBlank()) {
            Booking.BookingStatus bookingStatus = Booking.BookingStatus.valueOf(status.toUpperCase());
            bookingPage = bookingRepository.findByHotelOwnerIdAndStatus(userId, bookingStatus, pageable);
        } else {
            bookingPage = bookingRepository.findByHotelOwnerId(userId, pageable);
        }

        return bookingPage.map(this::toBookingResponse);
    }

    public Page<PartnerBookingResponse> getPartnerTourBookings(Long userId, String status, int page, int size) {
        userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        Tour dummyTour = tourRepository.findByOperator(userRepository.findById(userId).orElse(null)).stream().findFirst().orElse(null);
        if (dummyTour == null) {
            return Page.empty(PageRequest.of(page, size));
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<Booking> bookingPage;

        if (status != null && !status.isBlank()) {
            Booking.BookingStatus bookingStatus = Booking.BookingStatus.valueOf(status.toUpperCase());
            bookingPage = bookingRepository.findByTourOperatorIdAndStatus(userId, bookingStatus, pageable);
        } else {
            bookingPage = bookingRepository.findByTourOperatorId(userId, pageable);
        }

        return bookingPage.map(this::toBookingResponse);
    }

    public Map<String, Object> getRevenueStats(Long userId, String period) {
        int days = switch (period != null ? period : "30d") {
            case "7d" -> 7;
            case "90d" -> 90;
            case "1y" -> 365;
            default -> 30;
        };

        LocalDateTime fromDate = LocalDateTime.now().minusDays(days).withHour(0).withMinute(0).withSecond(0).withNano(0);

        // Aggregate daily revenue from hotel + tour bookings
        List<Object[]> hotelDaily = bookingRepository.sumDailyRevenueByHotelOwner(userId, fromDate);
        List<Object[]> tourDaily = bookingRepository.sumDailyRevenueByTourOperator(userId, fromDate);

        Map<String, DailyPoint> combined = new LinkedHashMap<>();

        for (Object[] row : hotelDaily) {
            String dateKey = dateKey(row[0]);
            combined.computeIfAbsent(dateKey, k -> new DailyPoint()).add(
                    row[0], ((Number) row[1]).doubleValue(), ((Number) row[2]).longValue());
        }
        for (Object[] row : tourDaily) {
            String dateKey = dateKey(row[0]);
            combined.computeIfAbsent(dateKey, k -> new DailyPoint()).add(
                    row[0], ((Number) row[1]).doubleValue(), ((Number) row[2]).longValue());
        }

        List<Map<String, Object>> dailyData = new ArrayList<>();
        BigDecimal totalRevenue = BigDecimal.ZERO;
        long totalBookings = 0;
        double totalPrevPeriod = 0;

        for (Map.Entry<String, DailyPoint> entry : combined.entrySet()) {
            DailyPoint p = entry.getValue();
            BigDecimal amount = BigDecimal.valueOf(p.amount);
            totalRevenue = totalRevenue.add(amount);
            totalBookings += p.count;

            dailyData.add(Map.of(
                    "date", entry.getKey(),
                    "revenue", amount,
                    "bookings", p.count
            ));
        }

        // Previous period comparison
        LocalDateTime prevFrom = fromDate.minusDays(days);
        List<Object[]> prevHotelDaily = bookingRepository.sumDailyRevenueByHotelOwner(userId, prevFrom);
        List<Object[]> prevTourDaily = bookingRepository.sumDailyRevenueByTourOperator(userId, prevFrom);
        for (Object[] row : prevHotelDaily) {
            totalPrevPeriod += ((Number) row[1]).doubleValue();
        }
        for (Object[] row : prevTourDaily) {
            totalPrevPeriod += ((Number) row[1]).doubleValue();
        }

        double revenueGrowth = totalPrevPeriod > 0
                ? (totalRevenue.doubleValue() - totalPrevPeriod) / totalPrevPeriod * 100
                : 0.0;

        return Map.of(
                "dailyData", dailyData,
                "totalRevenue", totalRevenue,
                "totalBookings", totalBookings,
                "avgDailyRevenue", totalRevenue.divide(BigDecimal.valueOf(Math.max(dailyData.size(), 1)), 2, java.math.RoundingMode.HALF_UP),
                "revenueGrowth", revenueGrowth,
                "period", period != null ? period : "30d"
        );
    }

    private String dateKey(Object dateObj) {
        if (dateObj == null) return "";
        if (dateObj instanceof java.sql.Timestamp ts) {
            return ts.toLocalDateTime().toLocalDate().toString();
        }
        if (dateObj instanceof java.sql.Date sd) {
            return sd.toLocalDate().toString();
        }
        if (dateObj instanceof LocalDateTime ldt) {
            return ldt.toLocalDate().toString();
        }
        if (dateObj instanceof LocalDate ld) {
            return ld.toString();
        }
        return dateObj.toString();
    }

    private static class DailyPoint {
        double amount = 0;
        long count = 0;

        void add(Object date, double amt, long cnt) {
            this.amount += amt;
            this.count += cnt;
        }
    }

    private PartnerBookingResponse toBookingResponse(Booking b) {
        String serviceName = null;
        String serviceType = null;
        String guestName = b.getGuestName();
        String guestEmail = b.getGuestEmail();
        LocalDateTime checkIn = null;
        LocalDateTime checkOut = null;

        if (b.getBookingType() == Booking.BookingType.HOTEL) {
            BookingHotelDetail hd = bookingHotelDetailRepository.findByBooking(b).orElse(null);
            if (hd != null) {
                serviceName = hd.getHotelName();
                serviceType = "HOTEL";
                checkIn = hd.getCheckInDate() != null ? hd.getCheckInDate().atStartOfDay() : null;
                checkOut = hd.getCheckOutDate() != null ? hd.getCheckOutDate().atStartOfDay() : null;
            }
        } else if (b.getBookingType() == Booking.BookingType.TOUR) {
            BookingTourDetail td = bookingTourDetailRepository.findByBooking(b).orElse(null);
            if (td != null) {
                serviceName = td.getTourTitle();
                serviceType = "TOUR";
                checkIn = td.getDepartureDate() != null ? td.getDepartureDate().atStartOfDay() : null;
            }
        }

        return PartnerBookingResponse.builder()
                .id(b.getId())
                .bookingCode(b.getBookingCode())
                .serviceType(serviceType)
                .serviceName(serviceName)
                .guestName(guestName)
                .guestEmail(guestEmail)
                .status(b.getStatus() != null ? b.getStatus().name() : null)
                .paymentStatus("PAID")
                .totalAmount(b.getTotalAmount())
                .currency(b.getCurrency())
                .checkIn(checkIn)
                .checkOut(checkOut)
                .createdAt(b.getCreatedAt())
                .confirmedAt(b.getConfirmedAt())
                .cancelledAt(b.getCancelledAt())
                .build();
    }
}
