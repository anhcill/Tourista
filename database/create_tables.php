<?php
$pdo = new PDO('mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway', 'root', 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

echo "Tao lai bang hotels...\n";
$pdo->exec("CREATE TABLE IF NOT EXISTS hotels (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    city_id INT UNSIGNED NOT NULL,
    owner_id BIGINT UNSIGNED,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL UNIQUE,
    description TEXT,
    address VARCHAR(300) NOT NULL,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    star_rating TINYINT UNSIGNED NOT NULL DEFAULT 3,
    avg_rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    review_count INT UNSIGNED NOT NULL DEFAULT 0,
    check_in_time TIME NOT NULL DEFAULT '14:00:00',
    check_out_time TIME NOT NULL DEFAULT '12:00:00',
    phone VARCHAR(20),
    email VARCHAR(150),
    website VARCHAR(300),
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_trending BOOLEAN NOT NULL DEFAULT FALSE,
    admin_status ENUM('PENDING','APPROVED','REJECTED','SUSPENDED') NOT NULL DEFAULT 'APPROVED',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_hotels_city (city_id),
    INDEX idx_hotels_owner (owner_id),
    INDEX idx_hotels_slug (slug),
    INDEX idx_hotels_rating (avg_rating),
    INDEX idx_hotels_featured (is_featured)
) ENGINE=InnoDB");
echo "OK\n";

echo "Tao lai bang hotel_images...\n";
$pdo->exec("CREATE TABLE IF NOT EXISTS hotel_images (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    hotel_id BIGINT UNSIGNED NOT NULL,
    url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(200),
    is_cover BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_hi_hotel (hotel_id)
) ENGINE=InnoDB");
echo "OK\n";

echo "Tao lai bang reviews...\n";
$pdo->exec("CREATE TABLE IF NOT EXISTS reviews (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    booking_id BIGINT UNSIGNED,
    target_type ENUM('HOTEL','TOUR') NOT NULL,
    target_id BIGINT UNSIGNED NOT NULL,
    overall_rating DECIMAL(3,2),
    title VARCHAR(200),
    comment TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    moderation_status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
    rejection_reason VARCHAR(255),
    helpful_count INT UNSIGNED NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_reviews_user (user_id),
    INDEX idx_reviews_target (target_type, target_id),
    INDEX idx_reviews_published (is_published, moderation_status),
    INDEX idx_reviews_rating (overall_rating)
) ENGINE=InnoDB");
echo "OK\n";

echo "\nKiem tra:\n";
foreach (['users', 'hotels', 'reviews', 'hotel_images'] as $t) {
    $c = $pdo->query("SELECT COUNT(*) FROM $t")->fetchColumn();
    echo "  $t: $c rows\n";
}
echo "\n✅ Xong!\n";
