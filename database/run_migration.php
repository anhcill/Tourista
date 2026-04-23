<?php
/**
 * Migration: Add admin_status column to hotels table
 * Connects to Railway MySQL (from backend/.env)
 */

$host = 'interchange.proxy.rlwy.net';
$port = 38550;
$dbname = 'railway';
$user = 'root';
$pass = 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD';

try {
    $pdo = @new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 10,
    ]);
    echo "Connected to Railway MySQL.\n";
} catch (Exception $e) {
    die("Connection failed: " . $e->getMessage() . "\n");
}

// Check if column already exists
$stmt = $pdo->query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
                     WHERE TABLE_SCHEMA = '$dbname' AND TABLE_NAME = 'hotels' AND COLUMN_NAME = 'admin_status'");
$exists = $stmt->fetchColumn();

if (!$exists) {
    $pdo->exec("ALTER TABLE hotels ADD COLUMN admin_status ENUM('PENDING','APPROVED','REJECTED','SUSPENDED') NOT NULL DEFAULT 'APPROVED' AFTER is_trending");
    echo "SUCCESS: admin_status column added to hotels table.\n";
} else {
    echo "SKIP: admin_status column already exists in hotels table.\n";
}

// Verify
$stmt = $pdo->query("DESCRIBE hotels");
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "\nHotels table columns:\n";
foreach ($columns as $col) {
    if (in_array($col['Field'], ['id','name','slug','is_trending','admin_status','is_active'])) {
        echo "  - {$col['Field']}: {$col['Type']} (default: {$col['Default']})\n";
    }
}
