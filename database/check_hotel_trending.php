<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 10]
);

echo "=== Hotels table relevant columns ===\n";
$hCols = $pdo->query("DESCRIBE hotels")->fetchAll(PDO::FETCH_ASSOC);
foreach ($hCols as $col) {
    if ($col['Field'] === 'is_trending' || $col['Field'] === 'is_featured' || $col['Field'] === 'is_active') {
        echo "  " . $col['Field'] . " | " . $col['Type'] . " | Default: " . $col['Default'] . " | Null: " . $col['Null'] . "\n";
    }
}

echo "\n=== Tours table relevant columns ===\n";
$tCols = $pdo->query("DESCRIBE tours")->fetchAll(PDO::FETCH_ASSOC);
foreach ($tCols as $col) {
    if ($col['Field'] === 'is_trending' || $col['Field'] === 'is_featured' || $col['Field'] === 'is_active') {
        echo "  " . $col['Field'] . " | " . $col['Type'] . " | Default: " . $col['Default'] . " | Null: " . $col['Null'] . "\n";
    }
}

echo "\n=== Data Counts ===\n";
echo "Hotels is_featured=1: " . $pdo->query("SELECT COUNT(*) FROM hotels WHERE is_active=1 AND is_featured=1")->fetchColumn() . "\n";
echo "Hotels is_trending=1: " . $pdo->query("SELECT COUNT(*) FROM hotels WHERE is_active=1 AND is_trending=1")->fetchColumn() . "\n";
echo "Hotels both: " . $pdo->query("SELECT COUNT(*) FROM hotels WHERE is_active=1 AND is_featured=1 AND is_trending=1")->fetchColumn() . "\n";

echo "\nTours is_featured=1: " . $pdo->query("SELECT COUNT(*) FROM tours WHERE is_active=1 AND is_featured=1")->fetchColumn() . "\n";
$tourTrending = $pdo->query("SELECT COUNT(*) FROM tours WHERE is_active=1 AND is_trending=1")->fetchColumn();
echo "Tours is_trending=1: " . $tourTrending . "\n";

// If tours has no trending, add it
if ($tourTrending == 0) {
    echo "\nTours table has is_trending column but all are 0 - OK, that's fine.\n";
    echo "getTrendingHotels only applies to hotels, not tours.\n";
}

echo "\n=== Featured+Trending by City ===\n";
$byCity = $pdo->query("
    SELECT c.name_vi,
           SUM(h.is_featured=1) as featured,
           SUM(h.is_trending=1) as trending,
           COUNT(h.id) as total
    FROM hotels h
    JOIN cities c ON h.city_id = c.id
    WHERE h.is_active=1
    GROUP BY c.id, c.name_vi
    ORDER BY featured DESC, trending DESC
    LIMIT 20
")->fetchAll(PDO::FETCH_NUM);
foreach ($byCity as $r) {
    printf("  %-15s | featured=%s | trending=%s | total=%s\n", $r[0], $r[1], $r[2], $r[3]);
}
