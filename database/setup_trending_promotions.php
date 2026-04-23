<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 10]
);

echo "=== Adding trending from featured cities ===\n";

// Get featured cities
$featCities = $pdo->query("
    SELECT DISTINCT city_id FROM hotels WHERE is_active=1 AND is_featured=1
")->fetchAll(PDO::FETCH_COLUMN);
$cityList = implode(',', $featCities);
echo "Featured cities: $cityList\n";

if ($cityList) {
    $added = $pdo->exec("
        UPDATE hotels SET is_trending = 1
        WHERE is_active = 1
          AND is_featured = 0
          AND is_trending = 0
          AND city_id IN ($cityList)
        ORDER BY avg_rating DESC, review_count DESC
        LIMIT 20
    ");
    echo "Added $added trending from featured cities\n";
}

$finalTrending = $pdo->query("SELECT COUNT(*) FROM hotels WHERE is_active=1 AND is_trending=1")->fetchColumn();
echo "Total trending now: $finalTrending\n";

$byCity = $pdo->query("
    SELECT c.name_vi, COUNT(h.id) as cnt
    FROM hotels h JOIN cities c ON h.city_id=c.id
    WHERE h.is_active=1 AND h.is_trending=1
    GROUP BY c.id, c.name_vi ORDER BY cnt DESC
")->fetchAll(PDO::FETCH_NUM);
echo "\nTrending by city:\n";
foreach ($byCity as $r) printf("  %-15s: %s\n", $r[0], $r[1]);

echo "\n=== Creating promotions ===\n";
$promoCount = $pdo->query("SELECT COUNT(*) FROM promotions")->fetchColumn();
echo "Current promotions: $promoCount\n";

if ($promoCount == 0) {
    $now = date('Y-m-d H:i:s');
    $future = date('Y-m-d H:i:s', strtotime('+1 year'));

    $promos = [
        ['EARLYBIRD', 'Đặt sớm — Giá tốt hơn', 'Book trước 7 ngày, tiết kiệm đến 35%', 'PERCENTAGE', 35, 'HOTEL'],
        ['LASTMIN', 'Xả hàng cuối tuần', 'Ưu đãi giờ chót, giá sốc chỉ hôm nay', 'PERCENTAGE', 50, 'HOTEL'],
        ['FAMILY20', 'Gói gia đình — Trọn vẹn kỳ nghỉ', 'Phòng rộng, ưu đãi ăn sáng cho trẻ em', 'PERCENTAGE', 25, 'HOTEL'],
        ['BIRTHDAY30', 'Quà tặng ngày sinh nhật', 'Nhận ưu đãi đặc biệt vào dịp trọng đại của bạn', 'PERCENTAGE', 30, 'ALL'],
        ['REFERRAL15', 'Giới thiệu bạn bè — Cùng nhận quà', 'Mời bạn đặt phòng, hai người đều được giảm', 'PERCENTAGE', 15, 'ALL'],
        ['LOYALTY20', 'Giảm giá khách hàng thân thiết', 'Ưu đãi dành riêng cho khách đã từng đặt phòng', 'PERCENTAGE', 20, 'HOTEL'],
        ['SUMMER30', 'Khuyến mãa mùa hè', 'Ưu đãi mùa hè với giá cực hấp dẫn', 'PERCENTAGE', 30, 'TOUR'],
        ['VIP500K', 'VIP Member Deal', 'Ưu đãi đặc biệt cho thành viên VIP', 'FIXED', 500000, 'ALL'],
    ];

    $stmt = $pdo->prepare("
        INSERT INTO promotions (code, name, description, discount_type, discount_value,
                               min_order_amount, used_count, applies_to, valid_from, valid_until, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?, ?, 1, ?)
    ");

    foreach ($promos as $p) {
        $stmt->execute([$p[0], $p[1], $p[2], $p[3], $p[4], $p[5], $now, $future, $now]);
        echo "Created: $p[1]\n";
    }
    echo "\nDone creating promotions!\n";
} else {
    echo "Promotions already exist, skipping\n";
}

echo "\n=== Final Summary ===\n";
echo "Featured hotels: " . $pdo->query("SELECT COUNT(*) FROM hotels WHERE is_active=1 AND is_featured=1")->fetchColumn() . "\n";
echo "Trending hotels: " . $pdo->query("SELECT COUNT(*) FROM hotels WHERE is_active=1 AND is_trending=1")->fetchColumn() . "\n";
echo "Featured tours: " . $pdo->query("SELECT COUNT(*) FROM tours WHERE is_active=1 AND is_featured=1")->fetchColumn() . "\n";
echo "Promotions: " . $pdo->query("SELECT COUNT(*) FROM promotions")->fetchColumn() . "\n";
