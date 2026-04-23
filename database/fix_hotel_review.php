<?php
$pdo = new PDO('mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4', 'root', 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD', [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);

echo "=== FIXING DATABASE SCHEMA ===\n\n";

$queries = [];

// ============================================================
// 1. FIX USERS
// ============================================================
echo "[1/4] Fixing users table...\n";

// Add full_name NOT NULL if needed
try {
    $pdo->exec("ALTER TABLE users MODIFY full_name VARCHAR(100) NOT NULL");
    echo "  - full_name: NOT NULL OK\n";
} catch (Exception $e) { echo "  ! full_name: {$e->getMessage()}\n"; }

// Add role_id NOT NULL DEFAULT 2
try {
    $pdo->exec("ALTER TABLE users MODIFY role_id TINYINT UNSIGNED NOT NULL DEFAULT 2");
    echo "  - role_id: NOT NULL DEFAULT 2 OK\n";
} catch (Exception $e) { echo "  ! role_id: {$e->getMessage()}\n"; }

// Add FK role_id -> roles(id)
try {
    $pdo->exec("ALTER TABLE users ADD CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)");
    echo "  - FK role_id: added OK\n";
} catch (Exception $e) { echo "  ! FK role_id: {$e->getMessage()}\n"; }

// ============================================================
// 2. FIX HOTELS
// ============================================================
echo "\n[2/4] Fixing hotels table...\n";

// star_rating NOT NULL DEFAULT 3
try {
    $pdo->exec("ALTER TABLE hotels MODIFY star_rating TINYINT UNSIGNED NOT NULL DEFAULT 3");
    echo "  - star_rating: NOT NULL DEFAULT 3 OK\n";
} catch (Exception $e) { echo "  ! star_rating: {$e->getMessage()}\n"; }

// avg_rating NOT NULL DEFAULT 0.00
try {
    $pdo->exec("ALTER TABLE hotels MODIFY avg_rating DECIMAL(3,2) NOT NULL DEFAULT 0.00");
    echo "  - avg_rating: NOT NULL DEFAULT 0.00 OK\n";
} catch (Exception $e) { echo "  ! avg_rating: {$e->getMessage()}\n"; }

// review_count NOT NULL DEFAULT 0
try {
    $pdo->exec("ALTER TABLE hotels MODIFY review_count INT UNSIGNED NOT NULL DEFAULT 0");
    echo "  - review_count: NOT NULL DEFAULT 0 OK\n";
} catch (Exception $e) { echo "  ! review_count: {$e->getMessage()}\n"; }

// is_featured NOT NULL DEFAULT FALSE
try {
    $pdo->exec("ALTER TABLE hotels MODIFY is_featured TINYINT(1) NOT NULL DEFAULT 0");
    echo "  - is_featured: NOT NULL DEFAULT 0 OK\n";
} catch (Exception $e) { echo "  ! is_featured: {$e->getMessage()}\n"; }

// is_trending NOT NULL DEFAULT FALSE
try {
    $pdo->exec("ALTER TABLE hotels MODIFY is_trending TINYINT(1) NOT NULL DEFAULT 0");
    echo "  - is_trending: NOT NULL DEFAULT 0 OK\n";
} catch (Exception $e) { echo "  ! is_trending: {$e->getMessage()}\n"; }

// admin_status NOT NULL DEFAULT APPROVED
try {
    $pdo->exec("ALTER TABLE hotels MODIFY admin_status ENUM('PENDING','APPROVED','REJECTED','SUSPENDED') NOT NULL DEFAULT 'APPROVED'");
    echo "  - admin_status: NOT NULL DEFAULT 'APPROVED' OK\n";
} catch (Exception $e) { echo "  ! admin_status: {$e->getMessage()}\n"; }

// is_active NOT NULL DEFAULT TRUE
try {
    $pdo->exec("ALTER TABLE hotels MODIFY is_active TINYINT(1) NOT NULL DEFAULT 1");
    echo "  - is_active: NOT NULL DEFAULT 1 OK\n";
} catch (Exception $e) { echo "  ! is_active: {$e->getMessage()}\n"; }

// ============================================================
// 3. FIX REVIEWS - ADD MISSING COLUMNS
// ============================================================
echo "\n[3/4] Fixing reviews table...\n";

// Check existing columns
$desc = $pdo->query("DESCRIBE reviews")->fetchAll(PDO::FETCH_ASSOC);
$existingCols = array_column($desc, 'Field');

// Add missing sub-rating columns
$missingCols = [
    'cleanliness'     => 'TINYINT UNSIGNED CHECK (cleanliness BETWEEN 1 AND 5)',
    'location'        => 'TINYINT UNSIGNED CHECK (location BETWEEN 1 AND 5)',
    'service'         => 'TINYINT UNSIGNED CHECK (service BETWEEN 1 AND 5)',
    'value_for_money' => 'TINYINT UNSIGNED CHECK (value_for_money BETWEEN 1 AND 5)',
    'guide_quality'   => 'TINYINT UNSIGNED CHECK (guide_quality BETWEEN 1 AND 5)',
    'organization'   => 'TINYINT UNSIGNED CHECK (organization BETWEEN 1 AND 5)',
    'admin_reply'     => 'TEXT',
    'admin_replied_at'=> 'DATETIME',
];

foreach ($missingCols as $col => $def) {
    if (!in_array($col, $existingCols)) {
        try {
            $pdo->exec("ALTER TABLE reviews ADD COLUMN $col $def");
            echo "  + Added: $col\n";
        } catch (Exception $e) { echo "  ! $col: {$e->getMessage()}\n"; }
    } else {
        echo "  - $col: already exists\n";
    }
}

// Fix is_published NOT NULL DEFAULT TRUE
try {
    $pdo->exec("ALTER TABLE reviews MODIFY is_published TINYINT(1) NOT NULL DEFAULT 1");
    echo "  - is_published: NOT NULL DEFAULT 1 OK\n";
} catch (Exception $e) { echo "  ! is_published: {$e->getMessage()}\n"; }

// Add FK hotel_id -> hotels(id)
try {
    $pdo->exec("ALTER TABLE reviews ADD CONSTRAINT fk_reviews_hotel FOREIGN KEY (target_id) REFERENCES hotels(id)");
    echo "  - FK target_id (hotel): added\n";
} catch (Exception $e) { echo "  ! FK target_id: {$e->getMessage()}\n"; }

// ============================================================
// 4. FIX HOTEL_IMAGES
// ============================================================
echo "\n[4/4] Fixing hotel_images table...\n";

// is_cover NOT NULL DEFAULT FALSE
try {
    $pdo->exec("ALTER TABLE hotel_images MODIFY is_cover TINYINT(1) NOT NULL DEFAULT 0");
    echo "  - is_cover: NOT NULL DEFAULT 0 OK\n";
} catch (Exception $e) { echo "  ! is_cover: {$e->getMessage()}\n"; }

// sort_order NOT NULL DEFAULT 0
try {
    $pdo->exec("ALTER TABLE hotel_images MODIFY sort_order TINYINT UNSIGNED NOT NULL DEFAULT 0");
    echo "  - sort_order: NOT NULL DEFAULT 0 OK\n";
} catch (Exception $e) { echo "  ! sort_order: {$e->getMessage()}\n"; }

// ============================================================
// VERIFY AFTER FIX
// ============================================================
echo "\n=== VERIFYING AFTER FIX ===\n";
$fixCheck = new PDO('mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4', 'root', 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD', [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);

foreach (['users', 'hotels', 'reviews', 'hotel_images'] as $tbl) {
    echo "\n=== $tbl ===\n";
    $cols = $fixCheck->query("DESCRIBE `$tbl`")->fetchAll();
    foreach ($cols as $c) {
        $null = $c['Null'];
        $def  = $c['Default'];
        echo sprintf("  %-30s %-30s Null=%-3s Default=%s\n", $c['Field'], $c['Type'], $null, $def);
    }
}

echo "\n=== FOREIGN KEYS ===\n";
$fks = $fixCheck->query("
    SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = 'railway' AND REFERENCED_TABLE_NAME IS NOT NULL
    ORDER BY TABLE_NAME, COLUMN_NAME
")->fetchAll();
foreach ($fks as $fk) {
    echo "  {$fk['TABLE_NAME']}.{$fk['COLUMN_NAME']} -> {$fk['REFERENCED_TABLE_NAME']}({$fk['REFERENCED_COLUMN_NAME']})\n";
}

echo "\nDone!\n";
