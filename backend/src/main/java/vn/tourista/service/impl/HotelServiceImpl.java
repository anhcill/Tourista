package vn.tourista.service.impl;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import vn.tourista.dto.request.HotelSearchRequest;
import vn.tourista.dto.response.HotelDetailResponse;
import vn.tourista.dto.response.HotelReviewResponse;
import vn.tourista.dto.response.HotelSummaryResponse;
import vn.tourista.entity.City;
import vn.tourista.entity.Hotel;
import vn.tourista.entity.RoomType;
import vn.tourista.repository.HotelRepository;
import vn.tourista.repository.ReviewRepository;
import vn.tourista.repository.RoomTypeRepository;
import vn.tourista.service.HotelService;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Transactional
public class HotelServiceImpl implements HotelService {

    @Autowired
    private HotelRepository hotelRepository;

    @Autowired
    private RoomTypeRepository roomTypeRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Override
    public List<HotelSummaryResponse> getHotels(Integer limit) {
        int safeLimit = (limit == null || limit < 1) ? 200 : Math.min(limit, 500);
        List<Long> hotelIds = hotelRepository.findActiveHotelIds(PageRequest.of(0, safeLimit));
        return mapHotelSummariesWithoutAvailability(hotelIds);
    }

    @Override
    public List<HotelSummaryResponse> searchHotels(HotelSearchRequest request) {
        validateSearchRequest(request);

        List<Long> hotelIds = hotelRepository.searchAvailableHotelIds(
                request.getCity(),
                request.getCheckIn(),
                request.getCheckOut(),
                request.getAdults(),
                request.getRooms());

        if (hotelIds.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, Hotel> hotelsById = hotelRepository.findAllById(hotelIds)
                .stream()
                .collect(Collectors.toMap(Hotel::getId, Function.identity()));

        return hotelIds.stream()
                .map(hotelsById::get)
                .filter(Objects::nonNull)
                .map(hotel -> mapHotelSummaryWithAvailability(hotel, request))
                .toList();
    }

    @Override
    public List<HotelSummaryResponse> getFeaturedHotels(Integer limit) {
        int safeLimit = sanitizeLimit(limit);
        List<Long> hotelIds = hotelRepository.findFeaturedHotelIds(PageRequest.of(0, safeLimit));
        return mapHotelSummariesWithoutAvailability(hotelIds);
    }

    @Override
    public List<HotelSummaryResponse> getTrendingHotels(Integer limit) {
        int safeLimit = sanitizeLimit(limit);
        List<Long> hotelIds = hotelRepository.findTrendingHotelIds(PageRequest.of(0, safeLimit));
        return mapHotelSummariesWithoutAvailability(hotelIds);
    }

    @Override
    public HotelDetailResponse getHotelDetail(Long hotelId) {
        Hotel hotel = hotelRepository.findByIdAndIsActiveTrue(hotelId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy khách sạn"));

        List<RoomType> roomTypes = roomTypeRepository.findByHotel_IdAndIsActiveTrueOrderByBasePricePerNightAsc(hotelId);

        return HotelDetailResponse.builder()
                .id(hotel.getId())
                .name(hotel.getName())
                .address(hotel.getAddress())
                .city(buildCityLabel(hotel.getCity()))
                .starRating(hotel.getStarRating())
                .avgRating(hotel.getAvgRating())
                .reviewCount(hotel.getReviewCount())
                .coverImage(hotelRepository.findCoverImageByHotelId(hotel.getId()).orElse(null))
                .description(hotel.getDescription())
                .checkInTime(hotel.getCheckInTime())
                .checkOutTime(hotel.getCheckOutTime())
                .roomTypes(roomTypes.stream()
                        .map(roomType -> HotelDetailResponse.RoomTypeItem.builder()
                                .id(roomType.getId())
                                .name(roomType.getName())
                                .capacity(roomType.getMaxAdults())
                                .basePricePerNight(roomType.getBasePricePerNight())
                                .description(roomType.getDescription())
                                .totalRooms(roomType.getTotalRooms())
                                .amenities(Collections.emptyList())
                                .build())
                        .toList())
                .build();
    }

    @Override
    public List<HotelReviewResponse> getHotelReviews(Long hotelId, Integer page, Integer limit) {
        hotelRepository.findByIdAndIsActiveTrue(hotelId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy khách sạn"));

        int safePage = (page == null || page < 1) ? 1 : page;
        int safeLimit = (limit == null || limit < 1) ? 6 : Math.min(limit, 20);
        int offset = (safePage - 1) * safeLimit;

        return reviewRepository.findPublishedHotelReviews(hotelId, safeLimit, offset)
                .stream()
                .map(item -> HotelReviewResponse.builder()
                        .id(item.getId())
                        .userName(item.getUserName())
                        .avatarUrl(item.getAvatarUrl())
                        .overallRating(item.getOverallRating())
                        .comment(item.getComment())
                        .verified(Boolean.TRUE.equals(item.getVerified()))
                        .createdAt(item.getCreatedAt())
                        .helpfulCount(0)
                        .build())
                .toList();
    }

    private void validateSearchRequest(HotelSearchRequest request) {
        if (request.getCheckIn() == null || request.getCheckOut() == null) {
            throw new IllegalArgumentException("Ngày nhận phòng và trả phòng là bắt buộc");
        }
        if (!request.getCheckOut().isAfter(request.getCheckIn())) {
            throw new IllegalArgumentException("Ngày trả phòng phải sau ngày nhận phòng");
        }
    }

    private String buildCityLabel(City city) {
        if (city == null) {
            return null;
        }
        if (city.getNameVi() != null && !city.getNameVi().isBlank()) {
            return city.getNameVi();
        }
        return city.getNameEn();
    }

    private int sanitizeLimit(Integer limit) {
        if (limit == null || limit < 1) {
            return 6;
        }
        return Math.min(limit, 20);
    }

    private List<HotelSummaryResponse> mapHotelSummariesWithoutAvailability(List<Long> hotelIds) {
        if (hotelIds == null || hotelIds.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, Hotel> hotelsById = hotelRepository.findAllById(hotelIds)
                .stream()
                .collect(Collectors.toMap(Hotel::getId, Function.identity()));

        return hotelIds.stream()
                .map(hotelsById::get)
                .filter(Objects::nonNull)
                .map(this::mapHotelSummary)
                .toList();
    }

    private HotelSummaryResponse mapHotelSummaryWithAvailability(Hotel hotel, HotelSearchRequest request) {
        HotelSummaryResponse base = mapHotelSummary(hotel);
        Integer availableRoomTypes = roomTypeRepository.countAvailableRoomTypesByHotelId(
                hotel.getId(),
                request.getCheckIn(),
                request.getCheckOut(),
                request.getAdults(),
                request.getRooms());
        Integer availableRooms = roomTypeRepository.countAvailableRoomsByHotelId(
                hotel.getId(),
                request.getCheckIn(),
                request.getCheckOut(),
                request.getAdults());

        base.setAvailableRoomTypes(availableRoomTypes);
        base.setAvailableRooms(availableRooms);
        return base;
    }

    private HotelSummaryResponse mapHotelSummary(Hotel hotel) {
        return HotelSummaryResponse.builder()
                .id(hotel.getId())
                .name(hotel.getName())
                .address(hotel.getAddress())
                .city(buildCityLabel(hotel.getCity()))
                .starRating(hotel.getStarRating())
                .avgRating(hotel.getAvgRating())
                .reviewCount(hotel.getReviewCount())
                .coverImage(hotelRepository.findCoverImageByHotelId(hotel.getId()).orElse(null))
                .minPricePerNight(roomTypeRepository.findMinBasePriceByHotelId(hotel.getId()))
                .availableRoomTypes(roomTypeRepository.countActiveRoomTypesByHotelId(hotel.getId()))
                .availableRooms(null)
                .build();
    }
}
