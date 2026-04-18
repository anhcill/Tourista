<?php
/**
 * Quick check: verify seed data counts
 */

$host = 'maglev.proxy.rlwy.net';
$port = 44405;
$dbname = 'railway';
$user = 'root';
$pass = 'EcQvhZIyDypbORoVrkpUhlcRTzaJNGOq';

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
} catch (Exception $e) {
    die("Connection failed: " . $e->getMessage() . "\n");
}

$tables = ['countries', 'cities', 'amenities', 'tour_categories', 'hotels', 'hotel_images', 'room_types', 'tours', 'tour_images', 'tour_itinerary', 'tour_departures'];
echo "=== Database Counts ===\n";
foreach ($tables as $t) {
    try {
        $count = $pdo->query("SELECT COUNT(*) FROM $t")->fetchColumn();
        echo "  $t: $count\n";
    } catch (Exception $e) {
        echo "  $t: ERROR - " . $e->getMessage() . "\n";
    }
}

echo "\n=== Tour list ===\n";
$stmt = $pdo->query("SELECT t.id, t.title, t.slug, c.name_en as city FROM tours t JOIN cities c ON t.city_id = c.id ORDER BY c.name_en, t.title");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "  [{$row['id']}] {$row['city']} - {$row['title']}\n";
}

echo "\n=== Hotel count by city ===\n";
$stmt = $pdo->query("SELECT c.name_en as city, COUNT(h.id) as cnt FROM hotels h JOIN cities c ON h.city_id = c.id GROUP BY c.name_en ORDER BY cnt DESC LIMIT 10");
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    echo "  {$row['city']}: {$row['cnt']}\n";
}
