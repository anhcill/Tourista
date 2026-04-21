package vn.tourista.service.impl;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.tourista.dto.request.CancelBookingRequest;
import vn.tourista.dto.request.CreateBookingRequest;
import vn.tourista.dto.request.CreateTourBookingRequest;
import vn.tourista.dto.request.UpdateBookingRequest;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.CreateBookingResponse;
import vn.tourista.dto.response.CreateTourBookingResponse;
import vn.tourista.dto.response.MyBookingResponse;
import vn.tourista.entity.Booking;
import vn.tourista.entity.BookingHotelDetail;
import vn.tourista.entity.BookingTourDetail;
import vn.tourista.entity.Hotel;
import vn.tourista.entity.RoomType;
import vn.tourista.entity.Tour;
import vn.tourista.entity.TourDeparture;
import vn.tourista.entity.User;
import vn.tourista.repository.BookingHotelDetailRepository;
import vn.tourista.repository.BookingRepository;
import vn.tourista.repository.BookingTourDetailRepository;
import vn.tourista.repository.HotelRepository;
import vn.tourista.repository.RoomTypeRepository;
import vn.tourista.repository.TourDepartureRepository;
import vn.tourista.repository.TourRepository;
import vn.tourista.repository.UserRepository;
import vn.tourista.service.BookingService;
import vn.tourista.service.EmailService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Random;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class BookingServiceImpl implements BookingService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private HotelRepository hotelRepository;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private BookingHotelDetailRepository bookingHotelDetailRepository;

    @Autowired
    private TourRepository tourRepository;

    @Autowired
    private TourDepartureRepository tourDepartureRepository;

    @Autowired
    private BookingTourDetailRepository bookingTourDetailRepository;

    @Autowired
    private EmailService emailService;

    @Override
    public CreateBookingResponse createBooking(String userEmail, CreateBookingRequest request) {
        validateBookingRequest(request);

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy người dùng"));

        Hotel hotel = hotelRepository.findByIdAndIsActiveTrue(request.getHotelId())
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy khách sạn"));

        RoomType roomType = roomTypeRepository.findByIdAndIsActiveTrue(request.getRoomTypeId())
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy loại phòng"));

        if (!Objects.equals(roomType.getHotel().getId(), hotel.getId())) {
            throw new IllegalArgumentException("Loại phòng không thuộc khách sạn đã chọn");
        }

        int maxAdultsAllowed = roomType.getMaxAdults() * request.getRooms();
        if (request.getAdults() > maxAdultsAllowed) {
            throw new IllegalArgumentException("Số người lớn vượt quá sức chứa của loại phòng");
        }

        int maxChildrenAllowed = roomType.getMaxChildren() * request.getRooms();
        if (request.getChildren() > maxChildrenAllowed) {
            throw new IllegalArgumentException("Số trẻ em vượt quá sức chứa của loại phòng");
        }

        int bookedRooms = roomTypeRepository.countBookedRoomsInDateRange(
                roomType.getId(),
                request.getCheckIn(),
                request.getCheckOut());

        int availableRooms = roomType.getTotalRooms() - bookedRooms;
        if (availableRooms < request.getRooms()) {
            throw new IllegalArgumentException("Không đủ phòng trống cho khoảng thời gian đã chọn");
        }

        int nights = (int) ChronoUnit.DAYS.between(request.getCheckIn(), request.getCheckOut());
        BigDecimal subtotal = roomType.getBasePricePerNight()
                .multiply(BigDecimal.valueOf(nights))
                .multiply(BigDecimal.valueOf(request.getRooms()));

        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal taxAmount = BigDecimal.ZERO;
        BigDecimal totalAmount = subtotal.subtract(discountAmount).add(taxAmount);

        String guestName = normalizeOrDefault(request.getGuestName(), user.getFullName());
        String guestEmail = normalizeOrDefault(request.getGuestEmail(), user.getEmail());
        String guestPhone = normalizeOrDefault(request.getGuestPhone(), user.getPhone());

        if (guestName == null || guestEmail == null || guestPhone == null) {
            throw new IllegalArgumentException("Thiếu thông tin khách đặt phòng (tên/email/số điện thoại)");
        }

        Booking booking = Booking.builder()
                .bookingCode(generateBookingCode())
                .user(user)
                .bookingType(Booking.BookingType.HOTEL)
                .status(Booking.BookingStatus.PENDING)
                .guestName(guestName)
                .guestEmail(guestEmail)
                .guestPhone(guestPhone)
                .subtotal(subtotal)
                .discountAmount(discountAmount)
                .taxAmount(taxAmount)
                .totalAmount(totalAmount)
                .currency("VND")
                .specialRequests(request.getSpecialRequests())
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        BookingHotelDetail detail = BookingHotelDetail.builder()
                .booking(savedBooking)
                .hotel(hotel)
                .roomType(roomType)
                .checkInDate(request.getCheckIn())
                .checkOutDate(request.getCheckOut())
                .nights(nights)
                .numRooms(request.getRooms())
                .adults(request.getAdults())
                .children(request.getChildren())
                .hotelName(hotel.getName())
                .roomTypeName(roomType.getName())
                .pricePerNight(roomType.getBasePricePerNight())
                .build();

        bookingHotelDetailRepository.save(detail);

        // Gửi email xác nhận booking (PENDING)
        emailService.sendBookingCreatedEmail(
                savedBooking.getGuestEmail(),
                savedBooking.getBookingCode(),
                "HOTEL",
                hotel.getName(),
                "Phòng: " + roomType.getName(),
                request.getCheckIn().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                request.getCheckOut().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                request.getAdults(),
                request.getChildren(),
                request.getRooms(),
                savedBooking.getTotalAmount(),
                savedBooking.getCurrency());

        return CreateBookingResponse.builder()
                .bookingId(savedBooking.getId())
                .bookingCode(savedBooking.getBookingCode())
                .status(savedBooking.getStatus().name())
                .totalAmount(savedBooking.getTotalAmount())
                .currency(savedBooking.getCurrency())
                .checkIn(detail.getCheckInDate())
                .checkOut(detail.getCheckOutDate())
                .nights(detail.getNights())
                .rooms(detail.getNumRooms())
                .hotelName(detail.getHotelName())
                .roomTypeName(detail.getRoomTypeName())
                .createdAt(savedBooking.getCreatedAt())
                .build();
    }

    @Override
    public CreateTourBookingResponse createTourBooking(String userEmail, CreateTourBookingRequest request) {
        validateTourBookingRequest(request);

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy người dùng"));

        Tour tour = tourRepository.findByIdAndIsActiveTrue(request.getTourId())
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy tour"));

        TourDeparture departure = tourDepartureRepository
                .findByIdAndTour_Id(request.getDepartureId(), request.getTourId())
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy lịch khởi hành"));

        if (departure.getDepartureDate() != null && departure.getDepartureDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Không thể đặt tour với ngày khởi hành trong quá khứ");
        }

        int totalGuests = request.getAdults() + request.getChildren();
        if (totalGuests < 1) {
            throw new IllegalArgumentException("Tổng số khách phải lớn hơn hoặc bằng 1");
        }

        int updated = tourDepartureRepository.decrementAvailableSlots(departure.getId(), totalGuests);
        if (updated == 0) {
            throw new IllegalArgumentException("Không đủ chỗ trống cho lịch khởi hành đã chọn");
        }

        BigDecimal adultPrice = departure.getPriceOverride() != null
                ? departure.getPriceOverride()
                : tour.getPricePerAdult();
        BigDecimal childPrice = tour.getPricePerChild() != null ? tour.getPricePerChild() : BigDecimal.ZERO;

        BigDecimal subtotal = adultPrice.multiply(BigDecimal.valueOf(request.getAdults()))
                .add(childPrice.multiply(BigDecimal.valueOf(request.getChildren())));

        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal taxAmount = BigDecimal.ZERO;
        BigDecimal totalAmount = subtotal.subtract(discountAmount).add(taxAmount);

        String guestName = normalizeOrDefault(request.getGuestName(), user.getFullName());
        String guestEmail = normalizeOrDefault(request.getGuestEmail(), user.getEmail());
        String guestPhone = normalizeOrDefault(request.getGuestPhone(), user.getPhone());

        if (guestName == null || guestEmail == null || guestPhone == null) {
            throw new IllegalArgumentException("Thiếu thông tin khách đặt tour (tên/email/số điện thoại)");
        }

        Booking booking = Booking.builder()
                .bookingCode(generateBookingCode())
                .user(user)
                .bookingType(Booking.BookingType.TOUR)
                .status(Booking.BookingStatus.PENDING)
                .guestName(guestName)
                .guestEmail(guestEmail)
                .guestPhone(guestPhone)
                .subtotal(subtotal)
                .discountAmount(discountAmount)
                .taxAmount(taxAmount)
                .totalAmount(totalAmount)
                .currency("VND")
                .specialRequests(request.getSpecialRequests())
                .build();

        Booking savedBooking = bookingRepository.save(booking);

        BookingTourDetail detail = BookingTourDetail.builder()
                .booking(savedBooking)
                .tour(tour)
                .departure(departure)
                .numAdults(request.getAdults())
                .numChildren(request.getChildren())
                .tourTitle(tour.getTitle())
                .departureDate(departure.getDepartureDate())
                .pricePerAdult(adultPrice)
                .pricePerChild(childPrice)
                .build();

        bookingTourDetailRepository.save(detail);

        // Gửi email xác nhận booking (PENDING)
        emailService.sendBookingCreatedEmail(
                savedBooking.getGuestEmail(),
                savedBooking.getBookingCode(),
                "TOUR",
                tour.getTitle(),
                "Khởi hành: " + departure.getDepartureDate().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                departure.getDepartureDate().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                null,
                request.getAdults(),
                request.getChildren(),
                request.getAdults() + request.getChildren(),
                savedBooking.getTotalAmount(),
                savedBooking.getCurrency());

        return CreateTourBookingResponse.builder()
                .bookingId(savedBooking.getId())
                .bookingCode(savedBooking.getBookingCode())
                .status(savedBooking.getStatus().name())
                .totalAmount(savedBooking.getTotalAmount())
                .currency(savedBooking.getCurrency())
                .tourId(tour.getId())
                .tourTitle(detail.getTourTitle())
                .departureId(departure.getId())
                .departureDate(detail.getDepartureDate())
                .adults(detail.getNumAdults())
                .children(detail.getNumChildren())
                .createdAt(savedBooking.getCreatedAt())
                .build();
    }

    @Override
    public ApiResponse<?> updateBooking(String userEmail, Long bookingId, UpdateBookingRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy booking"));

        // Verify ownership
        if (booking.getUser() == null || !booking.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new SecurityException("Bạn không có quyền sửa booking này");
        }

        // Only PENDING bookings can be modified
        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new IllegalArgumentException(
                    "Chỉ có thể sửa booking ở trạng thái PENDING. Trạng thái hiện tại: " + booking.getStatus().name());
        }

        // Only support hotel booking modification for now
        if (booking.getBookingType() != Booking.BookingType.HOTEL) {
            throw new IllegalArgumentException("Chỉ hỗ trợ sửa booking khách sạn");
        }

        BookingHotelDetail detail = bookingHotelDetailRepository.findByBooking(booking)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy chi tiết booking"));

        // Validate new dates
        if (request.getCheckIn() == null || request.getCheckOut() == null) {
            throw new IllegalArgumentException("Ngày nhận/trả phòng là bắt buộc");
        }
        if (!request.getCheckOut().isAfter(request.getCheckIn())) {
            throw new IllegalArgumentException("Ngày trả phòng phải sau ngày nhận phòng");
        }

        // Validate capacity
        RoomType roomType = detail.getRoomType();
        int maxAdultsAllowed = roomType.getMaxAdults() * request.getRooms();
        if (request.getAdults() > maxAdultsAllowed) {
            throw new IllegalArgumentException("Số người lớn vượt quá sức chứa của loại phòng");
        }
        int maxChildrenAllowed = roomType.getMaxChildren() * request.getRooms();
        if (request.getChildren() > maxChildrenAllowed) {
            throw new IllegalArgumentException("Số trẻ em vượt quá sức chứa của loại phòng");
        }

        // Check room availability (excluding current booking's rooms)
        int bookedRooms = roomTypeRepository.countBookedRoomsInDateRangeExcluding(
                roomType.getId(), request.getCheckIn(), request.getCheckOut(), bookingId);
        int availableRooms = roomType.getTotalRooms() - bookedRooms;
        if (availableRooms < request.getRooms()) {
            throw new IllegalArgumentException("Không đủ phòng trống cho khoảng thời gian đã chọn");
        }

        // Recalculate price
        int nights = (int) ChronoUnit.DAYS.between(request.getCheckIn(), request.getCheckOut());
        BigDecimal subtotal = roomType.getBasePricePerNight()
                .multiply(BigDecimal.valueOf(nights))
                .multiply(BigDecimal.valueOf(request.getRooms()));

        BigDecimal taxAmount = BigDecimal.ZERO;
        BigDecimal totalAmount = subtotal.subtract(booking.getDiscountAmount()).add(taxAmount);

        // Update booking subtotal/total
        booking.setSubtotal(subtotal);
        booking.setTaxAmount(taxAmount);
        booking.setTotalAmount(totalAmount);

        // Update detail
        detail.setCheckInDate(request.getCheckIn());
        detail.setCheckOutDate(request.getCheckOut());
        detail.setNights(nights);
        detail.setNumRooms(request.getRooms());
        detail.setAdults(request.getAdults());
        detail.setChildren(request.getChildren());

        bookingRepository.save(booking);
        bookingHotelDetailRepository.save(detail);

        return ApiResponse.ok("Cập nhật booking thành công", null);
    }

    @Override
    public List<MyBookingResponse> getMyBookings(String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy người dùng"));

        List<Booking> bookings = bookingRepository.findByUser_IdOrderByCreatedAtDesc(user.getId());
        if (bookings.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> bookingIds = bookings.stream().map(Booking::getId).toList();
        Map<Long, BookingHotelDetail> detailsByBookingId = bookingHotelDetailRepository.findByBooking_IdIn(bookingIds)
                .stream()
                .collect(Collectors.toMap(detail -> detail.getBooking().getId(), Function.identity()));
        Map<Long, BookingTourDetail> tourDetailsByBookingId = bookingTourDetailRepository.findByBooking_IdIn(bookingIds)
                .stream()
                .collect(Collectors.toMap(detail -> detail.getBooking().getId(), Function.identity()));

        return bookings.stream()
                .map(booking -> {
                    BookingHotelDetail detail = detailsByBookingId.get(booking.getId());
                    BookingTourDetail tourDetail = tourDetailsByBookingId.get(booking.getId());

                    Long ownerId = detail != null && detail.getHotel() != null && detail.getHotel().getOwner() != null
                            ? detail.getHotel().getOwner().getId()
                            : null;
                    Long operatorId = tourDetail != null && tourDetail.getTour() != null
                            && tourDetail.getTour().getOperator() != null
                                    ? tourDetail.getTour().getOperator().getId()
                                    : null;
                    Long partnerId = ownerId != null ? ownerId : operatorId;
                    String partnerName = detail != null && detail.getHotel() != null
                            && detail.getHotel().getOwner() != null
                                    ? detail.getHotel().getOwner().getFullName()
                                    : (tourDetail != null && tourDetail.getTour() != null
                                            && tourDetail.getTour().getOperator() != null
                                                    ? tourDetail.getTour().getOperator().getFullName()
                                                    : null);

                    return MyBookingResponse.builder()
                            .bookingId(booking.getId())
                            .bookingCode(booking.getBookingCode())
                            .bookingType(booking.getBookingType() != null ? booking.getBookingType().name() : null)
                            .status(booking.getStatus().name())
                            .totalAmount(booking.getTotalAmount())
                            .currency(booking.getCurrency())
                            .partnerId(partnerId)
                            .partnerName(partnerName)
                            .ownerId(ownerId)
                            .operatorId(operatorId)
                            .hotelId(detail != null && detail.getHotel() != null ? detail.getHotel().getId() : null)
                            .hotelName(detail != null ? detail.getHotelName() : null)
                            .roomTypeId(detail != null && detail.getRoomType() != null ? detail.getRoomType().getId()
                                    : null)
                            .roomTypeName(detail != null ? detail.getRoomTypeName() : null)
                            .checkIn(detail != null ? detail.getCheckInDate() : null)
                            .checkOut(detail != null ? detail.getCheckOutDate() : null)
                            .nights(detail != null ? detail.getNights() : null)
                            .rooms(detail != null ? detail.getNumRooms() : null)
                            .adults(detail != null ? detail.getAdults()
                                    : (tourDetail != null ? tourDetail.getNumAdults() : null))
                            .children(detail != null ? detail.getChildren()
                                    : (tourDetail != null ? tourDetail.getNumChildren() : null))
                            .tourId(tourDetail != null && tourDetail.getTour() != null ? tourDetail.getTour().getId()
                                    : null)
                            .tourTitle(tourDetail != null ? tourDetail.getTourTitle() : null)
                            .departureId(tourDetail != null && tourDetail.getDeparture() != null
                                    ? tourDetail.getDeparture().getId()
                                    : null)
                            .departureDate(tourDetail != null ? tourDetail.getDepartureDate() : null)
                            .createdAt(booking.getCreatedAt())
                            .build();
                })
                .toList();
    }

    @Override
    public ApiResponse<?> cancelBooking(String userEmail, Long bookingId, CancelBookingRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy booking"));

        // Verify ownership
        if (booking.getUser() == null || !booking.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new SecurityException("Bạn không có quyền hủy booking này");
        }

        // Only PENDING or CONFIRMED bookings can be cancelled
        if (booking.getStatus() != Booking.BookingStatus.PENDING
                && booking.getStatus() != Booking.BookingStatus.CONFIRMED) {
            throw new IllegalArgumentException(
                    "Không thể hủy booking ở trạng thái: " + booking.getStatus().name());
        }

        String cancelReason = (request != null && request.getReason() != null && !request.getReason().isBlank())
                ? request.getReason().trim()
                : "Nguoi dung huy booking.";

        booking.setStatus(Booking.BookingStatus.CANCELLED);
        booking.setCancelReason(cancelReason);
        booking.setCancelledAt(LocalDateTime.now());

        // Nếu là tour booking, khôi phục số chỗ trống
        if (booking.getBookingType() == Booking.BookingType.TOUR) {
            BookingTourDetail tourDetail = bookingTourDetailRepository.findByBooking(booking).orElse(null);
            if (tourDetail != null && tourDetail.getDeparture() != null) {
                int guests = tourDetail.getNumAdults() + tourDetail.getNumChildren();
                tourDepartureRepository.incrementAvailableSlots(tourDetail.getDeparture().getId(), guests);
            }
        }

        bookingRepository.save(booking);

        // Gửi email thông báo hủy
        String serviceName = getServiceNameForBooking(booking);
        emailService.sendBookingCancelledEmail(
                booking.getGuestEmail(),
                booking.getBookingCode(),
                booking.getBookingType() != null ? booking.getBookingType().name() : "HOTEL",
                serviceName,
                cancelReason);

        return ApiResponse.ok("Hủy booking thành công", null);
    }

    private String getServiceNameForBooking(Booking booking) {
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

    private void validateBookingRequest(CreateBookingRequest request) {
        if (request.getCheckIn() == null || request.getCheckOut() == null) {
            throw new IllegalArgumentException("Ngày nhận/trả phòng là bắt buộc");
        }

        if (!request.getCheckOut().isAfter(request.getCheckIn())) {
            throw new IllegalArgumentException("Ngày trả phòng phải sau ngày nhận phòng");
        }

        if (request.getRooms() == null || request.getRooms() < 1) {
            throw new IllegalArgumentException("Số phòng phải lớn hơn hoặc bằng 1");
        }
    }

    private void validateTourBookingRequest(CreateTourBookingRequest request) {
        if (request.getAdults() == null || request.getAdults() < 1) {
            throw new IllegalArgumentException("Số người lớn phải lớn hơn hoặc bằng 1");
        }

        if (request.getChildren() == null || request.getChildren() < 0) {
            throw new IllegalArgumentException("Số trẻ em không được âm");
        }
    }

    private String normalizeOrDefault(String value, String fallback) {
        if (value != null && !value.isBlank()) {
            return value.trim();
        }

        if (fallback != null && !fallback.isBlank()) {
            return fallback.trim();
        }

        return null;
    }

    private String generateBookingCode() {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        Random random = new Random();

        for (int i = 0; i < 20; i++) {
            int randomPart = 10000 + random.nextInt(90000);
            String code = "TRS-" + datePart + "-" + randomPart;
            if (!bookingRepository.existsByBookingCode(code)) {
                return code;
            }
        }

        return "TRS-" + datePart + "-" + System.currentTimeMillis() % 100000;
    }
}
