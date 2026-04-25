-- ============================================================
-- Table: articles
-- ============================================================
CREATE TABLE IF NOT EXISTS articles (
    id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    author_id         BIGINT          NOT NULL,
    title             VARCHAR(250)    NOT NULL,
    slug              VARCHAR(270)    NOT NULL,
    excerpt           VARCHAR(500)    NULL,
    content           LONGTEXT        NULL,
    cover_image_url   VARCHAR(500)    NULL,
    status            VARCHAR(20)     NOT NULL DEFAULT 'DRAFT',
    category          VARCHAR(100)    NULL,
    read_time_minutes INT             NOT NULL DEFAULT 1,
    views             BIGINT          NOT NULL DEFAULT 0,
    likes             BIGINT          NOT NULL DEFAULT 0,
    created_at        DATETIME        NOT NULL,
    updated_at        DATETIME        NOT NULL,
    UNIQUE KEY uk_article_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Table: article_comments
-- ============================================================
CREATE TABLE IF NOT EXISTS article_comments (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    article_id  BIGINT          NOT NULL,
    user_id     BIGINT          NOT NULL,
    content     VARCHAR(1000)   NOT NULL,
    created_at  DATETIME        NOT NULL,
    updated_at   DATETIME        NOT NULL,
    INDEX idx_ac_article (article_id),
    INDEX idx_ac_user    (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
