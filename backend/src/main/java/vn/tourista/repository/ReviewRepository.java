package vn.tourista.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.tourista.entity.Review;

import java.math.BigDecimal;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    interface HotelReviewProjection {
        Long getId();

        String getUserName();

        String getAvatarUrl();

        Integer getOverallRating();

        String getComment();

        Boolean getVerified();

        java.time.LocalDateTime getCreatedAt();

        Long getHelpfulCount();

        String getPartnerReply();

        java.time.LocalDateTime getPartnerRepliedAt();
    }

    interface HomeTestimonialProjection {
        Long getId();

        String getContent();

        Double getRating();

        String getAuthorName();

        String getAuthorAvatar();

        String getCountry();

        Boolean getVerified();

        String getTargetName();

        String getTargetType();
    }

    interface TourReviewProjection {
        Long getId();

        String getUserName();

        String getAvatarUrl();

        Integer getOverallRating();

        String getComment();

        Boolean getVerified();

        java.time.LocalDateTime getCreatedAt();

        Long getHelpfulCount();

        String getPartnerReply();

        java.time.LocalDateTime getPartnerRepliedAt();
    }

    interface ReviewMediaProjection {
        Long getReviewId();

        String getUrl();
    }

    interface ReviewAggregateProjection {
        BigDecimal getAvgRating();

        Long getReviewCount();
    }

    @Query(value = """
            SELECT
                r.id AS id,
                r.comment AS content,
                CAST(r.overall_rating AS DECIMAL(3,1)) AS rating,
                u.full_name AS authorName,
                COALESCE(NULLIF(u.avatar_url, ''), CONCAT('https://i.pravatar.cc/80?img=', MOD(r.user_id, 60) + 1)) AS authorAvatar,
                COALESCE(ct.name_en, 'Viet Nam') AS country,
                r.is_verified AS verified,
                CASE WHEN r.target_type = 'HOTEL' THEN h.name ELSE t.title END AS targetName,
                r.target_type AS targetType
            FROM reviews r
            JOIN users u ON u.id = r.user_id
            LEFT JOIN hotels h
                   ON r.target_type = 'HOTEL'
                  AND h.id = r.target_id
                  AND h.is_active = TRUE
            LEFT JOIN tours t
                   ON r.target_type = 'TOUR'
                  AND t.id = r.target_id
                  AND t.is_active = TRUE
            LEFT JOIN cities c
                   ON (r.target_type = 'HOTEL' AND c.id = h.city_id)
                   OR (r.target_type = 'TOUR' AND c.id = t.city_id)
            LEFT JOIN countries ct ON ct.id = c.country_id
            WHERE r.is_published = TRUE
              AND r.comment IS NOT NULL
              AND TRIM(r.comment) <> ''
              AND (
                  (r.target_type = 'HOTEL' AND h.id IS NOT NULL)
                  OR (r.target_type = 'TOUR' AND t.id IS NOT NULL)
              )
            ORDER BY r.is_verified DESC, r.created_at DESC
            LIMIT :limit
            """, nativeQuery = true)
    List<HomeTestimonialProjection> findPublicTestimonials(@Param("limit") Integer limit);

    @Query(value = """
            SELECT
                    r.id AS id,
                    u.full_name AS userName,
                    COALESCE(NULLIF(u.avatar_url, ''), CONCAT('https://i.pravatar.cc/80?img=', MOD(r.user_id, 60) + 1)) AS avatarUrl,
                    r.overall_rating AS overallRating,
                    r.comment AS comment,
                    r.is_verified AS verified,
                    r.created_at AS createdAt,
                    COALESCE(hv.helpful_count, 0) AS helpfulCount,
                    r.partner_reply AS partnerReply,
                    r.partner_replied_at AS partnerRepliedAt
            FROM reviews r
            JOIN users u ON u.id = r.user_id
            LEFT JOIN (
                SELECT review_id, COUNT(*) AS helpful_count
                FROM review_helpful_votes
                GROUP BY review_id
            ) hv ON hv.review_id = r.id
            WHERE r.target_type = 'HOTEL'
                AND r.target_id = :hotelId
                AND r.is_published = TRUE
                AND r.comment IS NOT NULL
                AND TRIM(r.comment) <> ''
            ORDER BY r.is_verified DESC, r.created_at DESC
            LIMIT :limit OFFSET :offset
            """, nativeQuery = true)
    List<HotelReviewProjection> findPublishedHotelReviews(
            @Param("hotelId") Long hotelId,
            @Param("limit") Integer limit,
            @Param("offset") Integer offset);

    @Query(value = """
            SELECT
                r.id AS id,
                u.full_name AS userName,
                COALESCE(NULLIF(u.avatar_url, ''), CONCAT('https://i.pravatar.cc/80?img=', MOD(r.user_id, 60) + 1)) AS avatarUrl,
                r.overall_rating AS overallRating,
                r.comment AS comment,
                r.is_verified AS verified,
                r.created_at AS createdAt,
                COALESCE(hv.helpful_count, 0) AS helpfulCount,
                r.partner_reply AS partnerReply,
                r.partner_replied_at AS partnerRepliedAt
            FROM reviews r
            JOIN users u ON u.id = r.user_id
            LEFT JOIN (
                SELECT review_id, COUNT(*) AS helpful_count
                FROM review_helpful_votes
                GROUP BY review_id
            ) hv ON hv.review_id = r.id
            WHERE r.target_type = 'TOUR'
            AND r.target_id = :tourId
            AND r.is_published = TRUE
            AND r.comment IS NOT NULL
            AND TRIM(r.comment) <> ''
            ORDER BY r.is_verified DESC, r.created_at DESC
            LIMIT :limit OFFSET :offset
            """, nativeQuery = true)
    List<TourReviewProjection> findPublishedTourReviews(
            @Param("tourId") Long tourId,
            @Param("limit") Integer limit,
            @Param("offset") Integer offset);

    @Query(value = """
            SELECT
                    ri.review_id AS reviewId,
                    ri.url AS url
            FROM review_images ri
            WHERE ri.review_id IN (:reviewIds)
                AND ri.url IS NOT NULL
                AND TRIM(ri.url) <> ''
            ORDER BY ri.review_id ASC, ri.id ASC
            """, nativeQuery = true)
    List<ReviewMediaProjection> findMediaByReviewIds(@Param("reviewIds") List<Long> reviewIds);

    @Query(value = """
            SELECT
                    COALESCE(AVG(r.overall_rating), 0) AS avgRating,
                    COUNT(*) AS reviewCount
            FROM reviews r
            WHERE r.target_type = :targetType
                AND r.target_id = :targetId
                AND r.is_published = TRUE
            """, nativeQuery = true)
    ReviewAggregateProjection findTargetRatingStats(
            @Param("targetType") String targetType,
            @Param("targetId") Long targetId);

    List<Review> findByAdminStatusOrderByCreatedAtDesc(Review.AdminStatus status);

    Page<Review> findByAdminStatusOrderByCreatedAtDesc(Review.AdminStatus status, Pageable pageable);

    Page<Review> findByTargetTypeOrderByCreatedAtDesc(Review.TargetType targetType, Pageable pageable);

    Page<Review> findByAdminStatusAndTargetTypeOrderByCreatedAtDesc(
            Review.AdminStatus status, Review.TargetType targetType, Pageable pageable);

    long countByAdminStatus(Review.AdminStatus status);

    long countByAdminStatusAndTargetType(Review.AdminStatus status, Review.TargetType targetType);

    @Query(value = """
            SELECT review_id FROM (
                SELECT r.id AS review_id, r.created_at FROM reviews r
                WHERE r.target_type = 'HOTEL' AND r.target_id IN (:hotelIds)
                UNION ALL
                SELECT r.id AS review_id, r.created_at FROM reviews r
                WHERE r.target_type = 'TOUR' AND r.target_id IN (:tourIds)
            ) AS combined
            ORDER BY created_at DESC
            """, nativeQuery = true)
    List<Long> findIdsByPartnerHotelsAndTours(
            @Param("hotelIds") List<Long> hotelIds,
            @Param("tourIds") List<Long> tourIds,
            Pageable pageable);

    List<Review> findByTargetTypeAndTargetIdIn(Review.TargetType targetType, List<Long> targetIds);

    boolean existsByUserIdAndTargetTypeAndTargetId(Long userId, Review.TargetType targetType, Long targetId);
}
