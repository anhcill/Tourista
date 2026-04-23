<?php
$pdo = new PDO('mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway', 'root', 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

echo "========================================\n";
echo "  THEM CAC COT THIEU VAO BANG REVIEWS\n";
echo "========================================\n\n";

// Check current columns
$existingCols = $pdo->query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='railway' AND TABLE_NAME='reviews'")->fetchAll(PDO::FETCH_COLUMN);
echo "Current columns in reviews: " . implode(', ', $existingCols) . "\n\n";

// Columns needed: admin_status, admin_reply, admin_replied_at, partner_id, partner_reply, partner_replied_at
$alterations = [
    ["admin_status", "ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING'", "moderation_status"],
    ["admin_reply", "TEXT", "admin_status"],
    ["admin_replied_at", "DATETIME", "admin_reply"],
    ["partner_id", "BIGINT UNSIGNED", "admin_replied_at"],
    ["partner_reply", "TEXT", "partner_id"],
    ["partner_replied_at", "DATETIME", "partner_reply"],
];

foreach ($alterations as $alt) {
    list($col, $def, $after) = $alt;
    if (!in_array($col, $existingCols)) {
        echo "Adding $col...\n";
        try {
            $pdo->exec("ALTER TABLE reviews ADD COLUMN $col $def AFTER $after");
            echo "   OK\n";
        } catch (Exception $e) {
            echo "   ERROR: " . $e->getMessage() . "\n";
        }
    } else {
        echo "$col already exists\n";
    }
}

echo "\n========================================\n";
echo "  Kiem tra lai\n";
echo "========================================\n";
$cols = $pdo->query("SHOW COLUMNS FROM reviews")->fetchAll(PDO::FETCH_COLUMN);
foreach ($cols as $col) {
    echo "  - $col\n";
}
echo "========================================\n";
echo "  XONG!\n";
echo "========================================\n";
