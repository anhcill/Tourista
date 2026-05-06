package vn.tourista.service.impl;

import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import vn.tourista.dto.request.CreateReviewRequest;
import vn.tourista.dto.response.ReviewCreatedResponse;
import vn.tourista.entity.Booking;
import vn.tourista.entity.BookingHotelDetail;
import vn.tourista.entity.BookingTourDetail;
import vn.tourista.entity.Hotel;
import vn.tourista.entity.Review;
import vn.tourista.entity.ReviewImage;
import vn.tourista.entity.Tour;
import vn.tourista.entity.User;
import vn.tourista.repository.BookingHotelDetailRepository;
import vn.tourista.repository.BookingRepository;
import vn.tourista.repository.BookingTourDetailRepository;
import vn.tourista.repository.HotelRepository;
import vn.tourista.repository.ReviewImageRepository;
import vn.tourista.repository.ReviewRepository;
import vn.tourista.repository.TourRepository;
import vn.tourista.repository.UserRepository;
import vn.tourista.service.ReviewService;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Set;

@Service
@Transactional
public class ReviewServiceImpl implements ReviewService {

    private static final Logger log = LoggerFactory.getLogger(ReviewServiceImpl.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private ReviewImageRepository reviewImageRepository;

    @Autowired
    private HotelRepository hotelRepository;

    @Autowired
    private TourRepository tourRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private BookingHotelDetailRepository bookingHotelDetailRepository;

    @Autowired
    private BookingTourDetailRepository bookingTourDetailRepository;

    @Override
    public ReviewCreatedResponse createReview(String userEmail, CreateReviewRequest request) {
        User user = userRepository.findByEmail(normalizeText(userEmail))
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay tai khoan dang nhap"));

        Review.TargetType targetType = parseTargetType(request.getTargetType());
        Long targetId = request.getTargetId();
        Integer rating = request.getOverallRating();

        if (targetId == null || targetId < 1) {
            throw new IllegalArgumentException("Target id khong hop le");
        }

        if (rating == null || rating < 1 || rating > 5) {
            throw new IllegalArgumentException("So sao danh gia phai nam trong khoang 1-5");
        }

        ensureTargetExists(targetType, targetId);

        if (reviewRepository.existsByUserIdAndTargetTypeAndTargetId(user.getId(), targetType, targetId)) {
            throw new IllegalArgumentException("Ban da danh gia dich vu nay roi");
        }

        String comment = normalizeText(request.getComment());
        List<String> mediaUrls = sanitizeMediaUrls(request.getMediaUrls());

        if ((comment == null || comment.isBlank()) && mediaUrls.isEmpty()) {
            throw new IllegalArgumentException("Danh gia can co noi dung hoac media dinh kem");
        }

        Long bookingId = request.getBookingId();
        boolean isVerified = false;

        if (bookingId != null) {
            isVerified = validateBookingVerification(user.getId(), bookingId, targetType, targetId);
        } else {
            List<Booking> bookings = bookingRepository.findByUserAndStatusIn(user,
                List.of(Booking.BookingStatus.PENDING, Booking.BookingStatus.CONFIRMED, Booking.BookingStatus.CHECKED_IN, Booking.BookingStatus.COMPLETED));
            for (Booking booking : bookings) {
                if (isBookingMatchedTarget(booking, targetType, targetId)) {
                    bookingId = booking.getId();
                    isVerified = true;
                    break;
                }
            }
        }

        Review review = reviewRepository.save(Review.builder()
                .userId(user.getId())
                .bookingId(bookingId)
                .targetType(targetType)
                .targetId(targetId)
                .overallRating(rating)
                .title(normalizeText(request.getTitle()))
                .comment(comment)
                .cleanliness(request.getCleanliness())
                .location(request.getLocation())
                .service(request.getService())
                .valueForMoney(request.getValueForMoney())
                .guideQuality(request.getGuideQuality())
                .organization(request.getOrganization())
                .isVerified(isVerified)
                .isPublished(true)
                .createdAt(LocalDateTime.now())
                .build());

        saveReviewMedia(review, mediaUrls);
        refreshTargetRatingStats(targetType, targetId);

        return ReviewCreatedResponse.builder()
                .id(review.getId())
                .targetType(targetType.name())
                .targetId(targetId)
                .overallRating(rating)
                .comment(comment)
                .verified(isVerified)
                .createdAt(review.getCreatedAt())
                .mediaUrls(mediaUrls)
                .build();
    }

    private void ensureTargetExists(Review.TargetType targetType, Long targetId) {
        if (targetType == Review.TargetType.HOTEL) {
            hotelRepository.findByIdAndIsActiveTrue(targetId)
                    .orElseThrow(() -> new NoSuchElementException("Khong tim thay khach san"));
            return;
        }

        tourRepository.findByIdAndIsActiveTrue(targetId)
                .orElseThrow(() -> new NoSuchElementException("Khong tim thay tour"));
    }

    private boolean validateBookingVerification(
            Long userId,
            Long bookingId,
            Review.TargetType targetType,
            Long targetId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking khong ton tai"));

        if (booking.getUser() == null || !Objects.equals(booking.getUser().getId(), userId)) {
            throw new IllegalArgumentException("Ban khong co quyen su dung booking nay de danh gia");
        }

        if (!isBookingMatchedTarget(booking, targetType, targetId)) {
            throw new IllegalArgumentException("Booking khong phu hop voi dich vu ban dang danh gia");
        }

        return booking.getStatus() == Booking.BookingStatus.PENDING
                || booking.getStatus() == Booking.BookingStatus.CONFIRMED
                || booking.getStatus() == Booking.BookingStatus.CHECKED_IN
                || booking.getStatus() == Booking.BookingStatus.COMPLETED;
    }

    private boolean isBookingMatchedTarget(Booking booking, Review.TargetType targetType, Long targetId) {
        if (targetType == Review.TargetType.HOTEL) {
            if (booking.getBookingType() != Booking.BookingType.HOTEL) {
                return false;
            }

            BookingHotelDetail detail = bookingHotelDetailRepository.findByBooking_Id(booking.getId()).orElse(null);
            if (detail == null || detail.getHotel() == null) {
                return false;
            }

            return Objects.equals(detail.getHotel().getId(), targetId);
        }

        if (booking.getBookingType() != Booking.BookingType.TOUR) {
            return false;
        }

        BookingTourDetail detail = bookingTourDetailRepository.findByBooking(booking).orElse(null);
        if (detail == null || detail.getTour() == null) {
            return false;
        }

        return Objects.equals(detail.getTour().getId(), targetId);
    }

    private void saveReviewMedia(Review review, List<String> mediaUrls) {
        if (review == null || review.getId() == null || mediaUrls.isEmpty()) {
            return;
        }

        try {
            List<ReviewImage> images = mediaUrls.stream()
                    .map(url -> ReviewImage.builder()
                            .review(review)
                            .url(url)
                            .build())
                    .toList();
            reviewImageRepository.saveAll(images);
        } catch (RuntimeException ex) {
            // Keep review creation stable for environments without review_images table.
            log.warn("Cannot persist review media for reviewId={}: {}", review.getId(), ex.getMessage());
        }
    }

    private void refreshTargetRatingStats(Review.TargetType targetType, Long targetId) {
        ReviewRepository.ReviewAggregateProjection stats = reviewRepository.findTargetRatingStats(targetType.name(),
                targetId);
        BigDecimal avgRating = stats != null && stats.getAvgRating() != null
                ? stats.getAvgRating().setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        int reviewCount = stats != null && stats.getReviewCount() != null ? stats.getReviewCount().intValue() : 0;

        if (targetType == Review.TargetType.HOTEL) {
            Hotel hotel = hotelRepository.findById(targetId).orElse(null);
            if (hotel != null) {
                hotel.setAvgRating(avgRating);
                hotel.setReviewCount(reviewCount);
                hotelRepository.save(hotel);
            }
            return;
        }

        Tour tour = tourRepository.findById(targetId).orElse(null);
        if (tour != null) {
            tour.setAvgRating(avgRating);
            tour.setReviewCount(reviewCount);
            tourRepository.save(tour);
        }
    }

    private Review.TargetType parseTargetType(String rawTargetType) {
        String normalized = normalizeText(rawTargetType);
        if (normalized == null) {
            throw new IllegalArgumentException("Target type khong hop le");
        }

        try {
            return Review.TargetType.valueOf(normalized.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Target type chi chap nhan HOTEL hoac TOUR");
        }
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private List<String> sanitizeMediaUrls(List<String> mediaUrls) {
        if (mediaUrls == null || mediaUrls.isEmpty()) {
            return Collections.emptyList();
        }

        Set<String> deduplicated = new LinkedHashSet<>();
        for (String rawUrl : mediaUrls) {
            String url = normalizeText(rawUrl);
            if (url == null) {
                continue;
            }
            String lower = url.toLowerCase(Locale.ROOT);
            if (!lower.startsWith("http://") && !lower.startsWith("https://")) {
                continue;
            }
            deduplicated.add(url);
            if (deduplicated.size() >= 8) {
                break;
            }
        }

        return new ArrayList<>(deduplicated);
    }

    @Override
    public boolean canUserReview(String userEmail, String targetType, Long targetId) {
        if (userEmail == null || targetType == null || targetId == null) {
            return false;
        }
        String normalized = normalizeText(targetType);
        if (normalized == null) {
            return false;
        }
        try {
            Review.TargetType type = Review.TargetType.valueOf(normalized.toUpperCase(Locale.ROOT));
            return switch (type) {
                case HOTEL -> canUserReviewHotel(userEmail, targetId);
                case TOUR -> canUserReviewTour(userEmail, targetId);
            };
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    @Override
    public boolean canUserReviewHotel(String userEmail, Long hotelId) {
        if (userEmail == null || hotelId == null) {
            return false;
        }
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) {
            return false;
        }
        if (reviewRepository.existsByUserIdAndTargetTypeAndTargetId(user.getId(), Review.TargetType.HOTEL, hotelId)) {
            System.out.println("canUserReviewHotel: false because already reviewed");
            return false;
        }
        List<Booking> bookings = bookingRepository.findByUserAndStatusIn(user,
                List.of(Booking.BookingStatus.PENDING, Booking.BookingStatus.CONFIRMED, Booking.BookingStatus.CHECKED_IN, Booking.BookingStatus.COMPLETED));
        
        System.out.println("canUserReviewHotel: Found " + bookings.size() + " valid bookings for user");

        for (Booking booking : bookings) {
            if (booking.getBookingType() != Booking.BookingType.HOTEL) {
                continue;
            }
            BookingHotelDetail detail = bookingHotelDetailRepository.findByBooking_Id(booking.getId()).orElse(null);
            if (detail != null && detail.getHotel() != null) {
                System.out.println("canUserReviewHotel: checking booking hotel " + detail.getHotel().getId() + " vs " + hotelId);
                if (Objects.equals(detail.getHotel().getId(), hotelId)) {
                    return true;
                }
            }
        }
        System.out.println("canUserReviewHotel: false because no matching hotel found in bookings");
        return false;
    }

    @Override
    public boolean hasUserReviewed(String userEmail, String targetType, Long targetId) {
        if (userEmail == null || targetType == null || targetId == null) return false;
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) return false;
        try {
            Review.TargetType type = Review.TargetType.valueOf(targetType.trim().toUpperCase(java.util.Locale.ROOT));
            return reviewRepository.existsByUserIdAndTargetTypeAndTargetId(user.getId(), type, targetId);
        } catch (Exception e) {
            return false;
        }
    }

    public boolean canUserReviewTour(String userEmail, Long tourId) {
        if (userEmail == null || tourId == null) {
            return false;
        }
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) {
            return false;
        }
        if (reviewRepository.existsByUserIdAndTargetTypeAndTargetId(user.getId(), Review.TargetType.TOUR, tourId)) {
            return false;
        }
        List<Booking> bookings = bookingRepository.findByUserAndStatusIn(user,
                List.of(Booking.BookingStatus.PENDING, Booking.BookingStatus.CONFIRMED, Booking.BookingStatus.CHECKED_IN, Booking.BookingStatus.COMPLETED));
        for (Booking booking : bookings) {
            if (booking.getBookingType() != Booking.BookingType.TOUR) {
                continue;
            }
            BookingTourDetail detail = bookingTourDetailRepository.findByBooking(booking).orElse(null);
            if (detail != null && detail.getTour() != null
                    && Objects.equals(detail.getTour().getId(), tourId)) {
                return true;
            }
        }
        return false;
    }
}
