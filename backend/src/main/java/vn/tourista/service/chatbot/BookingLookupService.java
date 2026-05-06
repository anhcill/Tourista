package vn.tourista.service.chatbot;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.tourista.dto.response.BotBookingResponse;
import vn.tourista.entity.Booking;
import vn.tourista.entity.BookingHotelDetail;
import vn.tourista.entity.BookingTourDetail;
import vn.tourista.entity.Hotel;
import vn.tourista.entity.Tour;
import vn.tourista.entity.TourItinerary;
import vn.tourista.entity.User;
import vn.tourista.repository.*;

import java.util.List;
import java.util.Optional;

/**
 * Service xử lý luồng tra cứu Booking.
 * Tìm booking theo mã TRS-YYYYMMDD-XXXXXX và build response.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BookingLookupService {

    private final BookingRepository bookingRepository;
    private final BookingTourDetailRepository tourDetailRepository;
    private final BookingHotelDetailRepository hotelDetailRepository;
    private final TourItineraryRepository tourItineraryRepository;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    /**
     * Tìm booking theo mã và kiểm tra quyền sở hữu.
     *
     * @param bookingCode Mã booking (VD: TRS-20260325-934D6D)
     * @param clientEmail Email của user đang hỏi
     * @return BotBookingResponse nếu tìm thấy và user có quyền, null nếu không tìm thấy
     */
    public LookupResult lookupBooking(String bookingCode, String clientEmail) {
        // 1. Tìm booking theo mã
        Optional<Booking> bookingOpt = bookingRepository.findByBookingCodeIgnoreCase(bookingCode);
        if (bookingOpt.isEmpty()) {
            return LookupResult.notFound();
        }

        Booking booking = bookingOpt.get();

        // 2. Bảo mật — chỉ chủ booking mới được xem
        boolean ownedByRequester = bookingRepository
                .findByBookingCodeAndUser_Email(booking.getBookingCode(), clientEmail)
                .isPresent();

        if (!ownedByRequester) {
            return LookupResult.forbidden();
        }

        // 3. Build response theo loại booking
        try {
            BotBookingResponse response;
            if (booking.getBookingType() == Booking.BookingType.TOUR) {
                response = buildTourResponse(booking);
            } else {
                response = buildHotelResponse(booking);
            }
            return LookupResult.success(response);
        } catch (Exception e) {
            log.error("BookingLookupService: Lỗi khi build booking response cho mã {}", bookingCode, e);
            return LookupResult.error("Hệ thống gặp lỗi khi tải thông tin booking. Vui lòng thử lại sau.");
        }
    }

    private BotBookingResponse buildTourResponse(Booking booking) {
        BookingTourDetail detail = tourDetailRepository.findByBooking(booking)
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy chi tiết tour cho booking " + booking.getBookingCode()));

        Tour tour = detail.getTour();
        User operator = tour.getOperator();

        List<TourItinerary> itineraries = tourItineraryRepository
                .findByTour_IdOrderByDayNumberAscIdAsc(tour.getId());

        List<BotBookingResponse.ItineraryDay> itineraryDays = itineraries.stream()
                .map(it -> BotBookingResponse.ItineraryDay.builder()
                        .day(it.getDayNumber())
                        .title(it.getTitle())
                        .description(it.getDescription())
                        .build())
                .toList();

        BotBookingResponse.PartnerInfo partnerInfo = null;
        if (operator != null) {
            partnerInfo = BotBookingResponse.PartnerInfo.builder()
                    .id(operator.getId())
                    .name(operator.getFullName())
                    .avatar(operator.getAvatarUrl())
                    .phone(operator.getPhone())
                    .build();
        }

        return BotBookingResponse.builder()
                .bookingCode(booking.getBookingCode())
                .bookingType("TOUR")
                .status(booking.getStatus().name())
                .totalAmount(booking.getTotalAmount())
                .currency(booking.getCurrency())
                .specialRequests(booking.getSpecialRequests())
                .partner(partnerInfo)
                .tourTitle(detail.getTourTitle())
                .departureDate(detail.getDepartureDate())
                .durationDays(tour.getDurationDays())
                .durationNights(tour.getDurationNights())
                .numAdults(detail.getNumAdults())
                .numChildren(detail.getNumChildren())
                .pricePerAdult(detail.getPricePerAdult())
                .pricePerChild(detail.getPricePerChild())
                .includes(tour.getIncludes())
                .excludes(tour.getExcludes())
                .highlights(tour.getHighlights())
                .itinerary(itineraryDays)
                .build();
    }

    private BotBookingResponse buildHotelResponse(Booking booking) {
        BookingHotelDetail detail = hotelDetailRepository.findByBooking(booking)
                .orElseThrow(() -> new RuntimeException(
                        "Không tìm thấy chi tiết hotel cho booking " + booking.getBookingCode()));

        Hotel hotel = detail.getHotel();
        User owner = hotel.getOwner();

        BotBookingResponse.PartnerInfo partnerInfo = null;
        if (owner != null) {
            partnerInfo = BotBookingResponse.PartnerInfo.builder()
                    .id(owner.getId())
                    .name(owner.getFullName())
                    .avatar(owner.getAvatarUrl())
                    .phone(owner.getPhone())
                    .build();
        }

        return BotBookingResponse.builder()
                .bookingCode(booking.getBookingCode())
                .bookingType("HOTEL")
                .status(booking.getStatus().name())
                .totalAmount(booking.getTotalAmount())
                .currency(booking.getCurrency())
                .specialRequests(booking.getSpecialRequests())
                .partner(partnerInfo)
                .hotelName(detail.getHotelName())
                .hotelAddress(hotel.getAddress())
                .roomTypeName(detail.getRoomTypeName())
                .checkInDate(detail.getCheckInDate())
                .checkOutDate(detail.getCheckOutDate())
                .nights(detail.getNights())
                .numRooms(detail.getNumRooms())
                .adults(detail.getAdults())
                .children(detail.getChildren())
                .pricePerNight(detail.getPricePerNight())
                .checkInTime(hotel.getCheckInTime() != null ? hotel.getCheckInTime().toString() : null)
                .checkOutTime(hotel.getCheckOutTime() != null ? hotel.getCheckOutTime().toString() : null)
                .build();
    }

    /**
     * Serialize response thành JSON string để lưu vào metadata.
     */
    public String serializeToJson(BotBookingResponse response) throws Exception {
        return objectMapper.writeValueAsString(response);
    }

    // ── Result wrapper ────────────────────────────────────────────────────────

    public record LookupResult(
            Status status,
            BotBookingResponse response,
            String errorMessage
    ) {
        public enum Status {
            SUCCESS, NOT_FOUND, FORBIDDEN, ERROR
        }

        public static LookupResult success(BotBookingResponse response) {
            return new LookupResult(Status.SUCCESS, response, null);
        }

        public static LookupResult notFound() {
            return new LookupResult(Status.NOT_FOUND, null, null);
        }

        public static LookupResult forbidden() {
            return new LookupResult(Status.FORBIDDEN, null, null);
        }

        public static LookupResult error(String message) {
            return new LookupResult(Status.ERROR, null, message);
        }

        public boolean isSuccess() { return status == Status.SUCCESS; }
        public boolean isNotFound() { return status == Status.NOT_FOUND; }
        public boolean isForbidden() { return status == Status.FORBIDDEN; }
        public boolean isError() { return status == Status.ERROR; }
    }
}
