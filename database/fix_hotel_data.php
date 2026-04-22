<?php
/**
 * Fix: Add room types with prices + diverse hotel images (BATCH VERSION)
 */
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "========================================\n";
echo "  FIX HOTEL DATA (BATCH)\n";
echo "========================================\n\n";

$pdo->exec("SET SESSION wait_timeout = 28800");

$cityMultipliers = [
    'ha-noi' => 1.3, 'ho-chi-minh' => 1.3, 'da-nang' => 1.1,
    'nha-trang' => 1.0, 'phu-quoc' => 1.2, 'da-lat' => 0.9,
    'hoi-an' => 1.0, 'hue' => 0.85, 'vung-tau' => 0.9, 'sa-pa' => 0.9,
];

// 1. Add room types using INSERT...SELECT
echo "[1] Adding room types with prices...\n";

$pdo->exec("DROP TABLE IF EXISTS temp_room_prices");
$pdo->exec("CREATE TEMPORARY TABLE temp_room_prices (
    hotel_id BIGINT UNSIGNED,
    star_rating TINYINT,
    city_slug VARCHAR(50)
)");

// Insert hotel data into temp table
$hotels = $pdo->query("
    SELECT h.id, h.star_rating, c.slug
    FROM hotels h
    JOIN cities c ON c.id = h.city_id
    WHERE h.is_active = TRUE
")->fetchAll();

$insertBatch = [];
foreach ($hotels as $h) {
    $insertBatch[] = sprintf("(%d, %d, '%s')", $h['id'], $h['star_rating'] ?? 3, $h['slug']);
}

if (!empty($insertBatch)) {
    $pdo->exec("INSERT INTO temp_room_prices (hotel_id, star_rating, city_slug) VALUES " . implode(",\n", $insertBatch));
}

// Insert room types using temp table
$sql = "
    INSERT INTO room_types 
    (hotel_id, name, description, max_adults, max_children, bed_type, area_sqm, base_price_per_night, total_rooms, is_active, created_at, updated_at)
    SELECT 
        hotel_id,
        CONCAT('Room ', rt_name),
        CONCAT(area, 'm2 ', rt_name, ' Room'),
        2,
        1,
        bed_type,
        area,
        ROUND((base_price * multiplier + price_add) / 10000) * 10000,
        FLOOR(3 + RAND() * 12),
        TRUE,
        NOW(),
        NOW()
    FROM (
        SELECT 
            p.hotel_id,
            CASE WHEN p.star_rating = 1 THEN 150000
                 WHEN p.star_rating = 2 THEN 280000
                 WHEN p.star_rating = 4 THEN 800000
                 WHEN p.star_rating = 5 THEN 1500000
                 ELSE 450000 END * COALESCE(m.mult, 1.0) as base_price,
            CASE m.mult WHEN 1.3 THEN 1.3 WHEN 1.2 THEN 1.2 WHEN 1.1 THEN 1.1 WHEN 0.85 THEN 0.85 WHEN 0.9 THEN 0.9 ELSE 1.0 END as multiplier,
            CASE WHEN p.star_rating = 1 THEN 1 
                 WHEN p.star_rating = 2 THEN 1.5 
                 WHEN p.star_rating = 4 THEN 2 
                 WHEN p.star_rating = 5 THEN 3 
                 ELSE 1.2 END as price_add,
            CASE WHEN p.star_rating = 1 THEN 'Standard' WHEN p.star_rating = 2 THEN 'Standard' WHEN p.star_rating = 4 THEN 'Deluxe' WHEN p.star_rating = 5 THEN 'Suite' ELSE 'Standard' END as rt_name,
            CASE WHEN p.star_rating = 1 THEN 18 WHEN p.star_rating = 2 THEN 20 WHEN p.star_rating = 4 THEN 35 WHEN p.star_rating = 5 THEN 50 ELSE 25 END as area,
            CASE WHEN p.star_rating = 1 THEN 'Single Bed' WHEN p.star_rating = 2 THEN 'Double Bed' WHEN p.star_rating = 4 THEN 'King Bed' WHEN p.star_rating = 5 THEN 'King Bed' ELSE 'Double Bed' END as bed_type
        FROM temp_room_prices p
        LEFT JOIN (
            SELECT 'ha-noi' as slug, 1.3 as mult UNION ALL
            SELECT 'ho-chi-minh', 1.3 UNION ALL
            SELECT 'da-nang', 1.1 UNION ALL
            SELECT 'nha-trang', 1.0 UNION ALL
            SELECT 'phu-quoc', 1.2 UNION ALL
            SELECT 'da-lat', 0.9 UNION ALL
            SELECT 'hoi-an', 1.0 UNION ALL
            SELECT 'hue', 0.85 UNION ALL
            SELECT 'vung-tau', 0.9 UNION ALL
            SELECT 'sa-pa', 0.9
        ) m ON m.slug = p.city_slug
    ) data
";

try {
    $pdo->exec($sql);
} catch (Exception $e) {
    echo "   Error (may already have data): " . $e->getMessage() . "\n";
}

$roomCount = $pdo->query("SELECT COUNT(*) FROM room_types")->fetchColumn();
echo "   OK - $roomCount room types\n\n";

// 2. Update hotel images with diverse URLs
echo "[2] Updating hotel images...\n";

// Clear old images
$pdo->exec("DELETE FROM hotel_images");

$imageUrls = [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80',
    'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80',
    'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
    'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80',
    'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80',
    'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
    'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80',
    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80',
    'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800&q=80',
    'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&q=80',
    'https://images.unsplash.com/photo-1587874522487-fe10e954d035?w=800&q=80',
    'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800&q=80',
    'https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=800&q=80',
    'https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?w=800&q=80',
    'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800&q=80',
    'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80',
    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80',
    'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80',
    'https://images.unsplash.com/photo-1590073242678-70ee3fc28e8e?w=800&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
    'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80',
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
];

// Build image values
$hotels = $pdo->query("SELECT id FROM hotels WHERE is_active = TRUE")->fetchAll(PDO::FETCH_COLUMN);
$imageValues = [];
$imageIdx = 0;

foreach ($hotels as $hotelId) {
    $numImages = 3 + ($hotelId % 3); // 3-5 images per hotel
    for ($i = 0; $i < $numImages; $i++) {
        $url = $imageUrls[$imageIdx % count($imageUrls)];
        $isCover = ($i === 0) ? 1 : 0;
        $imageValues[] = sprintf("(%d, '%s', 'Hotel image', %d, %d, NOW())", $hotelId, $url, $isCover, $i);
        $imageIdx++;
    }
    
    if (count($imageValues) >= 500) {
        $pdo->exec("INSERT INTO hotel_images (hotel_id, url, alt_text, is_cover, sort_order, created_at) VALUES " . implode(",\n", $imageValues));
        $imageValues = [];
    }
}

if (!empty($imageValues)) {
    $pdo->exec("INSERT INTO hotel_images (hotel_id, url, alt_text, is_cover, sort_order, created_at) VALUES " . implode(",\n", $imageValues));
}

$imgCount = $pdo->query("SELECT COUNT(*) FROM hotel_images")->fetchColumn();
echo "   OK - $imgCount images\n\n";

// 3. Update hotel ratings from reviews
echo "[3] Updating hotel ratings...\n";
$pdo->exec("
    UPDATE hotels h
    JOIN (
        SELECT target_id, AVG(overall_rating) as avg_rating, COUNT(*) as review_count
        FROM reviews WHERE target_type = 'HOTEL' GROUP BY target_id
    ) r ON h.id = r.target_id
    SET h.avg_rating = r.avg_rating, h.review_count = r.review_count
");
echo "   OK\n\n";

echo "========================================\n";
echo "  KET QUA\n";
echo "========================================\n";
echo "Room types: " . $pdo->query("SELECT COUNT(*) FROM room_types")->fetchColumn() . "\n";
echo "Hotel images: " . $pdo->query("SELECT COUNT(*) FROM hotel_images")->fetchColumn() . "\n";
echo "Hotels with images: " . $pdo->query("SELECT COUNT(DISTINCT hotel_id) FROM hotel_images")->fetchColumn() . "\n";
echo "========================================\n";
echo "  ✅ HOAN TAT!\n";
