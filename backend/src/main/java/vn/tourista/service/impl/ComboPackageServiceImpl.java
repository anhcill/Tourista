package vn.tourista.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.tourista.dto.request.CreateComboBookingRequest;
import vn.tourista.dto.response.ComboPackageResponse;
import vn.tourista.dto.response.CreateComboBookingResponse;
import vn.tourista.entity.*;
import vn.tourista.repository.*;
import vn.tourista.service.ComboPackageService;
import vn.tourista.service.VnpayService;
import vn.tourista.dto.request.CreateVnpayPaymentRequest;
import vn.tourista.dto.response.CreateVnpayPaymentResponse;
import org.springframework.beans.factory.annotation.Value;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ComboPackageServiceImpl implements ComboPackageService {

    private final ComboPackageRepository comboRepository;
    private final HotelRepository hotelRepository;
    private final TourRepository tourRepository;
    private final BookingRepository bookingRepository;
    private final BookingComboRepository bookingComboRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final VnpayService vnpayService;

    // ======================== READ METHODS ========================

    @Override
    public List<ComboPackageResponse> getActiveCombos() {
        LocalDate now = LocalDate.now();
        List<ComboPackage> combos = comboRepository
                .findByIsActiveTrueAndValidFromLessThanEqualAndValidUntilGreaterThanEqualOrderByCreatedAtDesc(now, now);
        return enrichWithNames(combos);
    }

    @Override
    public List<ComboPackageResponse> getCombosByType(String comboType) {
        ComboPackage.ComboType type;
        try {
            type = ComboPackage.ComboType.valueOf(comboType.toUpperCase());
        } catch (IllegalArgumentException e) {
            return List.of();
        }
        List<ComboPackage> combos = comboRepository
                .findByComboTypeAndIsActiveTrueOrderByCreatedAtDesc(type);
        return enrichWithNames(combos);
    }

    @Override
    public List<ComboPackageResponse> getFeaturedCombos() {
        List<ComboPackage> combos = comboRepository
                .findByIsActiveTrueOrderByIsFeaturedDescCreatedAtDesc()
                .stream()
                .filter(ComboPackage::getIsFeatured)
                .toList();
        return enrichWithNames(combos);
    }

    @Override
    public ComboPackageResponse getComboById(Long id) {
        ComboPackage combo = comboRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Khong tim thay combo: " + id));
        return enrichWithNames(List.of(combo)).stream().findFirst().orElseThrow();
    }

    // ======================== BOOKING ========================

    @Override
    @Transactional
    public CreateComboBookingResponse bookCombo(CreateComboBookingRequest request, String userEmail) {
        // 1. Load combo
        ComboPackage combo = comboRepository.findById(request.getComboId())
                .orElseThrow(() -> new RuntimeException("Khong tim thay combo: " + request.getComboId()));

        // 2. Validate combo is active
        if (!Boolean.TRUE.equals(combo.getIsActive())) {
            throw new RuntimeException("Combo nay hien dang khong kich hoat.");
        }

        // 3. Validate date range
        LocalDate now = LocalDate.now();
        if (now.isAfter(combo.getValidUntil())) {
            throw new RuntimeException("Combo nay da het han.");
        }
        if (request.getBookingDate() != null && request.getBookingDate().isBefore(now)) {
            throw new RuntimeException("Ngay dat phai tu hom nay tro di.");
        }

        // 4. Validate slot availability
        if (combo.getRemainingSlots() == null || combo.getRemainingSlots() < 1) {
            throw new RuntimeException("Combo nay da het slot.");
        }

        // 5. Load or create user
        User user = null;
        if (userEmail != null && !userEmail.isBlank()) {
            user = userRepository.findByEmail(userEmail).orElse(null);
        }

        // 6. Create Booking entity
        Booking booking = Booking.builder()
                .bookingCode(generateBookingCode())
                .user(user != null ? user : createGuestUser(request.getGuestName(), request.getGuestEmail()))
                .bookingType(Booking.BookingType.HOTEL) // reuse HOTEL type; COMBO type not added yet
                .status(Booking.BookingStatus.PENDING)
                .guestName(request.getGuestName())
                .guestEmail(request.getGuestEmail())
                .guestPhone(request.getGuestPhone() != null ? request.getGuestPhone() : "")
                .subtotal(combo.getComboPrice())
                .discountAmount(BigDecimal.ZERO)
                .taxAmount(BigDecimal.ZERO)
                .totalAmount(combo.getComboPrice())
                .currency("VND")
                .specialRequests(request.getNote())
                .build();

        booking = bookingRepository.save(booking);

        // 7. Create BookingCombo record
        BookingCombo bookingCombo = BookingCombo.builder()
                .booking(booking)
                .comboPackage(combo)
                .guestName(request.getGuestName())
                .guestEmail(request.getGuestEmail())
                .guestPhone(request.getGuestPhone())
                .bookingDate(request.getBookingDate() != null ? request.getBookingDate() : now)
                .guestCount(request.getGuestCount() != null ? request.getGuestCount() : 1)
                .nights(request.getNights() != null ? request.getNights() : 1)
                .totalAmount(combo.getComboPrice())
                .paymentStatus("PENDING")
                .paymentMethod(request.getPaymentMethod())
                .build();

        bookingComboRepository.save(bookingCombo);

        // 8. Decrement slot atomically
        int decremented = comboRepository.decrementSlots(request.getComboId(), 1);
        if (decremented == 0) {
            throw new RuntimeException("Het slot combo. Vui long thu lai sau.");
        }

        // 9. Generate payment URL if VNPAY
        String paymentUrl = null;
        if ("VNPAY".equalsIgnoreCase(request.getPaymentMethod())) {
            try {
                CreateVnpayPaymentRequest vnpayRequest = CreateVnpayPaymentRequest.builder()
                        .bookingId(booking.getId())
                        .bookingCode("COMBO_" + booking.getBookingCode())
                        .bankCode(request.getBankCode())
                        .returnUrl("https://tourista-nine.vercel.app/payments/vnpay/return")
                        .build();
                CreateVnpayPaymentResponse vnpayResponse = vnpayService.createPaymentUrl(
                        booking.getGuestEmail(),
                        null,
                        vnpayRequest
                );
                if (vnpayResponse != null && vnpayResponse.getPaymentUrl() != null) {
                    paymentUrl = vnpayResponse.getPaymentUrl();
                }
            } catch (Exception e) {
                log.warn("Failed to create VNPAY URL for combo booking {}: {}", booking.getId(), e.getMessage());
            }
        }

        // 10. Build response
        return CreateComboBookingResponse.builder()
                .bookingId(booking.getId())
                .comboId(combo.getId())
                .bookingCode(booking.getBookingCode())
                .guestName(booking.getGuestName())
                .guestEmail(booking.getGuestEmail())
                .bookingDate(bookingCombo.getBookingDate())
                .guestCount(bookingCombo.getGuestCount())
                .nights(bookingCombo.getNights())
                .totalAmount(booking.getTotalAmount())
                .paymentStatus("PENDING")
                .paymentMethod(request.getPaymentMethod())
                .paymentUrl(paymentUrl)
                .createdAt(booking.getCreatedAt())
                .message("Dat combo thanh cong. Vui long thanh toan de xac nhan.")
                .build();
    }

    // ======================== PRIVATE HELPERS ========================

    private List<ComboPackageResponse> enrichWithNames(List<ComboPackage> combos) {
        if (combos.isEmpty()) return List.of();

        var hotelIds = combos.stream()
                .flatMap(c -> java.util.stream.Stream.of(c.getHotelId(), c.getSecondHotelId()))
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();
        var tourIds = combos.stream()
                .flatMap(c -> java.util.stream.Stream.of(c.getTourId(), c.getSecondTourId()))
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();

        Map<Long, Hotel> hotels = hotelRepository.findAllById(hotelIds).stream()
                .collect(java.util.stream.Collectors.toMap(Hotel::getId, Function.identity()));
        Map<Long, Tour> tours = tourRepository.findAllById(tourIds).stream()
                .collect(java.util.stream.Collectors.toMap(Tour::getId, Function.identity()));

        // Bulk-fetch cover images
        Map<Long, String> hotelImages = new java.util.HashMap<>();
        for (Object[] row : hotelRepository.findCoverImagesByHotelIds(hotelIds)) {
            hotelImages.put(((Number) row[0]).longValue(), (String) row[1]);
        }
        Map<Long, String> tourImages = new java.util.HashMap<>();
        for (Object[] row : tourRepository.findCoverImagesByTourIds(tourIds)) {
            tourImages.put(((Number) row[0]).longValue(), (String) row[1]);
        }

        return combos.stream()
                .map(c -> toResponse(c, hotels, tours, hotelImages, tourImages))
                .toList();
    }

    private ComboPackageResponse toResponse(ComboPackage c, Map<Long, Hotel> hotels, Map<Long, Tour> tours,
                                            Map<Long, String> hotelImages, Map<Long, String> tourImages) {
        Hotel primaryHotel = c.getHotelId() != null ? hotels.get(c.getHotelId()) : null;
        Tour primaryTour = c.getTourId() != null ? tours.get(c.getTourId()) : null;
        Hotel secondHotel = c.getSecondHotelId() != null ? hotels.get(c.getSecondHotelId()) : null;
        Tour secondTour = c.getSecondTourId() != null ? tours.get(c.getSecondTourId()) : null;

        return ComboPackageResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .description(c.getDescription())
                .imageUrl(c.getImageUrl())
                .comboType(c.getComboType() != null ? c.getComboType().name() : null)
                .hotelId(c.getHotelId())
                .hotelName(primaryHotel != null ? primaryHotel.getName() : null)
                .hotelImageUrl(c.getHotelId() != null ? hotelImages.getOrDefault(c.getHotelId(), c.getImageUrl()) : null)
                .hotelStars(primaryHotel != null ? primaryHotel.getStarRating() : null)
                .tourId(c.getTourId())
                .tourName(primaryTour != null ? primaryTour.getTitle() : null)
                .tourImageUrl(c.getTourId() != null ? tourImages.getOrDefault(c.getTourId(), c.getImageUrl()) : null)
                .tourDays(primaryTour != null ? primaryTour.getDurationDays() : null)
                .secondHotelId(c.getSecondHotelId())
                .secondHotelName(secondHotel != null ? secondHotel.getName() : null)
                .secondTourId(c.getSecondTourId())
                .secondTourName(secondTour != null ? secondTour.getTitle() : null)
                .validFrom(c.getValidFrom())
                .validUntil(c.getValidUntil())
                .totalSlots(c.getTotalSlots())
                .remainingSlots(c.getRemainingSlots())
                .originalPrice(c.getOriginalPrice())
                .comboPrice(c.getComboPrice())
                .savingsAmount(c.getSavingsAmount())
                .savingsPercent(c.getSavingsPercent())
                .isFeatured(c.getIsFeatured())
                .isActive(c.getIsActive())
                .createdAt(c.getCreatedAt())
                .build();
    }

    private String generateBookingCode() {
        String code;
        do {
            code = "CMB" + System.currentTimeMillis() % 1_000_000;
        } while (bookingRepository.existsByBookingCode(code));
        return code;
    }

    private User createGuestUser(String name, String email) {
        return userRepository.findByEmail(email).orElseGet(() -> {
            Role guestRole = roleRepository.findByName("USER").orElse(null);
            User guest = User.builder()
                    .email(email)
                    .fullName(name)
                    .role(guestRole)
                    .status(User.UserStatus.ACTIVE)
                    .build();
            return userRepository.save(guest);
        });
    }
}
