<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD'
);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo "=== Railway Database Tables ===\n\n";

$tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
echo "Total tables: " . count($tables) . "\n\n";

foreach ($tables as $t) {
    echo "  - $t\n";
}

echo "\n=== Check if HomeController API methods exist ===\n\n";

// Check hotels table structure
try {
    $cols = $pdo->query("DESCRIBE hotels")->fetchAll(PDO::FETCH_ASSOC);
    echo "hotels columns:\n";
    foreach ($cols as $c) {
        echo "  {$c['Field']} ({$c['Type']})\n";
    }
} catch (Exception $e) {
    echo "hotels error: {$e->getMessage()}\n";
}

echo "\n=== Check promos table ===\n\n";
try {
    $promos = $pdo->query("SELECT COUNT(*) as cnt FROM promotions")->fetch(PDO::FETCH_ASSOC);
    echo "Total promotions: {$promos['cnt']}\n";
} catch (Exception $e) {
    echo "promotions error: {$e->getMessage()}\n";
}
