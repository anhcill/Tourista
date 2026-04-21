<?php
$pdo = new PDO('mysql:host=maglev.proxy.rlwy.net;port=44405;dbname=railway;charset=utf8mb4', 'root', 'EcQvhZIyDypbORoVrkpUhlcRTzaJNGOq', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

echo "=== Fixing chat_messages.id ===\n\n";

// Check current indexes
echo "Current indexes on chat_messages:\n";
$stmt = $pdo->query('SHOW INDEX FROM chat_messages');
$indexes = $stmt->fetchAll(PDO::FETCH_ASSOC);
print_r($indexes);

// Check current columns
echo "\nCurrent columns:\n";
$stmt = $pdo->query('DESCRIBE chat_messages');
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
print_r($columns);

// Drop existing primary key if any
try {
    $pdo->exec('ALTER TABLE chat_messages DROP PRIMARY KEY');
    echo "\n✓ Dropped existing primary key (if any)\n";
} catch (PDOException $e) {
    echo "\n(No primary key to drop): " . $e->getMessage() . "\n";
}

// Modify id column to be AUTO_INCREMENT with PRIMARY KEY
try {
    $pdo->exec('ALTER TABLE chat_messages MODIFY COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, ADD PRIMARY KEY (id)');
    echo "\n✓ SUCCESS: chat_messages.id is now PRIMARY KEY + AUTO_INCREMENT!\n";
} catch (PDOException $e) {
    echo "\n✗ ERROR: " . $e->getMessage() . "\n";
}

// Verify
echo "\nAfter fix:\n";
$stmt = $pdo->query('DESCRIBE chat_messages');
$columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
print_r($columns);

echo "\nDone!\n";
