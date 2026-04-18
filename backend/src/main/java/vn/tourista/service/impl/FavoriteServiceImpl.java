package vn.tourista.service.impl;

import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;
import vn.tourista.dto.request.FavoriteUpsertRequest;
import vn.tourista.dto.response.FavoriteItemResponse;
import vn.tourista.entity.City;
import vn.tourista.entity.Favorite;
import vn.tourista.entity.Hotel;
import vn.tourista.entity.Tour;
import vn.tourista.entity.User;
import vn.tourista.repository.FavoriteRepository;
import vn.tourista.repository.HotelRepository;
import vn.tourista.repository.RoomTypeRepository;
import vn.tourista.repository.TourImageRepository;
import vn.tourista.repository.TourRepository;
import vn.tourista.repository.UserRepository;
import vn.tourista.service.FavoriteService;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.NoSuchElementException;
import java.util.Objects;

@Service
@Transactional
public class FavoriteServiceImpl implements FavoriteService {

    private static final String DEFAULT_CURRENCY = "VND";

    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final HotelRepository hotelRepository;
    private final TourRepository tourRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final TourImageRepository tourImageRepository;

    public FavoriteServiceImpl(
            FavoriteRepository favoriteRepository,
            UserRepository userRepository,
            HotelRepository hotelRepository,
            TourRepository tourRepository,
            RoomTypeRepository roomTypeRepository,
            TourImageRepository tourImageRepository) {
        this.favoriteRepository = favoriteRepository;
        this.userRepository = userRepository;
        this.hotelRepository = hotelRepository;
        this.tourRepository = tourRepository;
        this.roomTypeRepository = roomTypeRepository;
        this.tourImageRepository = tourImageRepository;
    }

    @Override
    public List<FavoriteItemResponse> getMyFavorites(String email) {
        User user = findUserByEmail(email);
        return favoriteRepository.findByUser_IdOrderByCreatedAtDesc(user.getId()).stream()
                .map(this::mapFavorite)
                .filter(Objects::nonNull)
                .toList();
    }

    @Override
    public FavoriteItemResponse addFavorite(String email, FavoriteUpsertRequest request) {
        User user = findUserByEmail(email);

        Favorite.TargetType targetType = parseTargetType(request.getTargetType());
        Long targetId = request.getTargetId();

        ensureTargetExists(targetType, targetId);

        Favorite favorite = favoriteRepository
                .findByUser_IdAndTargetTypeAndTargetId(user.getId(), targetType, targetId)
                .orElseGet(() -> favoriteRepository.save(Favorite.builder()
                        .user(user)
                        .targetType(targetType)
                        .targetId(targetId)
                        .build()));

        FavoriteItemResponse response = mapFavorite(favorite);
        if (response == null) {
            throw new NoSuchElementException("Khong tim thay target de them vao favorite");
        }
        return response;
    }

    @Override
    public void removeFavorite(String email, String targetType, Long targetId) {
        User user = findUserByEmail(email);
        Favorite.TargetType parsedType = parseTargetType(targetType);
        favoriteRepository.deleteByUser_IdAndTargetTypeAndTargetId(user.getId(), parsedType, targetId);
    }

    private User findUserByEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Thong tin xac thuc khong hop le");
        }

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay user hien tai"));
    }

    private Favorite.TargetType parseTargetType(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("targetType khong hop le");
        }

        String normalized = value.trim().toUpperCase(Locale.ROOT);
        try {
            return Favorite.TargetType.valueOf(normalized);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("targetType chi ho tro HOTEL hoac TOUR");
        }
    }

    private void ensureTargetExists(Favorite.TargetType targetType, Long targetId) {
        if (targetId == null || targetId <= 0) {
            throw new IllegalArgumentException("targetId khong hop le");
        }

        boolean exists = switch (targetType) {
            case HOTEL -> hotelRepository.findByIdAndIsActiveTrue(targetId).isPresent();
            case TOUR -> tourRepository.findByIdAndIsActiveTrue(targetId).isPresent();
        };

        if (!exists) {
            throw new NoSuchElementException("Khong tim thay target de them favorite");
        }
    }

    private FavoriteItemResponse mapFavorite(Favorite favorite) {
        return switch (favorite.getTargetType()) {
            case HOTEL -> mapHotelFavorite(favorite);
            case TOUR -> mapTourFavorite(favorite);
        };
    }

    private FavoriteItemResponse mapHotelFavorite(Favorite favorite) {
        Hotel hotel = hotelRepository.findByIdAndIsActiveTrue(favorite.getTargetId()).orElse(null);
        if (hotel == null) {
            return null;
        }

        BigDecimal minPrice = roomTypeRepository.findMinBasePriceByHotelId(hotel.getId());

        Object[] coverImg = hotelRepository.findCoverImageByHotelId(hotel.getId());
        String coverUrl = (coverImg != null && coverImg.length > 1) ? (String) coverImg[1] : null;

        return FavoriteItemResponse.builder()
                .id(favorite.getId())
                .type(Favorite.TargetType.HOTEL.name())
                .targetId(hotel.getId())
                .title(hotel.getName())
                .location(buildCityLabel(hotel.getCity()))
                .imageUrl(coverUrl)
                .rating(hotel.getAvgRating())
                .reviewCount(hotel.getReviewCount())
                .priceFrom(minPrice)
                .currency(DEFAULT_CURRENCY)
                .detailPath("/hotels/" + hotel.getId())
                .createdAt(favorite.getCreatedAt())
                .build();
    }

    private FavoriteItemResponse mapTourFavorite(Favorite favorite) {
        Tour tour = tourRepository.findByIdAndIsActiveTrue(favorite.getTargetId()).orElse(null);
        if (tour == null) {
            return null;
        }

        return FavoriteItemResponse.builder()
                .id(favorite.getId())
                .type(Favorite.TargetType.TOUR.name())
                .targetId(tour.getId())
                .title(tour.getTitle())
                .location(buildCityLabel(tour.getCity()))
                .imageUrl(tourImageRepository.findCoverImageByTourId(tour.getId()).orElse(null))
                .rating(tour.getAvgRating())
                .reviewCount(tour.getReviewCount())
                .priceFrom(tour.getPricePerAdult())
                .currency(DEFAULT_CURRENCY)
                .detailPath("/tours/" + tour.getId())
                .createdAt(favorite.getCreatedAt())
                .build();
    }

    private String buildCityLabel(City city) {
        if (city == null) {
            return "-";
        }

        if (city.getNameVi() != null && !city.getNameVi().isBlank()) {
            return city.getNameVi();
        }

        if (city.getNameEn() != null && !city.getNameEn().isBlank()) {
            return city.getNameEn();
        }

        return "-";
    }
}
