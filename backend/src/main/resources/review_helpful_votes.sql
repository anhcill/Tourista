-- Run this SQL manually to create the review_helpful_votes table.
-- This table tracks which users have voted "helpful" on reviews.

CREATE TABLE IF NOT EXISTS review_helpful_votes (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    review_id   BIGINT UNSIGNED NOT NULL,
    user_id     BIGINT UNSIGNED NOT NULL,
    target_type VARCHAR(10)     NOT NULL COMMENT 'HOTEL or TOUR',
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uk_review_user (review_id, user_id),
    INDEX idx_review_vote_review (review_id),
    INDEX idx_review_vote_user (user_id),

    CONSTRAINT fk_vote_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    CONSTRAINT fk_vote_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='User votes marking reviews as helpful';
