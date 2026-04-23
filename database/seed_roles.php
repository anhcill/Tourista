<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "Inserting roles into new DB...\n\n";

// Insert roles
$roles = [
    [1, 'USER', 'Người dùng thông thường'],
    [2, 'ADMIN', 'Quản trị viên'],
    [3, 'PARTNER', 'Đối tác'],
    [4, 'HOTEL_OWNER', 'Chủ khách sạn'],
];

foreach ($roles as $r) {
    $pdo->prepare("INSERT IGNORE INTO roles (id, name, description) VALUES (?, ?, ?)")
        ->execute($r);
    echo "  ✓ Role: {$r[1]}\n";
}

// Verify
echo "\n--- Current roles ---\n";
$rows = $pdo->query("SELECT * FROM roles")->fetchAll();
foreach ($rows as $r) echo "  {$r['id']}: {$r['name']} ({$r['code']})\n";

echo "\n✅ Done!\n";
