<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 10]
);

echo "=== Promotions Table ===\n";
$promoCols = $pdo->query("DESCRIBE promotions")->fetchAll(PDO::FETCH_ASSOC);
foreach ($promoCols as $col) {
    echo "  " . $col['Field'] . " " . $col['Type'] . " " . ($col['Null'] === 'YES' ? 'NULL' : 'NOT NULL') . "\n";
}

echo "\nTotal promotions: " . $pdo->query("SELECT COUNT(*) FROM promotions")->fetchColumn() . "\n";

$activePromos = $pdo->query("
    SELECT id, code, title, discount_type, discount_value, applies_to,
           starts_at, ends_at, is_active
    FROM promotions
    WHERE is_active = 1
    ORDER BY id
    LIMIT 10
")->fetchAll(PDO::FETCH_ASSOC);
echo "Active promotions:\n";
foreach ($activePromos as $p) {
    echo "  ID=$p[id] | $p[title] | $p[discount_type] $p[discount_value] | $p[applies_to]\n";
}

echo "\n=== Promotions with hotel-specific data ===\n";
$hotelPromos = $pdo->query("
    SELECT p.id, p.title, p.applies_to, p.discount_type, p.discount_value,
           COUNT(DISTINCT pp.hotel_id) as hotel_count,
           COUNT(DISTINCT pt.tour_id) as tour_count
    FROM promotions p
    LEFT JOIN promotion_hotels pp ON p.id = pp.promotion_id
    LEFT JOIN promotion_tours pt ON p.id = pt.promotion_id
    GROUP BY p.id, p.title, p.applies_to, p.discount_type, p.discount_value
    ORDER BY hotel_count DESC
    LIMIT 10
")->fetchAll(PDO::FETCH_ASSOC);
foreach ($hotelPromos as $p) {
    echo "  ID=$p[id] | $p[title] | applies_to=$p[applies_to] | hotels=$p[hotel_count] | tours=$p[tour_count]\n";
}

echo "\n=== City distribution of ALL hotels (not just featured) ===\n";
$byCity = $pdo->query("
    SELECT c.name_vi, COUNT(h.id) as cnt
    FROM hotels h
    JOIN cities c ON h.city_id = c.id
    WHERE h.is_active=1
    GROUP BY c.id, c.name_vi
    ORDER BY cnt DESC
    LIMIT 20
")->fetchAll(PDO::FETCH_NUM);
foreach ($byCity as $r) printf("  %-15s: %s hotels\n", $r[0], $r[1]);
