<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD'
);

echo "=== Cities with IDs 58-69 ===\n";
$rows = $pdo->query("SELECT id, name_vi, name_en, slug, is_active FROM cities WHERE id BETWEEN 58 AND 69 ORDER BY id")->fetchAll();
printf("%-4s | %-20s | %-20s | %-15s | %s\n", "ID", "Name (VI)", "Name (EN)", "Slug", "Active");
foreach($rows as $r) printf("%-4s | %-20s | %-20s | %-15s | %s\n", $r[0], $r[1], $r[2], $r[3], $r[4] ? 'YES' : 'NO');

echo "\n=== Testing autocomplete for 'da lat' ===\n";
$stmt = $pdo->prepare("
    SELECT h.id, h.name, COALESCE(c.name_vi, c.name_en) AS city_name, h.address
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
$stmt->execute(['da lat', 'da lat', 'da lat', 'da lat']);
$rows = $stmt->fetchAll();
echo "Results for 'da lat': " . count($rows) . "\n";
foreach($rows as $r) echo "  - {$r[0]}: {$r[1]} ({$r[2]})\n";

echo "\n=== Testing autocomplete for 'ha noi' ===\n";
$stmt->execute(['ha noi', 'ha noi', 'ha noi', 'ha noi']);
$rows = $stmt->fetchAll();
echo "Results for 'ha noi': " . count($rows) . "\n";
foreach($rows as $r) echo "  - {$r[0]}: {$r[1]} ({$r[2]})\n";
