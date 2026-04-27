<?php
$pdo = new PDO(
    'mysql:host=interchange.proxy.rlwy.net;port=38550;dbname=railway;charset=utf8mb4',
    'root',
    'SZhkpiaBKssdXIyGLhTxbLQzGVlOnZBD',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);

echo "=== ROLES TABLE ===\n";
$roles = $pdo->query('SELECT * FROM roles')->fetchAll(PDO::FETCH_ASSOC);
print_r($roles);

echo "\n=== SEARCH EMAIL LIKE 'ducanh' ===\n";
$users = $pdo->query("SELECT id, email, full_name, role_id, status FROM users WHERE email LIKE '%ducanh%'")->fetchAll(PDO::FETCH_ASSOC);
if ($users) {
    print_r($users);
} else {
    echo "Không tìm thấy user nào có email chứa 'ducanh'\n";
}

echo "\n=== SEARCH EMAIL LIKE 'ducanhle' ===\n";
$users2 = $pdo->query("SELECT id, email, full_name, role_id, status FROM users WHERE email LIKE '%ducanhle%'")->fetchAll(PDO::FETCH_ASSOC);
if ($users2) {
    print_r($users2);
} else {
    echo "Không tìm thấy\n";
}

echo "\n=== TOTAL USERS ===\n";
$count = $pdo->query("SELECT COUNT(*) as total FROM users")->fetch(PDO::FETCH_ASSOC);
print_r($count);
