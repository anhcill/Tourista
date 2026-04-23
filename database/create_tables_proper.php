<?php
$pdo = new PDO('mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway', 'root', 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

echo "========================================\n";
echo "  TAO LAI BANG DUNG CHUAN\n";
echo "========================================\n\n";

$pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

// 1. Users
echo "[1] users...\n";
try { $pdo->exec("DROP TABLE IF EXISTS users"); } catch(Exception $e) {}
$pdo->exec("CREATE TABLE users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(100),
    phone VARCHAR(15),
    avatar_url VARCHAR(500),
    date_of_birth DATE,
    gender ENUM('MALE','FEMALE','OTHER'),
    nationality VARCHAR(60),
    role_id TINYINT UNSIGNED,
    status ENUM('ACTIVE','LOCKED','BANNED') DEFAULT 'ACTIVE',
    is_email_verified TINYINT(1) DEFAULT 0,
    email_verified_at DATETIME,
    failed_attempts INT DEFAULT 0,
    locked_until DATETIME,
    auth_provider ENUM('LOCAL','GOOGLE') DEFAULT 'LOCAL',
    provider_id VARCHAR(100),
    last_login_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_email (email),
    KEY idx_role (role_id),
    KEY idx_status (status)
) ENGINE=InnoDB");
echo "   OK\n\n";

// 2. Hotels
echo "[2] hotels...\n";
try { $pdo->exec("DROP TABLE IF EXISTS hotels"); } catch(Exception $e) {}
$pdo->exec("CREATE TABLE hotels (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    city_id INT UNSIGNED NOT NULL,
    owner_id BIGINT UNSIGNED,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL,
    description TEXT,
    address VARCHAR(300) NOT NULL,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    star_rating TINYINT UNSIGNED DEFAULT 3,
    avg_rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INT UNSIGNED DEFAULT 0,
    check_in_time TIME DEFAULT '14:00:00',
    check_out_time TIME DEFAULT '12:00:00',
    phone VARCHAR(20),
    email VARCHAR(150),
    website VARCHAR(300),
    is_featured TINYINT(1) DEFAULT 0,
    is_trending TINYINT(1) DEFAULT 0,
    admin_status ENUM('PENDING','APPROVED','REJECTED','SUSPENDED') DEFAULT 'APPROVED',
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_slug (slug),
    KEY idx_city (city_id),
    KEY idx_owner (owner_id),
    KEY idx_rating (avg_rating)
) ENGINE=InnoDB");
echo "   OK\n\n";

// 3. Reviews
echo "[3] reviews...\n";
try { $pdo->exec("DROP TABLE IF EXISTS reviews"); } catch(Exception $e) {}
$pdo->exec("CREATE TABLE reviews (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    booking_id BIGINT UNSIGNED,
    target_type ENUM('HOTEL','TOUR') NOT NULL,
    target_id BIGINT UNSIGNED NOT NULL,
    overall_rating DECIMAL(3,2),
    title VARCHAR(200),
    comment TEXT,
    is_verified TINYINT(1) DEFAULT 0,
    is_published TINYINT(1) DEFAULT 0,
    moderation_status ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
    rejection_reason VARCHAR(255),
    helpful_count INT UNSIGNED DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_user (user_id),
    KEY idx_target (target_type, target_id),
    KEY idx_published (is_published, moderation_status),
    KEY idx_rating (overall_rating)
) ENGINE=InnoDB");
echo "   OK\n\n";

// 4. Hotel_images
echo "[4] hotel_images...\n";
try { $pdo->exec("DROP TABLE IF EXISTS hotel_images"); } catch(Exception $e) {}
$pdo->exec("CREATE TABLE hotel_images (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    hotel_id BIGINT UNSIGNED NOT NULL,
    url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(200),
    is_cover TINYINT(1) DEFAULT 0,
    sort_order TINYINT UNSIGNED DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_hotel (hotel_id)
) ENGINE=InnoDB");
echo "   OK\n\n";

// 5. Them Foreign Keys
echo "[5] Them Foreign Keys...\n";
try { $pdo->exec("ALTER TABLE hotels ADD CONSTRAINT fk_hotels_city FOREIGN KEY (city_id) REFERENCES cities(id)"); } catch(Exception $e) {}
try { $pdo->exec("ALTER TABLE hotels ADD CONSTRAINT fk_hotels_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL"); } catch(Exception $e) {}
try { $pdo->exec("ALTER TABLE reviews ADD CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id)"); } catch(Exception $e) {}
try { $pdo->exec("ALTER TABLE hotel_images ADD CONSTRAINT fk_hi_hotel FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE"); } catch(Exception $e) {}
echo "   OK\n\n";

$pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

// Kiem tra
echo "========================================\n";
echo "  KET QUA\n";
echo "========================================\n";
$tables = ['users', 'hotels', 'reviews', 'hotel_images'];
foreach ($tables as $t) {
    $c = $pdo->query("SELECT COUNT(*) FROM $t")->fetchColumn();
    $fks = $pdo->query("SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA='railway' AND TABLE_NAME='$t' AND REFERENCED_TABLE_NAME IS NOT NULL")->fetchColumn();
    echo "  $t: $c rows, $fks FKs\n";
}
echo "========================================\n";
echo "  ✅ XONG!\n";
echo "========================================\n";
