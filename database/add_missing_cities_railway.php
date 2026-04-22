<?php
/**
 * Fix: Add missing cities to Railway database (no deletion, just INSERT IGNORE)
 */
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "========================================\n";
echo "  ADD MISSING CITIES TO RAILWAY\n";
echo "========================================\n\n";

// List of cities to add
$cities = [
    [1, 1, 'Hà Nội', 'Hanoi', 'ha-noi', 1],
    [2, 1, 'Hồ Chí Minh', 'Ho Chi Minh', 'ho-chi-minh', 1],
    [3, 1, 'Đà Nẵng', 'Da Nang', 'da-nang', 1],
    [4, 1, 'Nha Trang', 'Nha Trang', 'nha-trang', 1],
    [5, 1, 'Phú Quốc', 'Phu Quoc', 'phu-quoc', 1],
    [6, 1, 'Đà Lạt', 'Da Lat', 'da-lat', 1],
    [7, 1, 'Hội An', 'Hoi An', 'hoi-an', 1],
    [8, 1, 'Huế', 'Hue', 'hue', 1],
    [9, 1, 'Vũng Tàu', 'Vung Tau', 'vung-tau', 1],
    [10, 1, 'Hạ Long', 'Ha Long', 'ha-long', 1],
    [11, 1, 'Cần Thơ', 'Can Tho', 'can-tho', 1],
    [12, 1, 'Sa Pa', 'Sa Pa', 'sa-pa', 1],
];

// Check current cities
echo "Current cities:\n";
$existing = $pdo->query("SELECT id, name_vi, name_en, slug FROM cities ORDER BY id")->fetchAll(PDO::FETCH_NUM);
foreach ($existing as $r) printf("  %s | %s | %s | %s\n", $r[0], $r[1], $r[2], $r[3]);

// Add missing cities using INSERT IGNORE
echo "\nAdding missing cities (INSERT IGNORE)...\n";
$stmt = $pdo->prepare("INSERT IGNORE INTO cities (id, country_id, name_vi, name_en, slug, is_popular, is_active) VALUES (?, ?, ?, ?, ?, ?, 1)");
$added = 0;
foreach ($cities as $c) {
    // Check if this slug already exists
    $exists = $pdo->prepare("SELECT COUNT(*) FROM cities WHERE slug = ?");
    $exists->execute([$c[4]]);
    if ($exists->fetchColumn() == 0) {
        $stmt->execute($c);
        echo "  Added: {$c[2]} ({$c[3]}) - slug: {$c[4]}\n";
        $added++;
    } else {
        echo "  Already exists: {$c[2]} ({$c[3]}) - slug: {$c[4]}\n";
    }
}
echo "\nAdded $added cities.\n";

// Now check if Hanoi city exists and has hotels
echo "\n=== Checking Hanoi hotels ===\n";
$hanoiId = $pdo->query("SELECT id FROM cities WHERE slug = 'ha-noi' LIMIT 1")->fetchColumn();
if ($hanoiId) {
    echo "Hanoi city ID: $hanoiId\n";
    $hotelCount = $pdo->query("SELECT COUNT(*) FROM hotels WHERE city_id = $hanoiId AND is_active = TRUE")->fetchColumn();
    echo "Hotels in Hanoi: $hotelCount\n";
} else {
    echo "WARNING: Hanoi city not found!\n";
}

// Check all cities with hotels
echo "\n=== Cities with hotels (sample) ===\n";
$rows = $pdo->query("SELECT c.slug, COUNT(h.id) as cnt FROM cities c LEFT JOIN hotels h ON h.city_id = c.id AND h.is_active = TRUE GROUP BY c.id, c.slug ORDER BY cnt DESC LIMIT 15")->fetchAll(PDO::FETCH_NUM);
foreach ($rows as $r) printf("  %-15s: %s hotels\n", $r[0], $r[1]);

echo "\nDone!\n";
