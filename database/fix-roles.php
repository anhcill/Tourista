<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

// Insert roles with fixed IDs (TINYINT UNSIGNED: 1=USER, 2=ADMIN, 3=HOST)
$roles = [
    ['id' => 1, 'name' => 'USER',   'desc' => 'Người dùng thông thường'],
    ['id' => 2, 'name' => 'ADMIN',  'desc' => 'Quản trị viên'],
    ['id' => 3, 'name' => 'HOST',   'desc' => 'Đối tác chủ khách sạn/tour'],
];

$inserted = 0;
foreach ($roles as $r) {
    try {
        $stmt = $pdo->prepare("INSERT INTO roles (id, name, description) VALUES (?, ?, ?)");
        $stmt->execute([$r['id'], $r['name'], $r['desc']]);
        echo "[OK] Inserted: {$r['name']} (id={$r['id']})\n";
        $inserted++;
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate') !== false) {
            echo "[SKIP] {$r['name']} already exists\n";
        } else {
            echo "[ERROR] {$r['name']}: {$e->getMessage()}\n";
        }
    }
}

// Verify
echo "\nCurrent roles:\n";
foreach ($pdo->query("SELECT id, name, description FROM roles") as $row) {
    echo "  id={$row['id']} name={$row['name']} desc={$row['description']}\n";
}
