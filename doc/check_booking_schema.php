<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "=== booking_hotel_details columns ===\n";
$cols = $pdo->query("SHOW COLUMNS FROM booking_hotel_details")->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols as $c) {
    echo "  {$c['Field']} ({$c['Type']})\n";
}

echo "\n=== booking_tour_details columns ===\n";
$cols = $pdo->query("SHOW COLUMNS FROM booking_tour_details")->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols as $c) {
    echo "  {$c['Field']} ({$c['Type']})\n";
}

echo "\n=== bookings columns ===\n";
$cols = $pdo->query("SHOW COLUMNS FROM bookings")->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols as $c) {
    echo "  {$c['Field']} ({$c['Type']})\n";
}
