CREATE TABLE IF NOT EXISTS conversations (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    type         VARCHAR(10)     NOT NULL,
    client_id    BIGINT UNSIGNED NOT NULL,
    partner_id   BIGINT UNSIGNED NULL,
    reference_id BIGINT UNSIGNED NULL,
    booking_id   BIGINT UNSIGNED NULL,
    created_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_conv_client (client_id),
    INDEX idx_conv_partner (partner_id),
    INDEX idx_conv_updated (updated_at),
    CONSTRAINT fk_conv_client FOREIGN KEY (client_id) REFERENCES users(id),
    CONSTRAINT fk_conv_partner FOREIGN KEY (partner_id) REFERENCES users(id),
    CONSTRAINT fk_conv_booking FOREIGN KEY (booking_id) REFERENCES bookings(id)
) ENGINE=InnoDB COMMENT='Phien chat giua client-bot hoac client-partner';

CREATE TABLE IF NOT EXISTS chat_messages (
    id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    conversation_id BIGINT UNSIGNED NOT NULL,
    sender_id       BIGINT UNSIGNED NULL,
    content_type    VARCHAR(20)     NOT NULL DEFAULT 'TEXT',
    content         TEXT,
    metadata        TEXT,
    is_read         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_msg_conversation (conversation_id),
    INDEX idx_msg_created (created_at),
    CONSTRAINT fk_msg_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id) REFERENCES users(id)
) ENGINE=InnoDB COMMENT='Tin nhan trong phien chat';

CREATE TABLE IF NOT EXISTS conversation_sessions (
    id                   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    conversation_id      BIGINT UNSIGNED NOT NULL,
    session_started_at   DATETIME        NOT NULL,
    updated_at           DATETIME        NOT NULL,
    context_summary      TEXT,
    message_count        INT UNSIGNED    NOT NULL DEFAULT 0,
    current_intent_tag   VARCHAR(50),
    last_context_at      DATETIME,
    UNIQUE KEY uk_cs_conversation (conversation_id),
    INDEX idx_cs_updated (updated_at),
    CONSTRAINT fk_cs_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS session_recommendation_states (
    id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    conversation_id  BIGINT UNSIGNED NOT NULL,
    budget_vnd       INT,
    travelers        INT,
    city_query       VARCHAR(100),
    city_display     VARCHAR(100),
    max_duration_days INT,
    created_at       DATETIME NOT NULL,
    updated_at       DATETIME NOT NULL,
    UNIQUE KEY uk_rec_conversation (conversation_id),
    INDEX idx_rec_updated (updated_at),
    CONSTRAINT fk_rec_conv FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
