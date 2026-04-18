-- ============================================================
--  Tourista - Article & ArticleComment Schema
--  Chạy file này để tạo bảng articles và article_comments
-- ============================================================

USE tourista;

SET FOREIGN_KEY_CHECKS = 0;

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
    id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT PRIMARY KEY,
    author_id           BIGINT UNSIGNED     NOT NULL,
    title               VARCHAR(250)        NOT NULL,
    slug                VARCHAR(270)        NOT NULL UNIQUE,
    excerpt             VARCHAR(500),
    content             LONGTEXT,
    cover_image_url     VARCHAR(500),
    status              VARCHAR(20)         NOT NULL DEFAULT 'DRAFT',
    category            VARCHAR(100),
    read_time_minutes   INT UNSIGNED       NOT NULL DEFAULT 1,
    views               BIGINT UNSIGNED     NOT NULL DEFAULT 0,
    likes               BIGINT UNSIGNED     NOT NULL DEFAULT 0,
    created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_articles_status (status),
    INDEX idx_articles_category (category),
    INDEX idx_articles_author (author_id),
    INDEX idx_articles_slug (slug),
    CONSTRAINT fk_articles_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Article Comments table
CREATE TABLE IF NOT EXISTS article_comments (
    id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT PRIMARY KEY,
    article_id      BIGINT UNSIGNED     NOT NULL,
    user_id         BIGINT UNSIGNED     NOT NULL,
    content         VARCHAR(1000)       NOT NULL,
    created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_article_comments_article (article_id),
    INDEX idx_article_comments_user (user_id),
    CONSTRAINT fk_article_comments_article FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    CONSTRAINT fk_article_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
