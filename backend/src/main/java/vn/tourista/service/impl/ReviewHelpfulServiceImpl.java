package vn.tourista.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.tourista.entity.Review;
import vn.tourista.entity.ReviewHelpfulVote;
import vn.tourista.repository.ReviewHelpfulVoteRepository;
import vn.tourista.repository.ReviewRepository;
import vn.tourista.repository.UserRepository;
import vn.tourista.service.ReviewHelpfulService;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class ReviewHelpfulServiceImpl implements ReviewHelpfulService {

    @Autowired
    private ReviewHelpfulVoteRepository voteRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public int toggleHelpful(String userEmail, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found: " + reviewId));

        Long userId = resolveUserId(userEmail);
        boolean alreadyVoted = voteRepository.existsByReviewIdAndUserId(reviewId, userId);

        if (alreadyVoted) {
            voteRepository.deleteByReviewIdAndUserId(reviewId, userId);
        } else {
            ReviewHelpfulVote vote = ReviewHelpfulVote.builder()
                    .reviewId(reviewId)
                    .userId(userId)
                    .targetType(review.getTargetType())
                    .build();
            voteRepository.save(vote);
        }

        return (int) voteRepository.countByReviewId(reviewId);
    }

    @Override
    @Transactional(readOnly = true)
    public int getHelpfulCount(Long reviewId) {
        return (int) voteRepository.countByReviewId(reviewId);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<Long, Integer> getHelpfulCounts(List<Long> reviewIds) {
        if (reviewIds == null || reviewIds.isEmpty()) {
            return Collections.emptyMap();
        }

        List<Object[]> counts = voteRepository.countVotesByReviewIds(reviewIds);
        return counts.stream()
                .collect(Collectors.toMap(
                        row -> ((Number) row[0]).longValue(),
                        row -> ((Number) row[1]).intValue(),
                        (a, b) -> a
                ));
    }

    @Override
    @Transactional(readOnly = true)
    public Set<Long> getUserVotedReviewIds(String userEmail, List<Long> reviewIds) {
        if (reviewIds == null || reviewIds.isEmpty()) {
            return Collections.emptySet();
        }

        Long userId = resolveUserId(userEmail);
        return voteRepository.findVotedReviewIdsByUser(userId, reviewIds);
    }

    private Long resolveUserId(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email))
                .getId();
    }
}
