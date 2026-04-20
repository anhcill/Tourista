package vn.tourista.service;

import java.util.Set;

public interface ReviewHelpfulService {

    /**
     * Toggle helpful vote on a review. Creates vote if not exists, removes if exists.
     *
     * @param userEmail authenticated user email
     * @param reviewId  review ID
     * @return helpful count after toggle
     */
    int toggleHelpful(String userEmail, Long reviewId);

    /**
     * Get helpful count for a specific review.
     *
     * @param reviewId review ID
     * @return count
     */
    int getHelpfulCount(Long reviewId);

    /**
     * Batch get helpful counts for multiple reviews.
     *
     * @param reviewIds list of review IDs
     * @return map of reviewId -> count
     */
    java.util.Map<Long, Integer> getHelpfulCounts(java.util.List<Long> reviewIds);

    /**
     * Get which reviews the user has voted on from a given list.
     *
     * @param userEmail authenticated user email
     * @param reviewIds list of review IDs to check
     * @return set of review IDs the user has voted on
     */
    Set<Long> getUserVotedReviewIds(String userEmail, java.util.List<Long> reviewIds);
}
