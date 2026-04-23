<?php
$pdo = new PDO('mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway', 'root', 'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

$sql = file_get_contents(__DIR__ . '/tourista_schema.sql');

// Tach cau lenh
$stmts = array_filter(array_map('trim', explode(';', $sql)), function($s) {
    return !empty($s) && !preg_match('/^--/', $s) && !preg_match('/^CREATE DATABASE/i', $s);
});

$count = 0;
foreach ($stmts as $stmt) {
        if (preg_match('/CREATE TABLE\s+(\w+)/i', $stmt, $m)) {
        try {
            $pdo->exec($stmt);
            echo "✓ Tạo: {$m[1]}\n";
            $count++;
        } catch (Exception $e) {
            echo "✗ Lỗi {$m[1]}: " . substr($e->getMessage(), 0, 80) . "\n";
        }
    }
}

echo "\nĐã tạo $count bảng!\n";
