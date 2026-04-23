<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "=== Cities with 'ha noi' or 'hà nội' ===\n";
$rows = $pdo->query("SELECT id, name_vi, name_en, slug FROM cities WHERE LOWER(name_vi) LIKE '%ha%noi%' OR LOWER(name_en) LIKE '%hanoi%' OR slug LIKE '%ha-noi%'")->fetchAll(PDO::FETCH_NUM);
foreach ($rows as $r) printf("%s | %s | %s | %s\n", $r[0], $r[1], $r[2], $r[3]);

echo "\n=== Hotels in Hanoi (city_id = 4 or slug 'ha-noi') ===\n";
$rows = $pdo->query("SELECT h.id, h.name, h.address, h.city_id, c.name_vi as city, h.is_active FROM hotels h LEFT JOIN cities c ON c.id = h.city_id WHERE c.slug = 'ha-noi' LIMIT 10")->fetchAll(PDO::FETCH_NUM);
printf("%-4s | %-40s | %-30s | %s | %s\n", "ID", "Name", "Address", "City", "Active");
echo str_repeat('-', 110) . "\n";
foreach ($rows as $r) printf("%-4s | %-40s | %-30s | %-15s | %s\n", $r[0], substr($r[1],0,40), substr($r[2],0,30), $r[3], $r[5] ? 'YES' : 'NO');

echo "\n=== All hotels count ===\n";
echo "Total hotels: " . $pdo->query("SELECT COUNT(*) FROM hotels")->fetchColumn() . "\n";

echo "\n=== Hotels by city ===\n";
$rows = $pdo->query("SELECT c.name_vi, c.slug, COUNT(h.id) as cnt FROM cities c LEFT JOIN hotels h ON h.city_id = c.id GROUP BY c.id, c.name_vi, c.slug ORDER BY cnt DESC")->fetchAll(PDO::FETCH_NUM);
foreach ($rows as $r) printf("%-20s (%-10s): %s hotels\n", $r[0], $r[1], $r[2]);
