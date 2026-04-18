USE railway;
START TRANSACTION;

CREATE TABLE IF NOT EXISTS pricing_rules (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    target_type     ENUM('HOTEL','TOUR') NOT NULL,
    hotel_id        BIGINT NULL,
    tour_id         BIGINT NULL,
    rule_type       ENUM('DAY_OF_WEEK','SEASON','LAST_MINUTE','EARLY_BIRD','GROUP_SIZE') NOT NULL,
    season          ENUM('PEAK','REGULAR','OFF') NULL,
    day_of_week     TINYINT NULL,
    advance_days_min INT NULL,
    advance_days_max INT NULL,
    slots_remaining_max INT NULL,
    adjustment_percent DECIMAL(5,2) NOT NULL,
    min_pax         INT NULL,
    max_pax         INT NULL,
    name            VARCHAR(200) NOT NULL,
    description     VARCHAR(500) NULL,
    priority        INT NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    start_date      DATETIME NULL,
    end_date        DATETIME NULL,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_target_type (target_type),
    INDEX idx_hotel_id (hotel_id),
    INDEX idx_tour_id (tour_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

COMMIT;
SELECT 'pricing_rules table created' AS result;
