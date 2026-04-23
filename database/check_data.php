<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "=== Database Contents ===\n\n";

// Check tables
$tables = ['cities', 'tours', 'hotels', 'tour_categories', 'promotions'];
foreach ($tables as $table) {
    try {
        $count = $pdo->query("SELECT COUNT(*) FROM `{$table}`")->fetchColumn();
        echo "{$table}: {$count} rows\n";
    } catch (PDOException $e) {
        echo "{$table}: ERROR - {$e->getMessage()}\n";
    }
}

echo "\n=== Sample Tours ===\n";
$tour = $pdo->query("SELECT id, title, is_active FROM tours LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
if ($tour) print_r($tour);
else echo "No tours found\n";

echo "\n=== Sample Hotels ===\n";
$hotel = $pdo->query("SELECT id, name, is_active FROM hotels LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
if ($hotel) print_r($hotel);
else echo "No hotels found\n";

echo "\n=== Tour columns ===\n";
$cols = $pdo->query("DESCRIBE tours")->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols as $c) echo $c['Field'] . " | " . $c['Type'] . " | " . $c['Null'] . " | " . $c['Key'] . " | " . $c['Default'] . "\n";

echo "\n=== Hotel columns ===\n";
$hcols = $pdo->query("DESCRIBE hotels")->fetchAll(PDO::FETCH_ASSOC);
foreach ($hcols as $c) echo $c['Field'] . " | " . $c['Type'] . " | " . $c['Null'] . " | " . $c['Key'] . " | " . $c['Default'] . "\n";
