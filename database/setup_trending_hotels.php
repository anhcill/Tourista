<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 10]
);

// Check hotels columns
echo "=== Hotels columns ===\n";
$hCols = $pdo->query("DESCRIBE hotels")->fetchAll(PDO::FETCH_ASSOC);
foreach ($hCols as $col) {
    if (str_contains($col['Field'], 'trend') || str_contains($col['Field'], 'feature')) {
        echo "  " . $col['Field'] . " " . $col['Type'] . "\n";
    }
}

// Check tours columns
echo "\n=== Tours columns ===\n";
$tCols = $pdo->query("DESCRIBE tours")->fetchAll(PDO::FETCH_ASSOC);
foreach ($tCols as $col) {
    if (str_contains($col['Field'], 'trend') || str_contains($col['Field'], 'feature')) {
        echo "  " . $col['Field'] . " " . $col['Type'] . "\n";
    }
}

// Add is_trending to tours if missing
$hasTrending = $pdo->query("SHOW COLUMNS FROM tours LIKE 'is_trending'")->fetch();
if (!$hasTrending) {
    echo "\nAdding is_trending column to tours table...\n";
    $pdo->exec("ALTER TABLE tours ADD COLUMN is_trending TINYINT(1) NOT NULL DEFAULT 0 AFTER is_featured");
    echo "Done!\n";
} else {
    echo "\nis_trending column exists in tours\n";
}

// Count trending in hotels
echo "\nHotels is_trending=1: " . $pdo->query("SELECT COUNT(*) FROM hotels WHERE is_active=1 AND is_trending=1")->fetchColumn() . "\n";
echo "Hotels is_featured=1: " . $pdo->query("SELECT COUNT(*) FROM hotels WHERE is_active=1 AND is_featured=1")->fetchColumn() . "\n";

// For trending hotels that don't overlap with featured - get random hotels from different cities
echo "\n=== Setting trending hotels ===\n";
$currentTrending = $pdo->query("SELECT COUNT(*) FROM hotels WHERE is_active=1 AND is_trending=1")->fetchColumn();
echo "Current trending: $currentTrending\n";

// Get cities with most hotels
$cities = $pdo->query("
    SELECT h.city_id, c.name_vi, COUNT(h.id) as cnt
    FROM hotels h
    JOIN cities c ON h.city_id = c.id
    WHERE h.is_active=1 AND h.is_featured=0
    GROUP BY h.city_id, c.name_vi
    HAVING cnt >= 1
    ORDER BY cnt DESC
    LIMIT 10
")->fetchAll(PDO::FETCH_NUM);
echo "Cities with non-featured hotels:\n";
foreach ($cities as $r) printf("  city_id=%s | %-15s | %s non-featured hotels\n", $r[0], $r[1], $r[2]);

// Set ~32 trending from cities that don't have enough trending
// First, set all featured as trending too
$pdo->exec("UPDATE hotels SET is_trending=1 WHERE is_active=1 AND is_featured=1");
echo "\nSet featured hotels as trending\n";

// Now pick top trending from other cities (non-featured)
$targetTrending = 32;
$currentTrending = $pdo->query("SELECT COUNT(*) FROM hotels WHERE is_active=1 AND is_trending=1")->fetchColumn();
echo "After featured: $currentTrending trending\n";

if ($currentTrending < $targetTrending) {
    $needMore = $targetTrending - $currentTrending;
    // Pick top-rated non-featured hotels from different cities to diversify
    $added = $pdo->exec("
        UPDATE hotels SET is_trending=1
        WHERE is_active=1 AND is_featured=0 AND is_trending=0
        AND city_id IN (
            SELECT city_id FROM (
                SELECT city_id FROM hotels
                WHERE is_active=1 AND is_featured=0 AND is_trending=0
                GROUP BY city_id
                ORDER BY MAX(avg_rating) DESC
                LIMIT $needMore
            ) AS top_cities
        )
        ORDER BY avg_rating DESC
        LIMIT $needMore
    ");
    echo "Added $added more trending from top cities\n";
}

$finalTrending = $pdo->query("SELECT COUNT(*) FROM hotels WHERE is_active=1 AND is_trending=1")->fetchColumn();
echo "Final trending count: $finalTrending\n";
