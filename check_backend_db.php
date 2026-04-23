<?php
// Doc .env de lay config
$envFile = __DIR__ . '/backend/.env';
$env = [];
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES) as $line) {
        $line = trim($line);
        if ($line && strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            [$key, $val] = explode('=', $line, 2);
            $env[trim($key)] = trim($val);
        }
    }
}

$dbUrl = $env['DB_URL'] ?? '';
$dbUser = $env['DB_USERNAME'] ?? 'root';
$dbPass = $env['DB_PASSWORD'] ?? '';

// Parse jdbc URL
if (preg_match('/jdbc:mysql:\/\/([^:]+):(\d+)\/(\w+)/', $dbUrl, $m)) {
    $host = $m[1];
    $port = $m[2];
    $dbname = $m[3];
} else {
    echo "❌ Khong parse duoc DB_URL\n";
    exit;
}

echo "========================================\n";
echo "  BACKEND DB CONFIG\n";
echo "========================================\n\n";
echo "Host:     $host\n";
echo "Port:     $port\n";
echo "Database: $dbname\n";
echo "User:     $dbUser\n";
echo "Pass:     " . (strlen($dbPass) > 0 ? '(da dat)' : '(trong)') . "\n\n";

// Thu ket noi
try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);

    echo "✅ Ket noi: OK\n\n";

    // Kiem tra tables
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    echo "Tong bang: " . count($tables) . "\n\n";

    $keyTables = ['users', 'hotels', 'reviews', 'hotel_images', 'cities', 'tours', 'roles', 'bookings'];
    foreach ($keyTables as $t) {
        $count = $pdo->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
        echo "  $t: $count rows\n";
    }

    // Check current auto_increment
    echo "\n--- Auto Increment ---\n";
    $ais = $pdo->query("SELECT TABLE_NAME, AUTO_INCREMENT FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA='$dbname' AND AUTO_INCREMENT IS NOT NULL")->fetchAll();
    foreach ($ais as $ai) {
        echo "  {$ai['TABLE_NAME']}: {$ai['AUTO_INCREMENT']}\n";
    }

} catch (Exception $e) {
    echo "❌ Loi ket noi:\n   " . $e->getMessage() . "\n";
}

echo "\n========================================\n";
