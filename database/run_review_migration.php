<?php
$pdo = new PDO('mysql:host=maglev.proxy.rlwy.net;port=44405;dbname=railway;charset=utf8mb4', 'root', 'EcQvhZIyDypbORoVrkpUhlcRTzaJNGOq', [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);

echo "Running migration: add admin_status to reviews\n\n";

try {
    $pdo->exec("ALTER TABLE reviews ADD COLUMN admin_status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'APPROVED' AFTER is_published");
    echo "SUCCESS: admin_status column added.\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate') !== false || strpos($e->getMessage(), 'already exists') !== false) {
        echo "Column already exists - skipping.\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}

echo "\nVerifying:\n";
$cols = $pdo->query("DESCRIBE reviews")->fetchAll();
foreach ($cols as $c) {
    if (in_array($c['Field'], ['is_published', 'admin_status', 'admin_reply'])) {
        echo "  {$c['Field']}: {$c['Type']} Default={$c['Default']}\n";
    }
}
