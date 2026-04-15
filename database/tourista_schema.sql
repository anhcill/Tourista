-- ============================================================
--  TOURISTA - TRAVEL BOOKING SYSTEM
--  MySQL Database Schema
--  Version: 1.0.0
--  Backend: Java Spring Boot + MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS tourista
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;s

USE tourista;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. USERS & AUTHENTICATION
-- ============================================================

CREATE TABLE roles (
    id          TINYINT UNSIGNED    NOT NULL AUTO_INCREMENT,
    name        VARCHAR(30)         NOT NULL UNIQUE,  -- ADMIN, USER, HOST
    description VARCHAR(100),
    PRIMARY KEY (id)
) ENGINE=InnoDB COMMENT='Vai trò người dùng';

CREATE TABLE users (
    id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    email               VARCHAR(255)        NOT NULL UNIQUE,
    password_hash       VARCHAR(255),       -- Có thể NULL nếu login bằng Google
    full_name           VARCHAR(100)        NOT NULL,
    phone               VARCHAR(15),
    avatar_url          VARCHAR(500),
    date_of_birth       DATE,
    gender              ENUM('MALE','FEMALE','OTHER'),
    nationality         VARCHAR(60),
    role_id             TINYINT UNSIGNED    NOT NULL DEFAULT 2,             -- 1=ADMIN, 2=USER, 3=HOST
    status              ENUM('ACTIVE','LOCKED','BANNED') NOT NULL DEFAULT 'ACTIVE',
    is_email_verified   BOOLEAN             NOT NULL DEFAULT FALSE,
    email_verified_at   DATETIME,
    failed_attempts     INT                 NOT NULL DEFAULT 0,
    locked_until        DATETIME,
    auth_provider       ENUM('LOCAL','GOOGLE') NOT NULL DEFAULT 'LOCAL',
    provider_id         VARCHAR(100),
    last_login_at       DATETIME,
    created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_users_email (email),
    INDEX idx_users_role (role_id),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB COMMENT='Tài khoản người dùng';

CREATE TABLE refresh_tokens (
    id          BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    user_id     BIGINT UNSIGNED     NOT NULL,
    token       VARCHAR(512)        NOT NULL UNIQUE,
    expires_at  DATETIME            NOT NULL,
    revoked     BOOLEAN             NOT NULL DEFAULT FALSE,
    ip_address  VARCHAR(45),
    user_agent  VARCHAR(255),
    created_at  DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_rt_user (user_id),
    INDEX idx_rt_token (token),
    CONSTRAINT fk_rt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='JWT refresh tokens';

CREATE TABLE email_verification_tokens (
    id          BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    user_id     BIGINT UNSIGNED     NOT NULL,
    token       VARCHAR(255)        NOT NULL UNIQUE,
    type        ENUM('VERIFY_EMAIL','RESET_PASSWORD') NOT NULL,
    expires_at  DATETIME            NOT NULL,
    used        BOOLEAN             NOT NULL DEFAULT FALSE,
    created_at  DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_evt_user (user_id),
    INDEX idx_evt_token (token),
    CONSTRAINT fk_evt_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Token xác thực email / đặt lại mật khẩu';

CREATE TABLE login_attempts (
    id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    email           VARCHAR(255)        NOT NULL,
    ip_address      VARCHAR(45)         NOT NULL,
    success         BOOLEAN             NOT NULL,
    user_agent      VARCHAR(255),
    failure_reason  VARCHAR(50),
    attempted_at    DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_la_email (email),
    INDEX idx_la_attempted_at (attempted_at)
) ENGINE=InnoDB COMMENT='Ghi log đăng nhập';

-- ============================================================
-- 2. LOCATIONS & DESTINATIONS
-- ============================================================

CREATE TABLE countries (
    id          SMALLINT UNSIGNED   NOT NULL AUTO_INCREMENT,
    code        CHAR(2)             NOT NULL UNIQUE,   -- ISO 3166-1 alpha-2
    name_vi     VARCHAR(100)        NOT NULL,
    name_en     VARCHAR(100)        NOT NULL,
    flag_url    VARCHAR(300),
    PRIMARY KEY (id)
) ENGINE=InnoDB COMMENT='Quốc gia';

CREATE TABLE cities (
    id          INT UNSIGNED        NOT NULL AUTO_INCREMENT,
    country_id  SMALLINT UNSIGNED   NOT NULL,
    name_vi     VARCHAR(100)        NOT NULL,
    name_en     VARCHAR(100)        NOT NULL,
    slug        VARCHAR(120)        NOT NULL UNIQUE,
    description TEXT,
    cover_image VARCHAR(500),
    latitude    DECIMAL(10,7),
    longitude   DECIMAL(10,7),
    is_popular  BOOLEAN             NOT NULL DEFAULT FALSE,
    PRIMARY KEY (id),
    INDEX idx_cities_country (country_id),
    INDEX idx_cities_slug (slug),
    CONSTRAINT fk_cities_country FOREIGN KEY (country_id) REFERENCES countries(id)
) ENGINE=InnoDB COMMENT='Thành phố / điểm đến';

-- ============================================================
-- 3. AMENITIES (Tiện nghi chung cho Hotel & Tour)
-- ============================================================

CREATE TABLE amenities (
    id          SMALLINT UNSIGNED   NOT NULL AUTO_INCREMENT,
    code        VARCHAR(30)         NOT NULL UNIQUE,   -- wifi, pool, gym, spa ...
    name_vi     VARCHAR(80)         NOT NULL,
    name_en     VARCHAR(80)         NOT NULL,
    icon        VARCHAR(100),                           -- tên icon (FontAwesome/SVG)
    category    ENUM('HOTEL','TOUR','BOTH') NOT NULL DEFAULT 'HOTEL',
    PRIMARY KEY (id)
) ENGINE=InnoDB COMMENT='Danh mục tiện nghi';

-- ============================================================
-- 4. HOTELS
-- ============================================================

CREATE TABLE hotels (
    id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    city_id             INT UNSIGNED        NOT NULL,
    owner_id            BIGINT UNSIGNED,                -- user với role HOST
    name                VARCHAR(200)        NOT NULL,
    slug                VARCHAR(220)        NOT NULL UNIQUE,
    description         TEXT,
    address             VARCHAR(300)        NOT NULL,
    latitude            DECIMAL(10,7),
    longitude           DECIMAL(10,7),
    star_rating         TINYINT UNSIGNED    NOT NULL DEFAULT 3 CHECK (star_rating BETWEEN 1 AND 5),
    avg_rating          DECIMAL(3,2)        NOT NULL DEFAULT 0.00,
    review_count        INT UNSIGNED        NOT NULL DEFAULT 0,
    check_in_time       TIME                NOT NULL DEFAULT '14:00:00',
    check_out_time      TIME                NOT NULL DEFAULT '12:00:00',
    phone               VARCHAR(20),
    email               VARCHAR(150),
    website             VARCHAR(300),
    is_featured         BOOLEAN             NOT NULL DEFAULT FALSE,
    is_trending         BOOLEAN             NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN             NOT NULL DEFAULT TRUE,
    created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_hotels_city (city_id),
    INDEX idx_hotels_owner (owner_id),
    INDEX idx_hotels_slug (slug),
    INDEX idx_hotels_rating (avg_rating),
    INDEX idx_hotels_featured (is_featured),
    CONSTRAINT fk_hotels_city  FOREIGN KEY (city_id)  REFERENCES cities(id),
    CONSTRAINT fk_hotels_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Thông tin khách sạn';

CREATE TABLE hotel_images (
    id          BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    hotel_id    BIGINT UNSIGNED     NOT NULL,
    url         VARCHAR(500)        NOT NULL,
    alt_text    VARCHAR(200),
    is_cover    BOOLEAN             NOT NULL DEFAULT FALSE,
    sort_order  TINYINT UNSIGNED    NOT NULL DEFAULT 0,
    created_at  DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_hi_hotel (hotel_id),
    CONSTRAINT fk_hi_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Ảnh khách sạn';

CREATE TABLE hotel_amenities (
    hotel_id    BIGINT UNSIGNED     NOT NULL,
    amenity_id  SMALLINT UNSIGNED   NOT NULL,
    PRIMARY KEY (hotel_id, amenity_id),
    CONSTRAINT fk_ha_hotel   FOREIGN KEY (hotel_id)   REFERENCES hotels(id)    ON DELETE CASCADE,
    CONSTRAINT fk_ha_amenity FOREIGN KEY (amenity_id) REFERENCES amenities(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Tiện nghi của từng khách sạn';

-- ============================================================
-- 5. ROOM TYPES & ROOM AVAILABILITY
-- ============================================================

CREATE TABLE room_types (
    id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    hotel_id            BIGINT UNSIGNED     NOT NULL,
    name                VARCHAR(100)        NOT NULL,   -- Deluxe, Suite, Standard...
    description         TEXT,
    max_adults          TINYINT UNSIGNED    NOT NULL DEFAULT 2,
    max_children        TINYINT UNSIGNED    NOT NULL DEFAULT 1,
    bed_type            VARCHAR(50),                    -- King, Twin, Double
    area_sqm            DECIMAL(6,2),
    base_price_per_night DECIMAL(12,2)     NOT NULL,
    total_rooms         SMALLINT UNSIGNED   NOT NULL DEFAULT 1,
    is_active           BOOLEAN             NOT NULL DEFAULT TRUE,
    created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_rt_hotel (hotel_id),
    CONSTRAINT fk_rt_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Loại phòng của khách sạn';

CREATE TABLE room_type_images (
    id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    room_type_id    BIGINT UNSIGNED     NOT NULL,
    url             VARCHAR(500)        NOT NULL,
    alt_text        VARCHAR(200),
    is_cover        BOOLEAN             NOT NULL DEFAULT FALSE,
    sort_order      TINYINT UNSIGNED    NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT fk_rti_rt FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Ảnh loại phòng';

CREATE TABLE room_type_amenities (
    room_type_id    BIGINT UNSIGNED     NOT NULL,
    amenity_id      SMALLINT UNSIGNED   NOT NULL,
    PRIMARY KEY (room_type_id, amenity_id),
    CONSTRAINT fk_rta_rt     FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE,
    CONSTRAINT fk_rta_amenity FOREIGN KEY (amenity_id)  REFERENCES amenities(id)  ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Tiện nghi của từng loại phòng';

-- Bảng phòng cụ thể chỉ cần nếu hotel track từng phòng riêng lẻ
-- Với mô hình đơn giản: track số lượng available qua room_availability
CREATE TABLE room_availability (
    id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    room_type_id    BIGINT UNSIGNED     NOT NULL,
    date            DATE                NOT NULL,
    available_rooms SMALLINT UNSIGNED   NOT NULL DEFAULT 0,
    price_override  DECIMAL(12,2),                      -- Giá đặc biệt ngày đó (NULL = dùng base_price)
    PRIMARY KEY (id),
    UNIQUE KEY uq_ra_room_date (room_type_id, date),
    INDEX idx_ra_date (date),
    CONSTRAINT fk_ra_rt FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Lịch phòng trống theo ngày';

-- ============================================================
-- 6. TOURS
-- ============================================================

CREATE TABLE tour_categories (
    id          SMALLINT UNSIGNED   NOT NULL AUTO_INCREMENT,
    name_vi     VARCHAR(80)         NOT NULL,
    name_en     VARCHAR(80)         NOT NULL,
    slug        VARCHAR(100)        NOT NULL UNIQUE,
    icon        VARCHAR(100),
    PRIMARY KEY (id)
) ENGINE=InnoDB COMMENT='Danh mục tour';

CREATE TABLE tours (
    id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    category_id         SMALLINT UNSIGNED   NOT NULL,
    city_id             INT UNSIGNED        NOT NULL,
    operator_id         BIGINT UNSIGNED,                -- user HOST tổ chức tour
    title               VARCHAR(250)        NOT NULL,
    slug                VARCHAR(270)        NOT NULL UNIQUE,
    description         TEXT,
    highlights          TEXT,
    includes            TEXT,                           -- JSON array: ['Meals', 'Guide', ...]
    excludes            TEXT,                           -- JSON array
    duration_days       TINYINT UNSIGNED    NOT NULL DEFAULT 1,
    duration_nights     TINYINT UNSIGNED    NOT NULL DEFAULT 0,
    max_group_size      TINYINT UNSIGNED    NOT NULL DEFAULT 15,
    min_group_size      TINYINT UNSIGNED    NOT NULL DEFAULT 1,
    difficulty          ENUM('EASY','MEDIUM','HARD') NOT NULL DEFAULT 'EASY',
    price_per_adult     DECIMAL(12,2)       NOT NULL,
    price_per_child     DECIMAL(12,2)       NOT NULL DEFAULT 0,
    avg_rating          DECIMAL(3,2)        NOT NULL DEFAULT 0.00,
    review_count        INT UNSIGNED        NOT NULL DEFAULT 0,
    is_featured         BOOLEAN             NOT NULL DEFAULT FALSE,
    is_active           BOOLEAN             NOT NULL DEFAULT TRUE,
    created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_tours_category (category_id),
    INDEX idx_tours_city (city_id),
    INDEX idx_tours_operator (operator_id),
    INDEX idx_tours_slug (slug),
    INDEX idx_tours_featured (is_featured),
    CONSTRAINT fk_tours_cat      FOREIGN KEY (category_id) REFERENCES tour_categories(id),
    CONSTRAINT fk_tours_city     FOREIGN KEY (city_id)     REFERENCES cities(id),
    CONSTRAINT fk_tours_operator FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Thông tin tour du lịch';

CREATE TABLE tour_images (
    id          BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    tour_id     BIGINT UNSIGNED     NOT NULL,
    url         VARCHAR(500)        NOT NULL,
    alt_text    VARCHAR(200),
    is_cover    BOOLEAN             NOT NULL DEFAULT FALSE,
    sort_order  TINYINT UNSIGNED    NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT fk_ti_tour FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Ảnh tour';

CREATE TABLE tour_itinerary (
    id          BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    tour_id     BIGINT UNSIGNED     NOT NULL,
    day_number  TINYINT UNSIGNED    NOT NULL,
    title       VARCHAR(200)        NOT NULL,
    description TEXT,
    PRIMARY KEY (id),
    INDEX idx_tit_tour (tour_id),
    CONSTRAINT fk_tit_tour FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Lịch trình ngày của tour';

CREATE TABLE tour_departures (
    id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    tour_id         BIGINT UNSIGNED     NOT NULL,
    departure_date  DATE                NOT NULL,
    available_slots TINYINT UNSIGNED    NOT NULL DEFAULT 0,
    price_override  DECIMAL(12,2),
    PRIMARY KEY (id),
    INDEX idx_td_tour (tour_id),
    INDEX idx_td_date (departure_date),
    CONSTRAINT fk_td_tour FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Lịch khởi hành của tour';

CREATE TABLE tour_amenities (
    tour_id     BIGINT UNSIGNED     NOT NULL,
    amenity_id  SMALLINT UNSIGNED   NOT NULL,
    PRIMARY KEY (tour_id, amenity_id),
    CONSTRAINT fk_toa_tour    FOREIGN KEY (tour_id)    REFERENCES tours(id)    ON DELETE CASCADE,
    CONSTRAINT fk_toa_amenity FOREIGN KEY (amenity_id) REFERENCES amenities(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Tiện ích / dịch vụ đi kèm tour';

-- ============================================================
-- 7. BOOKINGS (Hotel & Tour dùng chung bảng)
-- ============================================================

CREATE TABLE bookings (
    id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    booking_code        VARCHAR(20)         NOT NULL UNIQUE,    -- TRS-20260304-XXXXX
    user_id             BIGINT UNSIGNED     NOT NULL,
    booking_type        ENUM('HOTEL','TOUR') NOT NULL,
    status              ENUM('PENDING','CONFIRMED','CHECKED_IN','COMPLETED','CANCELLED','REFUNDED')
                            NOT NULL DEFAULT 'PENDING',
    -- Thông tin khách hàng (snapshot lúc đặt)
    guest_name          VARCHAR(100)        NOT NULL,
    guest_email         VARCHAR(150)        NOT NULL,
    guest_phone         VARCHAR(20)         NOT NULL,
    -- Tài chính
    subtotal            DECIMAL(14,2)       NOT NULL,
    discount_amount     DECIMAL(14,2)       NOT NULL DEFAULT 0,
    tax_amount          DECIMAL(14,2)       NOT NULL DEFAULT 0,
    total_amount        DECIMAL(14,2)       NOT NULL,
    currency            CHAR(3)             NOT NULL DEFAULT 'VND',
    -- Ghi chú
    special_requests    TEXT,
    cancel_reason       TEXT,
    cancelled_at        DATETIME,
    confirmed_at        DATETIME,
    created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_bookings_user   (user_id),
    INDEX idx_bookings_code   (booking_code),
    INDEX idx_bookings_status (status),
    INDEX idx_bookings_type   (booking_type),
    CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB COMMENT='Đơn đặt phòng / tour';

-- Chi tiết booking hotel
CREATE TABLE booking_hotel_details (
    id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    booking_id      BIGINT UNSIGNED     NOT NULL UNIQUE,
    hotel_id        BIGINT UNSIGNED     NOT NULL,
    room_type_id    BIGINT UNSIGNED     NOT NULL,
    check_in_date   DATE                NOT NULL,
    check_out_date  DATE                NOT NULL,
    nights          TINYINT UNSIGNED    NOT NULL,
    num_rooms       TINYINT UNSIGNED    NOT NULL DEFAULT 1,
    adults          TINYINT UNSIGNED    NOT NULL DEFAULT 2,
    children        TINYINT UNSIGNED    NOT NULL DEFAULT 0,
    -- Snapshot giá lúc đặt
    hotel_name      VARCHAR(200)        NOT NULL,
    room_type_name  VARCHAR(100)        NOT NULL,
    price_per_night DECIMAL(12,2)       NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_bhd_booking   FOREIGN KEY (booking_id)   REFERENCES bookings(id)    ON DELETE CASCADE,
    CONSTRAINT fk_bhd_hotel     FOREIGN KEY (hotel_id)     REFERENCES hotels(id),
    CONSTRAINT fk_bhd_room_type FOREIGN KEY (room_type_id) REFERENCES room_types(id)
) ENGINE=InnoDB COMMENT='Chi tiết booking khách sạn';

-- Chi tiết booking tour
CREATE TABLE booking_tour_details (
    id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    booking_id          BIGINT UNSIGNED     NOT NULL UNIQUE,
    tour_id             BIGINT UNSIGNED     NOT NULL,
    departure_id        BIGINT UNSIGNED     NOT NULL,
    num_adults          TINYINT UNSIGNED    NOT NULL DEFAULT 1,
    num_children        TINYINT UNSIGNED    NOT NULL DEFAULT 0,
    -- Snapshot giá lúc đặt
    tour_title          VARCHAR(250)        NOT NULL,
    departure_date      DATE                NOT NULL,
    price_per_adult     DECIMAL(12,2)       NOT NULL,
    price_per_child     DECIMAL(12,2)       NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT fk_btd_booking   FOREIGN KEY (booking_id)  REFERENCES bookings(id)       ON DELETE CASCADE,
    CONSTRAINT fk_btd_tour      FOREIGN KEY (tour_id)     REFERENCES tours(id),
    CONSTRAINT fk_btd_departure FOREIGN KEY (departure_id) REFERENCES tour_departures(id)
) ENGINE=InnoDB COMMENT='Chi tiết booking tour';

-- ============================================================
-- 7.1 CHAT (Bot + Partner)
-- ============================================================

CREATE TABLE conversations (
    id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    type            VARCHAR(10)         NOT NULL,                -- BOT / P2P_TOUR / P2P_HOTEL
    client_id       BIGINT UNSIGNED     NOT NULL,
    partner_id      BIGINT UNSIGNED,
    reference_id    BIGINT UNSIGNED,
    booking_id      BIGINT UNSIGNED,
    created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_conv_client  (client_id),
    INDEX idx_conv_partner (partner_id),
    INDEX idx_conv_updated (updated_at),
    CONSTRAINT fk_conv_client  FOREIGN KEY (client_id)  REFERENCES users(id),
    CONSTRAINT fk_conv_partner FOREIGN KEY (partner_id) REFERENCES users(id),
    CONSTRAINT fk_conv_booking FOREIGN KEY (booking_id) REFERENCES bookings(id)
) ENGINE=InnoDB COMMENT='Phiên chat giữa khách-bot hoặc khách-đối tác';

CREATE TABLE chat_messages (
    id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    conversation_id BIGINT UNSIGNED     NOT NULL,
    sender_id       BIGINT UNSIGNED,
    content_type    VARCHAR(20)         NOT NULL DEFAULT 'TEXT', -- TEXT / IMAGE / BOOKING_DETAILS / SYSTEM_LOG
    content         TEXT,
    metadata        TEXT,
    is_read         BOOLEAN             NOT NULL DEFAULT FALSE,
    created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_msg_conversation (conversation_id),
    INDEX idx_msg_created      (created_at),
    CONSTRAINT fk_msg_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_msg_sender       FOREIGN KEY (sender_id)       REFERENCES users(id)
) ENGINE=InnoDB COMMENT='Tin nhắn trong phiên chat';

-- ============================================================
-- 8. PROMOTIONS & DISCOUNT CODES
-- ============================================================

CREATE TABLE promotions (
    id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    code                VARCHAR(30)         NOT NULL UNIQUE,
    name                VARCHAR(150)        NOT NULL,
    description         TEXT,
    discount_type       ENUM('PERCENTAGE','FIXED') NOT NULL,
    discount_value      DECIMAL(10,2)       NOT NULL,
    min_order_amount    DECIMAL(12,2)       NOT NULL DEFAULT 0,
    max_discount_amount DECIMAL(12,2),                          -- Giới hạn giảm tối đa
    usage_limit         INT UNSIGNED,                           -- NULL = không giới hạn
    used_count          INT UNSIGNED        NOT NULL DEFAULT 0,
    applies_to          ENUM('ALL','HOTEL','TOUR') NOT NULL DEFAULT 'ALL',
    valid_from          DATETIME            NOT NULL,
    valid_until         DATETIME            NOT NULL,
    is_active           BOOLEAN             NOT NULL DEFAULT TRUE,
    created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_promo_code (code)
) ENGINE=InnoDB COMMENT='Mã khuyến mãi / coupon';

CREATE TABLE booking_promotions (
    booking_id      BIGINT UNSIGNED     NOT NULL,
    promotion_id    BIGINT UNSIGNED     NOT NULL,
    discount_amount DECIMAL(12,2)       NOT NULL,
    PRIMARY KEY (booking_id, promotion_id),
    CONSTRAINT fk_bp_booking   FOREIGN KEY (booking_id)   REFERENCES bookings(id)    ON DELETE CASCADE,
    CONSTRAINT fk_bp_promotion FOREIGN KEY (promotion_id) REFERENCES promotions(id)
) ENGINE=InnoDB COMMENT='Mã giảm giá đã dùng trong booking';

-- ============================================================
-- 9. PAYMENTS
-- ============================================================

CREATE TABLE payment_methods (
    id      TINYINT UNSIGNED    NOT NULL AUTO_INCREMENT,
    code    VARCHAR(30)         NOT NULL UNIQUE,   -- CREDIT_CARD, MOMO, VNPAY, ZALOPAY, BANK_TRANSFER
    name    VARCHAR(80)         NOT NULL,
    logo    VARCHAR(300),
    is_active BOOLEAN           NOT NULL DEFAULT TRUE,
    PRIMARY KEY (id)
) ENGINE=InnoDB COMMENT='Phương thức thanh toán';

CREATE TABLE payments (
    id                  BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    booking_id          BIGINT UNSIGNED     NOT NULL,
    payment_method_id   TINYINT UNSIGNED    NOT NULL,
    amount              DECIMAL(14,2)       NOT NULL,
    currency            CHAR(3)             NOT NULL DEFAULT 'VND',
    status              ENUM('PENDING','SUCCESS','FAILED','REFUNDED','PARTIALLY_REFUNDED')
                            NOT NULL DEFAULT 'PENDING',
    transaction_id      VARCHAR(200) UNIQUE,                    -- ID từ cổng thanh toán
    gateway_response    JSON,                                   -- Raw response từ gateway
    paid_at             DATETIME,
    refunded_at         DATETIME,
    refund_amount       DECIMAL(14,2),
    created_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_payments_booking (booking_id),
    INDEX idx_payments_status  (status),
    INDEX idx_payments_txn     (transaction_id),
    CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id)         REFERENCES bookings(id),
    CONSTRAINT fk_payments_method  FOREIGN KEY (payment_method_id)  REFERENCES payment_methods(id)
) ENGINE=InnoDB COMMENT='Giao dịch thanh toán';

-- ============================================================
-- 10. REVIEWS & RATINGS
-- ============================================================

CREATE TABLE reviews (
    id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    user_id         BIGINT UNSIGNED     NOT NULL,
    booking_id      BIGINT UNSIGNED,                -- gắn với booking để đảm bảo đã đặt mới review được
    target_type     ENUM('HOTEL','TOUR') NOT NULL,
    target_id       BIGINT UNSIGNED     NOT NULL,
    overall_rating  TINYINT UNSIGNED    NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    -- Rating chi tiết (Hotel)
    cleanliness     TINYINT UNSIGNED    CHECK (cleanliness     BETWEEN 1 AND 5),
    location        TINYINT UNSIGNED    CHECK (location        BETWEEN 1 AND 5),
    service         TINYINT UNSIGNED    CHECK (service         BETWEEN 1 AND 5),
    value_for_money TINYINT UNSIGNED    CHECK (value_for_money BETWEEN 1 AND 5),
    -- Rating chi tiết (Tour)
    guide_quality   TINYINT UNSIGNED    CHECK (guide_quality   BETWEEN 1 AND 5),
    organization    TINYINT UNSIGNED    CHECK (organization    BETWEEN 1 AND 5),
    title           VARCHAR(150),
    comment         TEXT,
    is_verified     BOOLEAN             NOT NULL DEFAULT FALSE,  -- đã đặt + đã ở/đi
    is_published    BOOLEAN             NOT NULL DEFAULT TRUE,
    admin_reply     TEXT,
    admin_replied_at DATETIME,
    created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_reviews_user    (user_id),
    INDEX idx_reviews_target  (target_type, target_id),
    INDEX idx_reviews_booking (booking_id),
    CONSTRAINT fk_reviews_user    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
    CONSTRAINT fk_reviews_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Đánh giá khách sạn / tour';

CREATE TABLE review_images (
    id          BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    review_id   BIGINT UNSIGNED     NOT NULL,
    url         VARCHAR(500)        NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_ri_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Ảnh đính kèm đánh giá';

CREATE TABLE review_helpful_votes (
    review_id   BIGINT UNSIGNED     NOT NULL,
    user_id     BIGINT UNSIGNED     NOT NULL,
    is_helpful  BOOLEAN             NOT NULL DEFAULT TRUE,
    created_at  DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (review_id, user_id),
    CONSTRAINT fk_rhv_review FOREIGN KEY (review_id) REFERENCES reviews(id) ON DELETE CASCADE,
    CONSTRAINT fk_rhv_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Hữu ích / không hữu ích của review';

-- ============================================================
-- 11. FAVORITES (Danh sách yêu thích)
-- ============================================================

CREATE TABLE favorites (
    id          BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    user_id     BIGINT UNSIGNED     NOT NULL,
    target_type ENUM('HOTEL','TOUR') NOT NULL,
    target_id   BIGINT UNSIGNED     NOT NULL,
    created_at  DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_fav_user_target (user_id, target_type, target_id),
    INDEX idx_fav_user (user_id),
    CONSTRAINT fk_fav_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Danh sách yêu thích của người dùng';

-- ============================================================
-- 12. SEARCH HISTORY
-- ============================================================

CREATE TABLE search_history (
    id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    user_id         BIGINT UNSIGNED,                    -- NULL = khách không đăng nhập (dùng session)
    session_id      VARCHAR(128),
    search_type     ENUM('HOTEL','TOUR','ALL') NOT NULL DEFAULT 'ALL',
    keyword         VARCHAR(255),
    city_id         INT UNSIGNED,
    check_in        DATE,
    check_out       DATE,
    adults          TINYINT UNSIGNED,
    children        TINYINT UNSIGNED,
    rooms           TINYINT UNSIGNED,
    price_min       DECIMAL(12,2),
    price_max       DECIMAL(12,2),
    results_count   INT UNSIGNED,
    created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_sh_user (user_id),
    INDEX idx_sh_created (created_at),
    CONSTRAINT fk_sh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Lịch sử tìm kiếm';

-- ============================================================
-- 13. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id          BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    user_id     BIGINT UNSIGNED     NOT NULL,
    type        ENUM('BOOKING_CONFIRMED','BOOKING_CANCELLED','PAYMENT_SUCCESS',
                     'PAYMENT_FAILED','REVIEW_REPLY','PROMOTION','SYSTEM')
                    NOT NULL,
    title       VARCHAR(200)        NOT NULL,
    message     TEXT                NOT NULL,
    reference_type  VARCHAR(20),                    -- BOOKING, REVIEW, TOUR, HOTEL
    reference_id    BIGINT UNSIGNED,
    is_read     BOOLEAN             NOT NULL DEFAULT FALSE,
    read_at     DATETIME,
    created_at  DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_notif_user   (user_id),
    INDEX idx_notif_unread (user_id, is_read),
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Thông báo người dùng';

-- ============================================================
-- 14. FORUM (Cộng đồng du lịch)
-- ============================================================

CREATE TABLE forum_categories (
    id          SMALLINT UNSIGNED   NOT NULL AUTO_INCREMENT,
    name        VARCHAR(100)        NOT NULL,
    slug        VARCHAR(120)        NOT NULL UNIQUE,
    description VARCHAR(300),
    sort_order  TINYINT UNSIGNED    NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
) ENGINE=InnoDB COMMENT='Danh mục diễn đàn';

CREATE TABLE forum_posts (
    id              BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    category_id     SMALLINT UNSIGNED   NOT NULL,
    user_id         BIGINT UNSIGNED     NOT NULL,
    title           VARCHAR(300)        NOT NULL,
    slug            VARCHAR(320)        NOT NULL UNIQUE,
    content         LONGTEXT            NOT NULL,
    cover_image     VARCHAR(500),
    view_count      INT UNSIGNED        NOT NULL DEFAULT 0,
    reply_count     INT UNSIGNED        NOT NULL DEFAULT 0,
    is_pinned       BOOLEAN             NOT NULL DEFAULT FALSE,
    is_published    BOOLEAN             NOT NULL DEFAULT TRUE,
    created_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_fp_category (category_id),
    INDEX idx_fp_user     (user_id),
    INDEX idx_fp_slug     (slug),
    FULLTEXT INDEX ft_fp_title_content (title, content),
    CONSTRAINT fk_fp_category FOREIGN KEY (category_id) REFERENCES forum_categories(id),
    CONSTRAINT fk_fp_user     FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Bài viết diễn đàn';

CREATE TABLE forum_replies (
    id          BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    post_id     BIGINT UNSIGNED     NOT NULL,
    user_id     BIGINT UNSIGNED     NOT NULL,
    parent_id   BIGINT UNSIGNED,                    -- NULL = reply trực tiếp, có giá trị = nested reply
    content     TEXT                NOT NULL,
    is_published BOOLEAN            NOT NULL DEFAULT TRUE,
    created_at  DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_fr_post   (post_id),
    INDEX idx_fr_user   (user_id),
    INDEX idx_fr_parent (parent_id),
    CONSTRAINT fk_fr_post   FOREIGN KEY (post_id)   REFERENCES forum_posts(id)   ON DELETE CASCADE,
    CONSTRAINT fk_fr_user   FOREIGN KEY (user_id)   REFERENCES users(id)         ON DELETE CASCADE,
    CONSTRAINT fk_fr_parent FOREIGN KEY (parent_id) REFERENCES forum_replies(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Phản hồi bài viết diễn đàn';

CREATE TABLE forum_post_likes (
    post_id     BIGINT UNSIGNED     NOT NULL,
    user_id     BIGINT UNSIGNED     NOT NULL,
    created_at  DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (post_id, user_id),
    CONSTRAINT fk_fpl_post FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_fpl_user FOREIGN KEY (user_id) REFERENCES users(id)       ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Lượt thích bài viết diễn đàn';

-- ============================================================
-- 15. ADMIN AUDIT LOG
-- ============================================================

CREATE TABLE audit_logs (
    id          BIGINT UNSIGNED     NOT NULL AUTO_INCREMENT,
    user_id     BIGINT UNSIGNED,
    actor_email VARCHAR(255),
    action      VARCHAR(80)         NOT NULL,   -- CREATE_HOTEL, CANCEL_BOOKING, ...
    entity_type VARCHAR(50)         NOT NULL,   -- hotels, bookings, users ...
    entity_id   BIGINT UNSIGNED,
    old_value   JSON,
    new_value   JSON,
    reason      VARCHAR(500),
    ip_address  VARCHAR(45),
    user_agent  VARCHAR(255),
    created_at  DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_al_user   (user_id),
    INDEX idx_al_entity (entity_type, entity_id),
    INDEX idx_al_action (action),
    CONSTRAINT fk_al_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Nhật ký hành động admin';

-- ============================================================
-- 16. TRIGGERS: Tự động cập nhật avg_rating
-- ============================================================

DELIMITER $$

-- Cập nhật avg_rating của hotel sau khi thêm review
CREATE TRIGGER trg_update_hotel_rating_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    IF NEW.target_type = 'HOTEL' AND NEW.is_published = TRUE THEN
        UPDATE hotels
        SET avg_rating   = (
                SELECT ROUND(AVG(overall_rating), 2)
                FROM reviews
                WHERE target_type = 'HOTEL' AND target_id = NEW.target_id AND is_published = TRUE
            ),
            review_count = (
                SELECT COUNT(*) FROM reviews
                WHERE target_type = 'HOTEL' AND target_id = NEW.target_id AND is_published = TRUE
            )
        WHERE id = NEW.target_id;
    END IF;

    IF NEW.target_type = 'TOUR' AND NEW.is_published = TRUE THEN
        UPDATE tours
        SET avg_rating   = (
                SELECT ROUND(AVG(overall_rating), 2)
                FROM reviews
                WHERE target_type = 'TOUR' AND target_id = NEW.target_id AND is_published = TRUE
            ),
            review_count = (
                SELECT COUNT(*) FROM reviews
                WHERE target_type = 'TOUR' AND target_id = NEW.target_id AND is_published = TRUE
            )
        WHERE id = NEW.target_id;
    END IF;
END$$

-- Cập nhật sau khi xoá review
CREATE TRIGGER trg_update_rating_delete
AFTER DELETE ON reviews
FOR EACH ROW
BEGIN
    IF OLD.target_type = 'HOTEL' THEN
        UPDATE hotels
        SET avg_rating   = COALESCE((SELECT ROUND(AVG(overall_rating),2) FROM reviews WHERE target_type='HOTEL' AND target_id=OLD.target_id AND is_published=TRUE), 0),
            review_count = (SELECT COUNT(*) FROM reviews WHERE target_type='HOTEL' AND target_id=OLD.target_id AND is_published=TRUE)
        WHERE id = OLD.target_id;
    ELSEIF OLD.target_type = 'TOUR' THEN
        UPDATE tours
        SET avg_rating   = COALESCE((SELECT ROUND(AVG(overall_rating),2) FROM reviews WHERE target_type='TOUR' AND target_id=OLD.target_id AND is_published=TRUE), 0),
            review_count = (SELECT COUNT(*) FROM reviews WHERE target_type='TOUR' AND target_id=OLD.target_id AND is_published=TRUE)
        WHERE id = OLD.target_id;
    END IF;
END$$

-- Sinh booking_code tự động
CREATE TRIGGER trg_booking_code
BEFORE INSERT ON bookings
FOR EACH ROW
BEGIN
    SET NEW.booking_code = CONCAT(
        'TRS-',
        DATE_FORMAT(NOW(), '%Y%m%d'),
        '-',
        UPPER(SUBSTRING(MD5(RAND()), 1, 6))
    );
END$$

DELIMITER ;

-- ============================================================
-- 17. DỮ LIỆU MẪU (Seed Data)
-- ============================================================

-- Roles
INSERT INTO roles (name, description) VALUES
('ADMIN', 'Quản trị viên hệ thống'),
('USER',  'Người dùng thông thường'),
('HOST',  'Chủ khách sạn / Điều hành tour');

-- Countries
INSERT INTO countries (code, name_vi, name_en) VALUES
('VN', 'Việt Nam',       'Vietnam'),
('TH', 'Thái Lan',       'Thailand'),
('JP', 'Nhật Bản',       'Japan'),
('FR', 'Pháp',           'France'),
('IT', 'Ý',              'Italy'),
('SG', 'Singapore',      'Singapore'),
('ID', 'Indonesia',      'Indonesia'),
('US', 'Hoa Kỳ',         'United States');

-- Cities
INSERT INTO cities (country_id, name_vi, name_en, slug, is_popular) VALUES
(1, 'Hà Nội',      'Hanoi',          'ha-noi',       TRUE),
(1, 'Hồ Chí Minh', 'Ho Chi Minh',    'ho-chi-minh',  TRUE),
(1, 'Đà Nẵng',     'Da Nang',        'da-nang',       TRUE),
(1, 'Hội An',      'Hoi An',         'hoi-an',        TRUE),
(1, 'Nha Trang',   'Nha Trang',      'nha-trang',     TRUE),
(1, 'Phú Quốc',    'Phu Quoc',       'phu-quoc',      TRUE),
(1, 'Sapa',        'Sapa',           'sapa',          TRUE),
(2, 'Bangkok',     'Bangkok',        'bangkok',       TRUE),
(2, 'Phuket',      'Phuket',         'phuket',        TRUE),
(3, 'Tokyo',       'Tokyo',          'tokyo',         TRUE),
(3, 'Osaka',       'Osaka',          'osaka',         FALSE),
(6, 'Singapore',   'Singapore City', 'singapore',     TRUE);

-- Amenities
INSERT INTO amenities (code, name_vi, name_en, category) VALUES
('wifi',            'Wifi miễn phí',        'Free WiFi',           'BOTH'),
('parking',         'Bãi đỗ xe miễn phí',  'Free Parking',        'HOTEL'),
('pool',            'Hồ bơi',               'Swimming Pool',        'BOTH'),
('gym',             'Phòng gym',            'Fitness Center',       'HOTEL'),
('spa',             'Spa',                  'Spa',                  'BOTH'),
('restaurant',      'Nhà hàng',             'Restaurant',           'HOTEL'),
('bar',             'Bar',                  'Bar',                  'HOTEL'),
('breakfast',       'Bữa sáng',             'Breakfast Included',   'HOTEL'),
('pet_friendly',    'Thú cưng được phép',  'Pet Friendly',         'HOTEL'),
('air_conditioning','Máy lạnh',            'Air Conditioning',     'HOTEL'),
('airport_transfer','Đưa đón sân bay',     'Airport Transfer',     'TOUR'),
('meals',           'Bữa ăn',               'Meals Included',       'TOUR'),
('guide',           'Hướng dẫn viên',       'Tour Guide',           'TOUR'),
('insurance',       'Bảo hiểm du lịch',    'Travel Insurance',     'TOUR');

-- Payment Methods
INSERT INTO payment_methods (code, name) VALUES
('CREDIT_CARD',    'Thẻ Visa / Mastercard'),
('MOMO',           'Ví MoMo'),
('VNPAY',          'VNPay'),
('ZALOPAY',        'ZaloPay'),
('BANK_TRANSFER',  'Chuyển khoản ngân hàng');

-- Tour Categories
INSERT INTO tour_categories (name_vi, name_en, slug) VALUES
('Du lịch biển',      'Beach & Island',   'beach-island'),
('Leo núi & Trekking','Trekking',          'trekking'),
('Văn hoá & Di sản',  'Culture & Heritage','culture-heritage'),
('Ẩm thực',          'Food & Culinary',   'food-culinary'),
('Phiêu lưu',        'Adventure',         'adventure'),
('Honeymoon',        'Honeymoon',          'honeymoon'),
('Gia đình',         'Family',             'family');

-- Forum Categories
INSERT INTO forum_categories (name, slug, sort_order) VALUES
('Kinh nghiệm du lịch',     'kinh-nghiem-du-lich',  1),
('Hỏi đáp',                 'hoi-dap',               2),
('Chia sẻ hình ảnh',        'hinh-anh',              3),
('Tìm bạn đồng hành',       'tim-ban-dong-hanh',     4),
('Đánh giá khách sạn',      'danh-gia-khach-san',    5);

-- Admin user (password: Admin@12345 - đã hash bcrypt)
INSERT INTO users (email, password_hash, full_name, role_id, is_active, is_email_verified) VALUES
('admin@tourista.vn', '$2a$12$placeholder_bcrypt_hash_here', 'Admin Tourista', 1, TRUE, TRUE);

-- ============================================================
-- KÍCH HOẠT lại 
-- ============================================================
SET FOREIGN_KEY_CHECKS = 1;
