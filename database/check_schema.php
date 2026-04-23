<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

// Check actual table schemas
$tables = ['tour_categories', 'tours', 'tour_images', 'tour_itinerary', 'tour_departures'];
foreach ($tables as $table) {
    $cols = $pdo->query("SHOW COLUMNS FROM $table")->fetchAll(PDO::FETCH_ASSOC);
    echo "=== $table ===\n";
    foreach ($cols as $col) {
        echo "  {$col['Field']} {$col['Type']} Null:{$col['Null']} Default:{$col['Default']} Extra:{$col['Extra']}\n";
    }
}
