-- Migration: conversation_sessions + session_recommendation_states
-- Target: Railway MySQL
-- Run via: php run_conversation_migration.php
-- Or via: php fix_conversations_pk.php (adds PK first, then FK)

SET FOREIGN_KEY_CHECKS = 0;

-- conversations table: add PRIMARY KEY if not exists
-- (RUN FIRST if conversations.id has no PK)
-- ALTER TABLE conversations ADD PRIMARY KEY (id);

CREATE TABLE IF NOT EXISTS conversation_sessions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT UNSIGNED NOT NULL,
    session_started_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    context_summary TEXT,
    message_count INT UNSIGNED NOT NULL DEFAULT 0,
    current_intent_tag VARCHAR(50),
    last_context_at DATETIME,
    UNIQUE KEY uk_cs_conversation (conversation_id),
    INDEX idx_cs_updated (updated_at),
    CONSTRAINT fk_cs_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS session_recommendation_states (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    conversation_id BIGINT UNSIGNED NOT NULL,
    budget_vnd INT,
    travelers INT,
    city_query VARCHAR(100),
    city_display VARCHAR(100),
    max_duration_days INT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    UNIQUE KEY uk_rec_conversation (conversation_id),
    INDEX idx_rec_updated (updated_at),
    CONSTRAINT fk_rec_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
