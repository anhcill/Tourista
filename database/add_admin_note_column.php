<?php
$pdo = new PDO('mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway', 'root', 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

echo "========================================\n";
echo "  THEM CAC COT THIEU VAO BANG\n";
echo "========================================\n\n";

// Check current columns
$existingCols = $pdo->query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='railway' AND TABLE_NAME='hotels'")->fetchAll(PDO::FETCH_COLUMN);
echo "Current columns in hotels: " . implode(', ', $existingCols) . "\n\n";

// Add admin_note if missing
if (!in_array('admin_note', $existingCols)) {
    echo "Adding admin_note column...\n";
    $pdo->exec("ALTER TABLE hotels ADD COLUMN admin_note VARCHAR(500) AFTER admin_status");
    echo "   OK\n";
} else {
    echo "admin_note already exists\n";
}

echo "\n========================================\n";
echo "  Kiem tra lai\n";
echo "========================================\n";
$cols = $pdo->query("SHOW COLUMNS FROM hotels")->fetchAll(PDO::FETCH_COLUMN);
foreach ($cols as $col) {
    echo "  - $col\n";
}
echo "========================================\n";
echo "  XONG!\n";
echo "========================================\n";
