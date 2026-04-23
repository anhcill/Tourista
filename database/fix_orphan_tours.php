<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 10]
);

echo "=== Fixing orphan tours (city_id=0 -> Sa Pa ID=12) ===\n";

// Check current orphan tours
$orphans = $pdo->query("
    SELECT t.id, t.title, t.city_id FROM tours t
    LEFT JOIN cities c ON t.city_id = c.id
    WHERE t.is_active = 1 AND (c.id IS NULL OR t.city_id = 0)
")->fetchAll(PDO::FETCH_ASSOC);

echo "Found " . count($orphans) . " orphan tour(s):\n";
foreach ($orphans as $t) {
    echo "  ID=" . $t['id'] . " | city_id=" . $t['city_id'] . " | " . substr($t['title'], 0, 60) . "\n";
}

// Fix: set city_id = 12 (Sa Pa)
$fixed = $pdo->exec("
    UPDATE tours SET city_id = 12
    WHERE is_active = 1 AND city_id = 0
");
echo "\nFixed $fixed tour(s) to city_id=12 (Sa Pa)\n";

// Verify
$remaining = $pdo->query("
    SELECT COUNT(*) as cnt FROM tours t
    LEFT JOIN cities c ON t.city_id = c.id
    WHERE t.is_active = 1 AND (c.id IS NULL OR t.city_id = 0)
")->fetch(PDO::FETCH_ASSOC);
echo "Remaining orphan tours: " . $remaining['cnt'] . "\n";

echo "\n=== Summary ===\n";
echo "Total active tours: " . $pdo->query("SELECT COUNT(*) FROM tours WHERE is_active=1")->fetchColumn() . "\n";
echo "Total active hotels: " . $pdo->query("SELECT COUNT(*) FROM hotels WHERE is_active=1")->fetchColumn() . "\n";
echo "Featured hotels: " . $pdo->query("SELECT COUNT(*) FROM hotels WHERE is_active=1 AND is_featured=1")->fetchColumn() . "\n";
echo "Featured tours: " . $pdo->query("SELECT COUNT(*) FROM tours WHERE is_active=1 AND is_featured=1")->fetchColumn() . "\n";

echo "\n=== Featured Hotels by city ===\n";
$fh = $pdo->query("
    SELECT c.name_vi, COUNT(h.id) as cnt
    FROM hotels h
    JOIN cities c ON h.city_id = c.id
    WHERE h.is_active=1 AND h.is_featured=1
    GROUP BY c.id, c.name_vi
    ORDER BY cnt DESC
    LIMIT 20
")->fetchAll(PDO::FETCH_NUM);
foreach ($fh as $r) printf("  %-15s: %s featured hotels\n", $r[0], $r[1]);
