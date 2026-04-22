<?php
/**
 * TOURISTA - Import Hotels + Reviews (SMALL BATCH - 1000 rows)
 */

function esc($val) {
    return str_replace(["'", "\\"], ["''", "\\\\"], trim($val ?? ''));
}

try {
    $pdo = new PDO(
        'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
        'root',
        'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    // Tăng timeout
    $pdo->exec("SET SESSION wait_timeout = 28800");
    $pdo->exec("SET SESSION interactive_timeout = 28800");
} catch (Exception $e) {
    die("Lỗi kết nối: " . $e->getMessage() . "\n");
}

echo "==================================================\n";
echo "  TOURISTA - IMPORT\n";
echo "==================================================\n\n";

$csvFile = 'C:/Users/ducan/Downloads/archive/hotels_users_ratings.csv';

// 1. Cities - ALL 10 cities from CSV
echo "[1] Thêm cities (10 thanh pho)...\n";
$pdo->exec("INSERT IGNORE INTO cities (country_id, name_vi, name_en, slug, is_popular, is_active) VALUES 
    (1, 'Hà Nội', 'Hanoi', 'ha-noi', TRUE, TRUE),
    (1, 'Hồ Chí Minh', 'Ho Chi Minh', 'ho-chi-minh', TRUE, TRUE),
    (1, 'Đà Nẵng', 'Da Nang', 'da-nang', TRUE, TRUE),
    (1, 'Đà Lạt', 'Da Lat', 'da-lat', TRUE, TRUE),
    (1, 'Vũng Tàu', 'Vung Tau', 'vung-tau', TRUE, TRUE),
    (1, 'Huế', 'Hue', 'hue', TRUE, TRUE),
    (1, 'Nha Trang', 'Nha Trang', 'nha-trang', TRUE, TRUE),
    (1, 'Phú Quốc', 'Phu Quoc', 'phu-quoc', TRUE, TRUE),
    (1, 'Hội An', 'Hoi An', 'hoi-an', TRUE, TRUE),
    (1, 'Sa Pa', 'Sa Pa', 'sa-pa', TRUE, TRUE)
");
echo "   OK\n\n";

// 2. Staging
echo "[2] Tạo staging...\n";
$pdo->exec("DROP TABLE IF EXISTS stg_hotels_reviews_csv");
$pdo->exec("CREATE TABLE stg_hotels_reviews_csv (
    row_no BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    hotel_source_id BIGINT,
    user_source_id BIGINT,
    rating_raw DECIMAL(4,2),
    hotel_name VARCHAR(255),
    hotel_description TEXT,
    hotel_address VARCHAR(500),
    location_raw VARCHAR(200),
    url_hotel TEXT,
    user_name VARCHAR(150)
) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
echo "   OK\n\n";

// 3. Import CSV - batch 1000
echo "[3] Import CSV (batch 1000)...\n";
$handle = fopen($csvFile, 'r');
fgetcsv($handle);

$batch = [];
$batchSize = 1000;
$total = 0;

while (($row = fgetcsv($handle)) !== false) {
    if (count($row) >= 9) {
        $batch[] = sprintf(
            "(%s, %s, %s, '%s', '%s', '%s', '%s', '%s', '%s')",
            $row[2] ?: 'NULL',
            $row[6] ?: 'NULL',
            $row[8] !== '' ? (float)$row[8] : 'NULL',
            esc($row[3]),
            esc($row[4]),
            esc($row[5]),
            esc($row[1]),
            esc($row[0]),
            esc($row[7])
        );
        
        if (count($batch) >= $batchSize) {
            $pdo->exec("INSERT INTO stg_hotels_reviews_csv 
                (hotel_source_id, user_source_id, rating_raw, hotel_name, hotel_description, hotel_address, location_raw, url_hotel, user_name) 
                VALUES " . implode(",\n", $batch));
            $total += count($batch);
            echo "   $total rows...\n";
            $batch = [];
        }
    }
}

if (!empty($batch)) {
    $pdo->exec("INSERT INTO stg_hotels_reviews_csv 
        (hotel_source_id, user_source_id, rating_raw, hotel_name, hotel_description, hotel_address, location_raw, url_hotel, user_name) 
        VALUES " . implode(",\n", $batch));
    $total += count($batch);
}
fclose($handle);
echo "   OK - $total rows\n\n";

// 4. Normalize
echo "[4] Chuẩn hóa...\n";
$pdo->exec("UPDATE stg_hotels_reviews_csv SET 
    location_raw = NULLIF(TRIM(location_raw), ''),
    hotel_name = NULLIF(TRIM(hotel_name), ''),
    hotel_description = NULLIF(TRIM(hotel_description), ''),
    hotel_address = NULLIF(TRIM(hotel_address), ''),
    user_name = NULLIF(TRIM(user_name), ''),
    url_hotel = NULLIF(TRIM(url_hotel), ''),
    rating_raw = LEAST(5, GREATEST(1, COALESCE(rating_raw, 0)))
");
echo "   OK\n\n";

$pdo->beginTransaction();

// 5. Mapping table
echo "[5] Tạo mapping...\n";
$pdo->exec("DROP TABLE IF EXISTS import_hotel_source_map");
$pdo->exec("CREATE TABLE import_hotel_source_map (
    source_hotel_id BIGINT NOT NULL,
    hotel_id BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (source_hotel_id),
    INDEX idx_hotel (hotel_id)
) ENGINE=InnoDB");
echo "   OK\n\n";

// 6. Users
echo "[6] Tạo users...\n";
$pdo->exec("INSERT IGNORE INTO users 
    (email, password_hash, full_name, role_id, status, is_email_verified, failed_attempts, auth_provider, provider_id, created_at, updated_at)
    SELECT DISTINCT
        CONCAT('csvu_', user_source_id, '@import.local'),
        NULL, 
        COALESCE(NULLIF(user_name, ''), CONCAT('User ', user_source_id)),
        (SELECT id FROM roles WHERE name = 'USER'),
        'ACTIVE', TRUE, 0, 'LOCAL', CONCAT('CSV:', user_source_id), NOW(), NOW()
    FROM stg_hotels_reviews_csv
    WHERE user_source_id IS NOT NULL
");
$users = $pdo->query("SELECT COUNT(*) FROM users WHERE email LIKE 'csvu_%@import.local'")->fetchColumn();
echo "   OK - $users users\n\n";

// 7. Hotels
echo "[7] Tạo hotels...\n";
$pdo->exec("INSERT IGNORE INTO hotels
    (city_id, name, slug, description, address, star_rating, avg_rating, review_count, check_in_time, check_out_time, website, is_featured, is_trending, is_active, created_at, updated_at)
    SELECT
        c.id,
        LEFT(s.hotel_name, 200),
        LEFT(CONCAT(LOWER(REGEXP_REPLACE(s.hotel_name COLLATE utf8mb4_unicode_ci, '[^a-zA-Z0-9]+', '-')), '-', s.hotel_source_id), 220),
        LEFT(COALESCE(s.hotel_description, 'Khach san import'), 255),
        LEFT(COALESCE(s.hotel_address, 'Dia chi cap nhat'), 255),
        3, 0.00, 0, '14:00:00', '12:00:00', LEFT(s.url_hotel, 255), FALSE, FALSE, TRUE, NOW(), NOW()
    FROM (
        SELECT hotel_source_id, MAX(hotel_name) as hotel_name, MAX(hotel_description) as hotel_description,
               MAX(hotel_address) as hotel_address, MAX(location_raw) as location_raw, MAX(url_hotel) as url_hotel
        FROM stg_hotels_reviews_csv
        WHERE hotel_source_id IS NOT NULL AND hotel_name IS NOT NULL
        GROUP BY hotel_source_id
    ) s
    JOIN cities c ON 
        LOWER(c.name_vi COLLATE utf8mb4_unicode_ci) = LOWER(REPLACE(s.location_raw COLLATE utf8mb4_unicode_ci, 'TP. ', '')) 
        OR LOWER(c.name_en COLLATE utf8mb4_unicode_ci) = LOWER(REPLACE(s.location_raw COLLATE utf8mb4_unicode_ci, 'TP. ', '')) 
        OR LOWER(c.name_vi COLLATE utf8mb4_unicode_ci) = LOWER(s.location_raw COLLATE utf8mb4_unicode_ci)
        OR LOWER(c.name_en COLLATE utf8mb4_unicode_ci) = LOWER(s.location_raw COLLATE utf8mb4_unicode_ci)
");
$hotels = $pdo->query("SELECT COUNT(*) FROM hotels")->fetchColumn();
echo "   OK - $hotels hotels\n\n";

// 8. Map hotels
echo "[8] Map hotels...\n";
$pdo->exec("INSERT IGNORE INTO import_hotel_source_map (source_hotel_id, hotel_id)
    SELECT DISTINCT s.hotel_source_id, h.id
    FROM stg_hotels_reviews_csv s
    JOIN hotels h ON h.slug = CONCAT(LOWER(REGEXP_REPLACE(s.hotel_name COLLATE utf8mb4_unicode_ci, '[^a-zA-Z0-9]+', '-')), '-', s.hotel_source_id)
    WHERE s.hotel_source_id IS NOT NULL
");
$mapped = $pdo->query("SELECT COUNT(*) FROM import_hotel_source_map")->fetchColumn();
echo "   OK - $mapped mapped\n\n";

// 9. Reviews - batch 5000 (limit 50000 total)
echo "[9] Tạo reviews (max 50000)...\n";
$batchSize = 5000;
$reviewCount = 0;
$maxReviews = 50000;

while ($reviewCount < $maxReviews) {
    $stmt = $pdo->prepare("INSERT IGNORE INTO reviews
        (user_id, booking_id, target_type, target_id, overall_rating, cleanliness, location, service, value_for_money, title, comment, is_verified, is_published, moderation_status, helpful_count, created_at, updated_at)
        SELECT
            u.id,
            NULL,
            'HOTEL',
            m.hotel_id,
            CAST(ROUND(s.rating_raw) AS UNSIGNED),
            CAST(ROUND(s.rating_raw) AS UNSIGNED),
            CAST(ROUND(s.rating_raw) AS UNSIGNED),
            CAST(ROUND(s.rating_raw) AS UNSIGNED),
            CAST(ROUND(s.rating_raw) AS UNSIGNED),
            NULL,
            CONCAT('Danh gia import: ', LEFT(COALESCE(s.hotel_description, 'Trai nghiem tot'), 500)),
            FALSE, TRUE, 'APPROVED', 0, NOW(), NOW()
        FROM stg_hotels_reviews_csv s
        JOIN import_hotel_source_map m ON m.source_hotel_id = s.hotel_source_id
        JOIN users u ON u.email = CONCAT('csvu_', s.user_source_id, '@import.local')
        LEFT JOIN reviews r ON r.user_id = u.id AND r.target_type = 'HOTEL' AND r.target_id = m.hotel_id
        WHERE s.rating_raw BETWEEN 1 AND 5 AND r.id IS NULL
        LIMIT $batchSize
    ");
    $stmt->execute();
    $affected = $stmt->rowCount();

    if ($affected == 0) break;
    $reviewCount += $affected;
    echo "   +$affected (total: $reviewCount)...\n";

    if ($affected < $batchSize) break;
}

$reviews = $pdo->query("SELECT COUNT(*) FROM reviews WHERE target_type = 'HOTEL'")->fetchColumn();
echo "   OK - $reviews reviews\n\n";

// 10. Images
echo "[10] Thêm images...\n";
$pdo->exec("INSERT IGNORE INTO hotel_images (hotel_id, url, alt_text, is_cover, sort_order, created_at)
    SELECT h.id, 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80', h.name, TRUE, 0, NOW()
    FROM hotels h
    LEFT JOIN hotel_images hi ON hi.hotel_id = h.id AND hi.is_cover = TRUE
    WHERE hi.id IS NULL
");
$images = $pdo->query("SELECT COUNT(*) FROM hotel_images")->fetchColumn();
echo "   OK - $images images\n\n";

try { $pdo->commit(); } catch (Exception $e) { echo "  (transaction already committed or rolled back)\n"; }

echo "==================================================\n";
echo "  KẾT QUẢ\n";
echo "==================================================\n";
echo "  Hotels:   $hotels\n";
echo "  Reviews:  $reviews\n";
echo "  Users:    $users\n";
echo "  Images:   $images\n";
echo "==================================================\n";
echo "  ✅ HOÀN TẤT!\n";
