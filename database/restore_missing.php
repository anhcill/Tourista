<?php
$pdo = new PDO('mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway', 'root', 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

echo "Tao lai cac bang thieu...\n\n";

$sql = file_get_contents(__DIR__ . '/tourista_schema.sql');

$wanted = ['hotels', 'reviews', 'hotel_images'];
$stmts = explode(';', $sql);

foreach ($stmts as $stmt) {
    $stmt = trim($stmt);
    foreach ($wanted as $w) {
        if (preg_match("/CREATE TABLE `$w`/i", $stmt)) {
            try {
                $pdo->exec($stmt);
                echo "✓ Tạo: $w\n";
            } catch (Exception $e) {
                if (strpos($e->getMessage(), 'already exists') !== false) {
                    echo "○ Đã có: $w\n";
                } else {
                    echo "✗ Lỗi $w: " . substr($e->getMessage(), 0, 80) . "\n";
                }
            }
            break;
        }
    }
}

echo "\nKiem tra:\n";
foreach (['users', 'hotels', 'reviews', 'hotel_images'] as $t) {
    try {
        $c = $pdo->query("SELECT COUNT(*) FROM $t")->fetchColumn();
        echo "  $t: $c rows\n";
    } catch (Exception $e) {
        echo "  $t: KHONG TON TAI\n";
    }
}

echo "\n✅ Xong!\n";
