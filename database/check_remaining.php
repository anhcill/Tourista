<?php
$pdo = new PDO('mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4', 'root', 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD', [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);

echo "=== Users table columns ===\n";
$cols = $pdo->query("DESCRIBE users")->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols as $c) { echo "  {$c['Field']}: {$c['Type']}\n"; }

echo "\n=== Sample users ===\n";
$users = $pdo->query("SELECT id, email, full_name, role_id FROM users LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
foreach ($users as $u) { echo "  {$u['id']}: {$u['email']} - {$u['full_name']} (role_id={$u['role_id']})\n"; }

echo "\n=== Articles table ===\n";
$arts = $pdo->query("SHOW TABLES LIKE '%article%'")->fetchAll(PDO::FETCH_COLUMN);
if (count($arts) == 0) {
    echo "  No article tables found.\n";
} else {
    foreach ($arts as $c) { echo "  $c\n"; }
    $cnt = $pdo->query("SELECT COUNT(*) FROM articles")->fetchColumn();
    echo "  Total: $cnt articles\n";
}

echo "\n=== Blog categories ===\n";
$cats = $pdo->query("SHOW TABLES LIKE '%blog%'")->fetchAll(PDO::FETCH_COLUMN);
foreach ($cats as $c) { echo "  $c\n"; }

echo "\n=== Import hotel source map sample ===\n";
$src = $pdo->query("SELECT * FROM import_hotel_source_map LIMIT 3")->fetchAll(PDO::FETCH_ASSOC);
foreach ($src as $s) { echo "  Source {$s['import_batch_id']}: {$s['source_name']}\n"; }

echo "\n=== ALL tables list ===\n";
$tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
echo "Total: " . count($tables) . " tables\n";
foreach ($tables as $t) { echo "  $t\n"; }
