<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD'
);

echo "=== Hotels by city ===\n";
$rows = $pdo->query("
    SELECT c.name_vi, c.slug, COUNT(h.id) as cnt 
    FROM cities c 
    LEFT JOIN hotels h ON h.city_id = c.id AND h.is_active = TRUE 
    GROUP BY c.id, c.name_vi, c.slug 
    ORDER BY cnt DESC
")->fetchAll(PDO::FETCH_NUM);
printf("%-20s | %-15s | %s\n", "City", "Slug", "Hotels");
echo str_repeat('-', 55) . "\n";
foreach ($rows as $r) {
    printf("%-20s | %-15s | %s\n", $r[0], $r[1], $r[2]);
}

echo "\n=== Test autocomplete for 'ha noi' ===\n";
$stmt = $pdo->prepare("
    SELECT h.id, h.name, c.name_vi as city_name
    FROM hotels h
    LEFT JOIN cities c ON c.id = h.city_id
    WHERE h.is_active = TRUE
      AND (
          LOWER(h.name) LIKE LOWER(CONCAT('%', ?, '%'))
          OR LOWER(h.address) LIKE LOWER(CONCAT('%', ?, '%'))
          OR LOWER(c.name_vi) LIKE LOWER(CONCAT('%', ?, '%'))
          OR LOWER(c.name_en) LIKE LOWER(CONCAT('%', ?, '%'))
      )
    LIMIT 5
");
$stmt->execute(['ha noi', 'ha noi', 'ha noi', 'ha noi']);
$rows = $stmt->fetchAll();
echo "Results: " . count($rows) . "\n";
foreach($rows as $r) echo "  - {$r[0]}: {$r[1]} ({$r[2]})\n";

echo "\n=== Total stats ===\n";
echo "Hotels: " . $pdo->query("SELECT COUNT(*) FROM hotels WHERE is_active = TRUE")->fetchColumn() . "\n";
echo "Reviews: " . $pdo->query("SELECT COUNT(*) FROM reviews WHERE target_type = 'HOTEL'")->fetchColumn() . "\n";
echo "Cities: " . $pdo->query("SELECT COUNT(*) FROM cities")->fetchColumn() . "\n";
