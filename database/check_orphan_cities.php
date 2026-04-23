<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 10]
);

echo "=== Checking Tours with invalid city_id ===\n";
$bad = $pdo->query("
    SELECT COUNT(*) as cnt FROM tours t
    LEFT JOIN cities c ON t.city_id = c.id
    WHERE t.is_active = 1 AND c.id IS NULL
")->fetch(PDO::FETCH_ASSOC);
echo "Tours with NULL city (orphan): " . $bad['cnt'] . "\n";

$ok = $pdo->query("
    SELECT COUNT(*) as cnt FROM tours t
    INNER JOIN cities c ON t.city_id = c.id
    WHERE t.is_active = 1
")->fetch(PDO::FETCH_ASSOC);
echo "Tours with valid city: " . $ok['cnt'] . "\n";

$badTours = $pdo->query("
    SELECT t.id, t.title, t.city_id FROM tours t
    LEFT JOIN cities c ON t.city_id = c.id
    WHERE t.is_active = 1 AND c.id IS NULL LIMIT 5
")->fetchAll(PDO::FETCH_ASSOC);
if (count($badTours) > 0) {
    echo "\nOrphan tours:\n";
    foreach ($badTours as $t) {
        echo "  ID=" . $t['id'] . " | city_id=" . $t['city_id'] . " | " . substr($t['title'], 0, 60) . "\n";
    }
}

echo "\n=== Checking Hotels with invalid city_id ===\n";
$badH = $pdo->query("
    SELECT COUNT(*) as cnt FROM hotels h
    LEFT JOIN cities c ON h.city_id = c.id
    WHERE h.is_active = 1 AND c.id IS NULL
")->fetch(PDO::FETCH_ASSOC);
echo "Hotels with NULL city (orphan): " . $badH['cnt'] . "\n";

$okH = $pdo->query("
    SELECT COUNT(*) as cnt FROM hotels h
    INNER JOIN cities c ON h.city_id = c.id
    WHERE h.is_active = 1
")->fetch(PDO::FETCH_ASSOC);
echo "Hotels with valid city: " . $okH['cnt'] . "\n";

$badHotels = $pdo->query("
    SELECT h.id, h.name, h.city_id FROM hotels h
    LEFT JOIN cities c ON h.city_id = c.id
    WHERE h.is_active = 1 AND c.id IS NULL LIMIT 5
")->fetchAll(PDO::FETCH_ASSOC);
if (count($badHotels) > 0) {
    echo "\nOrphan hotels:\n";
    foreach ($badHotels as $h) {
        echo "  ID=" . $h['id'] . " | city_id=" . $h['city_id'] . " | " . substr($h['name'], 0, 60) . "\n";
    }
}

echo "\n=== City totals ===\n";
$cities = $pdo->query("SELECT id, name_vi FROM cities ORDER BY id LIMIT 20")->fetchAll(PDO::FETCH_NUM);
foreach ($cities as $c) printf("  %2s | %s\n", $c[0], $c[1]);
