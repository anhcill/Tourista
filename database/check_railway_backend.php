<?php
// Try maglev proxy with same password as interchange
try {
    $pdo = new PDO(
        'mysql:host=maglev.proxy.rlwy.net;port=44405;dbname=railway;charset=utf8mb4',
        'root',
        'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 5]
    );
    echo "Connected to Railway backend DB!\n";
    echo "Hotels: " . $pdo->query("SELECT COUNT(*) FROM hotels")->fetchColumn() . "\n";
    echo "Featured hotels: " . $pdo->query("SELECT COUNT(*) FROM hotels WHERE is_featured=1")->fetchColumn() . "\n";
    echo "Tours: " . $pdo->query("SELECT COUNT(*) FROM tours")->fetchColumn() . "\n";
    echo "Tour departures: " . $pdo->query("SELECT COUNT(*) FROM tour_departures")->fetchColumn() . "\n";
    echo "Hotel amenities: " . $pdo->query("SELECT COUNT(*) FROM hotel_amenities")->fetchColumn() . "\n";
    echo "Cities: " . $pdo->query("SELECT COUNT(*) FROM cities")->fetchColumn() . "\n";
    echo "\n--- Top cities by hotels ---\n";
    $rows = $pdo->query("SELECT c.name_vi, COUNT(h.id) as cnt FROM cities c LEFT JOIN hotels h ON h.city_id=c.id AND h.is_active=1 GROUP BY c.id, c.name_vi ORDER BY cnt DESC LIMIT 15")->fetchAll(PDO::FETCH_NUM);
    foreach ($rows as $r) printf("  %-15s: %s hotels\n", $r[0], $r[1]);
} catch (Exception $e) {
    echo "FAILED: " . $e->getMessage() . "\n";
}
