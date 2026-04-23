<?php
/**
 * Fix AUTO_INCREMENT: Two-step approach (no table recreation needed).
 * Step 1: ADD PRIMARY KEY on 'id' if missing
 * Step 2: MODIFY COLUMN to add AUTO_INCREMENT
 */

$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "=== Fix AUTO_INCREMENT (2-step ALTER) ===\n\n";

$fixTables = [
    'booking_hotel_details',
    'booking_tour_details',
    'users',
    'hotels',
    'room_types',
    'tours',
    'tour_departures',
    'tour_categories',
    'reviews',
    'review_images',
    'favorites',
    'promotions',
    'tour_images',
    'hotel_images',
    'email_verification_tokens',
    'login_attempts',
    'audit_logs',
    'roles',
    'cities',
    'amenities',
];

$fixed = 0;
$skipped = 0;
$errors = 0;

foreach ($fixTables as $table) {
    echo "--- {$table} ---\n";

    try {
        // Check if column exists
        $stmt = $pdo->prepare("
            SELECT COLUMN_TYPE, COLUMN_KEY
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = ?
              AND COLUMN_NAME = 'id'
        ");
        $stmt->execute([$table]);
        $col = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$col) {
            echo "  [SKIP] No 'id' column\n";
            $skipped++;
            continue;
        }

        $currentType = $col['COLUMN_TYPE'];
        $hasPk = $col['COLUMN_KEY'] === 'PRI';

        // Step 1: Add PRIMARY KEY if missing
        if (!$hasPk) {
            // Get current row count
            $cnt = $pdo->query("SELECT COUNT(*) FROM `{$table}`")->fetchColumn();
            echo "  Adding PRIMARY KEY (table has {$cnt} rows)...\n";
            $pdo->exec("ALTER TABLE `{$table}` ADD PRIMARY KEY (`id`)");
            echo "  [OK] PRIMARY KEY added\n";
        } else {
            echo "  [OK] PRIMARY KEY already exists\n";
        }

        // Step 2: Add AUTO_INCREMENT using CHANGE (not MODIFY, to re-set the column)
        // First check if already has auto_increment
        $stmt2 = $pdo->prepare("
            SELECT EXTRA FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = ?
              AND COLUMN_NAME = 'id'
        ");
        $stmt2->execute([$table]);
        $extra = $stmt2->fetchColumn();

        if (stripos($extra, 'auto_increment') !== false) {
            echo "  [SKIP] AUTO_INCREMENT already set\n";
            $skipped++;
            continue;
        }

        // Change column to add AUTO_INCREMENT
        $newType = $currentType;
        // Ensure it says NOT NULL
        if (stripos($currentType, 'not null') === false && stripos($currentType, 'unsigned') !== false) {
            // already has unsigned, ensure not null
            $newType = preg_replace('/\s*not null\s*/i', '', $currentType) . ' NOT NULL';
        } elseif (stripos($currentType, 'not null') === false) {
            $newType = $currentType . ' NOT NULL';
        }

        $pdo->exec("ALTER TABLE `{$table}` CHANGE `id` `id` {$newType} AUTO_INCREMENT");
        echo "  [FIXED] AUTO_INCREMENT added to 'id'\n";
        $fixed++;

    } catch (PDOException $e) {
        echo "  [ERROR] {$e->getMessage()}\n";
        $errors++;
    }
    echo "\n";
}

echo "=== Done: {$fixed} fixed, {$skipped} skipped, {$errors} errors ===\n";
