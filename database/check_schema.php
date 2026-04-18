<?php
$pdo = new PDO('mysql:host=maglev.proxy.rlwy.net;port=44405;dbname=railway;charset=utf8mb4', 'root', 'EcQvhZIyDypbORoVrkpUhlcRTzaJNGOq', [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);

echo "=== Tours table structure ===\n";
$cols = $pdo->query("DESCRIBE tours")->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols as $c) {
    echo "  {$c['Field']}: {$c['Type']} | Extra: {$c['Extra']} | Null: {$c['Null']} | Default: {$c['Default']}\n";
}

echo "\n=== Hotels table structure (first 3 cols) ===\n";
$cols = $pdo->query("DESCRIBE hotels")->fetchAll(PDO::FETCH_ASSOC);
foreach (array_slice($cols, 0, 5) as $c) {
    echo "  {$c['Field']}: {$c['Type']} | Extra: {$c['Extra']} | Default: {$c['Default']}\n";
}

echo "\n=== Tour categories ===\n";
$tours = $pdo->query("SELECT * FROM tour_categories")->fetchAll(PDO::FETCH_ASSOC);
foreach ($tours as $t) {
    echo "  ID {$t['id']}: {$t['slug']}\n";
}
