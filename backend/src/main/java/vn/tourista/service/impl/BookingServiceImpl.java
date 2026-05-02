package vn.tourista.service.impl;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.tourista.dto.request.CancelBookingRequest;
import vn.tourista.dto.request.CreateBookingRequest;
import vn.tourista.dto.request.CreateTourBookingRequest;
import vn.tourista.dto.request.UpdateBookingRequest;
import vn.tourista.dto.request.UpdateTourBookingRequest;
import vn.tourista.dto.response.ApiResponse;
import vn.tourista.dto.response.CreateBookingResponse;
import vn.tourista.dto.response.CreateTourBookingResponse;
import vn.tourista.dto.response.MyBookingResponse;
import vn.tourista.entity.Booking;
import vn.tourista.entity.BookingHotelDetail;
import vn.tourista.entity.BookingPromotion;
import vn.tourista.entity.BookingTourDetail;
import vn.tourista.entity.Hotel;
import vn.tourista.entity.Promotion;
import vn.tourista.entity.RoomType;
import vn.tourista.entity.Tour;
import vn.tourista.entity.TourDeparture;
import vn.tourista.entity.User;
import vn.tourista.repository.BookingHotelDetailRepository;
import vn.tourista.repository.BookingPromotionRepository;
import vn.tourista.repository.BookingRepository;
import vn.tourista.repository.BookingTourDetailRepository;
import vn.tourista.repository.HotelRepository;
import vn.tourista.repository.PromotionRepository;
import vn.tourista.repository.RoomTypeRepository;
import vn.tourista.repository.TourDepartureRepository;
import vn.tourista.repository.TourRepository;
import vn.tourista.repository.UserRepository;
import vn.tourista.service.BookingService;
import vn.tourista.service.BrevoEmailService;
import vn.tourista.service.IdempotencyService;
import vn.tourista.service.PricingService;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
    private BrevoEmailService emailService;

    @Autowired
    private PromotionRepository promotionRepository;

    @Autowired
    private BookingPromotionRepository bookingPromotionRepository;

    @Autowired
    private IdempotencyService idempotencyService;

    @Autowired
    private PricingService pricingService;

    @Override
    public CreateBookingResponse createBooking(String userEmail, CreateBookingRequest request) {
        validateBookingRequest(request);

        // Idempotency: nếu client gửi lại cùng key, trả booking đã tạo
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()) {
            CreateBookingResponse cached = idempotencyService.get(request.getIdempotencyKey());
            if (cached != null) {
                return cached;
            }
        }

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
        BigDecimal subtotal = BigDecimal.ZERO;

        // Calculate nightly dynamic prices for each night in the stay
        LocalDate nightDate = request.getCheckIn();
        for (int i = 0; i < nights; i++) {
            var nightlyCalc = pricingService.calculateHotelNightPrice(
                    roomType.getHotel().getId(), nightDate, request.getAdults());
            subtotal = subtotal.add(nightlyCalc.getFinalPrice() != null
                    ? nightlyCalc.getFinalPrice()
                    : roomType.getBasePricePerNight());
            nightDate = nightDate.plusDays(1);
        }

        // Multiply by number of rooms
        subtotal = subtotal.multiply(BigDecimal.valueOf(request.getRooms()));

        BigDecimal discountAmount = BigDecimal.ZERO;
        Promotion appliedPromo = null;

        if (request.getPromoCode() != null && !request.getPromoCode().isBlank()) {
            appliedPromo = validateAndApplyPromo(
                    request.getPromoCode().trim(),
                    subtotal,
                    Promotion.AppliesTo.HOTEL,
                    user.getId());
            discountAmount = calculateDiscount(appliedPromo, subtotal);
        }

        // Tính VAT 10% trên subtotal sau khi đã trừ discount
        BigDecimal discountedSubtotal = subtotal.subtract(discountAmount);
        BigDecimal taxAmount = discountedSubtotal
                .multiply(BigDecimal.valueOf(0.10))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = discountedSubtotal.add(taxAmount);
        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) totalAmount = BigDecimal.ZERO;

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

        // Lưu booking_promotions nếu có promo
        if (appliedPromo != null) {
            BookingPromotion bp = BookingPromotion.builder()
                    .booking(savedBooking)
                    .promotion(appliedPromo)
                    .discountAmount(discountAmount)
                    .build();
            bookingPromotionRepository.save(bp);

            // Tăng used_count
            appliedPromo.setUsedCount(appliedPromo.getUsedCount() + 1);
            promotionRepository.save(appliedPromo);
        }

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

        CreateBookingResponse result = CreateBookingResponse.builder()
                .bookingId(savedBooking.getId())
                .bookingCode(savedBooking.getBookingCode())
                .status(savedBooking.getStatus().name())
                .totalAmount(savedBooking.getTotalAmount())
                .subtotal(savedBooking.getSubtotal())
                .discountAmount(savedBooking.getDiscountAmount())
                .promoCode(appliedPromo != null ? appliedPromo.getCode() : null)
                .currency(savedBooking.getCurrency())
                .checkIn(detail.getCheckInDate())
                .checkOut(detail.getCheckOutDate())
                .nights(detail.getNights())
                .rooms(detail.getNumRooms())
                .hotelName(detail.getHotelName())
                .roomTypeName(detail.getRoomTypeName())
                .createdAt(savedBooking.getCreatedAt())
                .build();

        // Cache kết quả để idempotency
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()) {
            idempotencyService.put(request.getIdempotencyKey(), result);
        }

        return result;
    }

    @Override
    public CreateTourBookingResponse createTourBooking(String userEmail, CreateTourBookingRequest request) {
        validateTourBookingRequest(request);

        // Idempotency: nếu client gửi lại cùng key, trả booking đã tạo
        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()) {
            CreateTourBookingResponse cached = idempotencyService.get(request.getIdempotencyKey());
            if (cached != null) {
                return cached;
            }
        }

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

        // Lock row FOR UPDATE to prevent race conditions, then atomically decrement slots
        tourDepartureRepository.lockDepartureForUpdate(departure.getId());
        int updated = tourDepartureRepository.decrementAvailableSlots(departure.getId(), totalGuests);
        if (updated == 0) {
            throw new IllegalArgumentException("Không đủ chỗ trống cho lịch khởi hành đã chọn");
        }

        BigDecimal adultPrice = departure.getPriceOverride() != null
                ? departure.getPriceOverride()
                : tour.getPricePerAdult();
        BigDecimal childPrice = tour.getPricePerChild() != null ? tour.getPricePerChild() : BigDecimal.ZERO;

        // Apply dynamic pricing from PricingService (season, early bird, group size, etc.)
        var dynamicPricing = pricingService.calculateTourPrice(
                tour.getId(), totalGuests,
                (departure.getAvailableSlots() != null ? departure.getAvailableSlots() : 0) - totalGuests);
        BigDecimal effectivePricePerAdult = dynamicPricing.getFinalPrice() != null
                ? dynamicPricing.getFinalPrice()
                : adultPrice;

        BigDecimal subtotal = effectivePricePerAdult.multiply(BigDecimal.valueOf(request.getAdults()))
                .add(childPrice.multiply(BigDecimal.valueOf(request.getChildren())));

        BigDecimal discountAmount = BigDecimal.ZERO;
        Promotion appliedPromo = null;

        if (request.getPromoCode() != null && !request.getPromoCode().isBlank()) {
            appliedPromo = validateAndApplyPromo(
                    request.getPromoCode().trim(),
                    subtotal,
                    Promotion.AppliesTo.TOUR,
                    user.getId());
            discountAmount = calculateDiscount(appliedPromo, subtotal);
        }

        // Tính VAT 10% trên subtotal sau khi đã trừ discount
        BigDecimal discountedSubtotal = subtotal.subtract(discountAmount);
        BigDecimal taxAmount = discountedSubtotal
                .multiply(BigDecimal.valueOf(0.10))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = discountedSubtotal.add(taxAmount);
        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) totalAmount = BigDecimal.ZERO;

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

        // Lưu booking_promotions nếu có promo
        if (appliedPromo != null) {
            BookingPromotion bp = BookingPromotion.builder()
                    .booking(savedBooking)
                    .promotion(appliedPromo)
                    .discountAmount(discountAmount)
                    .build();
            bookingPromotionRepository.save(bp);

            appliedPromo.setUsedCount(appliedPromo.getUsedCount() + 1);
            promotionRepository.save(appliedPromo);
        }

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

        CreateTourBookingResponse result = CreateTourBookingResponse.builder()
                .bookingId(savedBooking.getId())
                .bookingCode(savedBooking.getBookingCode())
                .status(savedBooking.getStatus().name())
                .totalAmount(savedBooking.getTotalAmount())
                .subtotal(savedBooking.getSubtotal())
                .discountAmount(savedBooking.getDiscountAmount())
                .promoCode(appliedPromo != null ? appliedPromo.getCode() : null)
                .currency(savedBooking.getCurrency())
                .tourId(tour.getId())
                .tourTitle(detail.getTourTitle())
                .departureId(departure.getId())
                .departureDate(detail.getDepartureDate())
                .adults(detail.getNumAdults())
                .children(detail.getNumChildren())
                .createdAt(savedBooking.getCreatedAt())
                .build();

        if (request.getIdempotencyKey() != null && !request.getIdempotencyKey().isBlank()) {
            idempotencyService.put(request.getIdempotencyKey(), result);
        }

        return result;
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

        // Recalculate price using dynamic pricing
        int nights = (int) ChronoUnit.DAYS.between(request.getCheckIn(), request.getCheckOut());
        BigDecimal subtotal = BigDecimal.ZERO;

        LocalDate nightDate = request.getCheckIn();
        for (int i = 0; i < nights; i++) {
            var nightlyCalc = pricingService.calculateHotelNightPrice(
                    roomType.getHotel().getId(), nightDate, request.getAdults());
            subtotal = subtotal.add(nightlyCalc.getFinalPrice() != null
                    ? nightlyCalc.getFinalPrice()
                    : roomType.getBasePricePerNight());
            nightDate = nightDate.plusDays(1);
        }
        subtotal = subtotal.multiply(BigDecimal.valueOf(request.getRooms()));

        BigDecimal discountedSubtotal = subtotal.subtract(booking.getDiscountAmount() != null ? booking.getDiscountAmount() : BigDecimal.ZERO);
        BigDecimal taxAmount = discountedSubtotal
                .multiply(BigDecimal.valueOf(0.10))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = discountedSubtotal.add(taxAmount);

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

        // Gửi email thông báo cập nhật
        emailService.sendBookingUpdatedEmail(
                booking.getGuestEmail(),
                booking.getBookingCode(),
                "HOTEL",
                detail.getHotelName(),
                "Phòng: " + detail.getRoomTypeName(),
                request.getCheckIn().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                request.getCheckOut().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                request.getAdults(),
                request.getChildren(),
                request.getRooms(),
                totalAmount,
                booking.getCurrency());

        return ApiResponse.ok("Cập nhật booking thành công", null);
    }

    @Override
    public ApiResponse<?> updateTourBooking(String userEmail, Long bookingId, UpdateTourBookingRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy booking"));

        if (booking.getUser() == null || !booking.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new SecurityException("Bạn không có quyền sửa booking này");
        }

        if (booking.getBookingType() != Booking.BookingType.TOUR) {
            throw new IllegalArgumentException("Sử dụng endpoint /{id} (PUT) để sửa booking khách sạn");
        }

        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new IllegalArgumentException(
                    "Chỉ có thể sửa booking ở trạng thái PENDING. Trạng thái hiện tại: " + booking.getStatus().name());
        }

        BookingTourDetail tourDetail = bookingTourDetailRepository.findByBooking(booking)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy chi tiết booking"));

        int totalGuests = request.getAdults() + request.getChildren();
        if (totalGuests < 1) {
            throw new IllegalArgumentException("Tổng số khách phải lớn hơn hoặc bằng 1");
        }

        TourDeparture departure = tourDetail.getDeparture();
        int currentGuests = tourDetail.getNumAdults() + tourDetail.getNumChildren();
        int guestDelta = totalGuests - currentGuests;

        if (guestDelta > 0) {
            tourDepartureRepository.lockDepartureForUpdate(departure.getId());
            int updated = tourDepartureRepository.decrementAvailableSlots(departure.getId(), guestDelta);
            if (updated == 0) {
                throw new IllegalArgumentException("Không đủ chỗ trống cho lịch khởi hành đã chọn");
            }
        } else if (guestDelta < 0) {
            tourDepartureRepository.incrementAvailableSlots(departure.getId(), Math.abs(guestDelta));
        }

        BigDecimal adultPrice = departure.getPriceOverride() != null
                ? departure.getPriceOverride()
                : (tourDetail.getTour() != null ? tourDetail.getTour().getPricePerAdult() : tourDetail.getPricePerAdult());
        BigDecimal childPrice = tourDetail.getTour() != null && tourDetail.getTour().getPricePerChild() != null
                ? tourDetail.getTour().getPricePerChild()
                : tourDetail.getPricePerChild();

        // Apply dynamic pricing from PricingService
        Tour tour = tourDetail.getTour();
        var dynamicPricing = pricingService.calculateTourPrice(
                tour != null ? tour.getId() : null,
                totalGuests,
                (departure.getAvailableSlots() != null ? departure.getAvailableSlots() : 0) - totalGuests);
        BigDecimal effectivePricePerAdult = dynamicPricing.getFinalPrice() != null
                ? dynamicPricing.getFinalPrice()
                : adultPrice;

        BigDecimal subtotal = effectivePricePerAdult.multiply(BigDecimal.valueOf(request.getAdults()))
                .add(childPrice.multiply(BigDecimal.valueOf(request.getChildren())));

        BigDecimal discountAmount = booking.getDiscountAmount() != null ? booking.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal discountedSubtotal = subtotal.subtract(discountAmount);
        BigDecimal taxAmount = discountedSubtotal
                .multiply(BigDecimal.valueOf(0.10))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalAmount = discountedSubtotal.add(taxAmount);
        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) totalAmount = BigDecimal.ZERO;

        tourDetail.setNumAdults(request.getAdults());
        tourDetail.setNumChildren(request.getChildren());

        booking.setSubtotal(subtotal);
        booking.setTaxAmount(taxAmount);
        booking.setTotalAmount(totalAmount);

        bookingRepository.save(booking);
        bookingTourDetailRepository.save(tourDetail);

        emailService.sendBookingUpdatedEmail(
                booking.getGuestEmail(),
                booking.getBookingCode(),
                "TOUR",
                tourDetail.getTourTitle(),
                "",
                departure.getDepartureDate() != null
                        ? departure.getDepartureDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "N/A",
                "",
                request.getAdults() != null ? request.getAdults() : 0,
                request.getChildren() != null ? request.getChildren() : 0,
                (request.getAdults() != null ? request.getAdults() : 0) + (request.getChildren() != null ? request.getChildren() : 0),
                totalAmount,
                booking.getCurrency());

        return ApiResponse.ok("Cap nhat booking tour thanh cong", null);
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

        // Load promo info
        Map<Long, BookingPromotion> promoByBookingId = bookingPromotionRepository.findByBooking_IdIn(bookingIds).stream()
                .collect(Collectors.toMap(bp -> bp.getBooking().getId(), Function.identity()));

        return bookings.stream()
                .map(booking -> {
                    BookingHotelDetail detail = detailsByBookingId.get(booking.getId());
                    BookingTourDetail tourDetail = tourDetailsByBookingId.get(booking.getId());
                    BookingPromotion bp = promoByBookingId.get(booking.getId());

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
                            .subtotal(booking.getSubtotal())
                            .discountAmount(booking.getDiscountAmount())
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
                            .promoCode(bp != null && bp.getPromotion() != null ? bp.getPromotion().getCode() : null)
                            .promoName(bp != null && bp.getPromotion() != null ? bp.getPromotion().getName() : null)
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

        // Khôi phục số phòng/chỗ trống khi hủy
        if (booking.getBookingType() == Booking.BookingType.TOUR) {
            BookingTourDetail tourDetail = bookingTourDetailRepository.findByBooking(booking).orElse(null);
            if (tourDetail != null && tourDetail.getDeparture() != null) {
                int guests = tourDetail.getNumAdults() + tourDetail.getNumChildren();
                tourDepartureRepository.incrementAvailableSlots(tourDetail.getDeparture().getId(), guests);
            }
        } else if (booking.getBookingType() == Booking.BookingType.HOTEL) {
            BookingHotelDetail hotelDetail = bookingHotelDetailRepository.findByBooking(booking).orElse(null);
            if (hotelDetail != null && hotelDetail.getRoomType() != null) {
                roomTypeRepository.incrementRoomsAvailable(hotelDetail.getRoomType().getId(), hotelDetail.getNumRooms());
            }
        }

        // Rollback promo usage count nếu booking có sử dụng promo
        bookingPromotionRepository.findByBooking(booking).ifPresent(bp -> {
            if (bp.getPromotion() != null) {
                Promotion promo = bp.getPromotion();
                promo.setUsedCount(Math.max(0, promo.getUsedCount() - 1));
                promotionRepository.save(promo);
            }
            bookingPromotionRepository.delete(bp);
        });

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

    // ================================================================
    // HOÀN THÀNH BOOKING + GỬI EMAIL CẢM ƠN
    // ================================================================
    @Override
    public void completeBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy booking"));

        if (booking.getStatus() == Booking.BookingStatus.COMPLETED) {
            // Already completed, skip
            return;
        }

        booking.setStatus(Booking.BookingStatus.COMPLETED);
        bookingRepository.save(booking);

        String bookingType = booking.getBookingType() != null ? booking.getBookingType().name() : "HOTEL";
        String serviceName = getServiceNameForBooking(booking);
        String checkIn = "";
        String checkOut = "";
        int adults = 0;
        int children = 0;

        if ("HOTEL".equals(bookingType)) {
            BookingHotelDetail detail = bookingHotelDetailRepository.findByBooking(booking).orElse(null);
            if (detail != null) {
                checkIn = detail.getCheckInDate() != null ? detail.getCheckInDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "";
                checkOut = detail.getCheckOutDate() != null ? detail.getCheckOutDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "";
                adults = detail.getAdults() != null ? detail.getAdults() : 0;
                children = detail.getChildren() != null ? detail.getChildren() : 0;
            }
        } else {
            BookingTourDetail detail = bookingTourDetailRepository.findByBooking(booking).orElse(null);
            if (detail != null) {
                checkIn = detail.getDepartureDate() != null ? detail.getDepartureDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : "";
                adults = detail.getNumAdults() != null ? detail.getNumAdults() : 0;
                children = detail.getNumChildren() != null ? detail.getNumChildren() : 0;
            }
        }

        emailService.sendThankYouEmail(
                booking.getGuestEmail(),
                booking.getBookingCode(),
                bookingType,
                serviceName,
                checkIn,
                checkOut,
                adults,
                children,
                booking.getTotalAmount(),
                booking.getCurrency());
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

    private Promotion validateAndApplyPromo(String code, BigDecimal orderAmount,
            Promotion.AppliesTo appliesTo, Long userId) {
        Promotion promo = promotionRepository.findByCodeIgnoreCase(code)
                .orElseThrow(() -> new IllegalArgumentException("Mã khuyến mãi không tồn tại: " + code));

        // Validate active
        if (!Boolean.TRUE.equals(promo.getIsActive())) {
            throw new IllegalArgumentException("Mã khuyến mãi đã bị vô hiệu hóa");
        }

        // Validate applies_to
        if (promo.getAppliesTo() != Promotion.AppliesTo.ALL
                && promo.getAppliesTo() != appliesTo) {
            throw new IllegalArgumentException("Mã khuyến mãi không áp dụng cho dịch vụ này");
        }

        // Validate date range
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(promo.getValidFrom())) {
            throw new IllegalArgumentException("Mã khuyến mãi chưa có hiệu lực");
        }
        if (now.isAfter(promo.getValidUntil())) {
            throw new IllegalArgumentException("Mã khuyến mãi đã hết hạn");
        }

        // Validate usage limit
        if (promo.getUsageLimit() != null && promo.getUsedCount() >= promo.getUsageLimit()) {
            throw new IllegalArgumentException("Mã khuyến mãi đã hết lượt sử dụng");
        }

        // Validate min order amount
        if (promo.getMinOrderAmount() != null
                && orderAmount.compareTo(promo.getMinOrderAmount()) < 0) {
            throw new IllegalArgumentException(
                    "Giá trị đơn hàng tối thiểu: " + promo.getMinOrderAmount() + " VND");
        }

        return promo;
    }

    private BigDecimal calculateDiscount(Promotion promo, BigDecimal orderAmount) {
        BigDecimal discount;
        if (promo.getDiscountType() == Promotion.DiscountType.PERCENTAGE) {
            discount = orderAmount
                    .multiply(promo.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            discount = promo.getDiscountValue();
        }

        // Cap at max_discount_amount
        if (promo.getMaxDiscountAmount() != null
                && discount.compareTo(promo.getMaxDiscountAmount()) > 0) {
            discount = promo.getMaxDiscountAmount();
        }

        // Never discount more than order amount
        if (discount.compareTo(orderAmount) > 0) {
            discount = orderAmount;
        }

        return discount.setScale(2, RoundingMode.HALF_UP);
    }
}
