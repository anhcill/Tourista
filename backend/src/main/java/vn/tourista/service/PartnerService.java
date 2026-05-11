package vn.tourista.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.tourista.dto.request.partner.PartnerHotelUpsertRequest;
import vn.tourista.dto.request.partner.PartnerTourUpsertRequest;
import vn.tourista.dto.response.partner.PartnerBookingResponse;
import vn.tourista.dto.response.partner.PartnerHotelResponse;
import vn.tourista.dto.response.partner.PartnerTourResponse;
import vn.tourista.entity.Booking;
import vn.tourista.entity.BookingHotelDetail;
import vn.tourista.entity.BookingTourDetail;
import vn.tourista.entity.City;
import vn.tourista.entity.Hotel;
import vn.tourista.entity.HotelImage;
import vn.tourista.entity.RoomType;
import vn.tourista.entity.Tour;
import vn.tourista.entity.TourCategory;
import vn.tourista.entity.TourDeparture;
import vn.tourista.entity.TourImage;
import vn.tourista.entity.TourItinerary;
import vn.tourista.entity.User;
import vn.tourista.repository.BookingHotelDetailRepository;
import vn.tourista.repository.BookingRepository;
import vn.tourista.repository.BookingTourDetailRepository;
import vn.tourista.repository.CityRepository;
import vn.tourista.repository.HotelImageRepository;
import vn.tourista.repository.HotelRepository;
import vn.tourista.repository.RoomTypeRepository;
import vn.tourista.repository.TourCategoryRepository;
import vn.tourista.repository.TourDepartureRepository;
import vn.tourista.repository.TourImageRepository;
import vn.tourista.repository.TourItineraryRepository;
import vn.tourista.repository.TourRepository;
import vn.tourista.repository.UserRepository;
import vn.tourista.util.SlugUtil;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.function.Function;
import java.util.stream.Collectors;

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
    private final CityRepository cityRepository;
    private final TourCategoryRepository tourCategoryRepository;
    private final HotelImageRepository hotelImageRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final TourImageRepository tourImageRepository;
    private final TourItineraryRepository tourItineraryRepository;
    private final TourDepartureRepository tourDepartureRepository;

    public List<PartnerHotelResponse> getPartnerHotels(Long userId) {
        return getPartnerHotels(userId, 0, 20).getContent();
    }

    public Page<PartnerHotelResponse> getPartnerHotels(Long userId, int page, int size) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        Pageable pageable = PageRequest.of(page, Math.min(size, 50));
        Page<Hotel> hotelPage = hotelRepository.findByOwner(user, pageable);

        List<Long> hotelIds = hotelPage.getContent().stream().map(Hotel::getId).collect(Collectors.toList());
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

        List<PartnerHotelResponse> content = hotelPage.getContent().stream().map(h -> PartnerHotelResponse.builder()
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

        return new org.springframework.data.domain.PageImpl<>(content, pageable, hotelPage.getTotalElements());
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

    // ===================== HOTEL CRUD (Partner) =====================

    @Transactional
    public PartnerHotelResponse createHotel(PartnerHotelUpsertRequest request, Long userId) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        City city = cityRepository.findById(request.getCityId())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay city"));

        String slug = SlugUtil.toSlug(request.getName()) + "-" + System.currentTimeMillis();

        Hotel hotel = Hotel.builder()
                .city(city)
                .owner(owner)
                .name(request.getName().trim())
                .slug(slug)
                .description(request.getDescription())
                .address(request.getAddress().trim())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .starRating(request.getStarRating())
                .avgRating(BigDecimal.ZERO)
                .reviewCount(0)
                .checkInTime(request.getCheckInTime() != null ? request.getCheckInTime() : java.time.LocalTime.of(14, 0))
                .checkOutTime(request.getCheckOutTime() != null ? request.getCheckOutTime() : java.time.LocalTime.of(12, 0))
                .phone(request.getPhone())
                .email(request.getEmail())
                .website(request.getWebsite())
                .isFeatured(false)
                .isTrending(false)
                .isActive(false)
                .adminStatus(Hotel.AdminStatus.PENDING)
                .build();
        hotel.setCreatedAt(LocalDateTime.now());
        hotel.setUpdatedAt(LocalDateTime.now());

        Hotel saved = hotelRepository.save(hotel);

        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            saveHotelImages(saved, request.getImageUrls(), request.getCoverImage());
        }

        if (request.getRoomTypes() != null && !request.getRoomTypes().isEmpty()) {
            saveHotelRoomTypes(saved, request.getRoomTypes());
        }

        return toPartnerHotelResponse(saved);
    }

    @Transactional
    public PartnerHotelResponse updateHotel(Long hotelId, PartnerHotelUpsertRequest request, Long userId) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay hotel"));

        if (hotel.getOwner() == null || !hotel.getOwner().getId().equals(userId)) {
            throw new SecurityException("Ban khong co quyen chinh sua khach san nay");
        }

        City city = cityRepository.findById(request.getCityId())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay city"));
        hotel.setCity(city);

        hotel.setName(request.getName().trim());
        hotel.setDescription(request.getDescription());
        hotel.setAddress(request.getAddress().trim());
        hotel.setLatitude(request.getLatitude());
        hotel.setLongitude(request.getLongitude());
        hotel.setStarRating(request.getStarRating());
        if (request.getCheckInTime() != null) {
            hotel.setCheckInTime(request.getCheckInTime());
        }
        if (request.getCheckOutTime() != null) {
            hotel.setCheckOutTime(request.getCheckOutTime());
        }
        hotel.setPhone(request.getPhone());
        hotel.setEmail(request.getEmail());
        hotel.setWebsite(request.getWebsite());

        Hotel saved = hotelRepository.save(hotel);

        if (request.getImageUrls() != null) {
            hotelImageRepository.deleteByHotel_Id(hotelId);
            saveHotelImages(saved, request.getImageUrls(), request.getCoverImage());
        }

        List<HotelImage> images = hotelImageRepository.findByHotel_IdOrderBySortOrderAscIdAsc(hotelId);
        return toPartnerHotelResponseFull(saved, images);
    }

    public PartnerHotelResponse getPartnerHotelById(Long hotelId, Long userId) {
        Hotel hotel = hotelRepository.findById(hotelId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay hotel"));
        if (hotel.getOwner() == null || !hotel.getOwner().getId().equals(userId)) {
            throw new SecurityException("Ban khong co quyen xem khach san nay");
        }
        List<HotelImage> images = hotelImageRepository.findByHotel_IdOrderBySortOrderAscIdAsc(hotelId);
        return toPartnerHotelResponseFull(hotel, images);
    }

    // ===================== TOUR CRUD (Partner) =====================

    @Transactional
    public PartnerTourResponse createTour(PartnerTourUpsertRequest request, Long userId) {
        User operator = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        TourCategory category = tourCategoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay category"));
        City city = cityRepository.findById(request.getCityId())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay city"));

        String slug = SlugUtil.toSlug(request.getTitle()) + "-" + System.currentTimeMillis();
        Tour.Difficulty difficulty = parseEnum(Tour.Difficulty.class, request.getDifficulty(), "tours.difficulty");

        Tour tour = Tour.builder()
                .category(category)
                .city(city)
                .operator(operator)
                .title(request.getTitle().trim())
                .slug(slug)
                .description(request.getDescription())
                .highlights(request.getHighlights())
                .includes(request.getIncludes())
                .excludes(request.getExcludes())
                .durationDays(request.getDurationDays())
                .durationNights(request.getDurationNights() != null ? request.getDurationNights() : request.getDurationDays() - 1)
                .maxGroupSize(request.getMaxGroupSize())
                .minGroupSize(request.getMinGroupSize())
                .difficulty(difficulty)
                .pricePerAdult(request.getPricePerAdult())
                .pricePerChild(request.getPricePerChild() != null ? request.getPricePerChild() : BigDecimal.ZERO)
                .avgRating(BigDecimal.ZERO)
                .reviewCount(0)
                .isFeatured(false)
                .isActive(false)
                .build();
        tour.setCreatedAt(LocalDateTime.now());
        tour.setUpdatedAt(LocalDateTime.now());

        Tour saved = tourRepository.save(tour);

        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            saveTourImages(saved, request.getImageUrls(), request.getCoverImage());
        }
        if (request.getItineraryItems() != null && !request.getItineraryItems().isEmpty()) {
            saveTourItinerary(saved, request.getItineraryItems());
        }
        if (request.getDepartureDates() != null && !request.getDepartureDates().isEmpty()) {
            saveTourDepartures(saved, request.getDepartureDates());
        }

        List<TourImage> images = tourImageRepository.findByTour_IdOrderBySortOrderAscIdAsc(tourId);
        List<TourItinerary> itinerary = tourItineraryRepository.findByTour_IdOrderByDayNumberAscIdAsc(tourId);
        List<TourDeparture> departures = tourDepartureRepository.findByTour_IdOrderByDepartureDateAsc(tourId);

        return toPartnerTourResponseFull(saved, images, itinerary, departures);
    }

    @Transactional
    public PartnerTourResponse updateTour(Long tourId, PartnerTourUpsertRequest request, Long userId) {
        Tour tour = tourRepository.findById(tourId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay tour"));

        if (tour.getOperator() == null || !tour.getOperator().getId().equals(userId)) {
            throw new SecurityException("Ban khong co quyen chinh sua tour nay");
        }

        TourCategory category = tourCategoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay category"));
        City city = cityRepository.findById(request.getCityId())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay city"));
        tour.setCategory(category);
        tour.setCity(city);

        tour.setTitle(request.getTitle().trim());
        tour.setDescription(request.getDescription());
        tour.setHighlights(request.getHighlights());
        tour.setIncludes(request.getIncludes());
        tour.setExcludes(request.getExcludes());
        tour.setDurationDays(request.getDurationDays());
        tour.setDurationNights(request.getDurationNights() != null ? request.getDurationNights() : request.getDurationDays() - 1);
        tour.setMaxGroupSize(request.getMaxGroupSize());
        tour.setMinGroupSize(request.getMinGroupSize());
        tour.setDifficulty(parseEnum(Tour.Difficulty.class, request.getDifficulty(), "tours.difficulty"));
        tour.setPricePerAdult(request.getPricePerAdult());
        tour.setPricePerChild(request.getPricePerChild() != null ? request.getPricePerChild() : BigDecimal.ZERO);

        Tour saved = tourRepository.save(tour);

        if (request.getImageUrls() != null) {
            tourImageRepository.deleteByTour_Id(tourId);
            saveTourImages(saved, request.getImageUrls(), request.getCoverImage());
        }

        List<TourImage> images = tourImageRepository.findByTour_IdOrderBySortOrderAscIdAsc(tourId);
        List<TourItinerary> itinerary = tourItineraryRepository.findByTour_IdOrderByDayNumberAscIdAsc(tourId);
        List<TourDeparture> departures = tourDepartureRepository.findByTour_IdOrderByDepartureDateAsc(tourId);

        return toPartnerTourResponseFull(saved, images, itinerary, departures);
    }

    public PartnerTourResponse getPartnerTourById(Long tourId, Long userId) {
        Tour tour = tourRepository.findById(tourId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay tour"));
        if (tour.getOperator() == null || !tour.getOperator().getId().equals(userId)) {
            throw new SecurityException("Ban khong co quyen xem tour nay");
        }

        List<TourImage> images = tourImageRepository.findByTour_IdOrderBySortOrderAscIdAsc(tourId);
        List<TourItinerary> itinerary = tourItineraryRepository.findByTour_IdOrderByDayNumberAscIdAsc(tourId);
        List<TourDeparture> departures = tourDepartureRepository.findByTour_IdOrderByDepartureDateAsc(tourId);

        return toPartnerTourResponseFull(tour, images, itinerary, departures);
    }

    // ===================== PRIVATE HELPERS =====================

    private void saveHotelImages(Hotel hotel, List<String> urls, String coverUrl) {
        for (int i = 0; i < urls.size(); i++) {
            String url = urls.get(i);
            boolean isCover = coverUrl != null && coverUrl.equals(url);
            HotelImage image = HotelImage.builder()
                    .hotel(hotel)
                    .url(url)
                    .isCover(isCover)
                    .sortOrder(i)
                    .createdAt(LocalDateTime.now())
                    .build();
            hotelImageRepository.save(image);
        }
    }

    private void saveHotelRoomTypes(Hotel hotel, List<PartnerHotelUpsertRequest.RoomTypeRequest> roomTypeRequests) {
        for (PartnerHotelUpsertRequest.RoomTypeRequest rtReq : roomTypeRequests) {
            RoomType rt = RoomType.builder()
                    .hotel(hotel)
                    .name(rtReq.getName().trim())
                    .description(rtReq.getDescription())
                    .maxAdults(rtReq.getMaxAdults())
                    .maxChildren(rtReq.getMaxChildren())
                    .bedType(rtReq.getBedType())
                    .areaSqm(rtReq.getAreaSqm())
                    .basePricePerNight(rtReq.getBasePricePerNight())
                    .totalRooms(rtReq.getTotalRooms())
                    .isActive(rtReq.getIsActive() == null ? Boolean.TRUE : rtReq.getIsActive())
                    .build();
            rt.setCreatedAt(LocalDateTime.now());
            rt.setUpdatedAt(LocalDateTime.now());
            roomTypeRepository.save(rt);
        }
    }

    private void saveTourImages(Tour tour, List<String> urls, String coverUrl) {
        for (int i = 0; i < urls.size(); i++) {
            String url = urls.get(i);
            boolean isCover = coverUrl != null && coverUrl.equals(url);
            TourImage image = TourImage.builder()
                    .tour(tour)
                    .url(url)
                    .isCover(isCover)
                    .sortOrder(i)
                    .build();
            tourImageRepository.save(image);
        }
    }

    private void saveTourItinerary(Tour tour, List<PartnerTourUpsertRequest.ItineraryRequest> itineraryRequests) {
        for (PartnerTourUpsertRequest.ItineraryRequest itinReq : itineraryRequests) {
            TourItinerary itinerary = TourItinerary.builder()
                    .tour(tour)
                    .dayNumber(itinReq.getDayNumber())
                    .title(itinReq.getTitle().trim())
                    .description(itinReq.getDescription())
                    .build();
            tourItineraryRepository.save(itinerary);
        }
    }

    private void saveTourDepartures(Tour tour, List<PartnerTourUpsertRequest.DepartureRequest> departureRequests) {
        for (PartnerTourUpsertRequest.DepartureRequest depReq : departureRequests) {
            TourDeparture departure = TourDeparture.builder()
                    .tour(tour)
                    .departureDate(depReq.getDepartureDate())
                    .availableSlots(depReq.getAvailableSlots())
                    .priceOverride(depReq.getPriceOverride())
                    .build();
            tourDepartureRepository.save(departure);
        }
    }

    private <T extends Enum<T>> T parseEnum(Class<T> enumClass, String value, String fieldName) {
        try {
            return Enum.valueOf(enumClass, value.toUpperCase());
        } catch (Exception e) {
            throw new IllegalArgumentException("Gia tri khong hop le cho " + fieldName + ": " + value);
        }
    }

    private PartnerHotelResponse toPartnerHotelResponse(Hotel h) {
        return PartnerHotelResponse.builder()
                .id(h.getId())
                .name(h.getName())
                .city(h.getCity() != null ? h.getCity().getNameVi() : null)
                .starRating(h.getStarRating())
                .avgRating(h.getAvgRating())
                .reviewCount(h.getReviewCount())
                .isActive(h.getIsActive())
                .adminStatus(h.getAdminStatus() != null ? h.getAdminStatus().name() : null)
                .totalBookings(0)
                .totalRevenue(BigDecimal.ZERO)
                .build();
    }

    private PartnerHotelResponse toPartnerHotelResponseFull(Hotel h, List<HotelImage> images) {
        List<String> imageUrls = images.stream()
                .sorted((a, b) -> Integer.compare(
                        Integer.compare(a.getSortOrder(), b.getSortOrder()),
                        Long.compare(a.getId(), b.getId())))
                .map(HotelImage::getUrl)
                .toList();

        return PartnerHotelResponse.builder()
                .id(h.getId())
                .cityId(h.getCity() != null ? h.getCity().getId() : null)
                .name(h.getName())
                .city(h.getCity() != null ? h.getCity().getNameVi() : null)
                .address(h.getAddress())
                .starRating(h.getStarRating())
                .description(h.getDescription())
                .latitude(h.getLatitude())
                .longitude(h.getLongitude())
                .checkInTime(h.getCheckInTime())
                .checkOutTime(h.getCheckOutTime())
                .phone(h.getPhone())
                .email(h.getEmail())
                .website(h.getWebsite())
                .avgRating(h.getAvgRating())
                .reviewCount(h.getReviewCount())
                .isActive(h.getIsActive())
                .adminStatus(h.getAdminStatus() != null ? h.getAdminStatus().name() : null)
                .totalBookings(0)
                .totalRevenue(BigDecimal.ZERO)
                .imageUrls(imageUrls)
                .build();
    }

    private PartnerTourResponse toPartnerTourResponse(Tour t) {
        return PartnerTourResponse.builder()
                .id(t.getId())
                .title(t.getTitle())
                .city(t.getCity() != null ? t.getCity().getNameVi() : null)
                .durationDays(t.getDurationDays())
                .durationNights(t.getDurationNights())
                .pricePerAdult(t.getPricePerAdult())
                .avgRating(t.getAvgRating())
                .reviewCount(t.getReviewCount())
                .isActive(t.getIsActive())
                .adminStatus(t.getAdminStatus() != null ? t.getAdminStatus().name() : null)
                .totalBookings(0)
                .totalRevenue(BigDecimal.ZERO)
                .build();
    }

    private PartnerTourResponse toPartnerTourResponseFull(Tour t, List<TourImage> images,
            List<TourItinerary> itinerary, List<TourDeparture> departures) {
        List<String> imageUrls = images.stream()
                .sorted((a, b) -> Integer.compare(
                        Integer.compare(a.getSortOrder(), b.getSortOrder()),
                        Long.compare(a.getId(), b.getId())))
                .map(TourImage::getUrl)
                .toList();

        String coverImage = images.stream()
                .filter(TourImage::getIsCover)
                .findFirst()
                .map(TourImage::getUrl)
                .orElse(imageUrls.isEmpty() ? null : imageUrls.get(0));

        List<PartnerTourResponse.ItineraryItem> itineraryItems = itinerary.stream()
                .map(it -> PartnerTourResponse.ItineraryItem.builder()
                        .id(it.getId())
                        .dayNumber(it.getDayNumber())
                        .title(it.getTitle())
                        .description(it.getDescription())
                        .build())
                .toList();

        List<PartnerTourResponse.DepartureItem> departureItems = departures.stream()
                .map(d -> PartnerTourResponse.DepartureItem.builder()
                        .id(d.getId())
                        .departureDate(d.getDepartureDate())
                        .availableSlots(d.getAvailableSlots())
                        .priceOverride(d.getPriceOverride())
                        .build())
                .toList();

        return PartnerTourResponse.builder()
                .id(t.getId())
                .categoryId(t.getCategory() != null ? t.getCategory().getId() : null)
                .cityId(t.getCity() != null ? t.getCity().getId() : null)
                .title(t.getTitle())
                .city(t.getCity() != null ? t.getCity().getNameVi() : null)
                .description(t.getDescription())
                .highlights(t.getHighlights())
                .includes(t.getIncludes())
                .excludes(t.getExcludes())
                .durationDays(t.getDurationDays())
                .durationNights(t.getDurationNights())
                .maxGroupSize(t.getMaxGroupSize())
                .minGroupSize(t.getMinGroupSize())
                .difficulty(t.getDifficulty() != null ? t.getDifficulty().name() : null)
                .pricePerAdult(t.getPricePerAdult())
                .pricePerChild(t.getPricePerChild())
                .avgRating(t.getAvgRating())
                .reviewCount(t.getReviewCount())
                .isActive(t.getIsActive())
                .adminStatus(t.getAdminStatus() != null ? t.getAdminStatus().name() : null)
                .totalBookings(0)
                .totalRevenue(BigDecimal.ZERO)
                .imageUrls(imageUrls)
                .coverImage(coverImage)
                .itineraryItems(itineraryItems)
                .departureDates(departureItems)
                .build();
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
