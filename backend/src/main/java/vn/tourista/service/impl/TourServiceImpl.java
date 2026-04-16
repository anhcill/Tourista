package vn.tourista.service.impl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import vn.tourista.dto.request.TourSearchRequest;
import vn.tourista.dto.response.TourDetailResponse;
import vn.tourista.dto.response.TourReviewResponse;
import vn.tourista.dto.response.TourSummaryResponse;
import vn.tourista.entity.City;
import vn.tourista.entity.Tour;
import vn.tourista.entity.TourDeparture;
import vn.tourista.entity.TourImage;
import vn.tourista.entity.TourItinerary;
import vn.tourista.repository.ReviewRepository;
import vn.tourista.repository.TourDepartureRepository;
import vn.tourista.repository.TourImageRepository;
import vn.tourista.repository.TourItineraryRepository;
import vn.tourista.repository.TourRepository;
import vn.tourista.service.TourService;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;

@Service
@Transactional
public class TourServiceImpl implements TourService {

    @Autowired
    private TourRepository tourRepository;

    @Autowired
    private TourImageRepository tourImageRepository;

    @Autowired
    private TourItineraryRepository tourItineraryRepository;

    @Autowired
    private TourDepartureRepository tourDepartureRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public List<TourSummaryResponse> getTours(Integer limit) {
        int safeLimit = (limit == null || limit < 1) ? 20 : Math.min(limit, 100);
        List<Long> tourIds = tourRepository.findActiveTourIds(PageRequest.of(0, safeLimit));
        return mapSummaries(tourIds, LocalDate.now(), "RECOMMENDED");
    }

    @Override
    public List<TourSummaryResponse> getFeaturedTours(Integer limit) {
        int safeLimit = (limit == null || limit < 1) ? 6 : Math.min(limit, 20);
        List<Long> tourIds = tourRepository.findFeaturedTourIds(PageRequest.of(0, safeLimit));
        return mapSummaries(tourIds, LocalDate.now(), "RECOMMENDED");
    }

    @Override
    public List<TourSummaryResponse> searchTours(TourSearchRequest request) {
        validateSearchRequest(request);

        String normalizedDifficulty = normalizeDifficulty(request.getDifficulty());

        List<Long> tourIds = tourRepository.searchTourIds(
                normalizeText(request.getCity()),
                request.getCategoryId(),
                normalizedDifficulty,
                request.getDurationMin(),
                request.getDurationMax(),
                request.getMinRating(),
                request.getMinPrice(),
                request.getMaxPrice(),
                request.getDepartureDate(),
                LocalDate.now(),
                PageRequest.of(0, 200));

        LocalDate fromDate = request.getDepartureDate() != null ? request.getDepartureDate() : LocalDate.now();
        return mapSummaries(tourIds, fromDate, request.getSort());
    }

