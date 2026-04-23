<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD'
);

echo "=== Hotels by old city IDs (58-69) ===\n";
$rows = $pdo->query("SELECT city_id, COUNT(*) as cnt FROM hotels WHERE city_id BETWEEN 58 AND 69 GROUP BY city_id")->fetchAll();
foreach($rows as $r) printf("  city_id=%s: %s hotels\n", $r[0], $r[1]);

echo "\n=== Hotels by new city slugs ===\n";
$rows = $pdo->query("SELECT c.slug, COUNT(h.id) as cnt FROM cities c LEFT JOIN hotels h ON h.city_id = c.id GROUP BY c.id, c.slug ORDER BY cnt DESC LIMIT 15")->fetchAll();
foreach($rows as $r) printf("  %-15s: %s hotels\n", $r[0], $r[1]);
