<?php
$pdo = new PDO('mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4', 'root', 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD', [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);

echo "Seeding pricing rules...\n\n";

$now = date('Y-m-d H:i:s');

$rules = [
    [
        'target_type' => 'TOUR',
        'tour_id' => null,
        'rule_type' => 'EARLY_BIRD',
        'name' => 'Early Bird 30 ngay',
        'description' => 'Giam 10% khi dat truoc 30 ngay',
        'adjustment_percent' => -10.00,
        'advance_days_min' => 30,
        'advance_days_max' => 365,
        'priority' => 10,
        'is_active' => true,
    ],
    [
        'target_type' => 'TOUR',
        'tour_id' => null,
        'rule_type' => 'LAST_MINUTE',
        'name' => 'Last Minute 3 ngay',
        'description' => 'Giam 15% khi dat trong 3 ngay',
        'adjustment_percent' => -15.00,
        'advance_days_min' => 0,
        'advance_days_max' => 3,
        'priority' => 5,
        'is_active' => true,
    ],
    [
        'target_type' => 'TOUR',
        'tour_id' => null,
        'rule_type' => 'DAY_OF_WEEK',
        'day_of_week' => 7,
        'name' => 'Chu nhat gia suat',
        'description' => 'Gia tang 5% cho tour khoi hanh chu nhat',
        'adjustment_percent' => 5.00,
        'priority' => 3,
        'is_active' => true,
    ],
    [
        'target_type' => 'TOUR',
        'tour_id' => null,
        'rule_type' => 'DAY_OF_WEEK',
        'day_of_week' => 1,
        'name' => 'Thu 2 giam gia',
        'description' => 'Giam 5% cho tour khoi hanh thu 2',
        'adjustment_percent' => -5.00,
        'priority' => 3,
        'is_active' => true,
    ],
    [
        'target_type' => 'TOUR',
        'tour_id' => null,
        'rule_type' => 'GROUP_SIZE',
        'min_pax' => 5,
        'name' => 'Nhom 5+ nguoi',
        'description' => 'Giam 8% cho nhom 5 nguoi tro len',
        'adjustment_percent' => -8.00,
        'priority' => 8,
        'is_active' => true,
    ],
    [
        'target_type' => 'TOUR',
        'tour_id' => null,
        'rule_type' => 'GROUP_SIZE',
        'min_pax' => 10,
        'name' => 'Nhom lon 10+ nguoi',
        'description' => 'Giam 15% cho nhom 10 nguoi tro len',
        'adjustment_percent' => -15.00,
        'priority' => 9,
        'is_active' => true,
    ],
    [
        'target_type' => 'TOUR',
        'tour_id' => null,
        'rule_type' => 'SEASON',
        'season' => 'OFF',
        'name' => 'Mua thap diem',
        'description' => 'Giam 20% cho mua thap diem (T11-T2)',
        'adjustment_percent' => -20.00,
        'priority' => 7,
        'is_active' => true,
    ],
    [
        'target_type' => 'TOUR',
        'tour_id' => null,
        'rule_type' => 'SEASON',
        'season' => 'PEAK',
        'name' => 'Mua cao diem',
        'description' => 'Gia tang 25% cho mua cao diem (T6-T8)',
        'adjustment_percent' => 25.00,
        'priority' => 7,
        'is_active' => true,
    ],
    [
        'target_type' => 'HOTEL',
        'hotel_id' => null,
        'rule_type' => 'EARLY_BIRD',
        'name' => 'Early Bird Hotel 14 ngay',
        'description' => 'Giam 8% khi dat phong truoc 14 ngay',
        'adjustment_percent' => -8.00,
        'advance_days_min' => 14,
        'advance_days_max' => 365,
        'priority' => 10,
        'is_active' => true,
    ],
    [
        'target_type' => 'HOTEL',
        'hotel_id' => null,
        'rule_type' => 'LAST_MINUTE',
        'name' => 'Last Minute Hotel',
        'description' => 'Giam 12% cho dat trong 2 ngay',
        'adjustment_percent' => -12.00,
        'advance_days_min' => 0,
        'advance_days_max' => 2,
        'priority' => 5,
        'is_active' => true,
    ],
    [
        'target_type' => 'HOTEL',
        'hotel_id' => null,
        'rule_type' => 'DAY_OF_WEEK',
        'day_of_week' => 5,
        'name' => 'Thu 6 cuoi tuan',
        'description' => 'Gia tang 8% cho thu 6',
        'adjustment_percent' => 8.00,
        'priority' => 3,
        'is_active' => true,
    ],
    [
        'target_type' => 'HOTEL',
        'hotel_id' => null,
        'rule_type' => 'DAY_OF_WEEK',
        'day_of_week' => 6,
        'name' => 'Thu 7 cuoi tuan',
        'description' => 'Gia tang 10% cho thu 7',
        'adjustment_percent' => 10.00,
        'priority' => 3,
        'is_active' => true,
    ],
    [
        'target_type' => 'HOTEL',
        'hotel_id' => null,
        'rule_type' => 'GROUP_SIZE',
        'min_pax' => 3,
        'name' => 'Dat 3 phong tro len',
        'description' => 'Giam 5% khi dat 3 phong tro len',
        'adjustment_percent' => -5.00,
        'priority' => 6,
        'is_active' => true,
    ],
];

$stmt = $pdo->prepare("
    INSERT INTO pricing_rules
    (target_type, hotel_id, tour_id, rule_type, season, day_of_week,
     advance_days_min, advance_days_max, slots_remaining_max,
     adjustment_percent, min_pax, max_pax, name, description,
     priority, is_active, start_date, end_date, created_at, updated_at)
    VALUES
    (:target_type, :hotel_id, :tour_id, :rule_type, :season, :day_of_week,
     :advance_days_min, :advance_days_max, :slots_remaining_max,
     :adjustment_percent, :min_pax, :max_pax, :name, :description,
     :priority, :is_active, NULL, NULL, :created_at, :created_at)
");

$count = 0;
foreach ($rules as $r) {
    $params = [
        'target_type' => $r['target_type'],
        'hotel_id' => $r['hotel_id'] ?? null,
        'tour_id' => $r['tour_id'] ?? null,
        'rule_type' => $r['rule_type'],
        'season' => $r['season'] ?? null,
        'day_of_week' => $r['day_of_week'] ?? null,
        'advance_days_min' => $r['advance_days_min'] ?? null,
        'advance_days_max' => $r['advance_days_max'] ?? null,
        'slots_remaining_max' => null,
        'adjustment_percent' => $r['adjustment_percent'],
        'min_pax' => $r['min_pax'] ?? null,
        'max_pax' => $r['max_pax'] ?? null,
        'name' => $r['name'],
        'description' => $r['description'] ?? null,
        'priority' => $r['priority'],
        'is_active' => $r['is_active'] ? 1 : 0,
        'created_at' => $now,
    ];

    try {
        $stmt->execute($params);
        $count++;
        echo "  [OK] {$r['name']}\n";
    } catch (PDOException $e) {
        echo "  [SKIP] {$r['name']}: {$e->getMessage()}\n";
    }
}

echo "\nDone. $count pricing rules seeded.\n";
$total = $pdo->query("SELECT COUNT(*) FROM pricing_rules")->fetchColumn();
echo "Total pricing rules in DB: $total\n";