    @Override
    public TourDetailResponse getTourDetail(Long tourId) {
        Tour tour = tourRepository.findByIdAndIsActiveTrue(tourId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay tour"));

        List<TourImage> images = tourImageRepository.findByTour_IdOrderBySortOrderAscIdAsc(tourId);
        List<TourItinerary> itinerary = tourItineraryRepository.findByTour_IdOrderByDayNumberAscIdAsc(tourId);
        List<TourDeparture> departures = tourDepartureRepository.findByTour_IdOrderByDepartureDateAsc(tourId);

        return TourDetailResponse.builder()
                .id(tour.getId())
                .title(tour.getTitle())
                .slug(tour.getSlug())
                .city(buildCityLabel(tour.getCity()))
                .partnerId(tour.getOperator() != null ? tour.getOperator().getId() : null)
                .operatorId(tour.getOperator() != null ? tour.getOperator().getId() : null)
                .operatorName(tour.getOperator() != null ? tour.getOperator().getFullName() : null)
                .categoryName(buildCategoryLabel(tour))
                .description(tour.getDescription())
                .highlights(parseListText(tour.getHighlights()))
                .includes(parseListText(tour.getIncludes()))
                .excludes(parseListText(tour.getExcludes()))
                .durationDays(tour.getDurationDays())
                .durationNights(tour.getDurationNights())
                .difficulty(tour.getDifficulty() != null ? tour.getDifficulty().name() : null)
                .maxGroupSize(tour.getMaxGroupSize())
                .minGroupSize(tour.getMinGroupSize())
                .avgRating(tour.getAvgRating())
                .reviewCount(tour.getReviewCount())
                .coverImage(tourImageRepository.findCoverImageByTourId(tour.getId()).orElse(null))
                .images(images.stream().map(TourImage::getUrl).toList())
                .pricePerAdult(tour.getPricePerAdult())
                .pricePerChild(tour.getPricePerChild())
                .itinerary(itinerary.stream()
                        .map(item -> TourDetailResponse.TourItineraryItem.builder()
                                .dayNumber(item.getDayNumber())
                                .title(item.getTitle())
                                .description(item.getDescription())
                                .build())
                        .toList())
                .departures(departures.stream()
                        .map(dep -> TourDetailResponse.TourDepartureItem.builder()
                                .departureId(dep.getId())
                                .departureDate(dep.getDepartureDate())
                                .availableSlots(dep.getAvailableSlots())
                                .priceOverride(dep.getPriceOverride())
                                .build())
                        .toList())
                .build();
    }

    @Override
    public List<TourReviewResponse> getTourReviews(Long tourId, Integer page, Integer limit) {
        tourRepository.findByIdAndIsActiveTrue(tourId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay tour"));

        int safePage = (page == null || page < 1) ? 1 : page;
        int safeLimit = (limit == null || limit < 1) ? 6 : Math.min(limit, 20);
        int offset = (safePage - 1) * safeLimit;

        List<ReviewRepository.TourReviewProjection> reviewItems = reviewRepository
                .findPublishedTourReviews(tourId, safeLimit, offset);
        Map<Long, List<String>> mediaByReviewId = loadReviewMediaMap(reviewItems.stream()
                .map(ReviewRepository.TourReviewProjection::getId)
                .filter(Objects::nonNull)
                .toList());

        return reviewItems.stream()
                .map(item -> TourReviewResponse.builder()
                        .id(item.getId())
                        .userName(item.getUserName())
                        .avatarUrl(item.getAvatarUrl())
                        .overallRating(item.getOverallRating())
                        .comment(item.getComment())
                        .verified(Boolean.TRUE.equals(item.getVerified()))
                        .createdAt(item.getCreatedAt())
                        .helpfulCount(0)
                        .mediaUrls(mediaByReviewId.getOrDefault(item.getId(), Collections.emptyList()))
                        .build())
                .toList();
    }

    private Map<Long, List<String>> loadReviewMediaMap(List<Long> reviewIds) {
        if (reviewIds == null || reviewIds.isEmpty()) {
            return Collections.emptyMap();
        }

        try {
            Map<Long, List<String>> result = new LinkedHashMap<>();
            List<ReviewRepository.ReviewMediaProjection> mediaItems = reviewRepository.findMediaByReviewIds(reviewIds);

            for (ReviewRepository.ReviewMediaProjection item : mediaItems) {
                if (item == null || item.getReviewId() == null || item.getUrl() == null || item.getUrl().isBlank()) {
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

    @Override
    public List<TourSummaryResponse> getSimilarTours(Long tourId, Integer limit) {
        Tour sourceTour = tourRepository.findByIdAndIsActiveTrue(tourId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay tour"));

        int safeLimit = (limit == null || limit < 1) ? 4 : Math.min(limit, 12);
        if (safeLimit == 0) {
            return Collections.emptyList();
        }

        Integer cityId = sourceTour.getCity() != null ? sourceTour.getCity().getId() : null;
        Long categoryId = sourceTour.getCategory() != null ? sourceTour.getCategory().getId() : null;

        Set<Long> similarIds = new LinkedHashSet<>();
        int fetchSize = Math.max(12, safeLimit * 3);

        appendSimilarCandidates(similarIds, tourId, cityId, categoryId, fetchSize);
        if (similarIds.size() < safeLimit) {
            appendSimilarCandidates(similarIds, tourId, cityId, null, fetchSize);
        }
        if (similarIds.size() < safeLimit) {
            appendSimilarCandidates(similarIds, tourId, null, categoryId, fetchSize);
        }
        if (similarIds.size() < safeLimit) {
            appendSimilarCandidates(similarIds, tourId, null, null, fetchSize);
        }

        List<Long> topIds = similarIds.stream().limit(safeLimit).toList();
        return mapSummaries(topIds, LocalDate.now(), "RECOMMENDED");
    }

    private void appendSimilarCandidates(
            Set<Long> target,
            Long excludeTourId,
            Integer cityId,
            Long categoryId,
            int fetchSize) {
        if (fetchSize < 1) {
            return;
        }

        List<Long> candidateIds = tourRepository.findSimilarTourIds(
                excludeTourId,
                cityId,
                categoryId,
                PageRequest.of(0, fetchSize));

        target.addAll(candidateIds);
    }

    private List<TourSummaryResponse> mapSummaries(List<Long> tourIds, LocalDate departureFrom, String sort) {
        if (tourIds == null || tourIds.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Long, Tour> toursById = tourRepository.findAllById(tourIds)
                .stream()
                .collect(Collectors.toMap(Tour::getId, Function.identity()));

        List<TourSummaryResponse> responses = tourIds.stream()
                .map(toursById::get)
                .filter(Objects::nonNull)
                .map(tour -> mapSummary(tour, departureFrom))
                .toList();

        return sortSummaries(responses, sort);
    }

    private TourSummaryResponse mapSummary(Tour tour, LocalDate departureFrom) {
        TourDeparture nearestDeparture = tourDepartureRepository
                .findFirstByTour_IdAndAvailableSlotsGreaterThanAndDepartureDateGreaterThanEqualOrderByDepartureDateAsc(
                        tour.getId(),
                        0,
                        departureFrom)
                .orElse(null);

        BigDecimal pricePerAdult = nearestDeparture != null && nearestDeparture.getPriceOverride() != null
                ? nearestDeparture.getPriceOverride()
                : tour.getPricePerAdult();

        return TourSummaryResponse.builder()
                .id(tour.getId())
                .title(tour.getTitle())
                .slug(tour.getSlug())
                .city(buildCityLabel(tour.getCity()))
                .categoryName(buildCategoryLabel(tour))
                .durationDays(tour.getDurationDays())
                .durationNights(tour.getDurationNights())
                .difficulty(tour.getDifficulty() != null ? tour.getDifficulty().name() : null)
                .avgRating(tour.getAvgRating())
                .reviewCount(tour.getReviewCount())
                .coverImage(tourImageRepository.findCoverImageByTourId(tour.getId()).orElse(null))
                .pricePerAdult(pricePerAdult)
                .pricePerChild(tour.getPricePerChild())
                .nearestDepartureDate(nearestDeparture != null ? nearestDeparture.getDepartureDate() : null)
                .availableSlots(nearestDeparture != null ? nearestDeparture.getAvailableSlots() : 0)
                .build();
    }

    private List<TourSummaryResponse> sortSummaries(List<TourSummaryResponse> data, String sort) {
        if (data.isEmpty()) {
            return data;
        }

        List<TourSummaryResponse> mutable = new ArrayList<>(data);
        String normalizedSort = sort == null ? "RECOMMENDED" : sort.trim().toUpperCase(Locale.ROOT);

        Comparator<TourSummaryResponse> comparator;
        switch (normalizedSort) {
            case "PRICE_ASC" -> comparator = Comparator.comparing(
                    TourSummaryResponse::getPricePerAdult,
                    Comparator.nullsLast(BigDecimal::compareTo));
            case "RATING_DESC" -> comparator = Comparator.comparing(
                    TourSummaryResponse::getAvgRating,
                    Comparator.nullsLast(BigDecimal::compareTo))
                    .reversed();
            case "DEPARTURE_ASC" -> comparator = Comparator.comparing(
                    TourSummaryResponse::getNearestDepartureDate,
                    Comparator.nullsLast(LocalDate::compareTo));
            default -> comparator = Comparator
                    .comparing(TourSummaryResponse::getAvgRating, Comparator.nullsLast(BigDecimal::compareTo))
                    .reversed()
                    .thenComparing(
                            Comparator.comparing(
                                    TourSummaryResponse::getReviewCount,
                                    Comparator.nullsLast(Integer::compareTo))
                                    .reversed());
        }

        mutable.sort(comparator);
        return mutable;
    }

    private void validateSearchRequest(TourSearchRequest request) {
        if (request.getDepartureDate() != null && request.getDepartureDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Ngay khoi hanh khong duoc nho hon ngay hien tai");
        }

        if (request.getMinPrice() != null && request.getMaxPrice() != null
                && request.getMinPrice().compareTo(request.getMaxPrice()) > 0) {
            throw new IllegalArgumentException("Khoang gia khong hop le");
        }

        if (request.getDurationMin() != null && request.getDurationMax() != null
                && request.getDurationMin() > request.getDurationMax()) {
            throw new IllegalArgumentException("Khoang so ngay khong hop le");
        }

        normalizeDifficulty(request.getDifficulty());
    }

    private String normalizeDifficulty(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }

        String normalized = raw.trim().toUpperCase(Locale.ROOT);
        try {
            Tour.Difficulty.valueOf(normalized);
            return normalized;
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Difficulty chi ho tro EASY, MEDIUM, HARD");
        }
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
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

    private String buildCategoryLabel(Tour tour) {
        if (tour.getCategory() == null) {
            return null;
        }

        String nameVi = tour.getCategory().getNameVi();
        if (nameVi != null && !nameVi.isBlank()) {
            return nameVi;
        }
        return tour.getCategory().getNameEn();
    }

    private List<String> parseListText(String raw) {
        if (raw == null || raw.isBlank()) {
            return Collections.emptyList();
        }

        String normalized = raw.trim();
        if (normalized.startsWith("[") && normalized.endsWith("]")) {
            try {
                return objectMapper.readValue(normalized, new TypeReference<List<String>>() {
                });
            } catch (IOException ignored) {
                // Fall through to plain-text split.
            }
        }

        String[] chunks = normalized.split("\\r?\\n|\\|");
        List<String> values = new ArrayList<>();
        for (String chunk : chunks) {
            String item = chunk.trim();
            if (!item.isEmpty()) {
                values.add(item);
            }
        }

        if (!values.isEmpty()) {
            return values;
        }

        return List.of(normalized);
    }
}
