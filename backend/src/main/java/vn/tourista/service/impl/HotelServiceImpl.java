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

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.math.BigDecimal;

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

                Map<Long, String> coverImageMap = hotelRepository.findCoverImagesByHotelIds(hotelIds).stream()
                                .filter(r -> r != null && r.length > 1 && r[0] != null && r[1] != null)
                                .collect(Collectors.toMap(r -> ((Number) r[0]).longValue(), r -> (String) r[1],
                                                (a, b) -> a));
                Map<Long, BigDecimal> minPriceMap = roomTypeRepository.findMinBasePricesByHotelIds(hotelIds).stream()
                                .filter(r -> r != null && r.length > 1 && r[0] != null && r[1] != null)
                                .collect(Collectors.toMap(r -> ((Number) r[0]).longValue(), r -> (BigDecimal) r[1],
                                                (a, b) -> a));
                Map<Long, Integer> roomCountMap = roomTypeRepository.countActiveRoomTypesByHotelIds(hotelIds).stream()
                                .filter(r -> r != null && r.length > 1 && r[0] != null && r[1] != null)
                                .collect(Collectors.toMap(r -> ((Number) r[0]).longValue(),
                                                r -> ((Number) r[1]).intValue(), (a, b) -> a));

                return hotelIds.stream()
                                .map(hotelsById::get)
                                .filter(Objects::nonNull)
                                .map(hotel -> {
                                        HotelSummaryResponse base = mapHotelSummaryWithPreFetchedData(hotel,
                                                        coverImageMap, minPriceMap, roomCountMap);
                                        Integer availableRoomTypes = roomTypeRepository
                                                        .countAvailableRoomTypesByHotelId(
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
                                })
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
                Hotel hotel = hotelRepository.findByIdAndIsActiveTrueWithOwner(hotelId)
                                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy khách sạn"));

                List<RoomType> roomTypes = roomTypeRepository
                                .findByHotel_IdAndIsActiveTrueOrderByBasePricePerNightAsc(hotelId);

                String coverImg = null;
                Object[] coverRow = hotelRepository.findCoverImageByHotelId(hotel.getId());
                if (coverRow != null && coverRow.length > 1) {
                    coverImg = (String) coverRow[1];
                }

                return HotelDetailResponse.builder()
                                .id(hotel.getId())
                                .name(hotel.getName())
                                .address(hotel.getAddress())
                                .city(buildCityLabel(hotel.getCity()))
                                .partnerId(hotel.getOwner() != null ? hotel.getOwner().getId() : null)
                                .ownerId(hotel.getOwner() != null ? hotel.getOwner().getId() : null)
                                .ownerName(hotel.getOwner() != null ? hotel.getOwner().getFullName() : null)
                                .starRating(hotel.getStarRating())
                                .avgRating(hotel.getAvgRating())
                                .reviewCount(hotel.getReviewCount())
                                .coverImage(coverImg)
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

                List<ReviewRepository.HotelReviewProjection> reviewItems = reviewRepository
                                .findPublishedHotelReviews(hotelId, safeLimit, offset);
                Map<Long, List<String>> mediaByReviewId = loadReviewMediaMap(reviewItems.stream()
                                .map(ReviewRepository.HotelReviewProjection::getId)
                                .filter(Objects::nonNull)
                                .toList());

                return reviewItems.stream()
                                .map(item -> HotelReviewResponse.builder()
                                                .id(item.getId())
                                                .userName(item.getUserName())
                                                .avatarUrl(item.getAvatarUrl())
                                                .overallRating(item.getOverallRating())
                                                .comment(item.getComment())
                                                .verified(Boolean.TRUE.equals(item.getVerified()))
                                                .createdAt(item.getCreatedAt())
                                                .helpfulCount(item.getHelpfulCount() != null ? item.getHelpfulCount().intValue() : 0)
                                                .mediaUrls(mediaByReviewId.getOrDefault(item.getId(),
                                                                Collections.emptyList()))
                                                .partnerReply(item.getPartnerReply())
                                                .partnerRepliedAt(item.getPartnerRepliedAt())
                                                .build())
                                .toList();
        }

        private Map<Long, List<String>> loadReviewMediaMap(List<Long> reviewIds) {
                if (reviewIds == null || reviewIds.isEmpty()) {
                        return Collections.emptyMap();
                }

                try {
                        Map<Long, List<String>> result = new LinkedHashMap<>();
                        List<ReviewRepository.ReviewMediaProjection> mediaItems = reviewRepository
                                        .findMediaByReviewIds(reviewIds);

                        for (ReviewRepository.ReviewMediaProjection item : mediaItems) {
                                if (item == null || item.getReviewId() == null || item.getUrl() == null
                                                || item.getUrl().isBlank()) {
                                        continue;
                                }
                                result.computeIfAbsent(item.getReviewId(), ignored -> new ArrayList<>())
                                                .add(item.getUrl().trim());
                        }

                        return result;
                } catch (RuntimeException ignored) {
                        // Keep review endpoint stable even if legacy DB does not have review_images
                        // table.
                        return Collections.emptyMap();
                }
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

                Map<Long, String> coverImageMap = hotelRepository.findCoverImagesByHotelIds(hotelIds).stream()
                                .filter(r -> r != null && r.length > 1 && r[0] != null && r[1] != null)
                                .collect(Collectors.toMap(r -> ((Number) r[0]).longValue(), r -> (String) r[1],
                                                (a, b) -> a));
                Map<Long, BigDecimal> minPriceMap = roomTypeRepository.findMinBasePricesByHotelIds(hotelIds).stream()
                                .filter(r -> r != null && r.length > 1 && r[0] != null && r[1] != null)
                                .collect(Collectors.toMap(r -> ((Number) r[0]).longValue(), r -> (BigDecimal) r[1],
                                                (a, b) -> a));
                Map<Long, Integer> roomCountMap = roomTypeRepository.countActiveRoomTypesByHotelIds(hotelIds).stream()
                                .filter(r -> r != null && r.length > 1 && r[0] != null && r[1] != null)
                                .collect(Collectors.toMap(r -> ((Number) r[0]).longValue(),
                                                r -> ((Number) r[1]).intValue(), (a, b) -> a));

                return hotelIds.stream()
                                .map(hotelsById::get)
                                .filter(Objects::nonNull)
                                .map(hotel -> mapHotelSummaryWithPreFetchedData(hotel, coverImageMap, minPriceMap,
                                                roomCountMap))
                                .toList();
        }

        private HotelSummaryResponse mapHotelSummaryWithPreFetchedData(
                        Hotel hotel,
                        Map<Long, String> coverImageMap,
                        Map<Long, BigDecimal> minPriceMap,
                        Map<Long, Integer> roomCountMap) {
                return HotelSummaryResponse.builder()
                                .id(hotel.getId())
                                .name(hotel.getName())
                                .address(hotel.getAddress())
                                .city(buildCityLabel(hotel.getCity()))
                                .starRating(hotel.getStarRating())
                                .avgRating(hotel.getAvgRating())
                                .reviewCount(hotel.getReviewCount())
                                .coverImage(coverImageMap.get(hotel.getId()))
                                .minPricePerNight(minPriceMap.get(hotel.getId()))
                                .availableRoomTypes(roomCountMap.getOrDefault(hotel.getId(), 0))
                                .availableRooms(null)
                                .build();
        }
}
