package vn.tourista.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.tourista.entity.Review;

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
                    r.created_at AS createdAt
            FROM reviews r
            JOIN users u ON u.id = r.user_id
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
                r.created_at AS createdAt
            FROM reviews r
            JOIN users u ON u.id = r.user_id
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
}
